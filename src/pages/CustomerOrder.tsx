import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus } from 'lucide-react';
import { dbHelpers } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { LoadingPage } from '../components/common/LoadingSpinner';
import type { MenuItem, MenuCategory, RestaurantTable, Restaurant } from '../types';

interface CustomerOrderState {
  restaurant: Restaurant | null;
  table: RestaurantTable | null;
  categories: MenuCategory[];
  menuItems: Record<string, MenuItem[]>;
  loading: boolean;
  error: string | null;
}

export function CustomerOrder() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { addItem, itemCount, total } = useCart();
  
  const [state, setState] = useState<CustomerOrderState>({
    restaurant: null,
    table: null,
    categories: [],
    menuItems: {},
    loading: true,
    error: null,
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showInstructions, setShowInstructions] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setState(prev => ({ ...prev, error: 'Invalid QR code', loading: false }));
      return;
    }

    loadTableAndMenu();
  }, [token]);

  const loadTableAndMenu = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Get table and restaurant info
      const tableData = await dbHelpers.getTableByToken(token!);
      
      if (!tableData) {
        setState(prev => ({ ...prev, error: 'Table not found', loading: false }));
        return;
      }

      // Get menu with items
      const menuData = await dbHelpers.getMenuWithItems(tableData.restaurant.id);

      // Organize menu items by category
      const menuItems: Record<string, MenuItem[]> = {};
      const categories = menuData.map(category => {
        menuItems[category.id] = category.menu_items || [];
        return category;
      });

      setState({
        restaurant: tableData.restaurant,
        table: tableData,
        categories,
        menuItems,
        loading: false,
        error: null,
      });

      // Select first category by default
      if (categories.length > 0) {
        setSelectedCategory(categories[0].id);
      }
    } catch (error) {
      console.error('Error loading menu:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load menu. Please try again.',
        loading: false,
      }));
    }
  };

  const handleAddToCart = (item: MenuItem, specialInstructions?: string) => {
    addItem(item, 1, specialInstructions);
    setShowInstructions('');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (state.loading) {
    return <LoadingPage message="Loading menu..." />;
  }

  if (state.error || !state.restaurant || !state.table) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Oops!</h1>
          <p className="text-gray-600 mb-6">{state.error || 'Something went wrong'}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const currentItems = state.menuItems[selectedCategory] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {state.restaurant.name}
              </h1>
              <p className="text-sm text-gray-600">
                Table {state.table.table_number}
              </p>
            </div>
            
            {/* Cart Button */}
            {itemCount > 0 && (
              <button
                onClick={() => navigate(`/order/${token}/cart`)}
                className="relative btn-primary flex items-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>{itemCount} items</span>
                <span className="ml-2 font-bold">{formatPrice(total)}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {/* Category Tabs */}
        <div className="mb-6">
          <div className="flex overflow-x-auto gap-2 pb-2">
            {state.categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-4">
          {currentItems.length > 0 ? (
            currentItems.map((item) => (
              <div key={item.id} className="card">
                <div className="flex gap-4">
                  {/* Item Image */}
                  {item.image_url && (
                    <div className="flex-shrink-0">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  
                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {item.name}
                        </h3>
                        {item.description && (
                          <p className="text-gray-600 text-sm mb-2">
                            {item.description}
                          </p>
                        )}
                        <p className="text-lg font-bold text-primary-600">
                          {formatPrice(item.price)}
                        </p>
                        {item.preparation_time_minutes > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            ~{item.preparation_time_minutes} min prep time
                          </p>
                        )}
                      </div>
                      
                      {/* Add to Cart */}
                      <div className="flex-shrink-0 ml-4">
                        <button
                          onClick={() => setShowInstructions(item.id)}
                          className="btn-primary flex items-center gap-2"
                          disabled={!item.is_available}
                        >
                          <Plus className="w-4 h-4" />
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Special Instructions Modal */}
                    {showInstructions === item.id && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div 
                          className="fixed inset-0 bg-black bg-opacity-50"
                          onClick={() => setShowInstructions('')}
                        />
                        <div className="relative bg-white rounded-lg p-6 w-full max-w-md">
                          <h3 className="text-lg font-semibold mb-4">
                            Add {item.name}
                          </h3>
                          
                          <div className="mb-4">
                            <label className="form-label">
                              Special Instructions (Optional)
                            </label>
                            <textarea
                              id={`instructions-${item.id}`}
                              className="form-input"
                              rows={3}
                              placeholder="Any special requests..."
                            />
                          </div>
                          
                          <div className="flex gap-3">
                            <button
                              onClick={() => setShowInstructions('')}
                              className="btn-secondary flex-1"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                const textarea = document.getElementById(`instructions-${item.id}`) as HTMLTextAreaElement;
                                handleAddToCart(item, textarea?.value || undefined);
                              }}
                              className="btn-primary flex-1"
                            >
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No items available in this category</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Cart Button for mobile */}
      {itemCount > 0 && (
        <div className="fixed bottom-4 right-4 z-10 md:hidden">
          <button
            onClick={() => navigate(`/order/${token}/cart`)}
            className="btn-primary rounded-full p-4 shadow-lg"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              <span className="bg-white text-primary-600 rounded-full px-2 py-1 text-xs font-bold">
                {itemCount}
              </span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
} 