import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  FileText,
  Users,
  Cpu,
  Truck,
  Package,
  Layers,
  ArrowRight,
  X,
  BarChart3,
  ShieldCheck,
  PlusCircle,
  FileCheck,
  Sliders,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  // Keyboard shortcut listener for ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickNav = [
    { label: 'Dashboard Overview', path: '/dashboard', icon: Layers, category: 'Workspace', permission: 'dashboards:view' },
    { label: 'Create New Sales Order', path: '/sales-orders/new', icon: PlusCircle, category: 'Sales & Commercial', permission: 'sales_orders:create' },
    { label: 'Sales Orders Queue', path: '/sales-orders', icon: FileText, category: 'Sales & Commercial', permission: 'sales_orders:read' },
    { label: 'Commercial Order Entry', path: '/sales-orders/new', icon: Sliders, category: 'Sales & Commercial', permission: 'sales_orders:create' },
    { label: 'Shop Floor Operator Console', path: '/production/execution', icon: Cpu, category: 'Manufacturing & Floor', permission: 'production:execute' },
    { label: 'Extrusion Planning Board', path: '/production/planning', icon: Cpu, category: 'Manufacturing & Floor', permission: 'production:plan' },
    { label: 'Production Work Memos', path: '/production/memos', icon: FileCheck, category: 'Manufacturing & Floor', permission: 'memos:read' },
    { label: 'Packaging Queue & Bundles', path: '/packing', icon: Package, category: 'Packaging & Warehouse', permission: 'packing:read' },
    { label: 'Dispatch & Gate Passes', path: '/dispatch', icon: Truck, category: 'Logistics & Dispatch', permission: 'dispatch:read' },
    { label: 'Extrusion Lines 1–4 Telemetry', path: '/machines', icon: Cpu, category: 'Master Data & Assets', permission: 'machines:read' },
    { label: 'Customer Parties Directory', path: '/parties', icon: Users, category: 'Master Data & Assets', permission: 'parties:read' },
    { label: 'Product Catalog & Specs', path: '/products', icon: Package, category: 'Master Data & Assets', permission: 'products:read' },
    { label: 'Production & Dispatch Analytics', path: '/reports', icon: BarChart3, category: 'Analytics & Reports', permission: 'reports:view' },
    { label: 'System Audit Logs', path: '/audit', icon: ShieldCheck, category: 'Security & Audit', permission: 'audit:read' },
  ];

  const filtered = quickNav.filter(
    (item) =>
      (!item.permission || hasPermission(item.permission)) &&
      (item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase()))
  );

  const handleSelect = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-card-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center px-4.5 py-4 border-b border-slate-200 dark:border-slate-800 gap-3 bg-slate-50/50 dark:bg-slate-900">
          <Search className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, machine lines, orders, reports..."
            className="w-full bg-transparent border-none outline-none text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 font-medium"
          />
          <span className="hidden sm:inline-flex text-xs font-num font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            ESC
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-80 overflow-y-auto p-2.5 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No matching commands found for "{query}".
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  onClick={() => handleSelect(item.path)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-blue-50/80 dark:hover:bg-blue-950/40 cursor-pointer group transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8.5 h-8.5 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-600 group-hover:text-white text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors shadow-2xs">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 block">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-4.5 py-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>FixoBoard MMS Omnibar</span>
          </div>
          <span className="font-semibold">Plant 1 Extrusion & Fabrication</span>
        </div>
      </div>
    </div>
  );
};

