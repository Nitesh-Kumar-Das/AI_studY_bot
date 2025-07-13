'use client';

import { useEffect, ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import useUserStore from '../store/userStore';
import LoadingSpinner from './LoadingSpinner';

interface WithAuthOptions {
  redirectTo?: string;
  requireAuth?: boolean;
}

function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const { redirectTo = '/dashboard', requireAuth = true } = options;

  return function AuthenticatedComponent(props: P) {
    const router = useRouter();
    const { isAuthenticated, setAuthenticated, setUser } = useUserStore();

    useEffect(() => {
      // Check authentication status
      const token = localStorage.getItem('authToken');
      
      if (token && !isAuthenticated) {
        // User has token but store not updated
        setAuthenticated(true);
        setUser({
          id: 'demo-user',
          name: 'Demo User',
          email: 'demo@example.com',
          createdAt: new Date(),
        });
      } else if (!token && isAuthenticated) {
        // Token removed but store still shows authenticated
        setAuthenticated(false);
        setUser(null);
      }
    }, [isAuthenticated, setAuthenticated, setUser]);

    useEffect(() => {
      const token = localStorage.getItem('authToken');
      
      if (requireAuth && !token) {
        // Redirect to home if authentication required but no token
        router.push('/');
      } else if (!requireAuth && token) {
        // Redirect to dashboard if already authenticated and on public page
        router.push(redirectTo);
      }
    }, [router, requireAuth, redirectTo]);

    // Show loading while checking authentication
    const token = localStorage.getItem('authToken');
    if (requireAuth && !token) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <LoadingSpinner size="lg" message="Checking authentication..." />
        </div>
      );
    }

    if (!requireAuth && token) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <LoadingSpinner size="lg" message="Redirecting..." />
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}

export default withAuth;
