import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  Flame,
  Layers,
  ArrowRight,
  ShieldCheck,
  Plus,
  RefreshCw,
  Cpu,
  Clock,
  StopCircle,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { Button } from '../components/common/Button';
import { Card, CardHeader } from '../components/common/Card';
import { StatusBadge } from '../components/common/StatusBadge';

export const ProductionExecutionPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedMemoId, setSelectedMemoId] = useState<string>('');
  const [activeRunId, setActiveRunId] = useState<string>('');
  const [goodOutputToAdd, setGoodOutputToAdd] = useState<number>(10);
  const [scrapToAdd, setScrapToAdd] = useState<number>(1.5);
  const [rejectReason, setRejectReason] = useState<string>('SURFACE_DEFECT');
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Queries
  const { data: memosData, isLoading: isMemosLoading } = useQuery({
    queryKey: ['production_memos_execution'],
    queryFn: () => apiClient.getProductionMemos({ page_size: 50 }),
    placeholderData: (prev) => prev,
    staleTime: 10000,
  });

  const { data: runsData } = useQuery({
    queryKey: ['production_runs_execution'],
    queryFn: () => apiClient.getProductionRuns({ page_size: 20 }),
    refetchInterval: false,
    placeholderData: (prev) => prev,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const memos = (Array.isArray(memosData?.data) ? memosData.data : (memosData?.data as any)?.items) || [];
  const runs = (Array.isArray(runsData?.data) ? runsData.data : (runsData?.data as any)?.items) || [];

  // Selected memo object
  const currentMemo = memos.find((m: any) => m.id === selectedMemoId) || memos[0];
  const activeRun = runs.find((r: any) => r.production_memo_id === currentMemo?.id || r.memo_id === currentMemo?.id) || runs[0];

  // Set default selected memo on load
  React.useEffect(() => {
    if (!selectedMemoId && memos.length > 0) {
      setSelectedMemoId(memos[0].id);
    }
  }, [memos.length, selectedMemoId]);

  // Release Memo Mutation
  const releaseMutation = useMutation({
    mutationFn: async (memoId: string) => {
      return await apiClient.releaseProductionMemo(memoId);
    },
    onSuccess: () => {
      setStatusMessage({ text: 'Work Order successfully Released to Factory Floor!' });
      queryClient.invalidateQueries({ queryKey: ['production_memos_execution'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err?.response?.data?.error?.message || err?.message || 'Failed to release memo.';
      setStatusMessage({ text: typeof msg === 'string' ? msg : JSON.stringify(msg), isError: true });
    },
  });

  // Start Run Mutation
  const startRunMutation = useMutation({
    mutationFn: async (memo: any) => {
      if (!memo?.id) {
        throw new Error('No production memo selected.');
      }
      if (['DRAFT', 'APPROVED', 'PLANNED', 'MACHINE_ASSIGNED'].includes(memo.status)) {
        try {
          await apiClient.releaseProductionMemo(memo.id);
        } catch (relErr) {
          console.warn('Auto-release notice:', relErr);
        }
      }
      return await apiClient.startProductionRun({
        production_memo_id: memo.id,
        machine_id: memo.target_machine_id || memo.machine_id || undefined,
        shift: 'Shift A (08:00 - 16:00)',
        planned_quantity: Number(memo.planned_quantity || memo.target_quantity || 100),
      });
    },
    onSuccess: (res) => {
      if (res?.data?.id) {
        setActiveRunId(res.data.id);
      }
      setStatusMessage({ text: 'Extrusion Line Started Successfully! Shift logging active.' });
      queryClient.invalidateQueries({ queryKey: ['production_runs_execution'] });
      queryClient.invalidateQueries({ queryKey: ['production_memos_execution'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: (err: any) => {
      console.error('Start extrusion error:', err);
      let msg = 'Failed to start extrusion run.';
      if (err?.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          msg = err.response.data.detail.map((d: any) => `${d.loc?.slice(-1)[0] || 'Field'}: ${d.msg}`).join(' | ');
        } else {
          msg = err.response.data.detail;
        }
      } else if (err?.response?.data?.error?.message) {
        msg = err.response.data.error.message;
      } else if (err?.message) {
        msg = err.message;
      }
      setStatusMessage({ text: msg, isError: true });
    },
  });

  // Pause Run Mutation
  const pauseRunMutation = useMutation({
    mutationFn: async (runId: string) => {
      return await apiClient.pauseProductionRun(runId, {
        rejection_reason: 'OPERATOR_PAUSE',
        remarks: 'Operator paused extrusion line',
      });
    },
    onSuccess: () => {
      setStatusMessage({ text: 'Extrusion Line Paused.' });
      queryClient.invalidateQueries({ queryKey: ['production_runs_execution'] });
      queryClient.invalidateQueries({ queryKey: ['production_memos_execution'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: (err: any) => {
      setStatusMessage({ text: err?.response?.data?.detail || 'Failed to pause run.', isError: true });
    },
  });

  // Resume Run Mutation
  const resumeRunMutation = useMutation({
    mutationFn: async (runId: string) => {
      return await apiClient.resumeProductionRun(runId);
    },
    onSuccess: () => {
      setStatusMessage({ text: 'Extrusion Line Resumed.' });
      queryClient.invalidateQueries({ queryKey: ['production_runs_execution'] });
      queryClient.invalidateQueries({ queryKey: ['production_memos_execution'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: (err: any) => {
      setStatusMessage({ text: err?.response?.data?.detail || 'Failed to resume run.', isError: true });
    },
  });

  // Complete Run Mutation
  const completeRunMutation = useMutation({
    mutationFn: async (run: any) => {
      return await apiClient.completeProductionRun(run.id, {
        good_quantity: Number(run.good_quantity || 0),
        rejected_quantity: Number(run.rejected_quantity || 0),
        waste_kg: Number(run.waste_kg || 0),
        remarks: 'Extrusion batch completed by operator',
      });
    },
    onSuccess: () => {
      setStatusMessage({ text: 'Extrusion Batch Run Completed and Recorded!' });
      queryClient.invalidateQueries({ queryKey: ['production_runs_execution'] });
      queryClient.invalidateQueries({ queryKey: ['production_memos_execution'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: (err: any) => {
      setStatusMessage({ text: err?.response?.data?.detail || 'Failed to complete run.', isError: true });
    },
  });

  // Log Output Mutation
  const logOutputMutation = useMutation({
    mutationFn: async (params: { runId: string; goodQty: number; scrapKg: number; reason?: string }) => {
      if (!params.runId) {
        throw new Error('No active production run found. Please click START EXTRUSION first.');
      }
      return await apiClient.logProductionOutput(params.runId, {
        good_quantity: params.goodQty,
        rejected_quantity: 0,
        scrap_weight_kg: params.scrapKg,
        defect_reason: params.reason || undefined,
      });
    },
    onSuccess: () => {
      setStatusMessage({ text: `Logged +${goodOutputToAdd} Good Sheets and +${scrapToAdd} kg scrap!` });
      queryClient.invalidateQueries({ queryKey: ['production_runs_execution'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Failed to log output.';
      setStatusMessage({ text: typeof msg === 'string' ? msg : JSON.stringify(msg), isError: true });
    },
  });

  const isRunning = activeRun?.status === 'IN_PROGRESS';
  const isPaused = activeRun?.status === 'PAUSED';
  const targetQuantity = currentMemo?.planned_quantity || currentMemo?.target_quantity || 100;
  const goodOutput = Number(activeRun?.good_quantity || 0);
  const scrapWeight = Number(activeRun?.waste_kg || activeRun?.scrap_weight_kg || 0);
  const progressPct = Math.min(100, Math.round((goodOutput / targetQuantity) * 100));

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Shop Floor Operator Terminal
            </h1>
            <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-num text-xs font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {currentMemo?.target_machine?.line_name || currentMemo?.machine?.line_name || activeRun?.machine?.line_name || 'Extrusion Floor'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Touchscreen production console for sheet extrusion, tolerance checks, and scrap logging.
          </p>
        </div>

        {/* Action Release to Floor Button */}
        {currentMemo && ['DRAFT', 'APPROVED', 'PLANNED', 'MACHINE_ASSIGNED'].includes(currentMemo.status) && (
          <Button
            variant="brand"
            size="md"
            isLoading={releaseMutation.isPending}
            onClick={() => releaseMutation.mutate(currentMemo.id)}
            leftIcon={<Play className="w-4 h-4" />}
          >
            Release to Floor
          </Button>
        )}
        {currentMemo && currentMemo.status === 'RELEASED' && (
          <span className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-num text-xs font-bold flex items-center gap-2 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Released to Floor (Ready to Start)
          </span>
        )}
        {currentMemo && currentMemo.status === 'COMPLETED' && (
          <span className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-num text-xs font-bold flex items-center gap-2 shadow-2xs">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Batch Completed &amp; Packaged
          </span>
        )}
      </div>

      {/* Alert Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold shadow-2xs ${
            statusMessage.isError
              ? 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              : 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-500 hover:text-slate-900 dark:hover:text-white p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Job Selector & Live Work Order Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Job Selector (Horizontal strip on mobile, 4-col card on desktop) */}
        <div className="lg:col-span-4 space-y-4">
          <Card padding="md">
            <CardHeader
              title="Work Order Queue"
              subtitle="Select production memo to execute"
              icon={<Layers className="w-4 h-4" />}
            />

            {/* Mobile Horizontal Work Order Chips */}
            <div className="flex lg:hidden overflow-x-auto gap-2.5 pt-3 pb-1 no-scrollbar -mx-1 px-1">
              {isMemosLoading ? (
                <div className="p-3 text-center text-xs text-slate-400 font-medium">Loading work orders...</div>
              ) : memos.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400 font-medium">No work orders queued.</div>
              ) : (
                memos.map((memo: any) => {
                  const isSelected = (currentMemo?.id || '') === memo.id;
                  return (
                    <button
                      key={memo.id}
                      type="button"
                      onClick={() => {
                        setSelectedMemoId(memo.id);
                        setStatusMessage(null);
                      }}
                      className={`shrink-0 p-3 rounded-2xl border text-left transition-all min-w-[200px] touch-manipulation ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-500 shadow-glow-brand/20 ring-2 ring-blue-500/20'
                          : 'bg-white dark:bg-slate-850/80 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <span className="font-num font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {memo.memo_number || 'PM-' + memo.id.slice(0, 8)}
                        </span>
                        <StatusBadge status={memo.status} size="sm" />
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex justify-between">
                        <span>{memo.planned_quantity || memo.target_quantity || 0} Sheets</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {memo.target_machine?.line_name || memo.machine?.line_name || 'Line 1'}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Desktop Vertical List */}
            <div className="hidden lg:block space-y-2.5 mt-4 max-h-[460px] overflow-y-auto pr-1">
              {isMemosLoading ? (
                <div className="p-6 text-center text-xs text-slate-400 font-medium">Loading work orders...</div>
              ) : memos.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 font-medium">No work orders queued.</div>
              ) : (
                memos.map((memo: any) => {
                  const isSelected = (currentMemo?.id || '') === memo.id;
                  return (
                    <div
                      key={memo.id}
                      onClick={() => {
                        setSelectedMemoId(memo.id);
                        setStatusMessage(null);
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 dark:border-blue-600 shadow-glow-brand/20'
                          : 'bg-white dark:bg-slate-850/80 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-num font-bold text-xs text-slate-900 dark:text-slate-100">
                          {memo.memo_number || 'PM-' + memo.id.slice(0, 8)}
                        </span>
                        <StatusBadge status={memo.status} size="sm" />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                        <span>Target: {memo.planned_quantity || memo.target_quantity || 0} Sheets</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {memo.target_machine?.line_name || memo.machine?.line_name || 'Unassigned'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Right: Touch Operator Big Display (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <Card padding="lg">
            {/* Top Job Details */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-num font-bold px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    {currentMemo?.memo_number || (currentMemo ? 'PM-' + currentMemo.id.slice(0, 8) : 'No Memo Selected')}
                  </span>
                  <StatusBadge status={currentMemo?.status || 'RELEASED'} size="md" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">
                  {currentMemo?.sales_order_item?.product?.product_name || currentMemo?.sales_order_item?.product?.name || (currentMemo ? 'PVC/WPC Extrusion Board' : 'Select a Work Order')}
                  {(currentMemo?.sales_order_item?.thickness?.display_label || currentMemo?.sales_order_item?.density?.display_label) && (
                    <span className="text-blue-600 dark:text-blue-400 font-normal">
                      {' '}• {[currentMemo?.sales_order_item?.thickness?.display_label, currentMemo?.sales_order_item?.density?.display_label].filter(Boolean).join(' • ')}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  {currentMemo?.sales_order?.party?.party_name ? (
                    <>Customer: <strong className="text-slate-800 dark:text-slate-200">{currentMemo.sales_order.party.party_name}</strong> (SO #{currentMemo.sales_order.order_number})</>
                  ) : currentMemo?.sales_order?.order_number ? (
                    <>Linked Sales Order: <strong className="text-slate-800 dark:text-slate-200">{currentMemo.sales_order.order_number}</strong></>
                  ) : (
                    <>Line Allocation: <strong className="text-slate-800 dark:text-slate-200">{currentMemo?.target_machine?.line_name || 'Standard Extrusion'}</strong></>
                  )}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 flex-wrap">
                {!isRunning && !isPaused ? (
                  <Button
                    variant="success"
                    size="lg"
                    isLoading={startRunMutation.isPending}
                    onClick={() => startRunMutation.mutate(currentMemo)}
                    leftIcon={<Play className="w-5 h-5 fill-white" />}
                    className="px-8 shadow-md hover:shadow-glow-emerald"
                  >
                    START EXTRUSION
                  </Button>
                ) : isPaused ? (
                  <Button
                    variant="success"
                    size="lg"
                    isLoading={resumeRunMutation.isPending}
                    onClick={() => activeRun && resumeRunMutation.mutate(activeRun.id)}
                    leftIcon={<Play className="w-5 h-5 fill-white" />}
                    className="px-8 shadow-md hover:shadow-glow-emerald"
                  >
                    RESUME RUN
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="danger"
                      size="md"
                      isLoading={pauseRunMutation.isPending}
                      onClick={() => activeRun && pauseRunMutation.mutate(activeRun.id)}
                      leftIcon={<Pause className="w-4 h-4 fill-white" />}
                    >
                      PAUSE RUN
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      isLoading={completeRunMutation.isPending}
                      onClick={() => activeRun && completeRunMutation.mutate(activeRun)}
                      leftIcon={<StopCircle className="w-4 h-4" />}
                    >
                      COMPLETE BATCH
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Big 3 Digits Display: Target, Good Output, Purge Scrap */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 py-4 sm:py-6">
              <div className="p-3 sm:p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-center space-y-0.5 sm:space-y-1 shadow-2xs">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 block truncate">
                  Target
                </span>
                <span className="text-2xl sm:text-5xl font-extrabold font-num text-slate-900 dark:text-white block">
                  {targetQuantity}
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-500 font-bold uppercase">
                  Sheets
                </span>
              </div>

              <div className="p-3 sm:p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-center space-y-0.5 sm:space-y-1 shadow-2xs">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block truncate">
                  Good Prime
                </span>
                <span className="text-2xl sm:text-5xl font-extrabold font-num text-emerald-600 dark:text-emerald-400 block">
                  {goodOutput}
                </span>
                <span className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                  {progressPct}%
                </span>
              </div>

              <div className="p-3 sm:p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-center space-y-0.5 sm:space-y-1 shadow-2xs">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 block truncate">
                  Scrap
                </span>
                <span className="text-2xl sm:text-5xl font-extrabold font-num text-amber-600 dark:text-amber-400 block">
                  {scrapWeight}
                </span>
                <span className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 font-bold uppercase">
                  Kg Recyclable
                </span>
              </div>
            </div>

            {/* Real-time Progress Bar */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span>Shift Production Completion</span>
                <span className="font-num">{goodOutput} / {targetQuantity} Sheets ({progressPct}%)</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300 shadow-glow-emerald"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Quick Touch Output Logger */}
            <div className="mt-6 p-5 rounded-2xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Quick-Log Extrusion Output &amp; Scrap</span>
                </div>
                <span className="text-[11px] text-slate-500 font-semibold">Touchscreen Quick Keys</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    + Good Prime Sheets
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[10, 25, 50].map((qty) => (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => setGoodOutputToAdd(qty)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                          goodOutputToAdd === qty
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        +{qty}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    + Purge Scrap (Kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={scrapToAdd}
                    onChange={(e) => setScrapToAdd(Number(e.target.value))}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold font-num text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    variant="brand"
                    size="md"
                    className="w-full h-10 font-bold"
                    isLoading={logOutputMutation.isPending}
                    onClick={() =>
                      logOutputMutation.mutate({
                        runId: activeRun?.id,
                        goodQty: goodOutputToAdd,
                        scrapKg: scrapToAdd,
                        reason: rejectReason,
                      })
                    }
                  >
                    Log Output Now
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

