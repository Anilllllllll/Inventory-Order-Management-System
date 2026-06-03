import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // If Admin attempts to access user route or vice-versa, redirect to their home
    return <Navigate to={user?.role === 'ADMIN' ? '/admin' : '/dashboard'} replace />;
  }

  return children;
};

export default ProtectedRoute;
