
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

const ProtectedRoute = ({ children, fallback }: ProtectedRouteProps) => {
  const { isAuthenticated, isApproved, loading, profile } = useAuth();

  // Show loading while checking auth and profile
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show fallback (auth page)
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  // If authenticated but profile not loaded yet, keep showing loading
  // This prevents the brief redirect to pending-approval while profile loads
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // If authenticated but not approved, redirect to pending approval page
  if (!isApproved) {
    return <Navigate to="/pending-approval" replace />;
  }

  // If authenticated and approved, show the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
