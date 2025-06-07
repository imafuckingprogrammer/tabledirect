import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Trash2, User } from 'lucide-react';
import { dbHelpers } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { LoadingButton } from '../components/common/LoadingSpinner';
import type { RestaurantTable, Restaurant } from '../types';

export function CustomerCart() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clearCart, total, itemCount } = useCart();
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [table, setTable] = useState<RestaurantTable | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

    loadTableInfo();
  }, [token, navigate]);

  const loadTableInfo = async () => {
    try {
      setLoading(true);
      const tableData = await dbHelpers.getTableByToken(token!);
      
      if (!tableData) {
        setError('Table not found');
        return;
      }

      setRestaurant(tableData.restaurant);
      setTable(tableData);
    } catch (error) {
      console.error('Error loading table info:', error);
      setError('Failed to load table information');
    } finally {
      setLoading(false);
    }
  };

  const generateOrderNumber = () => {
    const now = new Date();
    const timestamp = now.getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `${timestamp}${random}`;
  };

  const handleSubmitOrder = async () => {
    if (!restaurant || !table || items.length === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      const orderNumber = generateOrderNumber();
      
      const orderData = {
        restaurant_id: restaurant.id,
        table_id: table.id,
        order_number: orderNumber,
        total_amount: total,
        customer_name: customerName.trim() || undefined,
        special_instructions: specialInstructions.trim() || undefined,
        items: items.map(item => ({
          menu_item_id: item.menu_item.id,
          quantity: item.quantity,
          unit_price: item.menu_item.price,
          special_instructions: item.special_instructions || undefined,
        })),
      };

      await dbHelpers.createOrder(orderData);
      
      // Clear cart and redirect to success page
      clearCart();
      navigate(`/order/${token}/success?orderNumber=${orderNumber}`);
      
    } catch (error) {
      console.error('Error submitting order:', error);
      setError('Failed to submit order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !restaurant || !table) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Oops!</h1>
          <p className="text-gray-600 mb-6">{error || 'Something went wrong'}</p>
          <button
            onClick={() => navigate(`/order/${token}`)}
            className="btn-primary"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/order/${token}`)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Your Cart</h1>
            </div>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto p-4">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some delicious items to get started!</p>
            <button
              onClick={() => navigate(`/order/${token}`)}
              className="btn-primary"
            >
              Browse Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/order/${token}`)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Your Cart</h1>
              <p className="text-sm text-gray-600">
                {restaurant.name} • Table {table.table_number}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Cart Items */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Order Items ({itemCount})
            </h2>
            
            {items.map((item, index) => (
              <div key={`${item.menu_item.id}-${index}`} className="card">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {item.menu_item.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {formatPrice(item.menu_item.price)} each
                    </p>
                    {item.special_instructions && (
                      <p className="text-sm text-primary-600 mt-1">
                        Special: {item.special_instructions}
                      </p>
                    )}
                  </div>
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.menu_item.id, item.quantity - 1)}
                      className="p-1 hover:bg-gray-100 rounded"
                      disabled={submitting}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    
                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    
                    <button
                      onClick={() => updateQuantity(item.menu_item.id, item.quantity + 1)}
                      className="p-1 hover:bg-gray-100 rounded"
                      disabled={submitting}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => removeItem(item.menu_item.id)}
                      className="p-1 hover:bg-red-100 text-red-600 rounded ml-2"
                      disabled={submitting}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Subtotal */}
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatPrice(item.subtotal)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Customer Info
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="form-label">
                    <User className="w-4 h-4 inline mr-2" />
                    Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="form-input"
                    placeholder="Your name for the order"
                    disabled={submitting}
                  />
                </div>
                
                <div>
                  <label className="form-label">
                    Special Instructions (Optional)
                  </label>
                  <textarea
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className="form-input"
                    rows={3}
                    placeholder="Allergies, preferences, etc."
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            {/* Order Total */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Order Summary
              </h3>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal ({itemCount} items)</span>
                  <span>{formatPrice(total)}</span>
                </div>
                
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-primary-600">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              <div className="mt-6">
                <LoadingButton
                  loading={submitting}
                  onClick={handleSubmitOrder}
                  className="btn-primary w-full"
                  disabled={items.length === 0}
                >
                  {submitting ? 'Placing Order...' : 'Place Order'}
                </LoadingButton>
              </div>
              
              <p className="text-xs text-gray-500 mt-3 text-center">
                Payment will be handled at the restaurant
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 