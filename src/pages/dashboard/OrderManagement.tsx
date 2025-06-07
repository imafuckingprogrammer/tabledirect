import { useState, useEffect } from 'react';
import { Search, Filter, Eye, Clock, CheckCircle, XCircle, AlertCircle, Truck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import type { Order } from '../../types';

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';

export function OrderManagement() {
  const { restaurantId } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (restaurantId) {
      loadOrders();
      
      // Set up real-time subscription
      const subscription = supabase
        .channel(`orders_${restaurantId}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'orders',
            filter: `restaurant_id=eq.${restaurantId}`
          }, 
          () => {
            loadOrders();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [restaurantId]);

  const loadOrders = async () => {
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
            menu_item:menu_items(*)
          )
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status, updated_at: new Date().toISOString() }
          : order
      ));
      
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-warning-700 bg-warning-100 border-warning-200';
      case 'preparing': return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'ready': return 'text-success-700 bg-success-100 border-success-200';
      case 'served': return 'text-gray-700 bg-gray-100 border-gray-200';
      case 'cancelled': return 'text-red-700 bg-red-100 border-red-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'preparing': return <AlertCircle className="w-4 h-4" />;
      case 'ready': return <CheckCircle className="w-4 h-4" />;
      case 'served': return <Truck className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const filteredOrders = orders.filter(order => {
         const matchesSearch = 
       order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
       order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       order.table?.table_number.toString().toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    served: orders.filter(o => o.status === 'served').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-600">Track and manage all restaurant orders</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="card text-center">
            <p className="text-2xl font-bold text-gray-900">{orderStats.total}</p>
            <p className="text-sm text-gray-600">Total Orders</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-warning-600">{orderStats.pending}</p>
            <p className="text-sm text-gray-600">Pending</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-blue-600">{orderStats.preparing}</p>
            <p className="text-sm text-gray-600">Preparing</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-success-600">{orderStats.ready}</p>
            <p className="text-sm text-gray-600">Ready</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-gray-600">{orderStats.served}</p>
            <p className="text-sm text-gray-600">Served</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input min-w-[150px]"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="served">Served</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <div key={order.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">#{order.order_number}</h3>
                    <p className="text-sm text-gray-600">
                      Table {order.table?.table_number} • {formatTime(order.created_at)}
                    </p>
                  </div>
                  
                  {order.customer_name && (
                    <div className="hidden md:block">
                      <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
                      {order.customer_phone && (
                        <p className="text-sm text-gray-600">{order.customer_phone}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(order.status)}`}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(order.status)}
                      {order.status}
                    </div>
                  </span>
                  
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(order.total_amount)}</p>
                    <p className="text-sm text-gray-600">
                      {order.order_items?.reduce((sum, item) => sum + item.quantity, 0)} items
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="space-y-2 mb-4">
                {order.order_items?.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {item.quantity}x {item.menu_item?.name}
                    </span>
                    <span className="text-gray-900">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
                
                {order.order_items && order.order_items.length > 3 && (
                  <p className="text-sm text-gray-500">
                    +{order.order_items.length - 3} more items
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {order.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="btn-primary text-sm"
                    >
                      Start Preparing
                    </button>
                    <button
                      onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      className="btn-secondary text-sm text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Cancel
                    </button>
                  </>
                )}
                
                {order.status === 'preparing' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'ready')}
                    className="btn-primary text-sm"
                  >
                    Mark Ready
                  </button>
                )}
                
                {order.status === 'ready' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'served')}
                    className="btn-primary text-sm"
                  >
                    Mark Served
                  </button>
                )}
              </div>
            </div>
          ))}

          {filteredOrders.length === 0 && (
            <div className="card text-center py-12">
              <Clock className="mx-auto w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-600">
                {orders.length === 0 ? 'No orders yet' : 'No orders match your filters'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Order #{selectedOrder.order_number}
                </h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Order Details</h3>
                    <p className="text-sm text-gray-600">Table: {selectedOrder.table?.table_number}</p>
                    <p className="text-sm text-gray-600">Time: {formatTime(selectedOrder.created_at)}</p>
                    <p className="text-sm text-gray-600">
                      Status: <span className={`font-medium ${getStatusColor(selectedOrder.status).split(' ')[0]}`}>
                        {selectedOrder.status}
                      </span>
                    </p>
                  </div>

                  {selectedOrder.customer_name && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Customer Info</h3>
                      <p className="text-sm text-gray-600">Name: {selectedOrder.customer_name}</p>
                      {selectedOrder.customer_phone && (
                        <p className="text-sm text-gray-600">Phone: {selectedOrder.customer_phone}</p>
                      )}
                      {selectedOrder.customer_email && (
                        <p className="text-sm text-gray-600">Email: {selectedOrder.customer_email}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Order Items</h3>
                  <div className="space-y-3">
                    {selectedOrder.order_items?.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{item.menu_item?.name}</p>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          {item.special_instructions && (
                            <p className="text-sm text-gray-600 italic">Note: {item.special_instructions}</p>
                          )}
                        </div>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Total */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(selectedOrder.total_amount)}</span>
                  </div>
                </div>

                {/* Special Instructions */}
                {selectedOrder.special_instructions && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Special Instructions</h3>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {selectedOrder.special_instructions}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 