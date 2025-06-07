import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  Eye,
  Settings,
  QrCode
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import type { Order } from '../../types';

interface DashboardStats {
  totalOrders: number;
  todayOrders: number;
  activeOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  activeTables: number;
  activeStaff: number;
  popularItems: Array<{ name: string; count: number }>;
}

export function Dashboard() {
  const { user, userRole, restaurantId, signOut } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (restaurantId) {
      loadDashboardData();
    }
  }, [restaurantId]);

  const loadDashboardData = async () => {
    if (!restaurantId) return;

    try {
      setLoading(true);
      setError(null);

      // Load recent orders
      const { data: orders, error: ordersError } = await supabase
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
        .order('created_at', { ascending: false })
        .limit(10);

      if (ordersError) throw ordersError;
      setRecentOrders(orders || []);

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayOrders = orders?.filter(order => 
        new Date(order.created_at) >= today
      ) || [];

      const activeOrders = orders?.filter(order => 
        ['pending', 'preparing'].includes(order.status)
      ) || [];

      // Get table count
      const { count: tableCount } = await supabase
        .from('restaurant_tables')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true);

      // Get active staff count
      const { count: staffCount } = await supabase
        .from('active_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .eq('status', 'active');

      // Calculate popular items
      const popularItems: Record<string, number> = {};
      orders?.forEach(order => {
        order.order_items?.forEach((item: any) => {
          if (item.menu_item) {
            const name = item.menu_item.name;
            popularItems[name] = (popularItems[name] || 0) + item.quantity;
          }
        });
      });

      const sortedItems = Object.entries(popularItems)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      setStats({
        totalOrders: orders?.length || 0,
        todayOrders: todayOrders.length,
        activeOrders: activeOrders.length,
        totalRevenue: orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0,
        todayRevenue: todayOrders.reduce((sum, order) => sum + order.total_amount, 0),
        activeTables: tableCount || 0,
        activeStaff: staffCount || 0,
        popularItems: sortedItems,
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-warning-600 bg-warning-100';
      case 'preparing': return 'text-primary-600 bg-primary-100';
      case 'ready': return 'text-success-600 bg-success-100';
      case 'served': return 'text-gray-600 bg-gray-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
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
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.email}</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Role: <span className="font-medium capitalize">{userRole}</span>
              </div>
              <button
                onClick={signOut}
                className="btn-secondary"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link to="/dashboard/menu" className="card hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-lg">
                <Settings className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Manage Menu</h3>
                <p className="text-sm text-gray-600">Add/edit items</p>
              </div>
            </div>
          </Link>

          <Link to="/dashboard/tables" className="card hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-success-100 rounded-lg">
                <QrCode className="w-6 h-6 text-success-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">QR Codes</h3>
                <p className="text-sm text-gray-600">Manage tables</p>
              </div>
            </div>
          </Link>

          <Link to="/dashboard/orders" className="card hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-warning-100 rounded-lg">
                <Eye className="w-6 h-6 text-warning-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">View Orders</h3>
                <p className="text-sm text-gray-600">Track all orders</p>
              </div>
            </div>
          </Link>

          <Link to="/dashboard/staff" className="card hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Staff</h3>
                <p className="text-sm text-gray-600">Manage team</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <ShoppingBag className="w-8 h-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Today's Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.todayOrders}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-3 bg-success-100 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-success-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.todayRevenue)}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-3 bg-warning-100 rounded-lg">
                  <Clock className="w-8 h-8 text-warning-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeOrders}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Staff</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeStaff}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
                <Link to="/dashboard/orders" className="text-primary-600 hover:text-primary-500 text-sm font-medium">
                  View all →
                </Link>
              </div>

              <div className="space-y-4">
                {recentOrders.length > 0 ? (
                  recentOrders.slice(0, 6).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium text-gray-900">#{order.order_number}</p>
                          <p className="text-sm text-gray-600">
                            Table {order.table?.table_number} • {formatTime(order.created_at)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <p className="font-semibold text-gray-900">{formatCurrency(order.total_amount)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <ShoppingBag className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">No orders yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Popular Items */}
          <div>
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Popular Items</h2>
              
              <div className="space-y-4">
                {stats?.popularItems && stats.popularItems.length > 0 ? (
                  stats.popularItems.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary-600">{index + 1}</span>
                        </div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                      </div>
                      <p className="text-sm text-gray-600">{item.count} orders</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">No data yet</p>
                  </div>
                )}
              </div>

              {stats && stats.popularItems.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <Link to="/dashboard/menu" className="text-primary-600 hover:text-primary-500 text-sm font-medium">
                    Manage menu →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 