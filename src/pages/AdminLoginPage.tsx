import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/OptimizedAuthProvider';
import EnhancedLoginPage from '@/components/auth/EnhancedLoginPage';

export function AdminLoginPage() {
  const { user, userRole } = useAuth();

  // Redirect if already authenticated as admin
  if (user && userRole === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Redirect if already authenticated as non-admin
  if (user && userRole !== 'admin') {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Admin Portal
            </h1>
            <p className="text-muted-foreground">
              Acceso exclusivo para administradores
            </p>
          </div>
          
          <EnhancedLoginPage />
          
          <div className="mt-6 text-center">
            <a 
              href="/auth" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ¿Eres cliente? Ingresa aquí
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}