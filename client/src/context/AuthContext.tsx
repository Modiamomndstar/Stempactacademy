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
  isFinanceAdmin: boolean;
  isAdmissionsAdmin: boolean;
  isCoordinator: boolean;
  isCoordinatorAdmin: boolean;
  isInstructor: boolean;
  isStudent: boolean;
  isParent: boolean;
  isCounselor: boolean;
  isContentManager: boolean;
  isInnovationManager: boolean;
  isMarketingManager: boolean;
  isPartner: boolean;
  isApplicant: boolean;
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
  const isFinanceAdmin = user?.role === 'FINANCE_ADMIN' || isSuperAdmin;
  const isAdmissionsAdmin = user?.role === 'ADMISSIONS_ADMIN' || isSuperAdmin;
  const isCoordinator = user?.role === 'PROGRAM_COORDINATOR' || user?.role === 'COORDINATOR_ADMIN' || isSuperAdmin;
  const isCoordinatorAdmin = isCoordinator;
  const isInstructor = user?.role === 'INSTRUCTOR';
  const isStudent = user?.role === 'STUDENT';
  const isParent = user?.role === 'PARENT';
  const isCounselor = user?.role === 'COUNSELOR' || isSuperAdmin;
  const isContentManager = user?.role === 'CONTENT_MANAGER' || isSuperAdmin;
  const isInnovationManager = user?.role === 'INNOVATION_MANAGER' || isSuperAdmin;
  const isMarketingManager = user?.role === 'MARKETING_MANAGER' || isSuperAdmin;
  const isPartner = user?.role === 'PARTNER';
  const isApplicant = user?.role === 'APPLICANT';

  let portalRoute = '/portal/login';
  if (user) {
    switch (user.role) {
      case 'SUPER_ADMIN':
      case 'ACADEMIC_ADMIN':
      case 'FINANCE_ADMIN':
      case 'ADMISSIONS_ADMIN':
        portalRoute = '/portal/admin';
        break;
      case 'PROGRAM_COORDINATOR':
      case 'COORDINATOR_ADMIN':
        portalRoute = '/portal/coordinator';
        break;
      case 'INSTRUCTOR':
        portalRoute = '/portal/instructor';
        break;
      case 'PARENT':
        portalRoute = '/portal/parent';
        break;
      case 'COUNSELOR':
        portalRoute = '/portal/counselor';
        break;
      case 'CONTENT_MANAGER':
        portalRoute = '/portal/content';
        break;
      case 'INNOVATION_MANAGER':
        portalRoute = '/portal/innovation';
        break;
      case 'MARKETING_MANAGER':
        portalRoute = '/portal/marketing';
        break;
      case 'PARTNER':
        portalRoute = '/portal/partner';
        break;
      case 'APPLICANT':
        portalRoute = '/portal/applicant';
        break;
      case 'STUDENT':
      default:
        portalRoute = '/portal/student';
        break;
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
        isFinanceAdmin,
        isAdmissionsAdmin,
        isCoordinator,
        isCoordinatorAdmin,
        isInstructor,
        isStudent,
        isParent,
        isCounselor,
        isContentManager,
        isInnovationManager,
        isMarketingManager,
        isPartner,
        isApplicant,
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
