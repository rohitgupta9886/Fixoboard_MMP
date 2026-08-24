import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSummary, AuthTokens, ApiResponse } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: UserSummary | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (tokens: AuthTokens) => void;
  logout: () => void;
  hasPermission: (perm: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('fixo_user');
    const token = localStorage.getItem('fixo_access_token');

    if (savedUser && savedUser !== 'undefined' && savedUser !== 'null' && token) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && typeof parsed === 'object') {
          setUser(parsed);
        }
        // Silently verify user with backend token
        api.get<ApiResponse<UserSummary>>('/auth/me')
          .then((res) => {
            if (res && res.data) {
              setUser(res.data);
              localStorage.setItem('fixo_user', JSON.stringify(res.data));
            }
          })
          .catch(() => {
            logout();
          })
          .finally(() => setIsLoading(false));
      } catch (e) {
        logout();
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (tokens: AuthTokens) => {
    if (!tokens || !tokens.access_token) return;
    localStorage.setItem('fixo_access_token', tokens.access_token);
    if (tokens.refresh_token) {
      localStorage.setItem('fixo_refresh_token', tokens.refresh_token);
    }
    if (tokens.user) {
      localStorage.setItem('fixo_user', JSON.stringify(tokens.user));
      setUser(tokens.user);
    }
  };

  const logout = () => {
    localStorage.removeItem('fixo_access_token');
    localStorage.removeItem('fixo_refresh_token');
    localStorage.removeItem('fixo_user');
    setUser(null);
  };

  const hasPermission = (perm: string): boolean => {
    if (!user) return false;
    const roles = Array.isArray(user.roles) ? user.roles : [];
    const permissions = Array.isArray(user.permissions) ? user.permissions : [];

    // System Administrator has unrestricted access
    if (roles.includes('ADMIN')) return true;

    // Plant Management (MAIN_HEAD) has full operational/commercial authority except user management
    if (roles.includes('MAIN_HEAD') && perm !== 'users:manage') return true;

    // Permission aliases
    if (perm === 'machines:create' && permissions.includes('machines:manage')) return true;

    return permissions.includes(perm);
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    const roles = Array.isArray(user.roles) ? user.roles : [];
    return roles.includes(role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
