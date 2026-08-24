import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Card } from '../components/common/Card';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatCard } from '../components/common/StatCard';
import {
  Truck,
  Plus,
  CheckCircle2,
  ShieldCheck,
  Check,
  Download,
  AlertCircle,
  Package,
  Layers,
  Clock,
  Eye,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SalesOrder, SalesOrderItem } from '../types';

interface ManifestItemRow {
  sales_order_item_id: string;
  packing_id?: string;
  product_name: string;
  specs: string;
  ordered_quantity: number;
  already_dispatched: number;
  dispatched_quantity: number;
  package_count: number;
  selected: boolean;
}

export const DispatchPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form State
  const [partyId, setPartyId] = useState('');
  const [salesOrderId, setSalesOrderId] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('GJ-01-XX-9999');
  const [driverName, setDriverName] = useState('Ramesh Singh');
  const [driverPhone, setDriverPhone] = useState('9876543210');
  const [transporter, setTransporter] = useState('V-Trans Logistics India');
  const [lrNumber, setLrNumber] = useState('');
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('All bundles verified against commercial packing slip');
  const [manifestItems, setManifestItems] = useState<ManifestItemRow[]>([]);

  // Queries
  const { data: dispatchesData, isLoading } = useQuery({
    queryKey: ['dispatches', page],
    queryFn: () => apiClient.getDispatches({ page, page_size: 15 }),
  });

  const { data: partiesData } = useQuery({
    queryKey: ['parties_all'],
    queryFn: () => apiClient.getAllParties(),
  });

  const { data: ordersData } = useQuery({
    queryKey: ['orders_for_dispatch'],
    queryFn: () => apiClient.getSalesOrders({ page_size: 100 }),
  });

  const { data: packingData } = useQuery({
    queryKey: ['packing_for_dispatch'],
    queryFn: () => apiClient.getPackingRecords({ page_size: 100 }),
  });

  const dispatches = dispatchesData?.data || [];
  const parties = partiesData?.data || [];
  const orders: SalesOrder[] = ordersData?.data || [];
  const packingRecords = packingData?.data || [];

  const totalDispatches = dispatches.length;
  const gateClearedCount = dispatches.filter((d: any) => d.status === 'GATE_OUT' || d.status === 'COMPLETED').length;
  const readyToGateOutCount = dispatches.filter((d: any) => d.status === 'READY' || d.status === 'PENDING').length;

  // Filtered orders based on selected party
  const partyOrders = partyId
    ? orders.filter((o) => o.party_id === partyId)
    : orders;

  const currentOrder = orders.find((o) => o.id === salesOrderId);

  const loadOrderItems = (order: SalesOrder) => {
    if (!order.items || order.items.length === 0) {
      setManifestItems([]);
      return;
    }

    const rows: ManifestItemRow[] = order.items.map((it: SalesOrderItem) => {
      const remaining = Math.max(0, Number(it.ordered_quantity || 0) - Number(it.dispatched_quantity || 0));
      const defaultQty = remaining > 0 ? remaining : Number(it.ordered_quantity || 100);
      const matchingPacking = packingRecords.find((p) => p.sales_order_item_id === it.id);

      return {
        sales_order_item_id: it.id,
        packing_id: matchingPacking?.id || undefined,
        product_name: it.product?.product_name || 'Manufactured Board',
        specs: `${it.thickness?.display_label || ''} • ${it.density?.display_label || ''}`,
        ordered_quantity: Number(it.ordered_quantity || 0),
        already_dispatched: Number(it.dispatched_quantity || 0),
        dispatched_quantity: defaultQty,
        package_count: Math.max(1, Math.ceil(defaultQty / 10)),
        selected: true,
      };
    });

    setManifestItems(rows);
  };

  const handlePartyChange = (newPartyId: string) => {
    setPartyId(newPartyId);
    const availableForParty = orders.filter((o) => o.party_id === newPartyId);
    if (availableForParty.length > 0) {
      setSalesOrderId(availableForParty[0].id);
      loadOrderItems(availableForParty[0]);
    } else {
      setSalesOrderId('');
      setManifestItems([]);
    }
  };

  const handleOrderChange = (newOrderId: string) => {
    setSalesOrderId(newOrderId);
    const selected = orders.find((o) => o.id === newOrderId);
    if (selected) {
      if (selected.party_id && selected.party_id !== partyId) {
        setPartyId(selected.party_id);
      }
      loadOrderItems(selected);
    } else {
      setManifestItems([]);
    }
  };

  const createDispatchMutation = useMutation({
    mutationFn: (payload: any) => apiClient.createDispatch(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['dispatches'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setIsCreateModalOpen(false);
      setSuccessToast(`Manifest ${res.data?.dispatch_number || 'created'} registered successfully!`);
      setTimeout(() => setSuccessToast(null), 5000);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to register dispatch manifest. Please review form inputs.');
    },
  });

  const gateOutMutation = useMutation({
    mutationFn: (dispatchId: string) => apiClient.confirmDispatch(dispatchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatches'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setSuccessToast('Gate-Out security clearance confirmed successfully!');
      setTimeout(() => setSuccessToast(null), 4000);
    },
    onError: (err: any) => {
      setSuccessToast(null);
      alert(`Gate-Out verification failed: ${err.message}`);
    },
  });

  const handleOpenCreateModal = () => {
    setErrorMessage(null);
    const firstParty = parties[0];
    const initialPartyId = firstParty?.id || '';
    const initialOrders = initialPartyId
      ? orders.filter((o) => o.party_id === initialPartyId)
      : orders;
    const firstOrder = initialOrders[0] || orders[0];

    setPartyId(initialPartyId || (firstOrder?.party_id || ''));
    setSalesOrderId(firstOrder?.id || '');
    setVehicleNumber('GJ-01-XX-9999');
    setDriverName('Ramesh Singh');
    setDriverPhone('9876543210');
    setTransporter('V-Trans Logistics India');
    setLrNumber(`LR-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    setDispatchDate(new Date().toISOString().split('T')[0]);
    setRemarks('All bundles verified against commercial packing slip');

    if (firstOrder) {
      loadOrderItems(firstOrder);
    } else {
      setManifestItems([]);
    }

    setIsCreateModalOpen(true);
  };

  const handleItemQtyChange = (index: number, qty: number) => {
    setManifestItems((prev) =>
      prev.map((row, i) => {
        if (i === index) {
          return {
            ...row,
            dispatched_quantity: qty,
            package_count: Math.max(1, Math.ceil(qty / 10)),
          };
        }
        return row;
      })
    );
  };

  const handleItemPackageCountChange = (index: number, count: number) => {
    setManifestItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, package_count: count } : row))
    );
  };

  const handleItemToggle = (index: number) => {
    setManifestItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, selected: !row.selected } : row))
    );
  };

  const handleSubmitManifest = () => {
    setErrorMessage(null);

    if (!partyId) {
      setErrorMessage('Please select a customer / party account.');
      return;
    }

    if (!salesOrderId) {
      setErrorMessage('Please select a linked sales order.');
      return;
    }

    if (!vehicleNumber.trim()) {
      setErrorMessage('Vehicle registration number is required.');
      return;
    }

    if (!driverName.trim()) {
      setErrorMessage('Driver name is required.');
      return;
    }

    const selectedItems = manifestItems.filter((it) => it.selected && it.dispatched_quantity > 0);
    if (selectedItems.length === 0) {
      setErrorMessage('Please select at least one item with a valid dispatch quantity (> 0).');
      return;
    }

    const payload = {
      party_id: partyId,
      sales_order_id: salesOrderId,
      vehicle_number: vehicleNumber.trim().toUpperCase(),
      driver_name: driverName.trim(),
      driver_phone: driverPhone.trim() || undefined,
      transporter: transporter.trim() || undefined,
      lr_number: lrNumber.trim() || undefined,
      dispatch_date: dispatchDate,
      remarks: remarks.trim() || undefined,
      items: selectedItems.map((it) => ({
        packing_id: it.packing_id || undefined,
        sales_order_item_id: it.sales_order_item_id,
        dispatched_quantity: Number(it.dispatched_quantity),
        package_count: Number(it.package_count || 1),
      })),
    };

    createDispatchMutation.mutate(payload);
  };

  const handleDownloadPdf = async (dispatchId: string) => {
    try {
      const blob = await apiClient.getDispatchPdf(dispatchId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Dispatch_Sheet_${dispatchId.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      window.open(`/api/v1/dispatches/${dispatchId}/pdf`, '_blank');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-xl shadow-emerald-900/30 text-sm font-bold animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-100" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Transporter Dispatch &amp; Gate Pass Manifest
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Logistics vehicle clearance, transporter LR numbers, and automated ReportLab PDF Dispatch Sheet generation
          </p>
        </div>

        <Button
          variant="brand"
          size="sm"
          onClick={handleOpenCreateModal}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Dispatch Manifest
        </Button>
      </div>

      {/* Logistics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Manifests"
          value={totalDispatches}
          unit="Shipments"
          subtitle="Logistics ledger"
          icon={<Truck className="w-4.5 h-4.5" />}
          variant="blue"
        />
        <StatCard
          title="Pending Gate-Out"
          value={readyToGateOutCount}
          unit="Trucks"
          subtitle="Security check active"
          icon={<Clock className="w-4.5 h-4.5" />}
          variant="amber"
        />
        <StatCard
          title="Gate Cleared"
          value={gateClearedCount}
          unit="Delivered"
          subtitle="LR verified & dispatched"
          icon={<CheckCircle2 className="w-4.5 h-4.5" />}
          variant="emerald"
        />
      </div>

      {/* Dispatch Readiness Checklist Card */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <span>Dispatch Readiness Verification Protocol</span>
          </div>
        }
        subtitle="Every vehicle manifest requires 4-point departmental verification before gate clearance"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 text-xs font-bold shadow-2xs">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>1. Production Complete</span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 text-xs font-bold shadow-2xs">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>2. Packaging Bundled</span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 text-xs font-bold shadow-2xs">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>3. Transporter LR Logged</span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 text-xs font-bold shadow-2xs">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>4. Gate Pass Verified</span>
          </div>
        </div>
      </Card>

      {/* Dispatches Table */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Commercial Dispatch Slips (DS-2026-XXXXXX)</span>
          </div>
        }
        subtitle="Historical and pending logistics dispatches with live security gate out timestamps"
      >
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner text="Loading logistics manifests..." />
          </div>
        ) : dispatches.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-medium">
            No active dispatch records yet. Create a manifest from the button above.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase font-sans font-bold">
                <tr>
                  <th className="p-3.5">Dispatch Number</th>
                  <th className="p-3.5">Customer / Party</th>
                  <th className="p-3.5">Vehicle &amp; Transporter</th>
                  <th className="p-3.5">Driver &amp; LR Ref</th>
                  <th className="p-3.5">Date &amp; Gate Out</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {dispatches.map((disp) => (
                  <tr key={disp.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50">
                    <td className="p-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {disp.dispatch_number}
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {disp.party?.party_name || 'Customer Account'}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-medium">
                        SO: {disp.sales_order?.order_number || 'Linked Order'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-slate-900 dark:text-white block">
                        {disp.vehicle_number}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {disp.transporter || 'Direct Courier'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="text-slate-800 dark:text-slate-200 font-medium block">
                        {disp.driver_name} {disp.driver_phone ? `(${disp.driver_phone})` : ''}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-bold">
                        LR: {disp.lr_number || 'N/A'}
                      </span>
                    </td>
                    <td className="p-3.5 font-num text-slate-500 font-medium">
                      {disp.dispatch_date}
                      {disp.gate_out_time && (
                        <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-num">
                          Gate Out: {new Date(disp.gate_out_time).toLocaleTimeString()}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      <StatusBadge status={disp.status} size="sm" />
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {disp.status === 'READY' && (
                          <Button
                            variant="brand"
                            size="xs"
                            isLoading={gateOutMutation.isPending}
                            onClick={() => gateOutMutation.mutate(disp.id)}
                            leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                          >
                            Gate Out
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleDownloadPdf(disp.id)}
                          leftIcon={<Download className="w-3.5 h-3.5" />}
                        >
                          PDF
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Dispatch Manifest Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create Transporter Dispatch Manifest"
          size="lg"
        >
          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
            {/* Error Notification inside modal */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 flex items-start gap-2.5 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Unable to register manifest</p>
                  <p className="text-[11px] opacity-90 mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Customer & Linked Sales Order Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Customer / Party Account *
                </label>
                <select
                  value={partyId}
                  onChange={(e) => handlePartyChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                >
                  <option value="">-- Select Customer / Consignee --</option>
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.party_name} ({p.party_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Linked Sales Order *
                </label>
                <select
                  value={salesOrderId}
                  onChange={(e) => handleOrderChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                >
                  <option value="">-- Select Sales Order --</option>
                  {partyOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.order_number} &bull; {o.party?.party_name || 'Customer'} [{o.status}]
                    </option>
                  ))}
                </select>
                {partyId && partyOrders.length === 0 && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-bold">
                    No sales orders found for this party.
                  </p>
                )}
              </div>
            </div>

            {/* Manifest Line Items Section */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Shipment Line Items &amp; Quantities
                </span>
                {currentOrder && (
                  <span className="text-[11px] font-mono text-slate-500">
                    Order: <span className="font-bold text-blue-600 dark:text-blue-400">{currentOrder.order_number}</span>
                  </span>
                )}
              </div>

              {manifestItems.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400 font-medium">
                  {salesOrderId
                    ? 'No line items found on this sales order.'
                    : 'Select a customer and sales order above to view line items.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {manifestItems.map((item, idx) => (
                    <div
                      key={item.sales_order_item_id || idx}
                      className={`p-3.5 rounded-xl border text-xs transition-all ${
                        item.selected
                          ? 'bg-white dark:bg-slate-800/90 border-blue-400 dark:border-blue-700/60 shadow-2xs'
                          : 'bg-slate-100/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => handleItemToggle(idx)}
                            className="mt-1 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {item.product_name}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-medium">
                              {item.specs}
                            </span>
                            <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-num">
                              <span>Ordered: {item.ordered_quantity}</span>
                              <span>Dispatched: {item.already_dispatched}</span>
                              <span className="text-blue-600 dark:text-blue-400 font-bold">
                                Bal: {Math.max(0, item.ordered_quantity - item.already_dispatched)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {item.selected && (
                          <div className="flex items-center gap-3 font-num">
                            <div>
                              <label className="block text-[10px] text-slate-500 font-sans font-bold mb-0.5">
                                Qty (Sheets)
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={item.dispatched_quantity}
                                onChange={(e) =>
                                  handleItemQtyChange(idx, Math.max(1, Number(e.target.value) || 1))
                                }
                                className="w-20 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-center"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-500 font-sans font-bold mb-0.5">
                                Bundles
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={item.package_count}
                                onChange={(e) =>
                                  handleItemPackageCountChange(idx, Math.max(1, Number(e.target.value) || 1))
                                }
                                className="w-16 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-center"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Vehicle & Logistics Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Vehicle Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. GJ-01-XX-9999"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Transporter Company
                </label>
                <input
                  type="text"
                  placeholder="e.g. V-Trans Logistics India"
                  value={transporter}
                  onChange={(e) => setTransporter(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Driver Name *
                </label>
                <input
                  type="text"
                  placeholder="Driver full name"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Driver Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="10-digit mobile"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  LR / Bilty Number
                </label>
                <input
                  type="text"
                  placeholder="LR reference"
                  value={lrNumber}
                  onChange={(e) => setLrNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Dispatch Date *
                </label>
                <input
                  type="date"
                  value={dispatchDate}
                  onChange={(e) => setDispatchDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-num font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Security Gate Remarks
                </label>
                <input
                  type="text"
                  placeholder="Optional remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={createDispatchMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="brand"
                size="md"
                isLoading={createDispatchMutation.isPending}
                onClick={handleSubmitManifest}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Register Manifest
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

