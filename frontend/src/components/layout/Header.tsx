import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Sun,
  Moon,
  Search,
  Bell,
  LogOut,
  ChevronDown,
  User,
  Activity,
  Zap,
  Camera,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

interface HeaderProps {
  onOpenMobileNav: () => void;
  onOpenCommandPalette: () => void;
  onOpenNotificationDrawer: () => void;
  onOpenAiAdvisor?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileNav,
  onOpenCommandPalette,
  onOpenNotificationDrawer,
  onOpenAiAdvisor,
}) => {
  const { user, logout, hasPermission, hasRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Polling live notifications count
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications-live'],
    queryFn: () => apiClient.getNotifications(20),
    refetchInterval: 15000,
  });

  const unreadCount = (notificationsData?.data || []).length;

  const canAccessAiAdvisor =
    hasRole('ADMIN') ||
    hasRole('MAIN_HEAD') ||
    hasRole('MANAGEMENT') ||
    hasRole('PLANT_MANAGER') ||
    user?.username === 'management' ||
    user?.username === 'admin';

  // Generate breadcrumb from path
  const pathParts = location.pathname.split('/').filter(Boolean);
  const getBreadcrumbTitle = () => {
    if (pathParts.length === 0) return 'Live Plant Overview';
    const main = pathParts[0].replace(/-/g, ' ');
    return main.charAt(0).toUpperCase() + main.slice(1);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 sm:h-16 px-3 sm:px-6 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      {/* Left: Mobile Toggle & Context Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 touch-target flex items-center justify-center"
          aria-label="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <span>FixoBoard MMS</span>
            {pathParts.length > 0 && <span>/</span>}
            <span className="text-primary-600 dark:text-primary-400 font-bold">{getBreadcrumbTitle()}</span>
          </div>
          <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 hidden sm:inline">
            {location.pathname === '/' || location.pathname === '/dashboard'
              ? 'Plant Operations Cockpit'
              : pathParts.map((p) => p.replace(/-/g, ' ').toUpperCase()).join(' › ')}
          </span>
        </div>
      </div>

      {/* Center: Global Omnibox Command Search Trigger */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-400 dark:text-slate-400 hover:border-primary-400 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-2xs group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-primary-500 transition-colors" />
            <span className="font-medium text-slate-600 dark:text-slate-400">
              Search orders, machines, parties, reports...
            </span>
          </div>
          <kbd className="font-num text-[11px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Quick Action: AI Plant Intelligence Advisor (Admin & Plant Manager Only) */}
        {onOpenAiAdvisor && canAccessAiAdvisor && (
          <button
            onClick={onOpenAiAdvisor}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 text-xs font-bold transition-all shadow-2xs"
            title="Ask FixoBoard AI Plant & Database Advisor"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 animate-pulse" />
            <span className="hidden sm:inline">AI Advisor</span>
          </button>
        )}

        {/* Plant Status Pill */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Extrusion Live</span>
        </div>

        {/* Mobile Search Button */}
        <button
          onClick={onOpenCommandPalette}
          className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotificationDrawer}
          className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 transition-colors"
          title={`Notifications (${unreadCount} live updates)`}
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
          )}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 transition-colors"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all select-none"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-700 to-blue-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate max-w-[120px]">
                {user?.full_name || 'Operator'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block truncate max-w-[120px] uppercase">
                {String(typeof user?.roles?.[0] === 'object' ? user?.roles?.[0]?.name : user?.roles?.[0] || 'Role').replace('_', ' ')}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {profileDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProfileDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-card shadow-2xl z-50 p-1.5 animate-in fade-in-50 duration-100">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {user?.full_name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-medium">
                    {user?.email}
                  </p>
                </div>

                {hasPermission('users:manage') && (
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate('/users');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>User Management</span>
                  </button>
                )}

                {hasPermission('audit:view') && (
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate('/audit-logs');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Activity className="w-3.5 h-3.5 text-slate-400" />
                    <span>Audit Logs</span>
                  </button>
                )}

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

