import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Card } from '../components/common/Card';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Stepper, StepItem } from '../components/common/Stepper';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Send,
  Layers,
  Building,
  Calendar,
  AlertCircle,
  FileText,
  Clock,
  Printer,
  Zap,
  Activity,
  Package,
  Truck,
} from 'lucide-react';

export const SalesOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const [selectedItemForMemo, setSelectedItemForMemo] = useState<string | null>(null);
  const [memoPlannedQty, setMemoPlannedQty] = useState(100);
  const [targetMachineId, setTargetMachineId] = useState('');
  const [memoRequiredDate, setMemoRequiredDate] = useState('');
  const [memoPriority, setMemoPriority] = useState('HIGH');
  const [actionError, setActionError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Queries
  const { data: orderData, isLoading, isError, refetch } = useQuery({
    queryKey: ['sales_order', id],
    queryFn: () => apiClient.getSalesOrderById(id!),
    enabled: !!id,
  });

  const order = orderData?.data;

  const { data: machinesData } = useQuery({
    queryKey: ['machines_all'],
    queryFn: () => apiClient.getAllMachines(),
  });

  const machines = machinesData?.data || [];
  const availableMachines = machines.filter(
    (m) => m.is_active && m.status !== 'MAINTENANCE' && m.status !== 'OFFLINE'
  );

  // Mutations
  const submitMutation = useMutation({
    mutationFn: () => apiClient.submitSalesOrder(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales_order', id] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setActionError(null);
      setSuccessNotice('Order submitted for management approval.');
    },
    onError: (err: any) => setActionError(err.message || 'Submit failed'),
  });

  const approveMutation = useMutation({
    mutationFn: () => apiClient.approveSalesOrder(id!),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['sales_order', id] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setActionError(null);
      setSuccessNotice('Order Approved! Automatically opening Production Memo & Line Allocation...');

      // Auto-open Issue Memo modal for first line item
      const currentOrder = res?.data || order;
      if (currentOrder?.items && currentOrder.items.length > 0) {
        handleOpenMemoModal(currentOrder.items[0]);
      }
    },
    onError: (err: any) => setActionError(err.message || 'Approval failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: () => apiClient.rejectSalesOrder(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales_order', id] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      setActionError(null);
    },
    onError: (err: any) => setActionError(err.message || 'Rejection failed'),
  });

  const createMemoMutation = useMutation({
    mutationFn: (payload: any) => apiClient.createProductionMemo(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales_order', id] });
      queryClient.invalidateQueries({ queryKey: ['production-memos'] });
      setSelectedItemForMemo(null);
      setActionError(null);
      navigate('/production-memos');
    },
    onError: (err: any) => setActionError(err.message || 'Production memo creation failed'),
  });

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner text="Loading commercial order details..." size="lg" />
      </div>
    );
  }

  if (isError || !order) {
    return <ErrorState onRetry={() => refetch()} title="Sales Order Not Found" message="The requested order ID does not exist or access was denied." />;
  }

  // Stepper progress derivation
  const getOrderWorkflowSteps = (): StepItem[] => {
    const isApproved = ['APPROVED', 'IN_PRODUCTION', 'COMPLETED'].includes(order.status);
    const inProd = ['IN_PRODUCTION', 'COMPLETED'].includes(order.status);
    const isCompleted = order.status === 'COMPLETED';

    return [
      {
        id: 'sales',
        label: 'Sales Booking',
        sublabel: order.order_source || 'CAT Source',
        status: isApproved ? 'complete' : order.status === 'SUBMITTED' ? 'current' : 'current',
      },
      {
        id: 'approval',
        label: 'Approval',
        sublabel: order.approved_at ? 'Approved' : 'Pending',
        status: isApproved ? 'complete' : order.status === 'SUBMITTED' ? 'current' : 'upcoming',
      },
      {
        id: 'production',
        label: 'Production Planning',
        sublabel: inProd ? 'Line Executing' : 'Queued',
        status: inProd ? 'complete' : isApproved ? 'current' : 'upcoming',
      },
      {
        id: 'packing',
        label: 'Packaging',
        sublabel: 'Standard / Cardboard',
        status: isCompleted ? 'complete' : inProd ? 'current' : 'upcoming',
      },
      {
        id: 'dispatch',
        label: 'Gate Clearance',
        sublabel: isCompleted ? 'Dispatched' : 'Pending Gate Out',
        status: isCompleted ? 'complete' : 'upcoming',
      },
    ];
  };

  const handleOpenMemoModal = (item: any) => {
    setSelectedItemForMemo(item.id);
    setMemoPlannedQty(Number(item.ordered_quantity));
    setTargetMachineId(availableMachines[0]?.id || '');
    setMemoRequiredDate(order.required_date || '');
  };

  const handleConfirmCreateMemo = () => {
    if (!selectedItemForMemo) return;
    createMemoMutation.mutate({
      sales_order_id: order.id,
      sales_order_item_id: selectedItemForMemo,
      planned_quantity: Number(memoPlannedQty),
      target_machine_id: targetMachineId || undefined,
      required_date: memoRequiredDate || undefined,
      priority: memoPriority,
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/sales-orders')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            All Orders
          </Button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold font-num text-slate-900 dark:text-white">
                {order.order_number}
              </h1>
              <StatusBadge status={order.status} />
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {order.order_source}
              </span>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40">
                {order.priority}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Customer: <strong className="text-slate-900 dark:text-slate-100">{order.party?.party_name}</strong> • Created: {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Workflow Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {order.status === 'DRAFT' && (
            <Button
              variant="brand"
              size="sm"
              isLoading={submitMutation.isPending}
              onClick={() => submitMutation.mutate()}
              leftIcon={<Send className="w-4 h-4" />}
            >
              Submit for Approval
            </Button>
          )}

          {order.status === 'SUBMITTED' && hasPermission('sales_orders:approve') && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                isLoading={rejectMutation.isPending}
                onClick={() => rejectMutation.mutate()}
                leftIcon={<XCircle className="w-4 h-4 text-rose-500" />}
              >
                Reject
              </Button>
              <Button
                variant="brand"
                size="sm"
                isLoading={approveMutation.isPending}
                onClick={() => approveMutation.mutate()}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Approve Order
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print
          </Button>
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 font-bold shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {successNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-bold">{successNotice}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {order.items && order.items.length > 0 && (
              <Button
                variant="brand"
                size="xs"
                onClick={() => handleOpenMemoModal(order.items[0])}
                leftIcon={<Layers className="w-3.5 h-3.5" />}
              >
                Issue Production Memo
              </Button>
            )}
            <Button
              variant="secondary"
              size="xs"
              onClick={() => navigate('/production/planning')}
              leftIcon={<Activity className="w-3.5 h-3.5" />}
            >
              Extrusion Planning Board
            </Button>
          </div>
        </div>
      )}

      {/* Progress Stepper Card */}
      <Card noPadding className="p-5 bg-slate-50/70 dark:bg-slate-900/70">
        <Stepper steps={getOrderWorkflowSteps()} />
      </Card>

      {/* Order Info & Customer Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Customer Account" subtitle="Party directory credentials">
          <div className="space-y-2 text-xs">
            <p className="font-bold text-slate-900 dark:text-white text-sm">
              {order.party?.party_name}
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              <strong className="text-slate-800 dark:text-slate-200">GST:</strong> {order.party?.gst_number || 'N/A'}
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              <strong className="text-slate-800 dark:text-slate-200">Shipping:</strong> {order.party?.shipping_address || order.party?.billing_address}
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              <strong className="text-slate-800 dark:text-slate-200">Payment:</strong> {order.party?.payment_terms || '30 Days Net'}
            </p>
          </div>
        </Card>

        <Card title="Commercial Details" subtitle="PO references & requirements">
          <div className="space-y-2 text-xs">
            <p className="text-slate-500 dark:text-slate-400">
              <strong className="text-slate-800 dark:text-slate-200">Customer PO:</strong>{' '}
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {order.customer_po_number || 'Direct Counter'}
              </span>
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              <strong className="text-slate-800 dark:text-slate-200">Required Delivery:</strong>{' '}
              <span className="font-num text-amber-600 dark:text-amber-400 font-bold">
                {order.required_date || 'Standard SLA'}
              </span>
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              <strong className="text-slate-800 dark:text-slate-200">Total Volume:</strong>{' '}
              <span className="font-num font-bold text-slate-900 dark:text-white">
                {order.total_quantity} Sheets
              </span>
            </p>
            {order.remarks && (
              <p className="text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 font-medium">
                <strong className="text-slate-800 dark:text-slate-200">Remarks:</strong> {order.remarks}
              </p>
            )}
          </div>
        </Card>

        <Card title="Automation Status" subtitle="Forward workflow handoff">
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Zap className="w-3.5 h-3.5" />
                <span>Automatic Work Order Engine</span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                {order.status === 'APPROVED' || order.status === 'IN_PRODUCTION'
                  ? 'Production Memos are generated & linked to Extrusion Line queues.'
                  : 'Pending approval before automatic work order release.'}
              </p>
            </div>

            <div className="text-slate-500 dark:text-slate-400 text-[11px] space-y-1 font-medium">
              <p>• Data flows to Packing &amp; Dispatch automatically.</p>
              <p>• No duplicate data entry required.</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Ordered Products Matrix */}
      <Card
        title="Ordered Products &amp; Finished Goods Matrix"
        subtitle="Line items configured with dynamic millimeter thickness and calibrated density"
      >
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase font-sans font-bold">
              <tr>
                <th className="p-3.5">#</th>
                <th className="p-3.5">Product Name</th>
                <th className="p-3.5">Thickness (mm)</th>
                <th className="p-3.5">Density (g/cm³)</th>
                <th className="p-3.5 text-right">Ordered Qty</th>
                <th className="p-3.5 text-right">Produced Qty</th>
                <th className="p-3.5 text-right">Unit Price</th>
                <th className="p-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {order.items?.map((item: any, idx: number) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50">
                  <td className="p-3.5 font-num text-slate-400 font-bold">{idx + 1}</td>
                  <td className="p-3.5">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {item.product?.product_name || 'PVC Celuka Board'}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {item.product?.product_code || 'PROD-PVC-001'}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {item.thickness?.display_label || 'Standard'}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {item.density?.display_label || 'Standard'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-num font-bold text-slate-900 dark:text-white">
                    {item.ordered_quantity} {item.unit || 'Sheets'}
                  </td>
                  <td className="p-3.5 text-right font-num text-slate-600 dark:text-slate-400 font-medium">
                    {item.produced_quantity || 0} {item.unit || 'Sheets'}
                  </td>
                  <td className="p-3.5 text-right font-num font-bold">
                    ₹{Number(item.unit_price || 0).toLocaleString()}
                  </td>
                  <td className="p-3.5 text-center">
                    {order.status === 'APPROVED' ? (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleOpenMemoModal(item)}
                        leftIcon={<Layers className="w-3.5 h-3.5 text-blue-600" />}
                      >
                        Issue Memo
                      </Button>
                    ) : (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                        {order.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Production Memo Modal */}
      {selectedItemForMemo && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedItemForMemo(null)}
          title="Issue Production Memo (Work Order)"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Create an official decoupled production memo (PM-2026-XXXXXX) and allocate an Extrusion Line.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Planned Quantity (Sheets) *
              </label>
              <input
                type="number"
                value={memoPlannedQty}
                onChange={(e) => setMemoPlannedQty(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-num font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Assign Extrusion Line (Operational Lines Only) *
              </label>
              <select
                value={targetMachineId}
                onChange={(e) => setTargetMachineId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold shadow-2xs"
                disabled={availableMachines.length === 0}
              >
                <option value="">
                  {availableMachines.length === 0 ? '-- No Operational Machines Available --' : '-- Choose Machine Line --'}
                </option>
                {availableMachines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.line_name} ({m.machine_name}) — {m.status} ({m.rated_capacity_hourly} sht/hr)
                  </option>
                ))}
              </select>
              {availableMachines.length === 0 && (
                <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                  ⚠️ All extrusion machines are currently in maintenance or offline. Please restore a machine status before creating production memos.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Required Production Date
              </label>
              <input
                type="date"
                value={memoRequiredDate}
                onChange={(e) => setMemoRequiredDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-num font-bold"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setSelectedItemForMemo(null)}>
                Cancel
              </Button>
              <Button
                variant="brand"
                size="sm"
                isLoading={createMemoMutation.isPending}
                onClick={handleConfirmCreateMemo}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Generate Memo &amp; Allocate Line
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

