import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import {
  LayoutDashboard,
  ShoppingCart,
  Cpu,
  Package,
  Truck,
  BarChart3,
  FileSpreadsheet,
  Users,
  Box,
  Sliders,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Camera,
  Sparkles,
  Bot,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type ColorScheme =
  | 'indigo'
  | 'emerald'
  | 'purple'
  | 'amber'
  | 'cyan'
  | 'rose'
  | 'teal'
  | 'sky'
  | 'fuchsia'
  | 'orange'
  | 'blue'
  | 'violet';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  permission?: string;
  badge?: string;
  color: ColorScheme;
}

interface NavGroup {
  label: string;
  colorTag: string;
  dotColor: string;
  items: NavItem[];
}

const colorStyles: Record<
  ColorScheme,
  {
    iconText: string;
    iconBg: string;
    activeIconBg: string;
    activeBg: string;
    activeBorder: string;
    activeText: string;
    indicator: string;
    hoverBorder: string;
    badge: string;
  }
> = {
  indigo: {
    iconText: 'text-indigo-600 dark:text-indigo-400',
    iconBg: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300',
    activeIconBg: 'bg-indigo-600 text-white shadow-xs',
    activeBg: 'bg-gradient-to-r from-indigo-50 via-indigo-50/70 to-blue-50/40 dark:from-indigo-950/60 dark:via-indigo-900/30 dark:to-slate-900/60',
    activeBorder: 'border-indigo-200 dark:border-indigo-700/60',
    activeText: 'text-indigo-950 dark:text-indigo-100 font-bold',
    indicator: 'bg-indigo-600 shadow-glow-brand',
    hoverBorder: 'hover:border-indigo-100 dark:hover:border-indigo-900/40',
    badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300',
  },
  emerald: {
    iconText: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300',
    activeIconBg: 'bg-emerald-600 text-white shadow-xs',
    activeBg: 'bg-gradient-to-r from-emerald-50 via-emerald-50/70 to-teal-50/40 dark:from-emerald-950/60 dark:via-emerald-900/30 dark:to-slate-900/60',
    activeBorder: 'border-emerald-200 dark:border-emerald-700/60',
    activeText: 'text-emerald-950 dark:text-emerald-100 font-bold',
    indicator: 'bg-emerald-600 shadow-glow-emerald',
    hoverBorder: 'hover:border-emerald-100 dark:hover:border-emerald-900/40',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
  },
  purple: {
    iconText: 'text-purple-600 dark:text-purple-400',
    iconBg: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300',
    activeIconBg: 'bg-purple-600 text-white shadow-xs',
    activeBg: 'bg-gradient-to-r from-purple-50 via-purple-50/70 to-violet-50/40 dark:from-purple-950/60 dark:via-purple-900/30 dark:to-slate-900/60',
    activeBorder: 'border-purple-200 dark:border-purple-700/60',
    activeText: 'text-purple-950 dark:text-purple-100 font-bold',
    indicator: 'bg-purple-600 shadow-glow-violet',
    hoverBorder: 'hover:border-purple-100 dark:hover:border-purple-900/40',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300',
  },
  amber: {
    iconText: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300',
    activeIconBg: 'bg-amber-500 text-white shadow-xs',
    activeBg: 'bg-gradient-to-r from-amber-50 via-amber-50/70 to-orange-50/40 dark:from-amber-950/60 dark:via-amber-900/30 dark:to-slate-900/60',
    activeBorder: 'border-amber-200 dark:border-amber-700/60',
    activeText: 'text-amber-950 dark:text-amber-100 font-bold',
    indicator: 'bg-amber-500 shadow-glow-amber',
    hoverBorder: 'hover:border-amber-100 dark:hover:border-amber-900/40',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
  },
  cyan: {
    iconText: 'text-cyan-600 dark:text-cyan-400',
    iconBg: 'bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-300',
    activeIconBg: 'bg-cyan-600 text-white shadow-xs',
    activeBg: 'bg-gradient-to-r from-cyan-50 via-cyan-50/70 to-sky-50/40 dark:from-cyan-950/60 dark:via-cyan-900/30 dark:to-slate-900/60',
    activeBorder: 'border-cyan-200 dark:border-cyan-700/60',
    activeText: 'text-cyan-950 dark:text-cyan-100 font-bold',
    indicator: 'bg-cyan-600 shadow-glow-brand',
    hoverBorder: 'hover:border-cyan-100 dark:hover:border-cyan-900/40',
    badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-300',
  },
  rose: {
    iconText: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300',
    activeIconBg: 'bg-rose-600 text-white shadow-xs',
    activeBg: 'bg-gradient-to-r from-rose-50 via-rose-50/70 to-pink-50/40 dark:from-rose-950/60 dark:via-rose-900/30 dark:to-slate-900/60',
    activeBorder: 'border-rose-200 dark:border-rose-700/60',
    activeText: 'text-rose-950 dark:text-rose-100 font-bold',
    indicator: 'bg-rose-600 shadow-glow-rose',
    hoverBorder: 'hover:border-rose-100 dark:hover:border-rose-900/40',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300',
  },
  teal: {
    iconText: 'text-teal-600 dark:text-teal-400',
    iconBg: 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-300',
    activeIconBg: 'bg-teal-600 text-white shadow-xs',
    activeBg: 'bg-gradient-to-r from-teal-50 via-teal-50/70 to-emerald-50/40 dark:from-teal-950/60 dark:via-teal-900/30 dark:to-slate-900/60',
    activeBorder: 'border-teal-200 dark:border-teal-700/60',
    activeText: 'text-teal-950 dark:text-teal-100 font-bold',
    indicator: 'bg-teal-600 shadow-glow-emerald',
    hoverBorder: 'hover:border-teal-100 dark:hover:border-teal-900/40',
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300',
  },
  sky: {
    iconText: 'text-sky-600 dark:text-sky-400',
    iconBg: 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300',
    activeIconBg: 'bg-sky-600 text-white shadow-xs',
    activeBg: 'bg-gradient-to-r from-sky-50 via-sky-50/70 to-blue-50/40 dark:from-sky-950/60 dark:via-sky-900/30 dark:to-slate-900/60',
    activeBorder: 'border-sky-200 dark:border-sky-700/60',
    activeText: 'text-sky-950 dark:text-sky-100 font-bold',
    indicator: 'bg-sky-600 shadow-glow-brand',
    hoverBorder: 'hover:border-sky-100 dark:hover:border-sky-900/40',
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300',
  },
  fuchsia: {
    iconText: 'text-fuchsia-600 dark:text-fuchsia-400',
    iconBg: 'bg-fuchsia-500/10 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-300',
    activeIconBg: 'bg-fuchsia-600 text-white shadow-xs',
    activeBg: 'bg-gradient-to-r from-fuchsia-50 via-fuchsia-50/70 to-pink-50/40 dark:from-fuchsia-950/60 dark:via-fuchsia-900/30 dark:to-slate-900/60',
    activeBorder: 'border-fuchsia-200 dark:border-fuchsia-700/60',
    activeText: 'text-fuchsia-950 dark:text-fuchsia-100 font-bold',
    indicator: 'bg-fuchsia-600 shadow-glow-rose',
    hoverBorder: 'hover:border-fuchsia-100 dark:hover:border-fuchsia-900/40',
    badge: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/60 dark:text-fuchsia-300',
  },
  orange: {
    iconText: 'text-orange-600 dark:text-orange-400',
    iconBg: 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300',
    activeIconBg: 'bg-orange-500 text-white shadow-xs',
    activeBg: 'bg-gradient-to-r from-orange-50 via-orange-50/70 to-amber-50/40 dark:from-orange-950/60 dark:via-orange-900/30 dark:to-slate-900/60',
    activeBorder: 'border-orange-200 dark:border-orange-700/60',
    activeText: 'text-orange-950 dark:text-orange-100 font-bold',
    indicator: 'bg-orange-500 shadow-glow-amber',
    hoverBorder: 'hover:border-orange-100 dark:hover:border-orange-900/40',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300',
  },
  blue: {
    iconText: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300',
    activeIconBg: 'bg-blue-600 text-white shadow-xs',
    activeBg: 'bg-gradient-to-r from-blue-50 via-blue-50/70 to-indigo-50/40 dark:from-blue-950/60 dark:via-blue-900/30 dark:to-slate-900/60',
    activeBorder: 'border-blue-200 dark:border-blue-700/60',
    activeText: 'text-blue-950 dark:text-blue-100 font-bold',
    indicator: 'bg-blue-600 shadow-glow-brand',
    hoverBorder: 'hover:border-blue-100 dark:hover:border-blue-900/40',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
  },
  violet: {
    iconText: 'text-violet-600 dark:text-violet-400',
    iconBg: 'bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300',
    activeIconBg: 'bg-violet-600 text-white shadow-xs',
    activeBg: 'bg-gradient-to-r from-violet-50 via-violet-50/70 to-purple-50/40 dark:from-violet-950/60 dark:via-violet-900/30 dark:to-slate-900/60',
    activeBorder: 'border-violet-200 dark:border-violet-700/60',
    activeText: 'text-violet-950 dark:text-violet-100 font-bold',
    indicator: 'bg-violet-600 shadow-glow-violet',
    hoverBorder: 'hover:border-violet-100 dark:hover:border-violet-900/40',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300',
  },
};

