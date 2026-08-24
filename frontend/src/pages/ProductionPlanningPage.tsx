import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Card } from '../components/common/Card';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatCard } from '../components/common/StatCard';
import {
  Calendar,
  PlayCircle,
  ArrowLeft,
  Clock,
  Zap,
  Activity,
  Layers,
  CheckCircle2,
  Cpu,
} from 'lucide-react';

export const ProductionPlanningPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedShift, setSelectedShift] = useState('Shift A (08:00 - 16:00)');

  const { data: machinesData, isLoading: isMachinesLoading } = useQuery({
    queryKey: ['machines_all'],
    queryFn: () => apiClient.getAllMachines(),
  });

  const { data: memosData, isLoading: isMemosLoading } = useQuery({
    queryKey: ['production_memos_planned'],
    queryFn: () => apiClient.getProductionMemos({ page_size: 100 }),
  });

  const releaseMutation = useMutation({
    mutationFn: (memoId: string) => apiClient.releaseProductionMemo(memoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production_memos_planned'] });
      queryClient.invalidateQueries({ queryKey: ['production_memos_execution'] });
      queryClient.invalidateQueries({ queryKey: ['production_memos_released'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  if (isMachinesLoading || isMemosLoading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner text="Building plant machine planning board..." size="lg" />
      </div>
    );
  }

  const machines = machinesData?.data || [];
  const memos = memosData?.data || [];

  const totalPlannedSheets = memos.reduce((acc, curr) => acc + Number(curr.planned_quantity || 0), 0);
  const releasedCount = memos.filter((m) => m.status === 'RELEASED' || m.status === 'IN_PROGRESS').length;
  const pendingReleaseCount = memos.filter((m) => m.status !== 'RELEASED' && m.status !== 'IN_PROGRESS' && m.status !== 'COMPLETED').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/production-memos')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Memos
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Extrusion Lines Planning Board
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Visual Gantt schedule, manual line assignment, and rated speed sequencing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs cursor-pointer"
          >
            <option value="Shift A (08:00 - 16:00)">Shift A (08:00 - 16:00)</option>
            <option value="Shift B (16:00 - 00:00)">Shift B (16:00 - 00:00)</option>
            <option value="Shift C (00:00 - 08:00)">Shift C (Night Shift)</option>
          </select>
          <Button
            variant="brand"
            size="sm"
            onClick={() => navigate('/production/execution')}
            leftIcon={<PlayCircle className="w-4 h-4" />}
          >
            Floor Terminal
          </Button>
        </div>
      </div>

      {/* Planning Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Scheduled Output"
          value={totalPlannedSheets.toLocaleString()}
          unit="Sheets"
          subtitle="Across active shift"
          icon={<Layers className="w-4.5 h-4.5" />}
          variant="blue"
        />
        <StatCard
          title="Active on Floor"
          value={releasedCount}
          unit="Work Memos"
          subtitle="Running in extrusion"
          icon={<Activity className="w-4.5 h-4.5" />}
          variant="emerald"
        />
        <StatCard
          title="Pending Floor Release"
          value={pendingReleaseCount}
          unit="Memos"
          subtitle="Ready to dispatch"
          icon={<Zap className="w-4.5 h-4.5" />}
          variant="amber"
        />
      </div>

      {/* Timeline Schedule Board */}
      <div className="space-y-5">
        {machines.map((machine) => {
          const machineMemos = memos.filter((m) => m.target_machine_id === machine.id);
          const totalPlannedQty = machineMemos.reduce(
            (acc, curr) => acc + Number(curr.planned_quantity),
            0
          );
          const hourlyCapacity = Number(machine.rated_capacity_hourly || 25);
          const estimatedHours =
            hourlyCapacity > 0 ? (totalPlannedQty / hourlyCapacity).toFixed(1) : '0';

          return (
            <Card
              key={machine.id}
              title={
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {machine.line_name}
                  </span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    ({machine.machine_name})
                  </span>
                </div>
              }
              subtitle={`Rated Speed: ${hourlyCapacity} Sheets/Hr • Plant 1 Extrusion Bay`}
              action={
                <div className="flex items-center gap-3">
                  <span className="text-xs font-num font-bold px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                    Load: {totalPlannedQty} Shts (~{estimatedHours} Hrs)
                  </span>
                  <StatusBadge status={machine.status} size="sm" />
                </div>
              }
            >
              {machineMemos.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-850/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 font-medium">
                  No active work orders allocated to {machine.line_name}. Line ready for next batch assignment.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {machineMemos.map((memo) => (
                    <div
                      key={memo.id}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 space-y-3 hover:border-blue-400 dark:hover:border-blue-600 transition-all shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                          {memo.memo_number}
                        </span>
                        <StatusBadge status={memo.status} size="sm" />
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {memo.sales_order?.party?.party_name || 'Customer Order'}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          SO Ref: {memo.sales_order?.order_number || 'N/A'}
                        </p>
                      </div>

                      <div className="flex justify-between items-center text-xs pt-3 border-t border-slate-200/80 dark:border-slate-700">
                        <span className="font-num font-bold text-slate-900 dark:text-white">
                          {memo.planned_quantity} Sheets
                        </span>
                        {memo.status !== 'RELEASED' && memo.status !== 'IN_PROGRESS' && memo.status !== 'COMPLETED' && (
                          <Button
                            variant="brand"
                            size="xs"
                            isLoading={releaseMutation.isPending}
                            onClick={() => releaseMutation.mutate(memo.id)}
                            leftIcon={<Zap className="w-3 h-3" />}
                          >
                            Release to Floor
                          </Button>
                        )}
                        {(memo.status === 'RELEASED' || memo.status === 'IN_PROGRESS') && (
                          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            ● Floor Active
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

