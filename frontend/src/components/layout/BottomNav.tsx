import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import {
  LayoutDashboard,
  ShoppingCart,
  Cpu,
  Truck,
  Menu,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface BottomNavProps {
  onOpenMobileMenu: () => void;
  onOpenAiAdvisor?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  onOpenMobileMenu,
  onOpenAiAdvisor,
}) => {
  const location = useLocation();
  const { hasRole } = useAuth();
  const canAccessAi = hasRole('ADMIN') || hasRole('PLANT_MANAGER');

  const navItems = [
    {
      name: 'Cockpit',
      path: '/dashboard',
      altPaths: ['/'],
      icon: LayoutDashboard,
    },
    {
      name: 'Orders',
      path: '/sales-orders',
      altPaths: ['/sales-orders/create', '/ai-orders'],
      icon: ShoppingCart,
    },
    {
      name: 'Floor',
      path: '/production-execution',
      altPaths: ['/production-planning', '/production-memos', '/machines'],
      icon: Cpu,
    },
    {
      name: 'Logistics',
      path: '/dispatch',
      altPaths: ['/packing'],
      icon: Truck,
    },
  ];

  const isTabActive = (item: typeof navItems[0]) => {
    if (location.pathname === item.path) return true;
    if (item.altPaths && item.altPaths.some((p) => location.pathname.startsWith(p))) return true;
    return false;
  };

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/90 dark:border-slate-800 shadow-2xl pb-safe transition-all"
    >
      <div className="flex items-center justify-around px-2 py-1.5 max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = isTabActive(item);
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={clsx(
                'flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all select-none touch-manipulation min-h-[48px]',
                active
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              )}
            >
              <div
                className={clsx(
                  'relative p-1 rounded-lg transition-transform duration-150',
                  active
                    ? 'bg-blue-50 dark:bg-blue-950/60 scale-110'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
                )}
              >
                <Icon className={clsx('w-5 h-5', active ? 'stroke-[2.5]' : 'stroke-2')} />
                {active && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.name}</span>
            </NavLink>
          );
        })}

        {/* AI Quick Button (if eligible) or Menu Trigger */}
        {canAccessAi && onOpenAiAdvisor ? (
          <button
            onClick={onOpenAiAdvisor}
            className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-purple-600 dark:text-purple-400 font-bold transition-all select-none touch-manipulation min-h-[48px]"
            title="AI Plant Advisor"
          >
            <div className="p-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 animate-pulse" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">AI Advisor</span>
          </button>
        ) : null}

        {/* More / Menu Drawer Trigger */}
        <button
          onClick={onOpenMobileMenu}
          className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium transition-all select-none touch-manipulation min-h-[48px]"
          title="Open Menu"
        >
          <div className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60">
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Menu</span>
        </button>
      </div>
    </nav>
  );
};
