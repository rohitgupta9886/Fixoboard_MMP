import React, { useState } from 'react';
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
} from 'lucide-react';
import clsx from 'clsx';

export interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'important' | 'production' | 'orders' | 'dispatch'>('all');

  if (!isOpen) return null;

  const notifications = [
    {
      id: 1,
      type: 'production',
      title: 'Production Run Completed',
      desc: 'Line 01 completed Extrusion Batch for 100 Sheets (PVC/WPC Ply 25mm 0.45).',
      time: '2 mins ago',
      isImportant: true,
      icon: Cpu,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300',
    },
    {
      id: 2,
      type: 'dispatch',
      title: 'Dispatch Ready for Gate Out',
      desc: 'Vehicle GJ-01-XX-9999 loaded with 10 Bundles (100 Sheets) ready for clearance.',
      time: '12 mins ago',
      isImportant: true,
      icon: Truck,
      color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300',
    },
    {
      id: 3,
      type: 'orders',
      title: 'Sales Order Approved',
      desc: 'SO-2026-000010 (ABC Traders) approved by Plant Manager. Production Memo queued.',
      time: '35 mins ago',
      isImportant: false,
      icon: CheckCircle2,
      color: 'text-brand-indigo bg-indigo-50 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300',
    },
    {
      id: 4,
      type: 'production',
      title: 'Extrusion Line 03 Standby',
      desc: 'Line 03 is idle and ready for work order assignment.',
      time: '1 hour ago',
      isImportant: false,
      icon: Clock,
      color: 'text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-300',
    },
    {
      id: 5,
      type: 'orders',
      title: 'Auto Workflow Triggered',
      desc: 'Production Memo PM-2026-000008 auto-scheduled on Line 01 based on capacity.',
      time: '2 hours ago',
      isImportant: false,
      icon: Activity,
      color: 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300',
    },
  ];

  const filtered = notifications.filter((n) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'important') return n.isImportant;
    return n.type === activeTab;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Notification Center
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Live factory events &amp; work order triggers
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs">
            {(['all', 'important', 'production', 'orders', 'dispatch'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={clsx(
                  'px-3 py-1 rounded-lg font-semibold capitalize transition-all shrink-0',
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filtered.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700/60 bg-white dark:bg-slate-850/60 shadow-2xs transition-all space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={clsx('w-6 h-6 rounded-md flex items-center justify-center border shrink-0', item.color)}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {item.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                      {item.time}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 pl-8 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 text-center">
            <button
              onClick={onClose}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Mark all as read
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
