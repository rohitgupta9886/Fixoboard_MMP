import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { PaginatedResponse, UserSummary, ApiResponse, RoleSummary } from '../types';
import { Table, Column } from '../components/common/Table';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { StatCard } from '../components/common/StatCard';
import {
  Plus,
  Shield,
  User as UserIcon,
  Mail,
  Building,
  Users,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Phone,
  Calendar,
  Lock,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: currentUser, hasPermission } = useAuth();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Create Form State
  const [createFormData, setCreateFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    phone_number: '',
    department: 'Manufacturing Operations',
    role_ids: [] as string[],
  });

  // Edit Form State
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    department: '',
    password: '',
    is_active: true,
    role_ids: [] as string[],
  });

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  // Queries
  const { data: usersData, isLoading, refetch } = useQuery<PaginatedResponse<UserSummary>>({
    queryKey: ['users_all'],
    queryFn: () => api.get<PaginatedResponse<UserSummary>>('/users', { page_size: 100 }),
  });

  const { data: rolesData } = useQuery<ApiResponse<RoleSummary[]>>({
    queryKey: ['roles_all'],
    queryFn: () => api.get<ApiResponse<RoleSummary[]>>('/roles'),
  });

  const rawUsers = usersData?.data || [];
  const roles = rolesData?.data || [];

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return rawUsers.filter((u) => {
      // Search text match
      const s = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !s ||
        u.full_name?.toLowerCase().includes(s) ||
        u.username?.toLowerCase().includes(s) ||
        u.email?.toLowerCase().includes(s) ||
        u.department?.toLowerCase().includes(s) ||
        u.phone_number?.toLowerCase().includes(s);

      // Role filter match
      let matchesRole = true;
      if (selectedRoleFilter) {
        matchesRole = u.roles?.some((r: any) => {
          if (typeof r === 'string') return r === selectedRoleFilter;
          return r?.id === selectedRoleFilter || r?.name === selectedRoleFilter;
        });
      }

      // Status filter match
      let matchesStatus = true;
      if (selectedStatusFilter === 'active') {
        matchesStatus = u.is_active === true;
      } else if (selectedStatusFilter === 'inactive') {
        matchesStatus = u.is_active === false;
      }

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [rawUsers, searchTerm, selectedRoleFilter, selectedStatusFilter]);

  const activeUsersCount = rawUsers.filter((u) => u.is_active).length;
  const inactiveUsersCount = rawUsers.filter((u) => !u.is_active).length;

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: (data: typeof createFormData) => api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users_all'] });
      setIsCreateModalOpen(false);
      setCreateFormData({
        username: '',
        email: '',
        password: '',
        full_name: '',
        phone_number: '',
        department: 'Manufacturing Operations',
        role_ids: [],
      });
      showFeedback('success', 'User account created successfully.');
    },
    onError: (err: any) => {
      showFeedback('error', err?.response?.data?.detail || err?.message || 'Failed to create user');
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: typeof editFormData }) => {
      const payload: any = {
        full_name: data.full_name,
        email: data.email,
        phone_number: data.phone_number || null,
        department: data.department || null,
        is_active: data.is_active,
        role_ids: data.role_ids,
      };
      if (data.password && data.password.trim().length > 0) {
        payload.password = data.password.trim();
      }
      return api.put(`/users/${userId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users_all'] });
      setIsEditModalOpen(false);
      setSelectedUser(null);
      showFeedback('success', 'User profile updated successfully.');
    },
    onError: (err: any) => {
      showFeedback('error', err?.response?.data?.detail || err?.message || 'Failed to update user');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ userId, is_active }: { userId: string; is_active: boolean }) =>
      api.patch(`/users/${userId}/status`, { is_active }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users_all'] });
      showFeedback('success', `User account ${variables.is_active ? 'activated' : 'deactivated'} successfully.`);
    },
    onError: (err: any) => {
      showFeedback('error', err?.response?.data?.detail || err?.message || 'Failed to change user status');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => api.delete(`/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users_all'] });
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      showFeedback('success', 'User deleted successfully.');
    },
    onError: (err: any) => {
      showFeedback('error', err?.response?.data?.detail || err?.message || 'Failed to delete user');
    },
  });

  const handleOpenEdit = (user: UserSummary) => {
    setSelectedUser(user);
    // Determine existing role IDs
    const existingRoleIds: string[] = [];
    if (Array.isArray(user.roles)) {
      user.roles.forEach((r: any) => {
        if (typeof r === 'object' && r.id) {
          existingRoleIds.push(r.id);
        } else if (typeof r === 'string') {
          const matchedRole = roles.find((role) => role.name === r || role.id === r);
          if (matchedRole) existingRoleIds.push(matchedRole.id);
        }
      });
    }

    setEditFormData({
      full_name: user.full_name || '',
      email: user.email || '',
      phone_number: user.phone_number || '',
      department: user.department || '',
      password: '',
      is_active: user.is_active,
      role_ids: existingRoleIds,
    });
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (user: UserSummary) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleOpenView = (user: UserSummary) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const handleToggleStatus = (user: UserSummary) => {
    if (user.id === currentUser?.id && user.is_active) {
      showFeedback('error', 'You cannot deactivate your own logged-in account.');
      return;
    }
    toggleStatusMutation.mutate({ userId: user.id, is_active: !user.is_active });
  };

  const columns: Column<UserSummary>[] = [
    {
      key: 'full_name',
      header: 'Staff Member / Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-sm shadow-2xs ${
              row.is_active
                ? 'bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400'
            }`}
          >
            {row.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer" onClick={() => handleOpenView(row)}>
                {row.full_name}
              </p>
              {row.id === currentUser?.id && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded border border-amber-200 dark:border-amber-800">
                  You
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">@{row.username}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Contact Info',
      render: (row) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-mono">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{row.email}</span>
          </div>
          {row.phone_number && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{row.phone_number}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium">
          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{row.department || 'General Operations'}</span>
        </div>
      ),
    },
    {
      key: 'roles',
      header: 'Assigned RBAC Roles',
      render: (row) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {Array.isArray(row.roles) && row.roles.length > 0 ? (
            row.roles.map((r: any, idx: number) => {
              const roleName = typeof r === 'string' ? r : r?.name || r?.display_name || 'USER';
              const key = typeof r === 'object' ? r?.id || `${roleName}-${idx}` : `${r}-${idx}`;
              return <Badge key={key} status={roleName} size="sm" />;
            })
          ) : (
            <span className="text-xs text-slate-400 font-medium italic">No roles</span>
          )}
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      align: 'center',
      render: (row) => (
        <button
          type="button"
          onClick={() => hasPermission('users:manage') && handleToggleStatus(row)}
          disabled={!hasPermission('users:manage') || toggleStatusMutation.isPending}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
            row.is_active
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
          title={hasPermission('users:manage') ? 'Click to toggle active/inactive status' : undefined}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${row.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          {row.is_active ? 'Active' : 'Inactive'}
        </button>
      ),
    },
    {
      key: 'id',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            className="p-1.5 h-8 w-8 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
            onClick={() => handleOpenView(row)}
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Button>

          {hasPermission('users:manage') && (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="p-1.5 h-8 w-8 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                onClick={() => handleOpenEdit(row)}
                title="Edit User"
              >
                <Edit2 className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className={`p-1.5 h-8 w-8 ${
                  row.id === currentUser?.id
                    ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                    : 'text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400'
                }`}
                disabled={row.id === currentUser?.id}
                onClick={() => handleOpenDelete(row)}
                title={row.id === currentUser?.id ? 'Cannot delete your own account' : 'Delete User'}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl shadow-md border animate-in slide-in-from-top duration-300 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <p className="text-sm font-semibold">{feedbackMessage.text}</p>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-xs font-semibold opacity-70 hover:opacity-100 transition-opacity"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            User Management &amp; Plant RBAC
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Manage factory operators, sales staff, dispatch officers, and role-based permissions with full CRUD controls.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          {hasPermission('users:manage') && (
            <Button variant="brand" onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Add User Account
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Staff Users"
          value={rawUsers.length}
          unit="Accounts"
          subtitle="Provisioned accounts"
          icon={<Users className="w-4.5 h-4.5" />}
          variant="blue"
        />
        <StatCard
          title="Active Operator Logins"
          value={activeUsersCount}
          unit="Active"
          subtitle="Plant access enabled"
          icon={<ShieldCheck className="w-4.5 h-4.5" />}
          variant="emerald"
        />
        <StatCard
          title="Inactive Accounts"
          value={inactiveUsersCount}
          unit="Inactive"
          subtitle="Deactivated access"
          icon={<ShieldAlert className="w-4.5 h-4.5" />}
          variant="amber"
        />
        <StatCard
          title="Configured RBAC Roles"
          value={roles.length}
          unit="Roles"
          subtitle="Security tiers"
          icon={<Shield className="w-4.5 h-4.5" />}
          variant="purple"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, username, email, department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-100 placeholder-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.display_name} ({r.name})
                </option>
              ))}
            </select>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            {(searchTerm || selectedRoleFilter || selectedStatusFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedRoleFilter('');
                  setSelectedStatusFilter('');
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
          <span>
            Showing <strong className="text-slate-800 dark:text-slate-200">{filteredUsers.length}</strong> of{' '}
            <strong className="text-slate-800 dark:text-slate-200">{rawUsers.length}</strong> accounts
          </span>
          {searchTerm && (
            <span>
              Filtered by: &ldquo;<span className="font-semibold text-blue-600 dark:text-blue-400">{searchTerm}</span>&rdquo;
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <Table columns={columns} data={filteredUsers} keyExtractor={(row) => row.id} isLoading={isLoading} />

      {/* Modal 1: Create User */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Provision Factory Staff Account"
          subtitle="Create user login credentials and assign RBAC roles"
          size="lg"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createUserMutation.mutate(createFormData);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                placeholder="e.g. Ramesh Patel"
                value={createFormData.full_name}
                onChange={(e) => setCreateFormData({ ...createFormData, full_name: e.target.value })}
                required
              />
              <Input
                label="Username / Staff ID *"
                placeholder="e.g. rpatel"
                value={createFormData.username}
                onChange={(e) => setCreateFormData({ ...createFormData, username: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email Address *"
                type="email"
                placeholder="rpatel@fixoboard.com"
                value={createFormData.email}
                onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                required
              />
              <Input
                label="Phone Number"
                placeholder="+91 98765 43210"
                value={createFormData.phone_number}
                onChange={(e) => setCreateFormData({ ...createFormData, phone_number: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Initial Password *"
                type="password"
                placeholder="••••••••"
                value={createFormData.password}
                onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                required
              />
              <Input
                label="Department *"
                placeholder="e.g. Extrusion Floor / Sales / Dispatch"
                value={createFormData.department}
                onChange={(e) => setCreateFormData({ ...createFormData, department: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Assigned RBAC Role *
              </label>
              <Select
                options={roles.map((r) => ({
                  value: r.id,
                  label: `${r.display_name} (${r.name})`,
                }))}
                value={createFormData.role_ids[0] || ''}
                onChange={(e) => setCreateFormData({ ...createFormData, role_ids: [e.target.value] })}
                placeholder="Select System Role"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="brand"
                type="submit"
                isLoading={createUserMutation.isPending}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Create User Account
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal 2: Edit User */}
      {isEditModalOpen && selectedUser && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
          title={`Edit User: ${selectedUser.full_name}`}
          subtitle={`Update profile details, contact, and role assignments for @${selectedUser.username}`}
          size="lg"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateUserMutation.mutate({ userId: selectedUser.id, data: editFormData });
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                value={editFormData.full_name}
                onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                required
              />
              <Input
                label="Username / ID"
                value={selectedUser.username}
                disabled
                helperText="Username cannot be changed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email Address *"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                required
              />
              <Input
                label="Phone Number"
                placeholder="+91 98765 43210"
                value={editFormData.phone_number}
                onChange={(e) => setEditFormData({ ...editFormData, phone_number: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Department"
                placeholder="e.g. Manufacturing Operations"
                value={editFormData.department}
                onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
              />
              <Input
                label="Reset Password (Optional)"
                type="password"
                placeholder="Leave blank to keep current"
                value={editFormData.password}
                onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Primary RBAC Role
              </label>
              <Select
                options={roles.map((r) => ({
                  value: r.id,
                  label: `${r.display_name} (${r.name})`,
                }))}
                value={editFormData.role_ids[0] || ''}
                onChange={(e) => setEditFormData({ ...editFormData, role_ids: [e.target.value] })}
                placeholder="Select System Role"
              />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Account Status</span>
                <p className="text-xs text-slate-500">Allow this user to sign in and perform factory tasks</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={editFormData.is_active}
                  disabled={selectedUser.id === currentUser?.id}
                  onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedUser(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="brand"
                type="submit"
                isLoading={updateUserMutation.isPending}
                leftIcon={<Edit2 className="w-4 h-4" />}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal 3: View Details */}
      {isViewModalOpen && selectedUser && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedUser(null);
          }}
          title="Staff Profile & Security Matrix"
          subtitle={`Details and security authorizations for @${selectedUser.username}`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Header Profile Card */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-md">
                {selectedUser.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedUser.full_name}</h3>
                  <Badge status={selectedUser.is_active ? 'ACTIVE' : 'INACTIVE'} size="sm" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">@{selectedUser.username}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedUser.email}</span>
                  </div>
                  {selectedUser.phone_number && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedUser.phone_number}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Department and Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-400 font-medium">Department</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                  {selectedUser.department || 'Manufacturing Operations'}
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-400 font-medium">Account ID</p>
                <p className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 mt-1 truncate">
                  {selectedUser.id}
                </p>
              </div>
            </div>

            {/* Roles and Permissions */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Assigned RBAC Roles
              </h4>
              <div className="flex items-center gap-2 flex-wrap">
                {Array.isArray(selectedUser.roles) && selectedUser.roles.length > 0 ? (
                  selectedUser.roles.map((r: any, idx: number) => {
                    const roleName = typeof r === 'string' ? r : r?.name || r?.display_name || 'USER';
                    const key = typeof r === 'object' ? r?.id || `${roleName}-${idx}` : `${r}-${idx}`;
                    return <Badge key={key} status={roleName} size="md" />;
                  })
                ) : (
                  <span className="text-xs text-slate-400 italic">No assigned roles</span>
                )}
              </div>
            </div>

            {Array.isArray(selectedUser.permissions) && selectedUser.permissions.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Granular Permissions Granted
                </h4>
                <div className="flex items-center gap-1.5 flex-wrap max-h-40 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                  {selectedUser.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="px-2 py-0.5 text-[11px] font-mono font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded text-slate-700 dark:text-slate-300"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedUser(null);
                }}
              >
                Close
              </Button>
              {hasPermission('users:manage') && (
                <Button
                  variant="brand"
                  leftIcon={<Edit2 className="w-4 h-4" />}
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleOpenEdit(selectedUser);
                  }}
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal 4: Delete Confirmation */}
      {isDeleteModalOpen && selectedUser && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedUser(null);
          }}
          title="Delete Staff Account"
          subtitle="Are you sure you want to permanently delete this user account?"
          size="md"
        >
          <div className="space-y-4">
            <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-rose-900 dark:text-rose-200">
                  Warning: Action Cannot Be Undone
                </p>
                <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
                  You are about to delete user account for{' '}
                  <strong className="font-semibold">{selectedUser.full_name}</strong> (@{selectedUser.username}). This will
                  permanently remove login access.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedUser(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                isLoading={deleteUserMutation.isPending}
                leftIcon={<Trash2 className="w-4 h-4" />}
                onClick={() => deleteUserMutation.mutate(selectedUser.id)}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
