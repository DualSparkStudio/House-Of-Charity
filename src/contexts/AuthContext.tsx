import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../api/database';
import { Donor, NGO } from '../types';

type AuthUser = {
  id: string;
  email: string;
  user_type: string;
  name?: string;
  phone?: string;
  city?: string;
  state?: string;
  description?: string;
};

export type Connection = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  description?: string | null;
};

interface AuthContextType {
  currentUser: AuthUser | null;
  userProfile: Donor | NGO | null;
  loading: boolean;
  connections: Connection[];
  addConnection: (connection: Connection) => void;
  removeConnection: (id: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, userData: Partial<Donor | NGO>) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Donor | NGO>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<Donor | NGO | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [connections, setConnections] = useState<Connection[]>([]);

  const loadConnections = (userId: string) => {
    try {
      if (typeof window === 'undefined') {
        setConnections([]);
        return;
      }
      const stored = sessionStorage.getItem(`connections_${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setConnections(parsed);
          return;
        }
      }
    } catch (error) {
      console.warn('Failed to load connections from storage', error);
    }
    setConnections([]);
  };

  const persistConnections = (userId: string, list: Connection[]) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`connections_${userId}`, JSON.stringify(list));
    }
  };

  const addConnection = (connection: Connection) => {
    if (!userProfile || userProfile.user_type !== 'donor') return;

    setConnections((prev) => {
      if (prev.some((item) => item.id === connection.id)) {
        return prev;
      }
      const updated = [...prev, connection];
      persistConnections(userProfile.id, updated);
      return updated;
    });
  };

  const removeConnection = (id: string) => {
    if (!userProfile || userProfile.user_type !== 'donor') return;

    setConnections((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      persistConnections(userProfile.id, updated);
      return updated;
    });
  };

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      try {
      if (apiService.isAuthenticated()) {
        try {
          const response = await apiService.verifyToken();
          setCurrentUser(response.user);
          setUserProfile(response.user as Donor | NGO);
          if (response.user?.user_type === 'donor') {
            loadConnections(response.user.id);
          } else {
            setConnections([]);
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          apiService.logout();
          setCurrentUser(null);
          setUserProfile(null);
          setConnections([]);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setConnections([]);
      }
      } finally {
      setLoading(false);
        setInitializing(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiService.login(email, password);
      setCurrentUser(response.user);
      setUserProfile(response.user as Donor | NGO);
      if (response.user?.user_type === 'donor') {
        loadConnections(response.user.id);
      } else {
        setConnections([]);
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, userData: Partial<Donor | NGO>) => {
    try {
      setLoading(true);
      const response = await apiService.register(email, password, userData);
      setCurrentUser(response.user);
      setUserProfile(response.user as Donor | NGO);
      if (response.user?.user_type === 'donor') {
        loadConnections(response.user.id);
      } else {
        setConnections([]);
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      apiService.logout();
      setCurrentUser(null);
      setUserProfile(null);
      setConnections([]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = async (data: Partial<Donor | NGO>) => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    try {
      const response = await apiService.updateUser(currentUser.id, data);
      setUserProfile(response.user);
      setCurrentUser({ ...currentUser, ...response.user });
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    connections,
    addConnection,
    removeConnection,
    login,
    register,
    logout,
    updateProfile,
  };

  if (initializing) {
    return (
      <AuthContext.Provider value={value}>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-600">Loading session...</p>
        </div>
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
