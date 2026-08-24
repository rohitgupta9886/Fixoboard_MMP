import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LayoutDashboard, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Button } from '../common/Button';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  permission?: string;
  permissions?: string[];
  role?: string;
  roles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  permission,
  permissions,
  role,
  roles,
}) => {
  const { user, isAuthenticated, isLoading, hasPermission, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-navy-950">
        <LoadingSpinner size="lg" text="Authenticating user session..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Permission Checks
  let isAuthorized = true;

  if (permission && !hasPermission(permission)) {
    isAuthorized = false;
  }

  if (permissions && permissions.length > 0) {
    const hasAny = permissions.some((p) => hasPermission(p));
    if (!hasAny) {
      isAuthorized = false;
    }
  }

  if (role && !hasRole(role)) {
    isAuthorized = false;
  }

  if (roles && roles.length > 0) {
    const hasAnyRole = roles.some((r) => hasRole(r));
    if (!hasAnyRole) {
      isAuthorized = false;
    }
  }

  if (!isAuthorized) {
    const userRoleDisplay = Array.isArray(user.roles) ? user.roles.join(', ') : 'STANDARD';

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700 shadow-soft text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Access Restricted
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Your account role (<strong className="text-slate-800 dark:text-slate-200 font-mono">{userRoleDisplay}</strong>) does not have authorization to view this operational module.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200/60 dark:border-navy-800 text-left text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span>Authenticated User:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-200">{user.full_name || user.username}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span>Required Clearance:</span>
              <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">
                {permission || (permissions ? permissions.join(' | ') : role || 'ELEVATED_ROLE')}
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Go Back
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/dashboard')}
              leftIcon={<LayoutDashboard className="w-4 h-4" />}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
