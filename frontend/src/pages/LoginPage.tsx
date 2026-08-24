import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Layers,
  Building2,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Button } from '../components/common/Button';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('management');
  const [password, setPassword] = useState('Fixo@12345');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const demoAccounts = [
    { name: 'Plant Manager (Head)', username: 'management', role: 'Full Operations Control', badge: 'Head', color: 'indigo' },
    { name: 'System Administrator', username: 'admin', role: 'All Modules & Users', badge: 'Admin', color: 'slate' },
    { name: 'Commercial Sales', username: 'sales', role: 'Order Authorizer', badge: 'Sales', color: 'blue' },
    { name: 'Production Supervisor', username: 'production', role: 'Line Scheduler', badge: 'Planning', color: 'purple' },
    { name: 'Floor Operator', username: 'operator1', role: 'Extrusion Terminal', badge: 'Operator', color: 'emerald' },
    { name: 'Packaging Lead', username: 'packing', role: 'Bundle & Slips', badge: 'Pack', color: 'amber' },
    { name: 'Dispatch Officer', username: 'dispatch', role: 'Gate Out Manifest', badge: 'Logistics', color: 'sky' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.post<any>('/auth/login', { username, password });
      login(res.data);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.response?.data?.error?.message || 'Invalid username or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans select-none">
      {/* Background ambient lighting effects */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-9 shadow-2xl space-y-6">
        {/* Logo & Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="bg-white px-6 py-3 rounded-2xl shadow-xl mb-4 flex items-center justify-center border border-slate-200">
            <img src="/logo.png" alt="FixoBoard Logo" className="h-12 sm:h-14 w-auto object-contain" />
          </div>

          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Manufacturing Management System
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-blue-400 font-mono font-bold uppercase tracking-wider">
              Plant 1 Extrusion &amp; Operations Center
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-emerald-400 font-mono font-semibold">
              ISO 9001:2015
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 max-w-sm">
            Sign in with your role-based credentials to access production lines, packaging queues, gate manifests, and analytics.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800/80 flex items-center gap-3 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Account ID / Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="management, sales, operator1, dispatch..."
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-700 bg-slate-800/80 text-sm font-medium text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Security Password
              </label>
              <span className="text-[11px] font-mono text-blue-400 font-bold">
                Default: Fixo@12345
              </span>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-700 bg-slate-800/80 text-sm font-medium text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full h-12 text-sm font-extrabold shadow-lg shadow-blue-600/30"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Sign In &amp; Launch Control Center
          </Button>
        </form>

        {/* 7 Quick-Select Industrial Personas Strip */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>One-Click Role Authentication:</span>
            <span className="font-mono text-[10px] text-blue-400 font-bold">7 Industrial Personas</span>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
            {demoAccounts.map((acc, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setUsername(acc.username);
                  setPassword('Fixo@12345');
                }}
                className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-blue-950/60 border border-slate-700/80 hover:border-blue-500 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-blue-400 truncate block">
                    {acc.name}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-700 text-slate-300">
                    {acc.badge}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium truncate">
                    {acc.role}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {acc.username}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
