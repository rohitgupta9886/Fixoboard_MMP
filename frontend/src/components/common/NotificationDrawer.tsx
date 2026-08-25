import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  X,
  CheckCircle2,
  AlertCircle,
  Truck,
  Cpu,
  Package,
  Clock,
  Activity,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  CheckCheck,
} from 'lucide-react';
import clsx from 'clsx';
import { apiClient } from '../../api/client';

export interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'important' | 'orders' | 'production' | 'dispatch'>('all');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch live functional notifications from backend
  const { data: notifResponse, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['notifications-live'],
    queryFn: () => apiClient.getNotifications(40),
    enabled: isOpen,
    refetchInterval: 15000,
  });

  if (!isOpen) return null;

  const rawNotifications: Array<{
    id: string;
    type: string;
    title: string;
    desc: string;
    time: string;
    created_at: string;
    isImportant: boolean;
    link?: string;
    actor?: string;
  }> = notifResponse?.data || [];

  const filtered = rawNotifications.filter((n) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'important') return n.isImportant;
    if (activeTab === 'orders') return n.type === 'orders';
    if (activeTab === 'production') return n.type === 'production';
    if (activeTab === 'dispatch') return n.type === 'dispatch';
    return true;
  });

  const getIconForType = (type: string, isImportant: boolean) => {
    switch (type) {
      case 'orders':
        return {
          icon: FileSpreadsheet,
          color: 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/60',
        };
      case 'production':
        return {
          icon: Cpu,
          color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60',
        };
      case 'dispatch':
        return {
          icon: Truck,
          color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60',
        };
      default:
        return {
          icon: isImportant ? AlertCircle : Activity,
          color: 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/60',
        };
    }
  };

  const handleNotificationClick = (item: typeof rawNotifications[0]) => {
    setReadIds((prev) => new Set(prev).add(item.id));
    if (item.link) {
      navigate(item.link);
      onClose();
    }
  };

  const handleMarkAllRead = () => {
    const allIds = new Set(rawNotifications.map((n) => n.id));
    setReadIds(allIds);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-2xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10 pointer-events-none">
        <div className="pointer-events-auto w-screen max-w-md md:max-w-lg bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col h-full animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800/60">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                    Live Event Notifications
                  </h3>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-black bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    LIVE
                  </span>
                </div>
                <p className="text-3xs sm:text-2xs text-slate-500 dark:text-slate-400 font-medium">
                  Real-time factory triggers for Management &amp; Admin
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => refetch()}
                title="Refresh notifications"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className={clsx('w-4 h-4', (isLoading || isRefetching) && 'animate-spin')} />
              </button>
              <button
                onClick={onClose}
                title="Close drawer"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs shrink-0 no-scrollbar">
            {(['all', 'important', 'orders', 'production', 'dispatch'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={clsx(
                  'px-3 py-1 rounded-lg font-bold capitalize transition-all shrink-0 text-3xs sm:text-2xs',
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Notifications Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50/50 dark:bg-slate-900/50">
            {isLoading ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                <span>Polling real-time database events...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                <CheckCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <span className="font-bold text-slate-700 dark:text-slate-300">All caught up!</span>
                <p className="text-3xs text-slate-400 mt-1">No new events in this filter.</p>
              </div>
            ) : (
              filtered.map((item) => {
                const { icon: Icon, color } = getIconForType(item.type, item.isImportant);
                const isRead = readIds.has(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={clsx(
                      'p-3.5 rounded-xl border transition-all space-y-1.5 cursor-pointer relative group',
                      isRead
                        ? 'bg-white/60 dark:bg-slate-850/40 border-slate-200/60 dark:border-slate-800/60 opacity-80'
                        : 'bg-white dark:bg-slate-850 border-slate-200/90 dark:border-slate-750 shadow-2xs hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-xs'
                    )}
                  >
                    {!isRead && (
                      <span className="absolute top-3.5 right-3 w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    )}

                    <div className="flex items-start justify-between gap-2 pr-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={clsx('w-6 h-6 rounded-lg flex items-center justify-center border shrink-0', color)}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {item.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 font-medium whitespace-nowrap">
                        {item.time}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 pl-8 leading-relaxed font-medium">
                      {item.desc}
                    </p>

                    <div className="pl-8 pt-1 flex items-center justify-between text-3xs text-slate-400">
                      <span>Logged by: <strong className="text-slate-700 dark:text-slate-300">{item.actor || 'System'}</strong></span>
                      {item.link && (
                        <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-0.5 group-hover:underline">
                          View details <ArrowUpRight className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-5">
            <span className="text-3xs text-slate-400 font-medium">
              Live updates polled every 15 seconds
            </span>
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all as read
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
