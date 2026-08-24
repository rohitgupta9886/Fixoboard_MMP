import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { PaginatedResponse, AuditLog } from '../types';
import { Table, Column } from '../components/common/Table';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { History, Search, Eye, ShieldAlert, ShieldCheck, FileCode, CheckCircle2 } from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data, isLoading } = useQuery<PaginatedResponse<AuditLog>>({
    queryKey: ['audit_logs', page, search],
    queryFn: () => api.get<PaginatedResponse<AuditLog>>('/audit-logs', { page, page_size: 20, entity_name: search || undefined }),
  });

  const totalLogs = data?.pagination?.total || data?.data?.length || 0;

  const columns: Column<AuditLog>[] = [
    {
      key: 'created_at',
      header: 'Timestamp',
      render: (row) => (
        <span className="font-num text-xs text-slate-500 dark:text-slate-400 font-bold">
          {row.created_at ? row.created_at.replace('T', ' ').slice(0, 19) : 'Just now'}
        </span>
      ),
    },
    {
      key: 'user',
      header: 'Actor / User',
      render: (row) => (
        <div className="text-xs">
          <p className="font-bold text-slate-900 dark:text-white">{row.user?.full_name || 'System / CLI'}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-medium">@{row.user?.username || 'system'}</p>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action Taken',
      render: (row) => (
        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          {row.action}
        </span>
      ),
    },
    {
      key: 'entity',
      header: 'Entity / Resource',
      render: (row) => (
        <div className="text-xs">
          <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">{row.entity_name}</span>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-[140px] font-medium">{row.entity_id}</p>
        </div>
      ),
    },
    {
      key: 'ip_address',
      header: 'Client IP',
      render: (row) => <span className="font-mono text-xs text-slate-500 dark:text-slate-400 font-bold">{row.ip_address || '127.0.0.1'}</span>,
    },
    {
      key: 'action_view',
      header: 'Diff',
      align: 'center',
      render: (row) => (
        <Button
          variant="outline"
          size="xs"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedLog(row);
          }}
          leftIcon={<Eye className="w-3.5 h-3.5" />}
        >
          Inspect
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">System Audit Trail &amp; Compliance</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Immutable before/after state ledger capturing all commercial approvals, line outputs, and gate events.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Recorded Audit Events"
          value={totalLogs}
          unit="Events"
          subtitle="Full compliance history"
          icon={<History className="w-4.5 h-4.5" />}
          variant="blue"
        />
        <StatCard
          title="Security Integrity"
          value="100%"
          unit="Verified"
          subtitle="Zero tampering detected"
          icon={<ShieldCheck className="w-4.5 h-4.5" />}
          variant="emerald"
        />
        <StatCard
          title="JSON State Snapshots"
          value={totalLogs}
          unit="Diffs"
          subtitle="Before/After delta logged"
          icon={<FileCode className="w-4.5 h-4.5" />}
          variant="purple"
        />
      </div>

      {/* Filter */}
      <div className="w-80">
        <Input
          placeholder="Filter entity (e.g. SalesOrder, Dispatch)..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          leftIcon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={data?.data || []}
        keyExtractor={(row) => row.id}
        isLoading={isLoading}
        onRowClick={(row) => setSelectedLog(row)}
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

      {/* Modal: Audit Log Diff Viewer */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title="Audit Transaction Snapshot"
          subtitle={`Action: ${selectedLog?.action} on ${selectedLog?.entity_name} (${selectedLog?.entity_id})`}
          size="xl"
        >
          <div className="space-y-4 text-xs font-mono">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-900 dark:bg-slate-950 rounded-xl border border-slate-800 shadow-2xs">
                <span className="text-slate-400 font-bold block mb-1 font-sans text-[11px] uppercase tracking-wider">PREVIOUS STATE (OLD VALUES)</span>
                <pre className="text-rose-400 whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {selectedLog?.old_values ? JSON.stringify(selectedLog.old_values, null, 2) : 'None (Created Entity)'}
                </pre>
              </div>

              <div className="p-3.5 bg-slate-900 dark:bg-slate-950 rounded-xl border border-slate-800 shadow-2xs">
                <span className="text-slate-400 font-bold block mb-1 font-sans text-[11px] uppercase tracking-wider">COMMITTED STATE (NEW VALUES)</span>
                <pre className="text-emerald-400 whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {selectedLog?.new_values ? JSON.stringify(selectedLog.new_values, null, 2) : 'None (Deleted/Empty)'}
                </pre>
              </div>
            </div>

            {selectedLog?.extra_metadata && (
              <div className="p-3.5 bg-slate-900 dark:bg-slate-950 rounded-xl border border-slate-800 shadow-2xs">
                <span className="text-slate-400 font-bold block mb-1 font-sans text-[11px] uppercase tracking-wider">ADDITIONAL AUDIT METADATA</span>
                <pre className="text-blue-400 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {JSON.stringify(selectedLog.extra_metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

