'use client';

import { ReactNode } from 'react';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface SupabaseProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin';
}

export default function SupabaseProtectedRoute({ children }: SupabaseProtectedRouteProps) {
  const { user, loading } = useSupabaseAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;
  return <>{children}</>;
}
