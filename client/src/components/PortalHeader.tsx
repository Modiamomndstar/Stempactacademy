import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Notification } from '../types';
import {
  Menu,
  Bell,
  Check,
  ExternalLink,
  Building,
  User as UserIcon,
  AlertCircle,
  CheckCircle2,
  Info,
  Sparkles,
} from 'lucide-react';

export interface PortalHeaderProps {
  onOpenMobileNav: () => void;
}

export const PortalHeader: React.FC<PortalHeaderProps> = ({ onOpenMobileNav }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.getNotifications(10);
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch {
      // Quiet fail if offline
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

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

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'ST';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-2xs">
      {/* Left: Mobile Drawer Trigger & Campus Location Badge */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="p-2 -ml-2 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-slate-100 lg:hidden cursor-pointer"
          aria-label="Open portal navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 items-center justify-center text-blue-600">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-extrabold text-slate-900 tracking-tight uppercase flex items-center gap-1.5">
              <span>STEMPACT ACADEMY</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              Ile-Ife School Operations Hub
            </p>
          </div>
        </div>
      </div>

      {/* Right: Actions, Notifications & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Return to Public Website */}
        <Link
          to="/"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-semibold transition"
        >
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          <span>Public Website</span>
        </Link>

        {/* Notifications Popover */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen((prev) => !prev)}
            className={`relative p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
              unreadCount > 0
                ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 shadow-2xs'
                : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100'
            }`}
            title="In-app notifications"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-xs animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
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
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-blue-300 hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs space-y-1">
                    <Bell className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                    <p className="font-semibold text-slate-600">No new notifications</p>
                    <p className="text-[10px]">Official updates and board directives will appear here.</p>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`p-3.5 hover:bg-slate-50 transition cursor-pointer text-left ${
                        !item.isRead ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            item.type === 'WARNING'
                              ? 'bg-amber-500'
                              : item.type === 'SUCCESS'
                              ? 'bg-emerald-500'
                              : item.type === 'ALERT'
                              ? 'bg-rose-500'
                              : 'bg-blue-500'
                          }`} />
                          <p className={`text-xs truncate ${!item.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                            {item.title}
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed pl-3">
                        {item.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen(false);
                    if (user.role === 'APPLICANT') {
                      navigate('/portal/applicant?tab=notifications');
                    } else if (user.role === 'STUDENT') {
                      navigate('/portal/student?tab=notifications');
                    } else if (user.role === 'PARENT') {
                      navigate('/portal/parent?tab=notifications');
                    } else {
                      navigate('/portal/admin');
                    }
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold transition inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Full Notifications Center</span>
                  <span aria-hidden="true">&rarr;</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Mini Profile Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight">
              {user.role.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
