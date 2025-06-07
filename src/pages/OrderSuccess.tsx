import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle, Clock, Utensils, MapPin } from 'lucide-react';
import { dbHelpers } from '../lib/supabase';
import type { Restaurant, RestaurantTable } from '../types';

export function OrderSuccess() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('orderNumber');
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [table, setTable] = useState<RestaurantTable | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    
    loadTableInfo();
  }, [token]);

  const loadTableInfo = async () => {
    try {
      const tableData = await dbHelpers.getTableByToken(token!);
      
      if (tableData) {
        setRestaurant(tableData.restaurant);
        setTable(tableData);
      }
    } catch (error) {
      console.error('Error loading table info:', error);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Success Icon and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-success-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-success-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Order Placed Successfully!
          </h1>
          
          <p className="text-gray-600">
            Thank you for your order. We'll start preparing it right away.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="card mb-6">
          <div className="text-center">
            {orderNumber && (
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-1">Order Number</p>
                <p className="text-2xl font-bold text-primary-600 font-mono">
                  #{orderNumber}
                </p>
              </div>
            )}

            {restaurant && table && (
              <div className="mb-6">
                <div className="flex items-center justify-center gap-2 text-gray-600 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">
                    {restaurant.name} • Table {table.table_number}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
              <div className="p-4 bg-primary-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Estimated Time
                </h3>
                <p className="text-sm text-gray-600">
                  15-25 minutes
                </p>
              </div>

              <div className="p-4 bg-success-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Utensils className="w-6 h-6 text-success-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Status
                </h3>
                <p className="text-sm text-gray-600">
                  Sent to kitchen
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* What's Next Card */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            What happens next?
          </h2>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-600">1</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Kitchen receives your order</h3>
                <p className="text-sm text-gray-600">
                  Our kitchen staff will start preparing your delicious meal
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-600">2</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Food preparation</h3>
                <p className="text-sm text-gray-600">
                  Fresh ingredients, carefully prepared just for you
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-600">3</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Ready to serve</h3>
                <p className="text-sm text-gray-600">
                  Our staff will bring your order directly to your table
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Notice */}
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-warning-100 rounded-full flex items-center justify-center">
                <span className="text-warning-600 text-sm">💳</span>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-warning-800 mb-1">
                Payment Information
              </h3>
              <p className="text-sm text-warning-700">
                Please pay for your order at the restaurant when your meal is ready. 
                We accept cash and all major credit cards.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.location.href = `/order/${token}`}
            className="btn-secondary flex-1"
          >
            Order More Items
          </button>
          
          <button
            onClick={() => window.print()}
            className="btn-primary flex-1"
          >
            Print Receipt
          </button>
        </div>

        {/* Footer Message */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">
            Need help with your order?
          </p>
          <p className="text-sm text-gray-500">
            Please ask any member of our staff for assistance.
          </p>
        </div>
      </div>
    </div>
  );
} 