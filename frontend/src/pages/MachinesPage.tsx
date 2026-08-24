import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { ApiResponse, Machine } from '../types';
import { Table, Column } from '../components/common/Table';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { StatCard } from '../components/common/StatCard';
import { Plus, Cpu, Activity, Gauge, Zap, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const MachinesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasPermission, hasRole } = useAuth();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    machine_code: '',
    machine_name: '',
    line_name: '',
    machine_type: 'EXTRUSION_LINE',
    rated_capacity_hourly: 25,
    location: 'Bay 1',
    description: '',
  });

  const { data, isLoading } = useQuery<ApiResponse<Machine[]>>({
    queryKey: ['machines_all'],
    queryFn: () => api.get<ApiResponse<Machine[]>>('/machines/all'),
  });

  const machines = data?.data || [];

  const totalLines = machines.length;
  const runningLines = machines.filter((m) => m.status === 'RUNNING').length;
  const availableLines = machines.filter((m) => m.status === 'AVAILABLE' || m.status === 'IDLE').length;
  const maintenanceLines = machines.filter((m) => m.status === 'MAINTENANCE' || m.status === 'OFFLINE').length;

  const createMachineMutation = useMutation({
    mutationFn: (data: typeof formData) => api.post('/machines', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines_all'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setIsCreateModalOpen(false);
      setActionError(null);
      setFormData({
        machine_code: '',
        machine_name: '',
        line_name: '',
        machine_type: 'EXTRUSION_LINE',
        rated_capacity_hourly: 25,
        location: 'Bay 1',
        description: '',
      });
    },
    onError: (err: any) => {
      setActionError(err?.message || 'Failed to register machine line');
    },
  });

  const canManageMachines =
    hasPermission('machines:manage') ||
    hasPermission('production:execute') ||
    hasPermission('production:plan') ||
    hasRole('OPERATOR') ||
    hasRole('PRODUCTION') ||
    hasRole('ADMIN') ||
    hasRole('MAIN_HEAD');

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => {
      setUpdatingId(id);
      return api.put(`/machines/${id}/status`, { status });
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['machines_all'] });
      const previousData = queryClient.getQueryData<ApiResponse<Machine[]>>(['machines_all']);
      if (previousData?.data) {
        queryClient.setQueryData<ApiResponse<Machine[]>>(['machines_all'], {
          ...previousData,
          data: previousData.data.map((m) => (m.id === id ? { ...m, status: status as Machine['status'] } : m)),
        });
      }
      return { previousData };
    },
    onError: (err: any, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['machines_all'], context.previousData);
      }
      setActionError(err?.message || 'Failed to update machine control state');
      setUpdatingId(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['machines_all'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setUpdatingId(null);
    },
  });

  const columns: Column<Machine>[] = [
    {
      key: 'line_name',
      header: 'Extrusion Line',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-700 dark:text-blue-400 font-num font-bold text-xs shadow-2xs">
            {row.line_name.replace('Line ', 'L')}
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-100">{row.line_name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">{row.machine_code}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'machine_name',
      header: 'Machine Specifications',
      render: (row) => (
        <div>
          <p className="text-slate-800 dark:text-slate-200 font-bold">{row.machine_name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{row.location || 'Main Extrusion Bay'}</p>
        </div>
      ),
    },
    {
      key: 'rated_capacity_hourly',
      header: 'Rated Capacity',
      align: 'right',
      render: (row) => (
        <div className="text-right font-num">
          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{row.rated_capacity_hourly}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 ml-1 font-sans font-medium">Shts/Hr</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Operational State',
      align: 'center',
      render: (row) => <Badge status={row.status} size="sm" />,
    },
    {
      key: 'action',
      header: 'Control State',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1.5">
          <select
            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-xs rounded-xl px-3 py-1.5 text-slate-900 dark:text-slate-100 font-sans font-bold cursor-pointer transition-all shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
            value={row.status}
            disabled={updatingId === row.id || !canManageMachines}
            onChange={(e) => updateStatusMutation.mutate({ id: row.id, status: e.target.value })}
          >
            <option value="AVAILABLE">🟢 AVAILABLE</option>
            <option value="RUNNING">🔵 RUNNING</option>
            <option value="IDLE">🟡 IDLE</option>
            <option value="MAINTENANCE">🟠 MAINTENANCE</option>
            <option value="OFFLINE">🔴 OFFLINE</option>
          </select>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Plant Machinery &amp; Extrusion Lines
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Configure extrusion lines, rated output capacities, and maintenance operational state.
          </p>
        </div>
        {hasPermission('machines:create') && (
          <Button
            variant="brand"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Extrusion Line
          </Button>
        )}
      </div>

      {/* Metric Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Lines"
          value={totalLines}
          unit="Extruders"
          subtitle="Plant 1 Bay"
          icon={<Cpu className="w-4.5 h-4.5" />}
          variant="blue"
        />
        <StatCard
          title="Running Extruders"
          value={runningLines}
          unit="Active"
          subtitle="Real-time synchronized"
          icon={<Activity className="w-4.5 h-4.5" />}
          variant="emerald"
        />
        <StatCard
          title="Available / Standby"
          value={availableLines}
          unit="Ready"
          subtitle="Job assignable"
          icon={<Zap className="w-4.5 h-4.5" />}
          variant="amber"
        />
        <StatCard
          title="In Maintenance"
          value={maintenanceLines}
          unit="Lines"
          subtitle="Scheduled downtime"
          icon={<AlertTriangle className="w-4.5 h-4.5" />}
          variant={maintenanceLines > 0 ? 'rose' : 'gray'}
        />
      </div>

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <span className="font-semibold">{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="text-rose-500 hover:text-rose-700 font-bold text-sm px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Table */}
      <Table columns={columns} data={machines} keyExtractor={(row) => row.id} isLoading={isLoading} />

      {/* Modal: Add Machine */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Register New Extrusion Line"
        subtitle="Add manufacturing line specification to plant registry"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMachineMutation.mutate(formData);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Line Name *"
              placeholder="e.g. Line 5"
              value={formData.line_name}
              onChange={(e) => setFormData({ ...formData, line_name: e.target.value })}
              required
            />
            <Input
              label="Machine Code *"
              placeholder="e.g. EXT-L5"
              value={formData.machine_code}
              onChange={(e) => setFormData({ ...formData, machine_code: e.target.value })}
              required
            />
          </div>

          <Input
            label="Machine Name / Make *"
            placeholder="e.g. High Output Conical Twin Screw Extruder 92/188"
            value={formData.machine_name}
            onChange={(e) => setFormData({ ...formData, machine_name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Rated Hourly Capacity (Sheets) *"
              type="number"
              value={formData.rated_capacity_hourly}
              onChange={(e) => setFormData({ ...formData, rated_capacity_hourly: Number(e.target.value) })}
              required
            />
            <Input
              label="Plant Location / Bay"
              placeholder="e.g. Bay 2, Plant Unit 1"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="brand" type="submit" isLoading={createMachineMutation.isPending}>
              Register Machine
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

