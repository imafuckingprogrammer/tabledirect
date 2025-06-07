import { useState, useEffect } from 'react';
import { Clock, Users, CheckCircle, AlertCircle, ChefHat, Bell, Timer } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { claimOrder, releaseOrder } from '../lib/database';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import type { Order } from '../types';

export function KitchenInterface() {
  const { user, restaurantId } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimedOrders, setClaimedOrders] = useState<Set<string>>(new Set());
  const [station, setStation] = useState<string>('');

  useEffect(() => {
    if (restaurantId && user) {
      loadKitchenOrders();
      
      // Set up real-time subscription for orders
      const ordersSubscription = supabase
        .channel(`kitchen_orders_${restaurantId}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'orders',
            filter: `restaurant_id=eq.${restaurantId}`
          }, 
          () => {
            loadKitchenOrders();
          }
        )
        .subscribe();

      // Set up real-time subscription for order items
      const itemsSubscription = supabase
        .channel(`kitchen_items_${restaurantId}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'order_items'
          }, 
          () => {
            loadKitchenOrders();
          }
        )
        .subscribe();

      return () => {
        ordersSubscription.unsubscribe();
        itemsSubscription.unsubscribe();
      };
    }
  }, [restaurantId, user]);

  const loadKitchenOrders = async () => {
    if (!restaurantId) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          table:restaurant_tables(*),
          order_items(
            *,
            menu_item:menu_items(*),
            claimed_by:users(email)
          )
        `)
        .eq('restaurant_id', restaurantId)
        .in('status', ['pending', 'preparing'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      setOrders(data || []);

      // Track which orders this user has claimed
      const userClaimedOrders = new Set<string>();
             data?.forEach(order => {
         order.order_items?.forEach((item: any) => {
           if (item.claimed_by_user_id === user?.id) {
             userClaimedOrders.add(order.id);
           }
         });
       });
      setClaimedOrders(userClaimedOrders);

    } catch (error) {
      console.error('Error loading kitchen orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimOrder = async (orderId: string) => {
    if (!user?.id) return;

    try {
      const success = await claimOrder(orderId, user.id, station);
      if (success) {
        setClaimedOrders(prev => new Set([...prev, orderId]));
        await loadKitchenOrders();
      }
    } catch (error) {
      console.error('Error claiming order:', error);
    }
  };

  const handleReleaseOrder = async (orderId: string) => {
    if (!user?.id) return;

    try {
      const success = await releaseOrder(orderId, user.id);
      if (success) {
        setClaimedOrders(prev => {
          const newSet = new Set(prev);
          newSet.delete(orderId);
          return newSet;
        });
        await loadKitchenOrders();
      }
    } catch (error) {
      console.error('Error releasing order:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, status: 'preparing' | 'ready') => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
      await loadKitchenOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const markItemComplete = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('order_items')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;
      await loadKitchenOrders();
    } catch (error) {
      console.error('Error marking item complete:', error);
    }
  };

  const getOrderAge = (createdAt: string) => {
    const now = new Date();
    const orderTime = new Date(createdAt);
    const diffMs = now.getTime() - orderTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return '< 1m';
    if (diffMins < 60) return `${diffMins}m`;
    return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
  };

  const getOrderUrgency = (createdAt: string) => {
    const diffMs = new Date().getTime() - new Date(createdAt).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins > 20) return 'urgent';
    if (diffMins > 10) return 'warning';
    return 'normal';
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'border-red-500 bg-red-50';
      case 'warning': return 'border-warning-500 bg-warning-50';
      default: return 'border-gray-200 bg-white';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ChefHat className="w-8 h-8 text-primary-400" />
              <div>
                <h1 className="text-2xl font-bold">Kitchen Interface</h1>
                <p className="text-gray-400">Real-time order management</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm">
                <p className="text-gray-400">Station</p>
                <input
                  type="text"
                  value={station}
                  onChange={(e) => setStation(e.target.value)}
                  placeholder="e.g., Grill, Prep"
                  className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                />
              </div>
              
              <div className="text-right">
                <p className="text-gray-400 text-sm">Chef</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-warning-400" />
              <div>
                <p className="text-2xl font-bold text-white">{pendingOrders.length}</p>
                <p className="text-gray-400 text-sm">New Orders</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Timer className="w-6 h-6 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">{preparingOrders.length}</p>
                <p className="text-gray-400 text-sm">In Progress</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-success-400" />
              <div>
                <p className="text-2xl font-bold text-white">{claimedOrders.size}</p>
                <p className="text-gray-400 text-sm">My Orders</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {orders.length > 0 ? getOrderAge(orders[0].created_at) : '0m'}
                </p>
                <p className="text-gray-400 text-sm">Oldest Order</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* New Orders */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-warning-400" />
              <h2 className="text-xl font-semibold">New Orders ({pendingOrders.length})</h2>
            </div>

            <div className="space-y-4">
              {pendingOrders.map(order => {
                const urgency = getOrderUrgency(order.created_at);
                const isClaimedByMe = claimedOrders.has(order.id);
                
                return (
                  <div key={order.id} className={`rounded-lg border-2 p-4 ${getUrgencyColor(urgency)}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">#{order.order_number}</h3>
                        <p className="text-sm text-gray-600">
                          Table {order.table?.table_number} • {formatTime(order.created_at)} • {getOrderAge(order.created_at)} ago
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {urgency === 'urgent' && (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                        {!isClaimedByMe ? (
                          <button
                            onClick={() => handleClaimOrder(order.id)}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                          >
                            Claim Order
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateOrderStatus(order.id, 'preparing')}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                            >
                              Start Cooking
                            </button>
                            <button
                              onClick={() => handleReleaseOrder(order.id)}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-2 rounded-lg text-sm"
                            >
                              Release
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {order.order_items?.map((item, index) => (
                        <div key={index} className="flex items-center justify-between bg-white/50 rounded p-2">
                          <div>
                            <span className="font-medium text-gray-900">{item.quantity}x {item.menu_item?.name}</span>
                            {item.special_instructions && (
                              <p className="text-sm text-gray-600 italic">Note: {item.special_instructions}</p>
                            )}
                            {item.claimed_by && (
                              <p className="text-xs text-blue-600">Claimed by: {item.claimed_by.email}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {order.special_instructions && (
                      <div className="mt-3 p-2 bg-warning-100 rounded">
                        <p className="text-sm text-warning-800">
                          <strong>Order Note:</strong> {order.special_instructions}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              {pendingOrders.length === 0 && (
                <div className="text-center py-12 bg-gray-800 rounded-lg">
                  <CheckCircle className="mx-auto w-12 h-12 text-success-400 mb-4" />
                  <p className="text-gray-400">No new orders</p>
                </div>
              )}
            </div>
          </div>

          {/* Orders in Progress */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Timer className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold">In Progress ({preparingOrders.length})</h2>
            </div>

            <div className="space-y-4">
              {preparingOrders.map(order => {
                const urgency = getOrderUrgency(order.created_at);
                const isClaimedByMe = claimedOrders.has(order.id);
                
                return (
                  <div key={order.id} className={`rounded-lg border-2 p-4 ${getUrgencyColor(urgency)}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">#{order.order_number}</h3>
                        <p className="text-sm text-gray-600">
                          Table {order.table?.table_number} • {formatTime(order.created_at)} • {getOrderAge(order.created_at)} ago
                        </p>
                      </div>
                      
                      {isClaimedByMe && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                          className="bg-success-600 hover:bg-success-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                        >
                          Mark Ready
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {order.order_items?.map((item, index) => (
                        <div key={index} className="flex items-center justify-between bg-white/50 rounded p-2">
                          <div>
                            <span className="font-medium text-gray-900">{item.quantity}x {item.menu_item?.name}</span>
                            {item.special_instructions && (
                              <p className="text-sm text-gray-600 italic">Note: {item.special_instructions}</p>
                            )}
                            {item.claimed_by && (
                              <p className="text-xs text-blue-600">Assigned to: {item.claimed_by.email}</p>
                            )}
                          </div>
                          
                          {item.claimed_by_user_id === user?.id && item.status !== 'completed' && (
                            <button
                              onClick={() => markItemComplete(item.id)}
                              className="bg-success-600 hover:bg-success-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Complete
                            </button>
                          )}
                          
                          {item.status === 'completed' && (
                            <CheckCircle className="w-5 h-5 text-success-600" />
                          )}
                        </div>
                      ))}
                    </div>

                    {order.special_instructions && (
                      <div className="mt-3 p-2 bg-warning-100 rounded">
                        <p className="text-sm text-warning-800">
                          <strong>Order Note:</strong> {order.special_instructions}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              {preparingOrders.length === 0 && (
                <div className="text-center py-12 bg-gray-800 rounded-lg">
                  <Timer className="mx-auto w-12 h-12 text-blue-400 mb-4" />
                  <p className="text-gray-400">No orders in progress</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 