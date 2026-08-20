import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { StorageService } from '../services/storage';
import { apiClient, saveToken, removeToken, setUnauthorizedHandler } from '../services/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileCompletionPending, setProfileCompletionPending] = useState(false);
  const sessionRevisionRef = useRef(0);

  const clearSession = async ({ clearAllData = false } = {}) => {
    sessionRevisionRef.current += 1;
    setProfileCompletionPending(false);
    await removeToken();

    if (clearAllData) {
      await StorageService.deleteAllData();
    } else {
      await StorageService.removeUser();
    }

    setUser(null);
  };

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      await clearSession();
    });

    checkAuth();

    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);

  const checkAuth = async () => {
    const revisionAtStart = sessionRevisionRef.current;

    try {
      const savedUser = await StorageService.getUser();
      if (!savedUser) {
        return;
      }

      const data = await apiClient.get('/users/me');
      const nextUser = {
        ...savedUser,
        ...(data?.user || {}),
        loggedAt: savedUser.loggedAt || new Date().toISOString(),
      };

      // A login/profile update may have completed while /users/me was in
      // flight. Never let that older response overwrite the newer session.
      if (revisionAtStart !== sessionRevisionRef.current) return;

      await StorageService.saveUser(nextUser);
      if (revisionAtStart !== sessionRevisionRef.current) return;
      setUser(nextUser);
    } catch (e) {
      console.error('Auth check error:', e);

      if (e?.status === 401) {
        await clearSession();
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 1: request a login code from the backend
  const sendLoginCode = async (email) => {
    await apiClient.post('/users/getLoginCode', { email, app: 'investment' });
  };

  // Step 2: verify the code; stores token + user on success
  const verifyLoginCode = async (email, code) => {
    const data = await apiClient.post('/users/verifyLoginCode', {
      email,
      app: 'investment',
      loginCode: code,
    });
    sessionRevisionRef.current += 1;
    setProfileCompletionPending(false);
    await saveToken(data.token);
    const userData = { ...data.user, loggedAt: new Date().toISOString() };
    await StorageService.saveUser(userData);
    setUser(userData);
    return userData;
  };

  const updateProfile = async (name) => {
    sessionRevisionRef.current += 1;
    const previousUser = user;
    const optimisticUser = {
      ...(previousUser || {}),
      name,
      profileCompleted: true,
      loggedAt: previousUser?.loggedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // The server write can take longer than the UI transition. Keep the app
    // out of onboarding while it is pending. Persist the optimistic state too:
    // an app refresh cannot recreate the empty form while the write is active.
    setProfileCompletionPending(true);
    setUser(optimisticUser);

    try {
      await StorageService.saveUser(optimisticUser);
      const data = await apiClient.put('/investment/profile', { name });
      const merged = {
        ...optimisticUser,
        ...data.user,
        profileCompleted: true,
        loggedAt: optimisticUser.loggedAt,
        updatedAt: new Date().toISOString(),
      };
      await StorageService.saveUser(merged);
      setUser(merged);
      return merged;
    } catch (error) {
      if (previousUser) {
        await StorageService.saveUser(previousUser);
        setUser(previousUser);
      } else {
        await StorageService.removeUser();
        setUser(null);
      }
      setProfileCompletionPending(false);
      throw error;
    }
  };

  const logout = async () => {
    await clearSession();
  };

  const deleteAccount = async () => {
    try {
      await apiClient.delete('/users/me');
    } catch (e) {
      console.error('Delete account API error:', e);
    }
    await clearSession({ clearAllData: true });
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      profileCompletionPending,
      sendLoginCode,
      verifyLoginCode,
      updateProfile,
      logout,
      deleteAccount,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
