import { Bell, Heart, Loader2, LogOut, Menu, Settings, User, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

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
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [areNotificationsOpen, setAreNotificationsOpen] = useState(false);

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
    let cancelled = false;
    if (areNotificationsOpen) {
      (async () => {
        const list = await refreshNotifications({ suppressToasts: true });
        if (!cancelled) {
          const unreadIds = list.filter((item) => !item.read).map((item) => item.id);
          if (unreadIds.length > 0) {
            await markNotificationsAsRead(unreadIds);
          }
        }
      })();
    }
    return () => {
      cancelled = true;
    };
  }, [areNotificationsOpen, refreshNotifications, markNotificationsAsRead]);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gradient">House of Charity</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-primary-600 transition-colors">
              Home
            </Link>
            <Link to="/ngos" className="text-gray-700 hover:text-primary-600 transition-colors">
              NGOs
            </Link>
            {currentUser && (
              <Link to="/dashboard" className="text-gray-700 hover:text-primary-600 transition-colors">
                Dashboard
              </Link>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setAreNotificationsOpen((prev) => !prev);
                      setIsUserMenuOpen(false);
                    }}
                    className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-4 bg-red-500 text-white text-[10px] font-semibold leading-4 rounded-full px-1 text-center">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                  </button>

                  {areNotificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
                        {notifications.length > 0 && (
                          <button
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                            onClick={() => markNotificationsAsRead()}
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notificationsLoading ? (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
                          </div>
                        ) : notificationsError ? (
                          <div className="px-4 py-6 text-sm text-red-500 text-center">
                            {notificationsError}
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="px-4 py-6 text-sm text-gray-500 text-center">
                            You’re all caught up!
                          </div>
                        ) : (
                          notifications.map((notification) => {
                            const timestamp = notification.created_at
                              ? new Date(notification.created_at).toLocaleString()
                              : '';
                            return (
                              <div
                                key={notification.id}
                                className={`px-4 py-3 border-b border-gray-100 last:border-b-0 ${
                                  notification.read ? 'bg-white' : 'bg-primary-50/70'
                                }`}
                              >
                                <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                {timestamp && (
                                  <span className="text-xs text-gray-400 mt-2 block">{timestamp}</span>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
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
                    <span className="hidden sm:block text-sm font-medium text-gray-700">
                      {userProfile?.name || 'User'}
                      {userProfile?.user_type && (
                        <span className="text-xs text-gray-500 ml-1">
                          ({userProfile.user_type})
                        </span>
                      )}
                    </span>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <Link
                        to={
                          userProfile?.user_type === 'ngo'
                            ? `/ngos/${userProfile.id}`
                            : '/dashboard'
                        }
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4 mr-3" />
                        {userProfile?.user_type === 'ngo' ? 'Profile' : 'Profile'}
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
              className="md:hidden p-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              <Link
                to="/"
                className="text-gray-700 hover:text-primary-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/ngos"
                className="text-gray-700 hover:text-primary-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                NGOs
              </Link>
              {currentUser && (
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-primary-600 transition-colors"
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