import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

// ✅ Updated User interface
interface User {
  id: string;
  username: string;
  email: string;
  role?: 'user' | 'admin';
  selectedGenres?: string[];
  uploads?: any[];
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const cacheUser = (nextUser: User | null) => {
    try {
      if (nextUser) {
        localStorage.setItem('auth_user', JSON.stringify(nextUser));
      } else {
        localStorage.removeItem('auth_user');
      }
    } catch {
      // ignore localStorage errors
    }
  };

  // 🔹 On app mount, check if token exists and fetch profile
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const isAdminArea = window.location.pathname.startsWith('/admin');
        const cachedUser = (() => {
          try {
            const rawUser = localStorage.getItem('auth_user');
            const rawAdmin = localStorage.getItem('adminUser');
            if (isAdminArea) {
              if (rawAdmin) return JSON.parse(rawAdmin) as User;
              if (rawUser) return JSON.parse(rawUser) as User;
              return null;
            }
            if (rawUser) return JSON.parse(rawUser) as User;
            return null;
          } catch {
            return null;
          }
        })();

        if (cachedUser) {
          setUser(cachedUser);
        }

        if (import.meta.env.PROD) {
          const resp = await authAPI.getProfile();
          const profile = (resp && (resp as any).user) ? (resp as any).user : resp;
          setUser(profile);
          cacheUser(profile);
        } else {
          const userToken = localStorage.getItem('auth_token');
          const adminToken = localStorage.getItem('adminToken');
          const effectiveToken = isAdminArea ? (adminToken || userToken) : userToken;

          if (!effectiveToken) {
            setUser(null);
            if (isAdminArea) {
              localStorage.removeItem('adminUser');
            } else {
              localStorage.removeItem('auth_user');
            }
            setIsLoading(false);
            return;
          }

          authAPI.setToken(effectiveToken, !isAdminArea);

          try {
            const resp = await authAPI.getProfile();
            const profile = (resp && (resp as any).user) ? (resp as any).user : resp;
            if (isAdminArea && (profile as any)?.role !== 'admin') {
              if (!cachedUser) {
                setUser(null);
              }
              setIsLoading(false);
              return;
            }
            if (profile && (profile as any).id && (profile as any).email) {
              setUser(profile);
              if (isAdminArea) {
                localStorage.setItem('adminUser', JSON.stringify(profile));
              } else {
                cacheUser(profile);
              }
            } else if (!cachedUser) {
              authAPI.setToken(null);
              setUser(null);
            }
          } catch (err) {
            console.warn('Profile refresh failed during app init, keeping cached session if available');
            if (!cachedUser) {
              authAPI.setToken(null);
              if (isAdminArea) {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
              } else {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
              }
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.warn('Auth initialization failed');
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // 🔹 Login
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { token, user } = await authAPI.login({ email, password });
      if (!token || !user) return false;

      if (!import.meta.env.PROD) {
        localStorage.setItem('auth_token', token);
        authAPI.setToken(token);
      }
      setUser(user);
      cacheUser(user);

      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  // 🔹 Register
  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      const { token, user } = await authAPI.register({ username, email, password });
      if (!token || !user) return false;

      if (!import.meta.env.PROD) {
        localStorage.setItem('auth_token', token);
        authAPI.setToken(token);
      }
      setUser(user);
      cacheUser(user);

      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  };

  // 🔹 Logout
  const logout = () => {
    setUser(null);
    cacheUser(null);
    // Clear client-side token in dev
    if (!import.meta.env.PROD) {
      localStorage.removeItem('auth_token');
    }
    // Always attempt server-side logout to clear cookie
    // call logout and swallow any error to avoid uncaught promise rejections
    authAPI.logout && authAPI.logout().catch((err: any) => {
      console.warn('Logout request failed:', err);
    });
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    authAPI.setToken(null);
  };

  // 🔹 Refresh profile
  const refreshProfile = async () => {
    try {
      const resp = await authAPI.getProfile();
      const profile = (resp && (resp as any).user) ? (resp as any).user : resp;
      setUser(profile);
      cacheUser(profile);
    } catch (error) {
      console.error('Profile refresh failed, logging out');
      logout();
    }
  };

  const value = { user, isLoading, login, register, logout, refreshProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
