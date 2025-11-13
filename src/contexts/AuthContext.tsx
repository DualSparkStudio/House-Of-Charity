import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../api/database';
import { Donor, NGO, Notification } from '../types';
import toast from 'react-hot-toast';

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
  notifications: Notification[];
  unreadNotifications: number;
  notificationsLoading: boolean;
  notificationsError: string | null;
  addConnection: (connection: Connection) => Promise<void>;
  removeConnection: (id: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, userData: Partial<Donor | NGO>) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Donor | NGO>) => Promise<void>;
  refreshNotifications: (options?: { silent?: boolean; suppressToasts?: boolean }) => Promise<Notification[]>;
  markNotificationsAsRead: (ids?: string[]) => Promise<void>;
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const lastNotificationIdsRef = useRef<Set<string>>(new Set());
  const notificationsInitializedRef = useRef(false);

  const loadConnections = (userId: string): Connection[] => {
    try {
      if (typeof window === 'undefined') {
        setConnections([]);
        return [];
      }
      const stored = sessionStorage.getItem(`connections_${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setConnections(parsed);
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to load connections from storage', error);
    }
    setConnections([]);
    return [];
  };

  const persistConnections = (userId: string, list: Connection[]) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`connections_${userId}`, JSON.stringify(list));
    }
  };

  const fetchConnections = useCallback(
    async (userId: string): Promise<Connection[]> => {
      if (!userId || !apiService.isAuthenticated()) {
        return [];
      }

      try {
        const response = await apiService.getConnectedNgos(userId);
        const ngos: Partial<NGO>[] = Array.isArray(response?.ngos) ? response.ngos : [];
        const mapped: Connection[] = ngos
          .filter((ngo) => ngo && typeof ngo.id === 'string')
          .map((ngo) => ({
            id: ngo.id as string,
            name: ngo.name || 'Unnamed NGO',
            email: ngo.email ?? null,
            phone: ngo.phone ?? null,
            description: ngo.description ?? null,
          }));

        setConnections(mapped);
        persistConnections(userId, mapped);

        setUserProfile((prev) => {
          if (!prev || prev.id !== userId || prev.user_type !== 'donor') {
            return prev;
          }
          return {
            ...prev,
            connected_ngos: mapped.map((item) => item.id),
          } as Donor;
        });

        return mapped;
      } catch (error) {
        console.error('Failed to fetch connected NGOs:', error);
        return [];
      }
    },
    []
  );

  const addConnection = async (connection: Connection) => {
    if (!userProfile || userProfile.user_type !== 'donor') {
      throw new Error('Only donors can create connections');
    }

    await apiService.connectDonorToNgo(userProfile.id, connection.id);

    setConnections((prev) => {
      if (prev.some((item) => item.id === connection.id)) {
        return prev;
      }
      const updated = [...prev, connection];
      persistConnections(userProfile.id, updated);
      return updated;
    });

    setUserProfile((prev) => {
      if (!prev || prev.id !== userProfile.id) return prev;
      const existing = Array.isArray(prev.connected_ngos) ? prev.connected_ngos : [];
      if (existing.includes(connection.id)) return prev;
      return {
        ...prev,
        connected_ngos: [...existing, connection.id],
      } as Donor | NGO;
    });
  };

  const removeConnection = async (id: string) => {
    if (!userProfile || userProfile.user_type !== 'donor') {
      throw new Error('Only donors can remove connections');
    }

    await apiService.disconnectDonorFromNgo(userProfile.id, id);

    setConnections((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      persistConnections(userProfile.id, updated);
      return updated;
    });

    setUserProfile((prev) => {
      if (!prev || prev.id !== userProfile.id) return prev;
      const existing = Array.isArray(prev.connected_ngos) ? prev.connected_ngos : [];
      return {
        ...prev,
        connected_ngos: existing.filter((ngoId) => ngoId !== id),
      } as Donor | NGO;
    });
  };

  const refreshNotifications = useCallback(
    async (
      {
        silent,
        suppressToasts,
        unreadOnly,
        limit,
      }: {
        silent?: boolean;
        suppressToasts?: boolean;
        unreadOnly?: boolean;
        limit?: number;
      } = {}
    ): Promise<Notification[]> => {
      if (!apiService.isAuthenticated()) {
        setNotifications([]);
        setUnreadNotifications(0);
        lastNotificationIdsRef.current = new Set();
        notificationsInitializedRef.current = false;
        setNotificationsError(null);
        if (!silent) {
          setNotificationsLoading(false);
        }
        return [];
      }

      if (!silent) {
        setNotificationsLoading(true);
        setNotificationsError(null);
      }

      try {
        const response = await apiService.getNotifications({
          unreadOnly,
          limit,
        });
        const list = response?.notifications || [];
        const previousIds = lastNotificationIdsRef.current;
        const newNotifications = list.filter((notification) => !previousIds.has(notification.id));

        if (!suppressToasts && notificationsInitializedRef.current && newNotifications.length > 0) {
          newNotifications.forEach((notification) => {
            const summary = notification.message
              ? `${notification.title}: ${notification.message}`
              : notification.title;
            toast(summary, {
              id: `notification-${notification.id}`,
              icon: '🔔',
            });
          });
        }

        lastNotificationIdsRef.current = new Set(list.map((notification) => notification.id));
        notificationsInitializedRef.current = true;

        setNotifications(list);
        setUnreadNotifications(
          typeof response?.unreadCount === 'number'
            ? response.unreadCount
            : list.filter((item) => !item.read).length
        );
        setNotificationsError(null);
        return list;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to load notifications';
        if (!silent) {
          setNotificationsError(message);
          toast.error(message, { icon: '⚠️' });
        }
        if (silent && !notificationsInitializedRef.current) {
          setNotificationsError(message);
        }
        if (!silent) {
          console.error('Failed to load notifications:', error);
        }
        return [];
      } finally {
        if (!silent) {
          setNotificationsLoading(false);
        }
      }
    },
    []
  );

  const markNotificationsAsRead = useCallback(
    async (ids?: string[]) => {
      if (!apiService.isAuthenticated()) {
        return;
      }

      try {
        const response = await apiService.markNotificationsRead(ids);
        const updatedIds =
          Array.isArray(response?.updated) && response.updated.length > 0
            ? new Set(response.updated.map((notification) => notification.id))
            : ids && ids.length > 0
            ? new Set(ids)
            : new Set(
                notifications
                  .filter((notification) => !notification.read)
                  .map((notification) => notification.id)
              );

        setNotifications((prev) =>
          prev.map((notification) =>
            updatedIds.has(notification.id)
              ? { ...notification, read: true }
              : notification
          )
        );

        if (typeof response?.unreadCount === 'number') {
          setUnreadNotifications(response.unreadCount);
        } else {
          setUnreadNotifications((prevCount) =>
            ids && ids.length > 0 ? Math.max(prevCount - ids.length, 0) : 0
          );
        }
      } catch (error) {
        console.error('Failed to update notifications:', error);
      }
    },
    [notifications]
  );

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
            await fetchConnections(response.user.id);
          } else {
            setConnections([]);
          }
          await refreshNotifications({ suppressToasts: true });
        } catch (error) {
          console.error('Token verification failed:', error);
          apiService.logout();
          setCurrentUser(null);
          setUserProfile(null);
          setConnections([]);
          setNotifications([]);
          setUnreadNotifications(0);
          lastNotificationIdsRef.current = new Set();
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setConnections([]);
        setNotifications([]);
        setUnreadNotifications(0);
        lastNotificationIdsRef.current = new Set();
      }
      } finally {
      setLoading(false);
        setInitializing(false);
      }
    };

    checkAuth();
  }, [fetchConnections, refreshNotifications]);

  useEffect(() => {
    let interval: number | undefined;

    if (currentUser) {
      refreshNotifications({ silent: true });
      interval = window.setInterval(() => {
        refreshNotifications({ silent: true });
      }, 15_000);
    }

    return () => {
      if (interval) {
        window.clearInterval(interval);
      }
    };
  }, [currentUser, refreshNotifications]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiService.login(email, password);
      setCurrentUser(response.user);
      setUserProfile(response.user as Donor | NGO);
      if (response.user?.user_type === 'donor') {
        loadConnections(response.user.id);
        await fetchConnections(response.user.id);
      } else {
        setConnections([]);
      }
      await refreshNotifications({ suppressToasts: true });
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
        await fetchConnections(response.user.id);
      } else {
        setConnections([]);
      }
      await refreshNotifications({ suppressToasts: true });
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
      setNotifications([]);
      setUnreadNotifications(0);
      lastNotificationIdsRef.current = new Set();
      notificationsInitializedRef.current = false;
      setNotificationsError(null);
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
    notifications,
    unreadNotifications,
    notificationsLoading,
    notificationsError,
    refreshNotifications,
    markNotificationsAsRead,
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
