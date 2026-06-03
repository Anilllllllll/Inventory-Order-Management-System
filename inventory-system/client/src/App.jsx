import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';

// Pages
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import OrderHistory from './pages/OrderHistory.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminProducts from './pages/AdminProducts.jsx';
import AdminOrders from './pages/AdminOrders.jsx';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0f172a',
              color: '#f8fafc',
              border: '1px solid #1e293b',
            },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Seller / User routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['USER']}>
                <Layout>
                  <UserDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/orders"
            element={
              <ProtectedRoute allowedRoles={['USER']}>
                <Layout>
                  <OrderHistory />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Layout>
                  <AdminProducts />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Layout>
                  <AdminOrders />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
