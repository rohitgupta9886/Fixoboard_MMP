import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, getFullApiUrl } from '../api/client';
import { Dispatch } from '../types';
import { Card } from '../components/common/Card';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  ArrowLeft,
  Truck,
  CheckCircle2,
  Printer,
  FileText,
  User,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Building,
  Package,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const DispatchDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const { data, isLoading } = useQuery<{ success: boolean; data: Dispatch }>({
    queryKey: ['dispatch', id],
    queryFn: () => apiClient.getDispatchById(id!),
    enabled: !!id,
  });

  const dispatch = data?.data;

  // Confirm Gate Out
  const gateOutMutation = useMutation({
    mutationFn: () => apiClient.confirmDispatch(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatch', id] });
      queryClient.invalidateQueries({ queryKey: ['dispatches'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const handlePrintPdf = () => {
    window.open(getFullApiUrl(`/api/v1/dispatches/${id}/pdf`), '_blank');
  };

  if (isLoading) {
    return <LoadingSpinner text="Retrieving dispatch gate record..." />;
  }

  if (!dispatch) {
    return <div className="p-8 text-center text-slate-500 font-medium">Dispatch record not found</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dispatch')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-extrabold font-num text-slate-900 dark:text-slate-100">{dispatch.dispatch_number}</h1>
              <StatusBadge status={dispatch.status} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Consignee: <span className="text-slate-900 dark:text-slate-200 font-bold">{dispatch.party?.party_name}</span> &bull; SO:{' '}
              <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{dispatch.sales_order?.order_number}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handlePrintPdf} leftIcon={<Printer className="w-4 h-4" />}>
            Print Official Dispatch Sheet (PDF)
          </Button>

          {dispatch.status !== 'DISPATCHED' && hasPermission('dispatch:approve') && (
            <Button
              variant="brand"
              size="sm"
              onClick={() => gateOutMutation.mutate()}
              isLoading={gateOutMutation.isPending}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Verify &amp; Confirm Gate-Out
            </Button>
          )}
        </div>
      </div>

      {/* Logistics & Vehicle Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans block">
            Vehicle &amp; Transporter
          </span>
          <p className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">{dispatch.vehicle_number}</p>
          <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 font-medium">{dispatch.transporter || 'Direct Dedicated Truck'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-2 font-bold">LR #: {dispatch.lr_number || 'N/A'}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans block">
            Driver Identification
          </span>
          <p className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">{dispatch.driver_name}</p>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-mono">Ph: {dispatch.driver_phone || 'N/A'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-num">Scheduled: {dispatch.dispatch_date}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans block">
            Security &amp; Gate Verification
          </span>
          <div className="mt-2 text-xs space-y-1">
            <p className="flex justify-between">
              <span className="text-slate-500 font-medium">Verified By:</span>
              <span className="text-slate-900 dark:text-slate-200 font-bold">{dispatch.verifier?.full_name || 'Pending Gate Out'}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-slate-500 font-medium">Gate Out Time:</span>
              <span className="font-num text-emerald-600 dark:text-emerald-400 font-bold">{dispatch.gate_out_time ? dispatch.gate_out_time.replace('T', ' ').slice(0, 19) : 'In Yard'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Manifest Items Table */}
      <Card title="Physical Shipment Manifest &amp; Loaded Finished Goods">
        <div className="space-y-3">
          {dispatch.items?.map((item, idx) => (
            <div key={item.id} className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between flex-wrap gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-num font-bold flex items-center justify-center text-xs border border-blue-200 dark:border-blue-800">
                  {idx + 1}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {item.sales_order_item?.product?.product_name || 'Manufactured Board'}
                  </h4>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5 font-bold">
                    {item.sales_order_item?.thickness?.display_label} &bull; {item.sales_order_item?.density?.display_label}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 font-num text-xs text-right">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-sans font-bold">Dispatched Qty</span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">{item.dispatched_quantity} Sheets</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-sans font-bold">Package Bundles</span>
                  <span className="text-base font-bold text-slate-800 dark:text-slate-200">{item.package_count} Crates</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

