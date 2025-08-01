'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  fullName: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (fullName: string, username: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const checkAuth = async () => {
    try {
        const response = await fetch('http://localhost:8000/api/me/', { credentials: 'include' });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.user) {
          setUser(data.user);
        } else if (data.username) {
          // Handle case where user data is directly in response
          setUser(data);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
              const response = await fetch('http://localhost:8000/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
        router.push('/dashboard');
        return true;
      } else {
        const data = await response.json();
        toast({
          title: "Login Failed",
          description: data.message || "Invalid credentials",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const signup = async (fullName: string, username: string, email: string, password: string): Promise<boolean> => {
    try {
              const response = await fetch('http://localhost:8000/api/signup/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, username, email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Account Created!",
          description: "You can now log in with your credentials.",
        });
        router.push('/login');
        return true;
      } else {
        toast({
          title: "Signup Failed",
          description: data.message || "An error occurred during signup",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Signup Failed",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('http://localhost:8000/api/logout/', { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      router.push('/login');
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Redirect to login if user is not authenticated and not on auth pages
  useEffect(() => {
    if (!loading && user === null) {
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath === '/login' || currentPath === '/signup' || currentPath === '/';
      const isDashboardPage = currentPath.startsWith('/dashboard');
      
      // Don't redirect if we're on dashboard pages - let the dashboard handle it
      if (!isAuthPage && !isDashboardPage) {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
