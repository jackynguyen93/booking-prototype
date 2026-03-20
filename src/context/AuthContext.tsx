'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '@/types';
import { mockUsers } from '@/data/users';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  isAdmin: () => boolean;
  isTenant: () => boolean;
  isFacilityUser: () => boolean;
  impersonate: (userId: string) => void;
  exitImpersonation: () => void;
  isImpersonating: boolean;
  originalUser: User | null;
  updateCurrentUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [originalUser, setOriginalUser] = useState<User | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('rh_current_user');
      const storedOriginal = localStorage.getItem('rh_original_user');
      const storedImpersonating = localStorage.getItem('rh_impersonating');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
      if (storedOriginal) {
        setOriginalUser(JSON.parse(storedOriginal));
      }
      if (storedImpersonating) {
        setIsImpersonating(JSON.parse(storedImpersonating));
      }
    } catch (e) {
      console.error('Failed to load auth from localStorage', e);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((email: string, password: string): { success: boolean; error?: string } => {
    const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) {
      return { success: false, error: 'Invalid email or password.' };
    }
    if (user.status === 'PENDING') {
      return { success: false, error: 'Your account is pending approval. Please contact admin@rosshouse.org.au.' };
    }
    if (user.status === 'REJECTED' || user.status === 'SUSPENDED') {
      return { success: false, error: 'Your account has been suspended. Please contact admin@rosshouse.org.au.' };
    }
    setCurrentUser(user);
    localStorage.setItem('rh_current_user', JSON.stringify(user));
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setOriginalUser(null);
    setIsImpersonating(false);
    localStorage.removeItem('rh_current_user');
    localStorage.removeItem('rh_original_user');
    localStorage.removeItem('rh_impersonating');
  }, []);

  const impersonate = useCallback((userId: string) => {
    const user = mockUsers.find(u => u.id === userId);
    if (!user) return;
    setOriginalUser(currentUser);
    setCurrentUser(user);
    setIsImpersonating(true);
    localStorage.setItem('rh_original_user', JSON.stringify(currentUser));
    localStorage.setItem('rh_current_user', JSON.stringify(user));
    localStorage.setItem('rh_impersonating', 'true');
  }, [currentUser]);

  const exitImpersonation = useCallback(() => {
    if (originalUser) {
      setCurrentUser(originalUser);
      localStorage.setItem('rh_current_user', JSON.stringify(originalUser));
    }
    setOriginalUser(null);
    setIsImpersonating(false);
    localStorage.removeItem('rh_original_user');
    localStorage.removeItem('rh_impersonating');
  }, [originalUser]);

  const updateCurrentUser = useCallback((user: User) => {
    setCurrentUser(user);
    localStorage.setItem('rh_current_user', JSON.stringify(user));
  }, []);

  const isAdmin = useCallback(() => currentUser?.role === 'ADMIN', [currentUser]);
  const isTenant = useCallback(() =>
    ['MEMBER_TENANT', 'COMMERCIAL_TENANT'].includes(currentUser?.role || ''),
    [currentUser]
  );
  const isFacilityUser = useCallback(() => currentUser?.role === 'FACILITY_USER', [currentUser]);

  return (
    <AuthContext.Provider value={{
      currentUser,
      isLoading,
      login,
      logout,
      isAdmin,
      isTenant,
      isFacilityUser,
      impersonate,
      exitImpersonation,
      isImpersonating,
      originalUser,
      updateCurrentUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
