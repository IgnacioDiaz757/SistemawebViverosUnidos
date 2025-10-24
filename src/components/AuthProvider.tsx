'use client';

import { ReactNode } from 'react';
import { AuthProvider as LocalAuthProvider } from '@/context/AuthContext';

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  return <LocalAuthProvider>{children}</LocalAuthProvider>;
}
