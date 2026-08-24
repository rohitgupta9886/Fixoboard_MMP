import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { PaginatedResponse, ProductionMemo, ApiResponse, Machine } from '../types';
import { Table, Column } from '../components/common/Table';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { StatCard } from '../components/common/StatCard';
import { Cpu, Search, Calendar, Play, Settings, PlaySquare, Layers, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ProductionMemosPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedMemoForAssign, setSelectedMemoForAssign] = useState<ProductionMemo | null>(null);
  const [selectedMachineId, setSelectedMachineId] = useState('');

  // Queries
  const { data, isLoading } = useQuery<PaginatedResponse<ProductionMemo>>({
    queryKey: ['production_memos', page, search, statusFilter],
    queryFn: () =>
      api.get<PaginatedResponse<ProductionMemo>>('/production-memos', {
        page,
        page_size: 15,
        search,
        status: statusFilter || undefined,
      }),
  });

  const { data: machinesData } = useQuery<ApiResponse<Machine[]>>({
    queryKey: ['machines_all'],
    queryFn: () => api.get<ApiResponse<Machine[]>>('/machines/all'),
  });

  const availableMachines = (machinesData?.data || []).filter(
    (m) => m.is_active && m.status !== 'MAINTENANCE' && m.status !== 'OFFLINE'
  );

  // Assign Machine Mutation
  const assignMachineMutation = useMutation({
    mutationFn: (memoId: string) =>
      api.post(`/production-memos/${memoId}/assign-machine`, {
        machine_id: selectedMachineId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production_memos'] });
      setSelectedMemoForAssign(null);
    },
  });

  // Release Memo Mutation
  const releaseMemoMutation = useMutation({
    mutationFn: (memoId: string) => api.post(`/production-memos/${memoId}/release`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production_memos'] });
    },
  });

  const memos = data?.data || [];
  const totalMemos = data?.pagination?.total || memos.length;
  const unassignedCount = memos.filter((m) => !m.target_machine_id && m.status === 'PLANNED').length;
  const releasedCount = memos.filter((m) => m.status === 'RELEASED' || m.status === 'IN_PROGRESS').length;
  const completedCount = memos.filter((m) => m.status === 'COMPLETED').length;

  const columns: Column<ProductionMemo>[] = [
    {
      key: 'memo_number',
      header: 'Memo #',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{row.memo_number}</span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-medium">SO: {row.sales_order?.order_number}</p>
        </div>
      ),
    },
    {
      key: 'product',
      header: 'Board Specifications',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
            {row.sales_order_item?.product?.product_name || 'PVC / WPC Board'}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 mt-0.5">
            <span className="text-indigo-600 dark:text-indigo-400">{row.sales_order_item?.thickness?.display_label}</span>
            <span>&bull;</span>
            <span className="text-emerald-600 dark:text-emerald-400">{row.sales_order_item?.density?.display_label}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'planned_quantity',
      header: 'Target Qty',
      align: 'right',
      render: (row) => (
        <div className="text-right font-num">
          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{row.planned_quantity}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 ml-1 font-sans font-medium">Shts</span>
        </div>
      ),
    },
    {
      key: 'target_machine',
      header: 'Assigned Extruder',
      render: (row) =>
        row.target_machine ? (
          <div className="text-xs">
            <span className="font-num font-bold text-slate-900 dark:text-slate-100">{row.target_machine.line_name}</span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{row.target_machine.machine_name}</p>
          </div>
        ) : (
          <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">Unassigned (Manual)</span>
        ),
    },
    {
      key: 'required_date',
      header: 'Req. Date',
      render: (row) => <span className="text-xs font-num font-bold text-slate-700 dark:text-slate-300">{row.required_date}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => <Badge status={row.status} size="sm" />,
    },
    {
      key: 'action',
      header: 'Action',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          {['DRAFT', 'PLANNED'].includes(row.status) && hasPermission('production:plan') && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => {
                setSelectedMemoForAssign(row);
                setSelectedMachineId(row.target_machine_id || (availableMachines[0]?.id || ''));
              }}
              leftIcon={<Settings className="w-3 h-3" />}
            >
              Assign
            </Button>
          )}

          {row.status === 'MACHINE_ASSIGNED' && hasPermission('production:plan') && (
            <Button
              variant="brand"
              size="xs"
              onClick={() => releaseMemoMutation.mutate(row.id)}
              isLoading={releaseMemoMutation.isPending}
              leftIcon={<Play className="w-3 h-3" />}
            >
              Release
            </Button>
          )}

          {row.status === 'RELEASED' && hasPermission('production:execute') && (
            <Button
              variant="success"
              size="xs"
              onClick={() => navigate(`/production/execution?memo_id=${row.id}`)}
              leftIcon={<PlaySquare className="w-3 h-3" />}
            >
              Start Floor Run
            </Button>
          )}
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
            Production Memos &amp; Work Orders
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Plant work orders with manual line allocation, production schedules, and floor tracking.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/production/planning')}
            leftIcon={<Calendar className="w-3.5 h-3.5" />}
          >
            Planning Board
          </Button>
          <Button
            variant="brand"
            size="sm"
            onClick={() => navigate('/production/execution')}
            leftIcon={<PlaySquare className="w-3.5 h-3.5" />}
          >
            Floor Execution
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Work Memos"
          value={totalMemos}
          unit="Memos"
          subtitle="All active orders"
          icon={<Layers className="w-4.5 h-4.5" />}
          variant="blue"
        />
        <StatCard
          title="Awaiting Machine"
          value={unassignedCount}
          unit="Pending"
          subtitle="Needs line allocation"
          icon={<Clock className="w-4.5 h-4.5" />}
          variant="amber"
        />
        <StatCard
          title="Active in Extrusion"
          value={releasedCount}
          unit="In Progress"
          subtitle="Lines 1–4 extruding"
          icon={<Cpu className="w-4.5 h-4.5" />}
          variant="indigo"
        />
        <StatCard
          title="Completed Batches"
          value={completedCount}
          unit="Completed"
          subtitle="Ready for packing/dispatch"
          icon={<CheckCircle className="w-4.5 h-4.5" />}
          variant="emerald"
        />
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-64">
          <Input
            placeholder="Search memo #, order #..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="w-48">
          <Select
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'PLANNED', label: 'Planned' },
              { value: 'MACHINE_ASSIGNED', label: 'Machine Assigned' },
              { value: 'RELEASED', label: 'Released to Floor' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'COMPLETED', label: 'Completed' },
            ]}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Memos Table */}
      <Table
        columns={columns}
        data={memos}
        keyExtractor={(row) => row.id}
        isLoading={isLoading}
        pagination={
          data?.pagination
            ? {
                page: data.pagination.page,
                pageSize: data.pagination.page_size,
                total: data.pagination.total,
                totalPages: data.pagination.total_pages,
                onPageChange: setPage,
              }
            : undefined
        }
      />

      {/* Modal: Manual Machine Selection */}
      <Modal
        isOpen={!!selectedMemoForAssign}
        onClose={() => setSelectedMemoForAssign(null)}
        title="Manual Machine Selection (Phase 1)"
        subtitle={`Assign Extrusion Line for Production Memo ${selectedMemoForAssign?.memo_number}`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (selectedMemoForAssign) {
              assignMachineMutation.mutate(selectedMemoForAssign.id);
            }
          }}
          className="space-y-4"
        >
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
            <p>
              <span className="text-slate-500 dark:text-slate-400 font-medium">Target Output:</span>{' '}
              <span className="font-num font-bold text-slate-900 dark:text-white">{selectedMemoForAssign?.planned_quantity} Sheets</span>
            </p>
            <p>
              <span className="text-slate-500 dark:text-slate-400 font-medium">Specification:</span>{' '}
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {selectedMemoForAssign?.sales_order_item?.thickness?.display_label}
              </span>{' '}
              &bull;{' '}
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {selectedMemoForAssign?.sales_order_item?.density?.display_label}
              </span>
            </p>
          </div>

          <Select
            label="Select Extrusion Line *"
            options={availableMachines.map((m) => ({
              value: m.id,
              label: `${m.line_name} - ${m.machine_name} (${m.status} • ${m.rated_capacity_hourly} sht/hr)`,
            }))}
            value={selectedMachineId}
            onChange={(e) => setSelectedMachineId(e.target.value)}
            placeholder={availableMachines.length === 0 ? "No operational machines available" : "Choose extrusion machine"}
            required
            disabled={availableMachines.length === 0}
          />
          {availableMachines.length === 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              ⚠️ All extrusion machines are currently under maintenance or offline. Please restore a machine status before assigning.
            </p>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setSelectedMemoForAssign(null)}>
              Cancel
            </Button>
            <Button variant="brand" type="submit" isLoading={assignMachineMutation.isPending} disabled={availableMachines.length === 0 || !selectedMachineId}>
              Confirm Line Allocation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

