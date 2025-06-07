import { Link } from 'react-router-dom';
import { QrCode, Smartphone, Users, ChefHat, BarChart3, Shield, Clock, CheckCircle } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold mb-6">
              TableDirect
            </h1>
            <p className="text-xl sm:text-2xl mb-4 text-primary-100">
              Revolutionary QR Ordering System for Restaurants
            </p>
            <p className="text-lg mb-8 text-primary-200 max-w-3xl mx-auto">
              Transform your restaurant with contactless ordering, real-time kitchen management, 
              and seamless customer experiences. No app downloads required.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/auth/signup"
                className="bg-white text-primary-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg text-lg transition-colors"
              >
                Start Free Trial
              </Link>
              <Link
                to="/auth/signin"
                className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold py-3 px-8 rounded-lg text-lg transition-colors"
              >
                Staff Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Everything you need for modern restaurant ordering
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            TableDirect provides a complete solution for contactless dining and efficient kitchen operations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* QR Ordering */}
          <div className="card text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <QrCode className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              QR Code Ordering
            </h3>
            <p className="text-gray-600">
              Customers scan QR codes at tables to browse menus and place orders instantly. 
              No app downloads or registration required.
            </p>
          </div>

          {/* Mobile Optimized */}
          <div className="card text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-success-100 rounded-full mb-4">
              <Smartphone className="w-8 h-8 text-success-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Mobile Optimized
            </h3>
            <p className="text-gray-600">
              Beautiful, responsive interface that works perfectly on any device. 
              Fast loading and intuitive navigation for all customers.
            </p>
          </div>

          {/* Real-time Kitchen */}
          <div className="card text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-warning-100 rounded-full mb-4">
              <ChefHat className="w-8 h-8 text-warning-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Kitchen Interface
            </h3>
            <p className="text-gray-600">
              Real-time order management with claiming system. Multiple chefs can work 
              simultaneously without conflicts.
            </p>
          </div>

          {/* Multi-user Management */}
          <div className="card text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Team Management
            </h3>
            <p className="text-gray-600">
              Role-based access for owners, managers, chefs, and servers. 
              Everyone gets the right tools for their job.
            </p>
          </div>

          {/* Analytics */}
          <div className="card text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Smart Analytics
            </h3>
            <p className="text-gray-600">
              Track orders, popular items, peak times, and customer preferences. 
              Make data-driven decisions for your restaurant.
            </p>
          </div>

          {/* Secure & Reliable */}
          <div className="card text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Shield className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Secure & Reliable
            </h3>
            <p className="text-gray-600">
              Enterprise-grade security with real-time backup. Your data is always 
              safe and your service never interrupted.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How TableDirect Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple setup, powerful results
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 text-white rounded-full mb-4">
                <span className="text-xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Setup Your Restaurant
              </h3>
              <p className="text-gray-600">
                Create your account, add your menu items, and generate QR codes for your tables. 
                Takes just minutes to get started.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 text-white rounded-full mb-4">
                <span className="text-xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Customers Order
              </h3>
              <p className="text-gray-600">
                Customers scan QR codes, browse your menu, and place orders directly from their phones. 
                No waiting for servers to take orders.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 text-white rounded-full mb-4">
                <span className="text-xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Kitchen Prepares
              </h3>
              <p className="text-gray-600">
                Orders appear instantly in your kitchen interface. Staff can claim orders, 
                update statuses, and coordinate efficiently.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why restaurants choose TableDirect
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-success-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Reduce Wait Times</h3>
                  <p className="text-gray-600">Customers order immediately without waiting for servers</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-success-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Increase Order Accuracy</h3>
                  <p className="text-gray-600">Direct digital orders eliminate miscommunication</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-success-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Improve Staff Efficiency</h3>
                  <p className="text-gray-600">Staff focus on service instead of taking orders</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Clock className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Real-time Updates</h3>
                  <p className="text-gray-600">Kitchen and management see orders instantly</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-success-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Higher Order Values</h3>
                  <p className="text-gray-600">Customers browse full menu and add items easily</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-success-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Better Customer Experience</h3>
                  <p className="text-gray-600">Fast, contactless ordering that customers love</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">
            Ready to revolutionize your restaurant?
          </h2>
          <p className="text-xl mb-8 text-primary-100">
            Join hundreds of restaurants already using TableDirect to improve their operations and delight customers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth/signup"
              className="bg-white text-primary-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg text-lg transition-colors"
            >
              Start Your Free Trial
            </Link>
            <Link
              to="/auth/signin"
              className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold py-3 px-8 rounded-lg text-lg transition-colors"
            >
              Existing User Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="mb-4">© 2024 TableDirect. All rights reserved.</p>
          <p className="text-sm text-gray-400">
            The modern QR ordering system for restaurants everywhere.
          </p>
        </div>
      </footer>
    </div>
  );
} 