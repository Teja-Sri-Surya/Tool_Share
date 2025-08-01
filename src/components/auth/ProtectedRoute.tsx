'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  console.log('ProtectedRoute - user:', user, 'loading:', loading);

  useEffect(() => {
    if (!loading && !user) {
      console.log('ProtectedRoute - redirecting to login');
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    console.log('ProtectedRoute - showing loading state');
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute - no user, returning null');
    return null; // Will redirect to login
  }

  console.log('ProtectedRoute - rendering children');
  return <>{children}</>;
} 
