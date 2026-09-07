import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api, setAuthToken, removeAuthToken, getAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: any) => Promise<User>;
  register: (userData: any) => Promise<User>;
  logout: () => void;
  isSuperAdmin: boolean;
  isAcademicAdmin: boolean;
  isInstructor: boolean;
  isStudent: boolean;
  isParent: boolean;
  portalRoute: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await api.getMe();
        setUser(data.user);
      } catch (err) {
        console.warn('Session expired or invalid:', err);
        removeAuthToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (credentials: any): Promise<User> => {
    const data = await api.login(credentials);
    setAuthToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (userData: any): Promise<User> => {
    const data = await api.register(userData);
    setAuthToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAcademicAdmin = user?.role === 'ACADEMIC_ADMIN' || isSuperAdmin;
  const isInstructor = user?.role === 'INSTRUCTOR';
  const isStudent = user?.role === 'STUDENT';
  const isParent = user?.role === 'PARENT';

  let portalRoute = '/portal/login';
  if (user) {
    if (['SUPER_ADMIN', 'ACADEMIC_ADMIN', 'FINANCE_ADMIN'].includes(user.role)) {
      portalRoute = '/admin';
    } else if (user.role === 'INSTRUCTOR') {
      portalRoute = '/instructor';
    } else if (user.role === 'PARENT') {
      portalRoute = '/parent';
    } else {
      portalRoute = '/student';
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isSuperAdmin,
        isAcademicAdmin,
        isInstructor,
        isStudent,
        isParent,
        portalRoute,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
