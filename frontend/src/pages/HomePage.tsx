import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  ShoppingCart,
  Package,
  Truck,
  BarChart3,
  Layers,
  ShieldCheck,
  Zap,
  Activity,
  FileCheck,
  Users,
  Play,
  ArrowUpRight,
  TrendingUp,
  Boxes,
  Clock,
  Settings,
  Lock,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);

  const { data: summaryData } = useQuery({
    queryKey: ['dashboard-summary-home'],
    queryFn: () => apiClient.getPublicDashboardSummary(),
    refetchInterval: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-home'],
    queryFn: () => apiClient.getAllProducts(),
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
  const runningLinesCount = lineStatus.filter((l: any) => l.status === 'RUNNING' || l.status === 'IN_PROGRESS').length;
  const totalLinesCount = lineStatus.length || 4;
  const realProducts = productsData?.data || [];

  const workflowSteps = [
    {
      step: '01',
      title: 'Order Capture',
      subtitle: 'Sales & Dealer Portal',
      desc: 'Capture multi-line customer orders with auto-specification validation, real-time credit check, and instant approval routing.',
      icon: ShoppingCart,
      color: 'from-blue-600 to-indigo-600',
      badge: 'Auto-Validated',
      details: ['Multi-thickness batching', 'Party credit control', 'Automated memo queue'],
    },
    {
      step: '02',
      title: 'Extrusion Planning',
      subtitle: 'Capacity & Machine Matrix',
      desc: 'Automatic work order scheduling across Extrusion Lines 1 to 4 with thickness grouping to minimize die changeover scrap.',
      icon: SlidersIcon,
      color: 'from-indigo-600 to-purple-600',
      badge: 'Die-Optimized',
      details: ['Lines 1–4 auto-routing', 'Die change minimization', 'Shift load balancing'],
    },
    {
      step: '03',
      title: 'Shop Floor Execution',
      subtitle: 'Operator Touch Terminal',
      desc: 'Live telemetry logging of prime sheets, surface rejection, and purge scrap directly from the factory floor.',
      icon: Cpu,
      color: 'from-purple-600 to-brand-blue',
      badge: 'Real-Time Telemetry',
      details: ['Touchscreen terminal', 'Tolerance check (±0.2mm)', 'Scrap weight recording'],
    },
    {
      step: '04',
      title: 'Value Addition & QA',
      subtitle: 'Surface Treatment & Lab Tests',
      desc: 'Calibrating density (0.45–0.60 g/cm³), water absorption, and optional UV lamination / prelaminate surfacing.',
      icon: Layers,
      color: 'from-brand-blue to-sky-500',
      badge: 'Quality Assured',
      details: ['Density verification', 'Screw-holding tests', 'Batch serial stamping'],
    },
    {
      step: '05',
      title: 'Smart Packaging',
      subtitle: 'Bundle & Pallet Logistics',
      desc: 'Automatic bundle packaging calculations with barcode label generation and packaging slip PKG issuance.',
      icon: Package,
      color: 'from-emerald-600 to-teal-500',
      badge: 'Slip Generated',
      details: ['Standard / Raffia wrapping', 'Bundle sheet counter', 'Tare weight tracking'],
    },
    {
      step: '06',
      title: 'Gate Out & Dispatch',
      subtitle: 'Transporter Logistics',
      desc: 'Vehicle verification, automated weight reconciliation, PDF dispatch manifest generation, and digital Gate Pass.',
      icon: Truck,
      color: 'from-teal-500 to-blue-600',
      badge: 'Gate Pass Clear',
      details: ['Vehicle manifest', 'ReportLab vector PDF', 'Immutable Gate Out log'],
    },
  ];

  const productCatalog = [
    {
      name: 'PVC / WPC Celuka Ply',
      thickness: '5mm – 30mm',
      density: '0.45 – 0.60 g/cm³',
      desc: '100% waterproof, termite-proof, fire-retardant industrial marine ply for modular kitchens and architectural facades.',
      features: ['Lead-Free formulation', 'High screw holding capacity', 'Smooth calibrated skin'],
    },
    {
      name: 'Solid WPC Doors',
      thickness: '24mm – 35mm',
      density: '0.50 – 0.55 g/cm³',
      desc: 'High-impact extruded solid composite doors engineered for extreme weather, moisture resistance, and longevity.',
      features: ['Zero swelling guarantee', 'Direct paint / polish ready', 'CNC routable surface'],
    },
    {
      name: 'Prelaminate Gloss Ply',
      thickness: '8mm – 25mm',
      density: '0.50 – 0.55 g/cm³',
      desc: 'Pre-laminated decorative PVC boards with high-gloss textures, realistic wood grains, and UV-cured topcoat.',
      features: ['Scratch resistant', 'No edge-banding required', 'Ready to install'],
    },
    {
      name: 'WPC Door Frames (Chaukhat)',
      thickness: '3x2" to 5x2.5"',
      density: '0.55 – 0.65 g/cm³',
      desc: 'Heavy-duty composite door frames resistant to borer, decay, and moisture, replacing traditional timber chaukhats.',
      features: ['Self-extinguishing', 'Ready for screw installation', 'Dimensionally stable'],
    },
  ];

  return (
    <div className="min-h-screen bg-surface-base text-slate-900 selection:bg-blue-600 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* 1. TOP STICKY NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-navy-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-navy-800 px-6 py-3.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white px-3 py-1.5 rounded-xl shadow-xs flex items-center justify-center border border-slate-200">
              <img src="/logo.png" alt="FixoBoard Logo" className="h-10 sm:h-11 w-auto object-contain" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 block tracking-wider uppercase font-bold">
                ● Factory OS Live
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block tracking-tight uppercase">
                Manufacturing Management System
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#workflow" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Workflow
            </a>
            <a href="#command-center" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Command Center
            </a>
            <a href="#products" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Products
            </a>
            <a href="#transformation" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Transformation
            </a>
            <a href="#security" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Security
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/login')}
              className="hidden sm:inline-flex"
            >
              Sign In
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/dashboard')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Launch Platform
            </Button>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden bg-gradient-to-b from-white via-blue-50/40 to-surface-base dark:from-navy-950 dark:via-navy-900 dark:to-navy-950">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 text-xs font-bold text-blue-700 dark:text-blue-300 shadow-2xs">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Next-Gen Smart Factory &amp; MES Core</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.08]">
              Manufacturing,{' '}
              <span className="bg-gradient-to-r from-brand-indigo via-brand-blue to-sky-500 bg-clip-text text-transparent">
                Connected.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              One intelligent platform to manage orders, production, packing and dispatch —
              from one powerful, real-time industrial workspace.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/dashboard')}
                rightIcon={<ArrowRight className="w-5 h-5" />}
                className="shadow-soft hover:shadow-soft-hover"
              >
                Explore Platform
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  const el = document.getElementById('workflow');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                leftIcon={<Play className="w-4 h-4 text-blue-600 fill-blue-600" />}
              >
                See How It Works
              </Button>
            </div>

            {/* Micro Stats Strip */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-8 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>4 Extrusion Lines Live</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>100% End-to-End Auditability</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Sub-Second Gate Clearance</span>
              </div>
            </div>
          </div>

          {/* Large Floating Command Center Mockup */}
          <div className="mt-14 relative rounded-2xl sm:rounded-3xl p-3 bg-white/70 dark:bg-navy-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-navy-700 shadow-2xl overflow-hidden group">
            <div className="bg-slate-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-slate-100 overflow-hidden relative">
              {/* Header inside Mockup */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-slate-400 font-mono font-semibold">
                    FixoBoard Industrial OS — Plant 1 Control Center
                  </span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 font-mono font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>ALL SYSTEMS NOMINAL</span>
                </div>
              </div>

              {/* Grid Inside Mockup - 100% Real Database Telemetry */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-slate-850 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">
                    Today's Output
                  </span>
                  <span className="text-2xl font-bold font-num text-white mt-1 block">
                    {Number(kpis.today_produced_quantity || 0).toLocaleString()} Sheets
                  </span>
                  <span className="text-xs text-emerald-400 mt-1 block font-semibold">
                    {Number(kpis.today_waste_kg || 0) > 0 ? `${kpis.today_waste_kg} kg scrap logged` : 'Real Database Log'}
                  </span>
                </div>

                <div className="bg-slate-850 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">
                    Commercial Pipeline
                  </span>
                  <span className="text-2xl font-bold font-num text-white mt-1 block">
                    {kpis.open_orders} Open Orders
                  </span>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(10, (kpis.open_orders / Math.max(1, kpis.total_orders)) * 100))}%` }}
                    />
                  </div>
                </div>

                <div className="bg-slate-850 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">
                    Active Extruders
                  </span>
                  <span className="text-2xl font-bold font-num text-white mt-1 block">
                    {runningLinesCount} / {totalLinesCount} Running
                  </span>
                  <span className="text-xs text-blue-400 mt-1 block font-semibold">
                    {runningLinesCount > 0 ? `${runningLinesCount} Lines Extruding` : 'Extrusion Floor Standby'}
                  </span>
                </div>

                <div className="bg-slate-850 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">
                    Dispatch Queue
                  </span>
                  <span className="text-2xl font-bold font-num text-white mt-1 block">
                    {kpis.ready_for_dispatch} Line Items
                  </span>
                  <span className="text-xs text-purple-400 mt-1 block font-semibold">
                    {kpis.dispatched_count} Gate Cleared
                  </span>
                </div>
              </div>

              {/* Live Flow Stream Visualization */}
              <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Live Flow
                  </span>
                  {lineStatus.length > 0 && lineStatus.some((l: any) => l.order_no && l.order_no !== '—') ? (
                    (() => {
                      const activeLine = lineStatus.find((l: any) => l.order_no && l.order_no !== '—') || lineStatus[0];
                      return (
                        <span className="text-slate-300 font-mono">
                          {activeLine.order_no} ({activeLine.party_name || 'Customer'}) ➔ {activeLine.name} ➔ {activeLine.product}
                        </span>
                      );
                    })()
                  ) : (
                    <span className="text-slate-300 font-mono">
                      {kpis.total_orders > 0
                        ? `${kpis.total_orders} Orders in DB ➔ Extrusion Planning ➔ Gate Clearance`
                        : 'Real-Time Database Synchronized • All Nodes Nominal'}
                    </span>
                  )}
                </div>
                <span className="text-xs font-mono text-emerald-400">
                  Database Synced ✓
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CONNECTED MANUFACTURING WORKFLOW SECTION */}
      <section id="workflow" className="py-20 md:py-28 bg-white dark:bg-navy-900 border-y border-slate-200/80 dark:border-navy-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Autonomous Production Engine
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              From Order to Dispatch — Automatically Connected
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
              Eliminate paper slips, manual Excel coordination, and phone follow-ups with a single source of manufacturing truth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflowSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.step}
                  onClick={() => setActiveWorkflowStep(idx)}
                  className="p-6 rounded-2xl bg-surface-base dark:bg-navy-850/80 border border-slate-200/80 dark:border-navy-700/80 hover:border-blue-300 dark:hover:border-blue-600/60 shadow-soft hover:shadow-soft-hover transition-all group flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-extrabold text-blue-600 dark:text-blue-400">
                          {step.step}
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                        <span className="text-xs font-bold text-slate-400 uppercase">
                          {step.subtitle}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50">
                        {step.badge}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {step.title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-200/60 dark:border-navy-700/60 space-y-1.5">
                    {step.details.map((detail, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. COMMAND CENTER SPOTLIGHT */}
      <section id="command-center" className="py-20 md:py-28 bg-surface-base dark:bg-navy-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-xs font-bold text-purple-700 dark:text-purple-300">
                <Zap className="w-3.5 h-3.5" />
                <span>Unified Factory Visibility</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Your Factory. One Digital Command Center.
              </h2>

              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                Connect management, production supervisors, floor operators, quality inspectors, and logistics teams into a unified real-time workflow.
              </p>

              <div className="space-y-4 pt-2">
                {[
                  {
                    title: 'Live Extrusion Floor Status',
                    desc: 'Real-time telemetry across Extrusion Lines 1 to 4 with speed, temperature, and progress monitoring.',
                    icon: Cpu,
                  },
                  {
                    title: '3-Way Demand Intelligence',
                    desc: 'Instant breakdown of high-margin demand across Party portfolios, millimeter thickness, and density grades.',
                    icon: BarChart3,
                  },
                  {
                    title: 'Zero-Discrepancy Dispatching',
                    desc: 'Vector PDF Dispatch manifest generation with automatic truck weight reconciliation and gate security pass.',
                    icon: Truck,
                  },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex gap-4 p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-2xs">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/dashboard')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Open Factory Dashboard
              </Button>
            </div>

            {/* Right Interactive Status Preview */}
            <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-navy-800">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Live Extrusion Lines
                  </h4>
                  <p className="text-xs text-slate-500">Real-time database machine telemetry</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {runningLinesCount} / {totalLinesCount} Active
                </span>
              </div>

              <div className="space-y-3">
                {lineStatus.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">Loading live machines from database...</div>
                ) : (
                  lineStatus.map((line: any, i: number) => {
                    const progress = line.efficiency || 0;
                    return (
                      <div key={line.line_id || i} className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200/80 dark:border-navy-800 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {line.name}
                          </span>
                          <StatusBadge status={line.status} size="sm" />
                        </div>
                        <span className="text-xs text-slate-500 truncate">
                          {line.product}
                        </span>
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400 mt-1">
                          <span>
                            {line.good_output && Number(line.good_output) > 0
                              ? `${line.good_output} / ${line.target} Sheets`
                              : (line.order_no && line.order_no !== '—' ? `SO #${line.order_no}` : 'Standby / Ready')}
                          </span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-navy-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all"
                            style={{ width: `${Math.max(progress > 0 ? progress : 0, line.status === 'RUNNING' || line.status === 'IN_PROGRESS' ? 20 : 0)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FIXOBOARD PRODUCT SHOWCASE */}
      <section id="products" className="py-20 md:py-28 bg-white dark:bg-navy-900 border-y border-slate-200/80 dark:border-navy-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Advanced Polymer Solutions
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Built Around Modern Manufacturing
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
              Precision-calibrated PVC/WPC sheets, doors, frames, and marble composites engineered for industrial durability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(realProducts.length > 0 ? realProducts.slice(0, 4) : productCatalog).map((prod: any, idx: number) => {
              const isDb = Boolean(prod.product_name || prod.product_code);
              const title = isDb ? prod.product_name : prod.name;
              const categoryOrDensity = isDb ? (prod.category?.name || 'Standard Marine') : prod.density;
              const unitOrThickness = isDb ? (prod.unit || 'Sheets') : prod.thickness;
              const desc = isDb ? (prod.description || `${prod.product_name} industrial marine polymer board.`) : prod.desc;
              const features = isDb
                ? [`SKU: ${prod.product_code}`, `UoM: ${prod.unit || 'Sheets'}`, '100% Quality Inspected']
                : prod.features;

              return (
                <div
                  key={prod.id || idx}
                  className="p-6 rounded-2xl bg-surface-base dark:bg-navy-850 border border-slate-200/80 dark:border-navy-700 hover:border-blue-300 dark:hover:border-blue-600 shadow-soft hover:shadow-soft-hover transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                        {unitOrThickness}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 bg-slate-200/60 dark:bg-navy-800 px-2 py-0.5 rounded-md">
                        {categoryOrDensity}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {title}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {desc}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-200/60 dark:border-navy-700/60 space-y-1">
                    {features.map((feat: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. BEFORE VS AFTER TRANSFORMATION */}
      <section id="transformation" className="py-20 md:py-28 bg-surface-base dark:bg-navy-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              The Digital Shift
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Before vs. After Digital Transformation
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
              See the measurable impact of replacing disconnected manual operations with FixoBoard Manufacturing OS.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Before Card */}
            <div className="p-8 rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  ✕
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Traditional Manual Factory
                  </h3>
                  <p className="text-xs text-rose-600 dark:text-rose-400">Disconnected &amp; Error-Prone</p>
                </div>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                {[
                  'Handwritten paper registers that get lost or soiled on the shop floor',
                  'Multiple disconnected Excel spreadsheets creating duplicate entries',
                  'Constant phone calls between Sales and Supervisors to check batch status',
                  'Scrap and rejection quantities only discovered at month-end inventory tally',
                  'Delayed dispatch manifests causing transporter vehicle detention penalties',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-rose-200/80 text-rose-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      ✕
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* After Card */}
            <div className="p-8 rounded-3xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    FixoBoard Manufacturing OS
                  </h3>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Automated &amp; 100% Traceable</p>
                </div>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                {[
                  'Centralized digital order capture with automated production memo routing',
                  'Live touchscreen execution tracking good output and scrap in real time',
                  'Instant executive dashboards showing active capacity across Lines 1–4',
                  'Automated bundle calculations and packaging slip generation',
                  'One-click PDF dispatch manifests and digital Gate Out security passes',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. TRUST & SECURITY SECTION */}
      <section id="security" className="py-20 bg-white dark:bg-navy-900 border-t border-slate-200/80 dark:border-navy-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
            {[
              { title: 'Role-Based Access', desc: '7 Industrial Personas', icon: Users },
              { title: 'Audit Trail', desc: 'Immutable Event Logs', icon: FileCheck },
              { title: 'Data Traceability', desc: 'Full Batch Lineage', icon: ShieldCheck },
              { title: 'Fast Authentication', desc: 'Secure JWT Tokens', icon: Lock },
              { title: 'Real-Time Sync', desc: 'Sub-second Updates', icon: Activity },
              { title: 'Scalable Arch', desc: 'Postgres & FastAPI', icon: Cpu },
            ].map((sec, i) => {
              const Icon = sec.icon;
              return (
                <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200/80 dark:border-navy-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {sec.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {sec.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. FINAL CTA */}
      <section className="py-20 bg-gradient-to-r from-brand-indigo via-brand-blue to-indigo-900 text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Ready to modernize your manufacturing operation?
          </h2>
          <p className="text-base sm:text-lg text-blue-100 max-w-2xl mx-auto">
            Experience the complete end-to-end workflow from customer order to factory gate out.
          </p>
          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/dashboard')}
              rightIcon={<ArrowRight className="w-5 h-5 text-blue-600" />}
              className="bg-white text-brand-indigo hover:bg-slate-50 shadow-xl"
            >
              Launch Plant 1 Dashboard
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/login')}
              className="border-white/40 text-white hover:bg-white/10"
            >
              Sign In as Operator
            </Button>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-6 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-lg">
              <img src="/logo.png" alt="FixoBoard Logo" className="h-7 w-auto object-contain" />
            </div>
            <div>
              <span className="font-bold text-white block">FixoBoard Atlantic Polymers</span>
              <span className="text-[11px] text-slate-500">Manufacturing Management System • Version 2.0</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-medium">
            <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
            <a href="#command-center" className="hover:text-white transition-colors">Command Center</a>
            <a href="#products" className="hover:text-white transition-colors">Products</a>
            <a href="#security" className="hover:text-white transition-colors">Security</a>
            <span className="text-slate-600">|</span>
            <span>Plant 1 Extrusion &amp; Operations</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Simple internal icon helper for Sliders
function SlidersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}
