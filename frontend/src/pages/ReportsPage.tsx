import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ApiResponse, DashboardSummary } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatCard } from '../components/common/StatCard';
import { BarChart3, Download, Layers, Sliders, Users, Flame, TrendingUp, CheckCircle2, AlertTriangle } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [reportTab, setReportTab] = useState<'party' | 'thickness' | 'density'>('party');

  const { data, isLoading } = useQuery<ApiResponse<DashboardSummary>>({
    queryKey: ['dashboard_reports'],
    queryFn: () => api.get<ApiResponse<DashboardSummary>>('/dashboards'),
  });

  const summary = data?.data;

  const exportCsv = (filename: string, rows: any[]) => {
    if (!rows || !rows.length) return;
    const separator = ',';
    const keys = Object.keys(rows[0]);
    const csvContent =
      keys.join(separator) +
      '\n' +
      rows
        .map((row) =>
          keys
            .map((k) => {
              let cell = row[k] === null || row[k] === undefined ? '' : row[k];
              cell = cell instanceof Date ? cell.toLocaleString() : cell.toString().replace(/"/g, '""');
              if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
              return cell;
            })
            .join(separator)
        )
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <LoadingSpinner text="Compiling multi-dimensional production analytics..." />;
  }

  const totalOrdered = summary?.summary?.total_ordered_quantity || 0;
  const totalProduced = summary?.summary?.total_produced_quantity || 0;
  const totalDispatched = summary?.summary?.total_dispatched_quantity || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Demand Intelligence &amp; Production Reports</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Aggregated intelligence across commercial parties, gauge thicknesses (mm), and densities (g/cm³).
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (reportTab === 'party') exportCsv('demand_by_party', summary?.demand_by_party || []);
            if (reportTab === 'thickness') exportCsv('demand_by_thickness', summary?.demand_by_thickness || []);
            if (reportTab === 'density') exportCsv('demand_by_density', summary?.demand_by_density || []);
          }}
          leftIcon={<Download className="w-4 h-4" />}
        >
          Export CSV Report
        </Button>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Commercial Demand"
          value={totalOrdered.toLocaleString()}
          unit="Sheets"
          subtitle="All confirmed orders"
          icon={<TrendingUp className="w-4.5 h-4.5" />}
          variant="blue"
        />
        <StatCard
          title="Total Plant Production"
          value={totalProduced.toLocaleString()}
          unit="Sheets"
          subtitle="Extruded & verified"
          icon={<CheckCircle2 className="w-4.5 h-4.5" />}
          variant="emerald"
        />
        <StatCard
          title="Logistics Dispatched"
          value={totalDispatched.toLocaleString()}
          unit="Sheets"
          subtitle="Delivered through gate out"
          icon={<BarChart3 className="w-4.5 h-4.5" />}
          variant="purple"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setReportTab('party')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 transition-all ${
            reportTab === 'party'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Party-Wise Demand</span>
        </button>

        <button
          onClick={() => setReportTab('thickness')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 transition-all ${
            reportTab === 'thickness'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Thickness-Wise Breakdown (mm)</span>
        </button>

        <button
          onClick={() => setReportTab('density')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 transition-all ${
            reportTab === 'density'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Density-Wise Breakdown (g/cm³)</span>
        </button>
      </div>

      {/* Party-Wise Demand Table */}
      {reportTab === 'party' && (
        <Card title="Party-Wise Demand &amp; Delivery Performance">
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 uppercase font-sans font-bold">
                <tr>
                  <th className="p-3.5">Party Code</th>
                  <th className="p-3.5">Customer Name</th>
                  <th className="p-3.5 text-right">Ordered Qty</th>
                  <th className="p-3.5 text-right">Produced Qty</th>
                  <th className="p-3.5 text-right">Packed Qty</th>
                  <th className="p-3.5 text-right">Dispatched Qty</th>
                  <th className="p-3.5 text-right">Pending Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-num">
                {summary?.demand_by_party?.map((p) => (
                  <tr key={p.party_id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50">
                    <td className="p-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">{p.party_code}</td>
                    <td className="p-3.5 font-sans font-bold text-slate-900 dark:text-white">{p.party_name}</td>
                    <td className="p-3.5 text-right text-slate-900 dark:text-white font-bold">{p.total_ordered_quantity}</td>
                    <td className="p-3.5 text-right text-blue-600 dark:text-blue-400 font-bold">{p.total_produced_quantity}</td>
                    <td className="p-3.5 text-right text-amber-600 dark:text-amber-400 font-bold">{p.total_packed_quantity}</td>
                    <td className="p-3.5 text-right text-emerald-600 dark:text-emerald-400 font-bold">{p.total_dispatched_quantity}</td>
                    <td className="p-3.5 text-right text-rose-600 dark:text-rose-400 font-bold">{p.pending_quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Thickness-Wise Demand Table */}
      {reportTab === 'thickness' && (
        <Card title="Thickness-Wise Manufacturing Distribution (mm)">
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 uppercase font-sans font-bold">
                <tr>
                  <th className="p-3.5">Gauge (mm)</th>
                  <th className="p-3.5">Specification Label</th>
                  <th className="p-3.5 text-right">Total Ordered Volume</th>
                  <th className="p-3.5 text-right">Total Produced Volume</th>
                  <th className="p-3.5 text-right">Fulfillment Deficit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-num">
                {summary?.demand_by_thickness?.map((t) => (
                  <tr key={t.thickness_id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50">
                    <td className="p-3.5 font-bold text-blue-600 dark:text-blue-400 text-sm font-num">{Number(t.thickness_value)} mm</td>
                    <td className="p-3.5 font-sans font-medium text-slate-800 dark:text-slate-200">{t.display_label}</td>
                    <td className="p-3.5 text-right text-slate-900 dark:text-white font-bold">{t.total_ordered_quantity} Sheets</td>
                    <td className="p-3.5 text-right text-emerald-600 dark:text-emerald-400 font-bold">{t.total_produced_quantity} Sheets</td>
                    <td className="p-3.5 text-right text-rose-600 dark:text-rose-400 font-bold">{t.pending_quantity} Sheets</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Density-Wise Demand Table */}
      {reportTab === 'density' && (
        <Card title="Density-Wise Material Grade Breakdown (g/cm³)">
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 uppercase font-sans font-bold">
                <tr>
                  <th className="p-3.5">Density (g/cm³)</th>
                  <th className="p-3.5">Grade Label</th>
                  <th className="p-3.5 text-right">Total Ordered Volume</th>
                  <th className="p-3.5 text-right">Total Produced Volume</th>
                  <th className="p-3.5 text-right">Fulfillment Deficit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-num">
                {summary?.demand_by_density?.map((d) => (
                  <tr key={d.density_id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50">
                    <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400 text-sm font-num">{Number(d.density_value)} g/cm³</td>
                    <td className="p-3.5 font-sans font-medium text-slate-800 dark:text-slate-200">{d.display_label}</td>
                    <td className="p-3.5 text-right text-slate-900 dark:text-white font-bold">{d.total_ordered_quantity} Sheets</td>
                    <td className="p-3.5 text-right text-blue-600 dark:text-blue-400 font-bold">{d.total_produced_quantity} Sheets</td>
                    <td className="p-3.5 text-right text-rose-600 dark:text-rose-400 font-bold">{d.pending_quantity} Sheets</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

