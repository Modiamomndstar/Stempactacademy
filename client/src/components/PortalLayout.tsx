import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PortalSidebar } from './PortalSidebar';
import { api } from '../services/api';
import { Notification } from '../types';
import {
  Menu,
  ArrowLeft,
  User,
  LogOut,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Check,
  ExternalLink,
} from 'lucide-react';

interface PortalLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
    setNotificationsOpen(false);
  }, [activeTab, location.pathname]);

  // Fetch in-app notifications
  const loadNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.getNotifications(10);
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      // Quiet fail if offline
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // 30s polling
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleNotificationClick = async (item: Notification) => {
    if (!item.isRead) {
      try {
        await api.markNotificationRead(item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        console.error('Failed to mark read:', err);
      }
    }
    if (item.link) {
      setNotificationsOpen(false);
      navigate(item.link);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* 1. Desktop Fixed Role Sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-64 xl:w-72 z-40 shadow-xl">
        <PortalSidebar
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      </div>

      {/* 2. Mobile Off-Canvas Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-slate-900 z-50 shadow-2xl flex flex-col">
            <PortalSidebar
              onCloseMobile={() => setMobileOpen(false)}
              activeTab={activeTab}
              onTabChange={onTabChange}
            />
          </div>
        </div>
      )}

      {/* 3. Main Portal Viewport */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 xl:pl-72 min-h-screen">
        {/* Top Portal Utility Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-2 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-slate-100 lg:hidden"
              aria-label="Open portal navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="text-xs font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
                <span>{user.role.replace('_', ' ')} PORTAL</span>
                <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="hidden sm:inline-block text-[10px] text-slate-500 font-mono font-normal">
                  Ile-Ife Campus Hub
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* In-App Notification Bell with Live Counter */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className="relative p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                title="Notifications"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Drawer */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                  <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] text-blue-300 hover:text-white flex items-center gap-1 font-semibold"
                      >
                        <Check className="w-3 h-3" />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        No notifications yet. You're completely up to date!
                      </div>
                    ) : (
                      notifications.map((item) => {
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleNotificationClick(item)}
                            className={`p-3 transition-colors cursor-pointer hover:bg-slate-50 flex gap-2.5 ${
                              !item.isRead ? 'bg-blue-50/50' : ''
                            }`}
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              {item.type === 'SUCCESS' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : item.type === 'ALERT' || item.type === 'WARNING' ? (
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                              ) : (
                                <Info className="w-4 h-4 text-blue-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                                <span className="truncate">{item.title}</span>
                                {!item.isRead && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0"></span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                                {item.message}
                              </p>
                              <div className="text-[9px] text-slate-400 mt-1 font-mono">
                                {new Date(item.createdAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/portal/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors"
            >
              <span>Switch Portal</span>
            </Link>

            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Return to Website</span>
              <span className="sm:hidden">Website</span>
            </Link>

            <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

            <div className="flex items-center gap-2">
              <div className="hidden md:block text-right">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {user.username ? `@${user.username}` : user.email}
                </div>
              </div>

              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {user.firstName ? user.firstName[0] : 'U'}
              </div>

              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Portal Page Body */}
        <main className="flex-1 w-full">{children}</main>
      </div>
    </div>
  );
};
