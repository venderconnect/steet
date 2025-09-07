import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      if (token && savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      // Clear corrupted data
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await authService.login({ email, password });
      const { token, user: userData } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      toast({ title: 'Login Successful', description: `Welcome back, ${userData.name}!` });
      return true;
    } catch (err) {
      toast({ title: 'Login Failed', description: err.response?.data?.msg || 'Invalid credentials', variant: 'destructive' });
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const res = await authService.register(userData);
      const { token, user: newUser } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      toast({ title: 'Registration Successful', description: `Welcome, ${newUser.name}!` });
      return true;
    } catch (err) {
      toast({ title: 'Registration Failed', description: err.response?.data?.msg || 'An error occurred', variant: 'destructive' });
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast({ title: 'Logged Out' });
  };

  const value = { user, isAuthenticated: !!user, login, register, logout };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
