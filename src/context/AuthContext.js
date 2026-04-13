import React, { createContext, useContext, useState, useEffect } from 'react';
import { StorageService } from '../services/storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const savedUser = await StorageService.getUser();
      if (savedUser) setUser(savedUser);
    } catch (e) {
      console.error('Auth check error:', e);
    } finally {
      setLoading(false);
    }
  };

  // email zorunlu, name/age onboarding'den gelir
  const login = async (email, name = null, age = null) => {
    const userData = {
      email,
      name,
      age,
      loggedAt: new Date().toISOString(),
    };
    await StorageService.saveUser(userData);
    setUser(userData);
  };

  const updateProfile = async (name, age) => {
    const updated = await StorageService.updateUser({ name, age });
    setUser(updated);
  };

  const logout = async () => {
    await StorageService.removeUser();
    setUser(null);
  };

  const deleteAccount = async () => {
    await StorageService.deleteAllData();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, updateProfile, logout, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
