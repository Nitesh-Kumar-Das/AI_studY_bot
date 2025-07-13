'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useUserStore from '../store/userStore';
import LoadingSpinner from './LoadingSpinner';

interface RouteGuardProps {
  children: React.ReactNode;
}

// Define which routes require authentication
const protectedRoutes = ['/dashboard', '/upload', '/schedule', '/summary', '/performance', '/quiz'];
const publicRoutes = ['/'];

export default function RouteGuard({ children }: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, setAuthenticated, setUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const isProtectedRoute = protectedRoutes.includes(pathname);
      const isPublicRoute = publicRoutes.includes(pathname);

      if (token && !isAuthenticated) {
        // Update store if token exists but not authenticated
        setAuthenticated(true);
        setUser({
          id: 'demo-user',
          name: 'Demo User',
          email: 'demo@example.com',
          createdAt: new Date(),
        });
      } else if (!token && isAuthenticated) {
        // Clear store if no token but still authenticated
        setAuthenticated(false);
        setUser(null);
      }

      // Handle route protection
      if (isProtectedRoute && !token) {
        router.push('/');
        return;
      }

      if (isPublicRoute && token) {
        router.push('/dashboard');
        return;
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [pathname, isAuthenticated, setAuthenticated, setUser, router]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    );
  }

  return <>{children}</>;
}
