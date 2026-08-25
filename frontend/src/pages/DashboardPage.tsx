import React, { useState } from 'react';
import clsx from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Cpu,
  Package,
  Truck,
  TrendingUp,
  Activity,
  Layers,
  ArrowRight,
  Zap,
  CheckCircle2,
  Clock,
  Boxes,
  Users,
  AlertCircle,
  BarChart3,
  RefreshCw,
  Gauge,
  ShieldCheck,
  Send,
  Sliders,
  FileSpreadsheet,
  Camera,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { OrderPipeline } from '../components/common/OrderPipeline';
import { FactoryMachineCard } from '../components/common/FactoryMachineCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const DashboardPage: React.FC = () => {
  const { user, hasPermission, hasRole } = useAuth();
  const navigate = useNavigate();
  const [selectedPipelineStage, setSelectedPipelineStage] = useState<string>('ALL');

  // Fetch live summary from backend API (Real Database Query on page load or manual refresh)
  const { data: summaryData, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => apiClient.getDashboardSummary(),
    placeholderData: (previousData) => previousData,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  const rawData = summaryData?.data;
  const kpis = rawData?.kpis || {
    total_orders: 0,
    open_orders: 0,
    pending_production_memos: 0,
    in_progress_runs: 0,
    pending_packing: 0,
    ready_for_dispatch: 0,
    dispatched_count: 0,
    delayed_orders: 0,
    today_produced_quantity: 0,
    today_waste_kg: 0,
  };

  const lineStatus = rawData?.line_status || [];
  const pipelineStagesFromDb = rawData?.pipeline_stages || [];
  const demandByParty = rawData?.demand_by_party || [];
  const demandByThickness = rawData?.demand_by_thickness || [];
  const demandByDensity = rawData?.demand_by_density || [];

  // Compute total ordered quantity across parties for percentage calculations
  const totalPartyVolume = demandByParty.reduce(
    (acc: number, curr: any) => acc + Number(curr.total_ordered_quantity || 0),
    0
  );

  const totalThicknessVolume = demandByThickness.reduce(
    (acc: number, curr: any) => acc + Number(curr.total_ordered_quantity || 0),
    0
  );

  const totalDensityVolume = demandByDensity.reduce(
    (acc: number, curr: any) => acc + Number(curr.total_ordered_quantity || 0),
    0
  );

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Map real pipeline stages
  const pipelineStages = pipelineStagesFromDb.length > 0
    ? pipelineStagesFromDb.map((st: any) => ({
        id: st.id,
        label: st.label,
        count: st.count,
        description: st.description,
        icon:
          st.id === 'NEW'
            ? ShoppingCart
            : st.id === 'SUBMITTED'
            ? Clock
            : st.id === 'APPROVED'
            ? CheckCircle2
            : st.id === 'IN_PRODUCTION'
            ? Cpu
            : st.id === 'PACKING'
            ? Package
            : st.id === 'READY_FOR_DISPATCH'
            ? Truck
            : Send,
        color: (st.color || 'blue') as any,
      }))
    : [
        { id: 'NEW', label: 'New Drafts', count: 0, description: 'Commercial entry', icon: ShoppingCart, color: 'blue' as const },
        { id: 'SUBMITTED', label: 'Submitted', count: 0, description: 'Spec check', icon: Clock, color: 'amber' as const },
        { id: 'APPROVED', label: 'Approved', count: 0, description: 'Ready for floor', icon: CheckCircle2, color: 'green' as const },
        { id: 'IN_PRODUCTION', label: 'In Production', count: Number(kpis.in_progress_runs || 0), description: 'Extrusion active', icon: Cpu, color: 'orange' as const },
        { id: 'PACKING', label: 'Packaging Queue', count: Number(kpis.pending_packing || 0), description: 'Bundling & wrapping', icon: Package, color: 'cyan' as const },
        { id: 'READY_FOR_DISPATCH', label: 'Ready for Dispatch', count: Number(kpis.ready_for_dispatch || 0), description: 'Staged in dock', icon: Truck, color: 'sky' as const },
        { id: 'DISPATCHED', label: 'Gate Clearance', count: Number(kpis.dispatched_count || 0), description: 'Gate pass verified', icon: Send, color: 'emerald' as const },
      ];

  const runningLinesCount = lineStatus.filter((l: any) => l.status === 'RUNNING' || l.status === 'IN_PROGRESS').length;
  const totalLinesCount = lineStatus.length || 4;

  // Only show full loading spinner on initial page load / refresh before data exists
  if (isLoading && !rawData) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner text="Retrieving Live Plant Intelligence from database..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. GREETING & INDUSTRIAL CONTEXT HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              Good morning, {user?.full_name?.split(' ')[0] || 'Team'} 👋
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold font-mono">
              <span className={clsx('w-1.5 h-1.5 rounded-full', isRefetching ? 'bg-amber-500 animate-ping' : 'bg-emerald-500')} />
              {isRefetching ? 'SYNCING DB...' : 'LIVE DB SYNC'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            {currentDate} • Real-time operational database telemetry across extrusion, bundling, and dispatches.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            isLoading={isRefetching}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Sync DB
          </Button>

          {hasPermission('sales_orders:create') && (
            <Button
              variant="brand"
              size="sm"
              onClick={() => navigate('/sales-orders/new')}
              leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
            >
              + Create Sales Order
            </Button>
          )}
        </div>
      </div>

      {/* 2. SEMANTIC MULTI-COLORED KPI CARDS GRID (2x3 on mobile, 6-col on xl) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3.5">
        {/* Blue: Active Sales Orders */}
        <StatCard
          title="Open Orders"
          value={kpis.open_orders}
          unit="Orders"
          variant="blue"
          icon={<ShoppingCart className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
          subtitle={`${kpis.total_orders} total booked`}
          onClick={() => navigate('/sales-orders')}
        />

        {/* Orange: In Production Runs */}
        <StatCard
          title="In Production"
          value={kpis.in_progress_runs}
          unit="Runs"
          variant="orange"
          icon={<Cpu className="w-4 h-4 text-orange-600 dark:text-orange-400" />}
          subtitle={`${kpis.pending_production_memos} memos pending`}
          onClick={() => navigate('/production/execution')}
        />

        {/* Green: Daily Output Volume */}
        <StatCard
          title="Produced Today"
          value={Number(kpis.today_produced_quantity || 0).toLocaleString()}
          unit="Sheets"
          variant="green"
          icon={<Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
          subtitle={`${Number(kpis.today_waste_kg || 0)} kg scrap logged`}
          onClick={() => navigate('/production/execution')}
        />

        {/* Amber / Yellow: Packaging Queue */}
        <StatCard
          title="Ready to Pack"
          value={kpis.pending_packing}
          unit="Items"
          variant="amber"
          icon={<Package className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
          subtitle="Packaging queue"
          onClick={() => navigate('/packing')}
        />

        {/* Cyan: Dispatch Bay */}
        <StatCard
          title="Ready for Gate"
          value={kpis.ready_for_dispatch}
          unit="Items"
          variant="cyan"
          icon={<Truck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />}
          subtitle={`${kpis.dispatched_count} gate cleared`}
          onClick={() => navigate('/dispatch')}
        />

        {/* Purple / Violet: Machine Efficiency */}
        <StatCard
          title="Extrusion Lines"
          value={`${runningLinesCount}/${totalLinesCount}`}
          unit="Active"
          variant="purple"
          icon={<Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
          subtitle="Real-time status"
          onClick={() => navigate('/machines')}
        />
      </div>

      {/* AI Camera Order Scanner Quick Action Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-slate-900/90 p-5 text-white border border-purple-500/30 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shadow-inner">
            <Camera className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white">
                AI Mobile Camera Order Scanner
              </h3>
              <span className="px-2 py-0.5 rounded-full text-3xs font-extrabold bg-purple-400/20 text-purple-300 border border-purple-400/30">
                GEMINI VISION OCR
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Take photos of handwritten order chits or physical purchase orders for instant OCR extraction & 1-click order creation.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/ai-scanner')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white text-xs font-bold shadow-md shadow-purple-500/30 transition-all hover:scale-102 shrink-0 self-stretch sm:self-auto justify-center"
        >
          <Sparkles className="w-4 h-4" />
          <span>Launch AI Scanner</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3. VISUAL ORDER PIPELINE TRACKER (REAL DATA) */}
      <Card variant="primary" padding="sm" className="rounded-2xl border-slate-200/80 dark:border-slate-800">
        <CardHeader
          title="Manufacturing & Commercial Order Pipeline"
          subtitle="Real database order counts across commercial booking, floor execution, bundling, and dispatches."
          icon={<Sliders className="w-4.5 h-4.5" />}
          action={
            <Button
              variant="outline"
              size="xs"
              onClick={() => navigate('/sales-orders')}
              rightIcon={<ArrowRight className="w-3 h-3" />}
            >
              View All Orders
            </Button>
          }
        />
        <OrderPipeline
          stages={pipelineStages}
          activeStage={selectedPipelineStage}
          onStageSelect={(id) => {
            setSelectedPipelineStage(id);
            navigate('/sales-orders');
          }}
        />
      </Card>

      {/* 4. LIVE FACTORY FLOOR & EXTRUSION LINES (REAL DATABASE MACHINES & RUNS) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2">
              <span>Live Factory Floor Machinery</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Extrusion line telemetry and shift output counters queried directly from registered machines.
            </p>
          </div>

          <Button
            variant="outline"
            size="xs"
            onClick={() => navigate('/machines')}
            rightIcon={<ArrowRight className="w-3 h-3" />}
          >
            Machine Master
          </Button>
        </div>

        {lineStatus.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
            No machine lines registered in database.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-3">
            {lineStatus.map((line: any) => (
              <FactoryMachineCard
                key={line.line_id}
                lineId={line.machine_code || line.line_id}
                name={line.name}
                type={line.machine_type || 'Extrusion Line'}
                status={line.status}
                orderNo={line.order_no}
                partyName={line.party_name}
                product={line.product}
                goodOutput={Number(line.good_output || 0)}
                target={Number(line.target || 0)}
                efficiency={line.efficiency}
                speed={line.speed}
                operator={line.operator}
                targetTime={line.targetTime}
                onViewDetails={() => navigate('/machines')}
                onExecute={() => navigate('/production/execution')}
              />
            ))}
          </div>
        )}
      </div>

      {/* 5. SPLIT SECTION: PLANT OPERATIONS & DEMAND ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Industrial Operations Insights */}
        <Card variant="primary" padding="sm" className="rounded-2xl flex flex-col justify-between border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/50 via-white to-white dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900">
          <div>
            <CardHeader
              title="Plant Operations Intelligence"
              subtitle="Real-time operational summary & shift status."
              icon={<Activity className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />}
              action={
                <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-[10px]">
                  LIVE DB
                </span>
              }
            />

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/50 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-indigo-900 dark:text-indigo-200 mb-0.5">
                  <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Floor Schedule Optimization</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium text-[11px]">
                  {kpis.pending_production_memos > 0 ? (
                    <>There are <strong className="text-slate-900 dark:text-slate-200">{kpis.pending_production_memos} pending memos</strong> ready for machine allocation on the floor planning board.</>
                  ) : (
                    <>All production memos are currently assigned and running on extrusion lines.</>
                  )}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-200 mb-0.5">
                  <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Dispatch Cargo Status</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium text-[11px]">
                  <strong className="text-slate-900 dark:text-slate-200">{kpis.ready_for_dispatch} line items</strong> are packed and ready for gate manifest clearance in the loading dock.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-200 mb-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Shift Yield Quality</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium text-[11px]">
                  Cumulative shift good output logged at <strong className="text-emerald-700 dark:text-emerald-300">{Number(kpis.today_produced_quantity || 0).toLocaleString()} prime sheets</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-indigo-100 dark:border-indigo-900/40">
            <Button
              variant="brand"
              size="xs"
              className="w-full"
              onClick={() => navigate('/reports')}
              rightIcon={<ArrowRight className="w-3 h-3" />}
            >
              Explore Operations Analytics
            </Button>
          </div>
        </Card>

        {/* Center & Right: Multi-Dimensional Demand Intelligence (REAL DATA) */}
        <Card variant="primary" padding="sm" className="lg:col-span-2 rounded-2xl">
          <CardHeader
            title="Demand Intelligence"
            subtitle="Customer volume, gauge thickness, and material density breakdown from real sales orders."
            icon={<BarChart3 className="w-4.5 h-4.5" />}
            action={
              <Button
                variant="outline"
                size="xs"
                onClick={() => navigate('/reports')}
                rightIcon={<ArrowRight className="w-3 h-3" />}
              >
                Detailed Analytics
              </Button>
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Top Parties by Order Volume */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Customer Demand (Sheets)</span>
                <span className="text-[10px] text-slate-400 font-normal">Real Orders</span>
              </h4>

              {demandByParty.length === 0 ? (
                <p className="text-xs text-slate-400 py-3">No party demand data recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {demandByParty.slice(0, 5).map((p: any, idx: number) => {
                    const ordered = Number(p.total_ordered_quantity || 0);
                    const sharePct = totalPartyVolume > 0 ? Math.round((ordered / totalPartyVolume) * 100) : 0;
                    return (
                      <div key={p.party_id || idx} className="space-y-0.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-800 dark:text-slate-200 truncate max-w-[170px] text-[11px]">
                            {p.party_name}
                          </span>
                          <span className="font-num font-bold text-slate-900 dark:text-slate-50 text-[11px]">
                            {ordered.toLocaleString()} Shts ({sharePct}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-600 transition-all duration-500"
                            style={{ width: `${sharePct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Thickness Gauge & Density Share */}
            <div className="space-y-4">
              {/* Thickness breakdown */}
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Thickness Gauge (mm)
                </h4>
                {demandByThickness.length === 0 ? (
                  <p className="text-xs text-slate-400 py-1.5">No thickness specifications queried.</p>
                ) : (
                  <div className="grid grid-cols-4 gap-1.5">
                    {demandByThickness.map((t: any, idx: number) => {
                      const ordered = Number(t.total_ordered_quantity || 0);
                      const pct = totalThicknessVolume > 0 ? Math.round((ordered / totalThicknessVolume) * 100) : 0;
                      return (
                        <div
                          key={t.thickness_id || idx}
                          className="p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 text-center"
                        >
                          <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                            {t.display_label}
                          </span>
                          <span className="block text-sm font-extrabold font-num text-slate-900 dark:text-slate-100 mt-0.5">
                            {pct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Density breakdown */}
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Density Grade (g/cm³)
                </h4>
                {demandByDensity.length === 0 ? (
                  <p className="text-xs text-slate-400 py-1.5">No density specifications queried.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5">
                    {demandByDensity.map((d: any, idx: number) => {
                      const ordered = Number(d.total_ordered_quantity || 0);
                      const pct = totalDensityVolume > 0 ? Math.round((ordered / totalDensityVolume) * 100) : 0;
                      return (
                        <div
                          key={d.density_id || idx}
                          className="p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 text-center"
                        >
                          <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                            {d.display_label}
                          </span>
                          <span className="block text-sm font-extrabold font-num text-blue-600 dark:text-blue-400 mt-0.5">
                            {pct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 6. QUICK WORKSPACE ACTION TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => navigate('/sales-orders')}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/80 via-blue-50/30 to-white dark:from-blue-950/30 dark:to-slate-900 border border-blue-200/80 dark:border-blue-900/60 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm shadow-blue-500/5 hover:shadow-md hover:shadow-blue-500/10 hover:-translate-y-0.5 transition-all text-left group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-500 text-white shadow-md shadow-blue-500/30 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">Sales Orders</span>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold font-num">{kpis.total_orders} in database</span>
        </button>

        <button
          onClick={() => navigate('/production/planning')}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-indigo-50/30 to-white dark:from-indigo-950/30 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-900/60 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-sm shadow-indigo-500/5 hover:shadow-md hover:shadow-indigo-500/10 hover:-translate-y-0.5 transition-all text-left group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white shadow-md shadow-indigo-500/30 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
            <Sliders className="w-4 h-4" />
          </div>
          <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">Planning Board</span>
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold font-num">{kpis.pending_production_memos} Memos</span>
        </button>

        <button
          onClick={() => navigate('/production/execution')}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-emerald-50/30 to-white dark:from-emerald-950/30 dark:to-slate-900 border border-emerald-200/80 dark:border-emerald-900/60 hover:border-emerald-400 dark:hover:border-emerald-500 shadow-sm shadow-emerald-500/5 hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-0.5 transition-all text-left group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/30 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
            <Cpu className="w-4 h-4" />
          </div>
          <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">Floor Terminal</span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-num">{kpis.in_progress_runs} Runs Active</span>
        </button>

        <button
          onClick={() => navigate('/packing')}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/80 via-amber-50/30 to-white dark:from-amber-950/30 dark:to-slate-900 border border-amber-200/80 dark:border-amber-900/60 hover:border-amber-400 dark:hover:border-amber-500 shadow-sm shadow-amber-500/5 hover:shadow-md hover:shadow-amber-500/10 hover:-translate-y-0.5 transition-all text-left group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/30 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
            <Package className="w-4 h-4" />
          </div>
          <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">Packaging Queue</span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold font-num">{kpis.pending_packing} Queued</span>
        </button>

        <button
          onClick={() => navigate('/dispatch')}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-50/80 via-sky-50/30 to-white dark:from-sky-950/30 dark:to-slate-900 border border-sky-200/80 dark:border-sky-900/60 hover:border-sky-400 dark:hover:border-sky-500 shadow-sm shadow-sky-500/5 hover:shadow-md hover:shadow-sky-500/10 hover:-translate-y-0.5 transition-all text-left group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-sky-500 text-white shadow-md shadow-sky-500/30 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
            <Truck className="w-4 h-4" />
          </div>
          <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">Gate Passes</span>
          <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold font-num">{kpis.dispatched_count} Dispatched</span>
        </button>

        <button
          onClick={() => navigate('/reports')}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-50/80 via-purple-50/30 to-white dark:from-purple-950/30 dark:to-slate-900 border border-purple-200/80 dark:border-purple-900/60 hover:border-purple-400 dark:hover:border-purple-500 shadow-sm shadow-purple-500/5 hover:shadow-md hover:shadow-purple-500/10 hover:-translate-y-0.5 transition-all text-left group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-500 text-white shadow-md shadow-purple-500/30 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
            <BarChart3 className="w-4 h-4" />
          </div>
          <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">Analytics & CSV</span>
          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">Export Reports</span>
        </button>
      </div>
    </div>
  );
};
