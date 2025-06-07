
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';

// Customer pages
import { CustomerOrder } from './pages/CustomerOrder';
import { CustomerCart } from './pages/CustomerCart';
import { OrderSuccess } from './pages/OrderSuccess';

// Auth pages (to be created)
import { SignIn } from './pages/auth/SignIn';
import { SignUp } from './pages/auth/SignUp';

// Dashboard pages (to be created)
import { Dashboard } from './pages/dashboard/Dashboard';
import { MenuManagement } from './pages/dashboard/MenuManagement';
import { TableManagement } from './pages/dashboard/TableManagement';
import { OrderManagement } from './pages/dashboard/OrderManagement';
import { StaffManagement } from './pages/dashboard/StaffManagement';

// Kitchen interface (to be created)
import { KitchenInterface } from './pages/KitchenInterface';

// Protected route component
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Landing page
import { LandingPage } from './pages/LandingPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Landing page */}
            <Route path="/" element={<LandingPage />} />

            {/* Authentication routes */}
            <Route path="/auth/signin" element={<SignIn />} />
            <Route path="/auth/signup" element={<SignUp />} />

            {/* Customer ordering flow - no auth required */}
            <Route 
              path="/order/:token" 
              element={
                <CartProvider persistKey="tabledirect_cart">
                  <CustomerOrder />
                </CartProvider>
              } 
            />
            <Route 
              path="/order/:token/cart" 
              element={
                <CartProvider persistKey="tabledirect_cart">
                  <CustomerCart />
                </CartProvider>
              } 
            />
            <Route path="/order/:token/success" element={<OrderSuccess />} />

            {/* Protected dashboard routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager']}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/menu" 
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager']}>
                  <MenuManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/tables" 
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager']}>
                  <TableManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/orders" 
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager', 'server', 'host']}>
                  <OrderManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/staff" 
              element={
                <ProtectedRoute allowedRoles={['owner', 'manager']}>
                  <StaffManagement />
                </ProtectedRoute>
              } 
            />

            {/* Kitchen interface - chef role only */}
            <Route 
              path="/kitchen" 
              element={
                <ProtectedRoute allowedRoles={['chef']}>
                  <KitchenInterface />
                </ProtectedRoute>
              } 
            />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