const navGroups: NavGroup[] = [
  {
    label: 'WORKSPACE',
    colorTag: 'text-indigo-600 dark:text-indigo-400',
    dotColor: 'bg-indigo-500 shadow-glow-brand',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboards:view', color: 'indigo' },
    ],
  },
  {
    label: 'AI & OPERATIONS',
    colorTag: 'text-purple-600 dark:text-purple-400',
    dotColor: 'bg-purple-500 shadow-glow-violet',
    items: [
      { name: 'AI Order Scanner', href: '/ai-scanner', icon: Camera, permission: 'sales_orders:create', badge: 'AI VISION', color: 'purple' },
      { name: 'Sales Orders', href: '/sales-orders', icon: ShoppingCart, permission: 'sales_orders:read', color: 'emerald' },
      { name: 'Planning Board', href: '/production/planning', icon: Sliders, permission: 'production:plan', color: 'purple' },
      { name: 'Production Memos', href: '/production-memos', icon: FileSpreadsheet, permission: 'production:read', color: 'amber' },
      { name: 'Floor Execution', href: '/production/execution', icon: Cpu, permission: 'production:execute', color: 'cyan' },
      { name: 'Packaging Queue', href: '/packing', icon: Package, permission: 'packing:read', color: 'rose' },
      { name: 'Dispatch & Gate Passes', href: '/dispatch', icon: Truck, permission: 'dispatch:read', color: 'teal' },
    ],
  },
  {
    label: 'MASTER DATA & ASSETS',
    colorTag: 'text-amber-600 dark:text-amber-400',
    dotColor: 'bg-amber-500 shadow-glow-amber',
    items: [
      { name: 'Extrusion Machines', href: '/machines', icon: Cpu, permission: 'machines:read', color: 'sky' },
      { name: 'Customer Parties', href: '/parties', icon: Users, permission: 'parties:read', color: 'fuchsia' },
      { name: 'Product Catalog', href: '/products', icon: Box, permission: 'products:read', color: 'orange' },
    ],
  },
  {
    label: 'INTELLIGENCE & AUDIT',
    colorTag: 'text-violet-600 dark:text-violet-400',
    dotColor: 'bg-violet-500 shadow-glow-violet',
    items: [
      { name: 'Plant Analytics', href: '/reports', icon: BarChart3, permission: 'reports:view', color: 'blue' },
      { name: 'System Audit Logs', href: '/audit-logs', icon: History, permission: 'audit:view', color: 'violet' },
      { name: 'User Management', href: '/users', icon: Settings, permission: 'users:manage', color: 'teal' },
    ],
  },
];

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { hasPermission } = useAuth();
  const location = useLocation();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={clsx(
          'fixed lg:static top-0 bottom-0 left-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-r border-slate-200/90 dark:border-slate-800/90 flex flex-col transition-all duration-300 select-none shadow-soft lg:shadow-none',
          isCollapsed ? 'w-20' : 'w-64',
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="border-b border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-b from-slate-50/90 to-white/90 dark:from-slate-950/90 dark:to-slate-900/90 p-3.5 transition-all">
          {isCollapsed ? (
            /* Collapsed Brand Header */
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center p-1.5 shadow-xs border border-slate-200/80 dark:border-slate-700/80">
                <img
                  src="/logo.png"
                  alt="FixoBoard"
                  className="w-full h-full object-contain"
                />
              </div>
              <button
                onClick={onToggleCollapse}
                className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all shadow-2xs border border-slate-200/60 dark:border-slate-700/60"
                title="Expand Sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Expanded Brand Header */
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="bg-white dark:bg-slate-800/90 px-3 py-2 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700/80 flex items-center flex-1 min-w-0">
                  <img
                    src="/logo.png"
                    alt="FixoBoard Logo"
                    className="h-9 w-full object-contain object-left"
                  />
                </div>
                <button
                  onClick={onToggleCollapse}
                  className="hidden lg:flex p-2 rounded-xl text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all shadow-2xs border border-slate-200/60 dark:border-slate-700/60 shrink-0"
                  title="Collapse Sidebar"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={onCloseMobile}
                  className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all touch-target shrink-0 flex items-center justify-center"
                  aria-label="Close navigation menu"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>

              {/* Status Sub-bar */}
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-[10px]">
                <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  MMS Core
                </span>
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Lines 1–4 Active
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(
              (item) => !item.permission || hasPermission(item.permission)
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label}>
                {!isCollapsed && (
                  <div className="px-3 mb-2.5 flex items-center gap-2">
                    <span className={clsx('w-1.5 h-1.5 rounded-full', group.dotColor)} />
                    <span className={clsx('text-[10px] font-extrabold tracking-wider uppercase font-sans', group.colorTag)}>
                      {group.label}
                    </span>
                  </div>
                )}
                <div className="space-y-1.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const style = colorStyles[item.color];
                    const isActive =
                      location.pathname === item.href ||
                      (item.href !== '/dashboard' &&
                        item.href !== '/' &&
                        location.pathname.startsWith(item.href));

                    return (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        onClick={onCloseMobile}
                        title={isCollapsed ? item.name : undefined}
                        className={clsx(
                          'relative group flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border',
                          isActive
                            ? clsx(style.activeBg, style.activeBorder, style.activeText)
                            : clsx(
                                'text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white',
                                style.hoverBorder
                              ),
                          isCollapsed && 'justify-center px-2'
                        )}
                      >
                        {/* Active Left Indicator Bar */}
                        {isActive && (
                          <span
                            className={clsx(
                              'absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full transition-all',
                              style.indicator
                            )}
                          />
                        )}

                        {/* Vivid Colorful Icon Badge */}
                        <div
                          className={clsx(
                            'p-1.5 rounded-lg shrink-0 flex items-center justify-center transition-all duration-200',
                            isActive
                              ? style.activeIconBg
                              : clsx(style.iconBg, 'group-hover:scale-105')
                          )}
                        >
                          <Icon
                            className={clsx(
                              'w-4 h-4 shrink-0 transition-colors',
                              isActive ? 'text-white' : style.iconText
                            )}
                          />
                        </div>

                        {!isCollapsed && (
                          <span className="truncate tracking-tight font-medium">
                            {item.name}
                          </span>
                        )}

                        {!isCollapsed && item.badge && (
                          <span
                            className={clsx(
                              'ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs',
                              style.badge
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Smart Factory Core Card */}
        {!isCollapsed && (
          <div className="p-3 m-3 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-950/60 dark:via-purple-950/40 dark:to-slate-900 border border-indigo-200/70 dark:border-indigo-800/60 text-xs shadow-soft relative overflow-hidden group">
            {/* Ambient Background Gradient Orb */}
            <div className="absolute -right-6 -bottom-6 w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-lg pointer-events-none group-hover:scale-125 transition-transform" />

            <div className="flex items-center justify-between gap-2 mb-1.5 relative z-10">
              <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-bold">
                <div className="p-1 rounded-md bg-indigo-600 text-white shadow-2xs">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <span className="font-extrabold text-[11px] tracking-tight">Smart Factory Core</span>
              </div>
              <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug relative z-10">
              Real-time telemetry and ERP dispatch engine active.
            </p>
          </div>
        )}
      </aside>
    </>
  );
};


