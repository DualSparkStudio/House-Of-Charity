import { Bell, Heart, Loader2, LogOut, Menu, Settings, User, X, Check, CheckCheck, Gift, FileText, Users, Moon, Sun } from 'lucide-react';
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Notification } from '../../types';

const Header: React.FC = () => {
  const {
    currentUser,
    userProfile,
    logout,
    notifications,
    unreadNotifications,
    notificationsLoading,
    notificationsError,
    refreshNotifications,
    markNotificationsAsRead,
  } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [areNotificationsOpen, setAreNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Group notifications by time (like mobile notification panels)
  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: Notification[] } = {
      Today: [],
      Yesterday: [],
      'This Week': [],
      Older: [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    notifications.forEach((notification) => {
      if (!notification.created_at) {
        groups.Older.push(notification);
        return;
      }

      const notifDate = new Date(notification.created_at);
      const notifDay = new Date(notifDate.getFullYear(), notifDate.getMonth(), notifDate.getDate());

      if (notifDay.getTime() === today.getTime()) {
        groups.Today.push(notification);
      } else if (notifDay.getTime() === yesterday.getTime()) {
        groups.Yesterday.push(notification);
      } else if (notifDate >= weekAgo) {
        groups['This Week'].push(notification);
      } else {
        groups.Older.push(notification);
      }
    });

    // Remove empty groups
    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, [notifications]);

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'donation':
        return <Gift className="h-5 w-5 text-green-500" />;
      case 'requirement':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'connection':
        return <Users className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  // Format time for display
  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationsAsRead([notificationId]);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      setAreNotificationsOpen(false);
      setIsUserMenuOpen(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (areNotificationsOpen) {
      refreshNotifications({ suppressToasts: true });
    }
  }, [areNotificationsOpen, refreshNotifications]);

  // Close notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node) &&
        areNotificationsOpen
      ) {
        // Check if click is not on the bell button
        const target = event.target as HTMLElement;
        if (!target.closest('button[aria-label*="notification"]') && !target.closest('.notification-bell')) {
          setAreNotificationsOpen(false);
        }
      }
    };

    if (areNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [areNotificationsOpen]);

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            <span className="text-xl font-bold text-gradient dark:text-white">House of Charity</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Home
            </Link>
            <Link to="/ngos" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              NGOs
            </Link>
            {currentUser && (
              <Link to="/dashboard" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Dashboard
              </Link>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {currentUser ? (
              <>
                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => {
                      setAreNotificationsOpen((prev) => !prev);
                      setIsUserMenuOpen(false);
                    }}
                    className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors notification-bell"
                    aria-label="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-4 bg-red-500 text-white text-[10px] font-semibold leading-4 rounded-full px-1 text-center">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                  </button>

                  {areNotificationsOpen && (
                    <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[600px] flex flex-col">
                      {/* Header */}
                      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-t-xl">
                        <div className="flex items-center space-x-2">
                          <Bell className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Notifications</h3>
                          {unreadNotifications > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-primary-600 text-white text-xs font-semibold rounded-full">
                              {unreadNotifications}
                            </span>
                          )}
                        </div>
                        {notifications.length > 0 && (
                          <button
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1"
                            onClick={() => markNotificationsAsRead()}
                          >
                            <CheckCheck className="h-3.5 w-3.5" />
                            <span>Mark all read</span>
                          </button>
                        )}
                      </div>

                      {/* Notifications List */}
                      <div className="overflow-y-auto flex-1">
                        {notificationsLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                          </div>
                        ) : notificationsError ? (
                          <div className="px-5 py-8 text-sm text-red-500 text-center">
                            {notificationsError}
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="px-5 py-12 text-center">
                            <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">You're all caught up!</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">No new notifications</p>
                          </div>
                        ) : (
                          groupedNotifications.map(([groupName, groupNotifications]) => (
                            <div key={groupName} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                              {/* Group Header */}
                              <div className="px-5 py-2 bg-gray-50 dark:bg-gray-900">
                                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                  {groupName}
                                </h4>
                              </div>

                              {/* Group Notifications */}
                              {groupNotifications.map((notification) => (
                                <div
                                  key={notification.id}
                                  className={`px-5 py-4 border-b border-gray-50 dark:border-gray-700 last:border-b-0 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                                    !notification.read ? 'bg-primary-50/30 dark:bg-primary-900/20' : 'bg-white dark:bg-gray-800'
                                  }`}
                                >
                                  <div className="flex items-start space-x-3">
                                    {/* Icon */}
                                    <div className="flex-shrink-0 mt-0.5">
                                      {getNotificationIcon(notification.type)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <p
                                            className={`text-sm font-semibold ${
                                              !notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                                            }`}
                                          >
                                            {notification.title}
                                          </p>
                                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                                            {notification.message}
                                          </p>
                                          {notification.created_at && (
                                            <span className="text-xs text-gray-400 dark:text-gray-500 mt-2 block">
                                              {formatNotificationTime(notification.created_at)}
                                            </span>
                                          )}
                                        </div>

                                        {/* Unread Indicator & Mark as Read */}
                                        {!notification.read && (
                                          <div className="flex items-center space-x-2 ml-2">
                                            <div className="h-2 w-2 bg-primary-600 dark:bg-primary-400 rounded-full flex-shrink-0" />
                                            <button
                                              onClick={() => handleMarkAsRead(notification.id)}
                                              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                                              title="Mark as read"
                                            >
                                              <Check className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Footer */}
                      {notifications.length > 0 && (
                        <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-xl">
                          <button
                            onClick={() => {
                              setAreNotificationsOpen(false);
                              navigate('/dashboard');
                            }}
                            className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium w-full text-center"
                          >
                            View all notifications
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {userProfile?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200">
                      {userProfile?.name || 'User'}
                      {userProfile?.user_type && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                          ({userProfile.user_type})
                        </span>
                      )}
                    </span>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                      <Link
                        to={
                          userProfile?.user_type === 'ngo'
                            ? `/ngos/${userProfile.id}`
                            : '/dashboard'
                        }
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4 mr-3" />
                        {userProfile?.user_type === 'ngo' ? 'Profile' : 'Profile'}
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="btn-outline">
                  Login
                </Link>
                <Link to="/register" className="btn-primary">
                  Register
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <nav className="flex flex-col space-y-4">
              <Link
                to="/"
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/ngos"
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                NGOs
              </Link>
              {currentUser && (
                <Link
                  to="/dashboard"
                  className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 