import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Card } from '../components/common/Card';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatCard } from '../components/common/StatCard';
import { useAuth } from '../context/AuthContext';
import {
  Package,
  Plus,
  ArrowRight,
  CheckCircle2,
  Boxes,
  Truck,
  Zap,
  Printer,
  AlertCircle,
  FileText,
  Layers,
  Info,
  ShieldCheck,
} from 'lucide-react';

export const PackingPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const [page, setPage] = useState(1);
  const [isPackModalOpen, setIsPackModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [successSlip, setSuccessSlip] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    sales_order_item_id: '',
    packing_type_id: '',
    packed_quantity: 100,
    package_count: 10,
    pieces_per_package: 10,
    remarks: 'Wrapped with moisture barrier & edge corner protectors',
  });

  // Queries
  const { data: packingRecordsData, isLoading: isPackingLoading } = useQuery({
    queryKey: ['packing_records', page],
    queryFn: () => apiClient.getPackingRecords({ page, page_size: 20 }),
  });

  const { data: packingTypesData } = useQuery({
    queryKey: ['packing_types'],
    queryFn: () => apiClient.getPackingTypes(),
  });

  const { data: ordersData } = useQuery({
    queryKey: ['orders_for_packing'],
    queryFn: () => apiClient.getSalesOrders({ page_size: 50 }),
  });

  const packingRecords = packingRecordsData?.data || [];
  const packingTypes = packingTypesData?.data || [];
  const orders = ordersData?.data || [];

  // Extract all available items from orders
  const allOrderItems = orders.flatMap((o) =>
    (o.items || []).map((i: any) => {
      const produced = Number(i.produced_quantity || 0);
      const packed = Number(i.packed_quantity || 0);
      const ordered = Number(i.ordered_quantity || 0);
      const maxCap = Math.max(produced, ordered);
      const available = Math.max(0, maxCap - packed);

      return {
        ...i,
        order_number: o.order_number,
        party_name: o.party?.party_name || 'Direct Customer',
        order_status: o.status,
        available_qty: available,
        ordered_qty: ordered,
        produced_qty: produced,
        packed_qty: packed,
        is_fully_packed: available <= 0,
      };
    })
  );

  const selectedItem = allOrderItems.find((i) => i.id === formData.sales_order_item_id);

  const totalPackedSheets = packingRecords.reduce((acc: number, curr: any) => acc + Number(curr.packed_quantity || 0), 0);
  const totalBundles = packingRecords.reduce((acc: number, curr: any) => acc + Number(curr.package_count || 0), 0);
  const availableToPackCount = allOrderItems.filter((i) => i.available_qty > 0).length;

  // Sync initial form values when orders or packing types load
  useEffect(() => {
    if (isPackModalOpen) {
      const availableItems = allOrderItems.filter((i) => i.available_qty > 0);
      const targetItem = availableItems.length > 0 ? availableItems[0] : allOrderItems[0];

      if (
        (!formData.sales_order_item_id ||
          !allOrderItems.some((i) => i.id === formData.sales_order_item_id)) &&
        targetItem
      ) {
        const defaultQty = targetItem.available_qty > 0 ? targetItem.available_qty : Math.min(100, targetItem.ordered_qty);
        const ppp = 10;
        setFormData((prev) => ({
          ...prev,
          sales_order_item_id: targetItem.id,
          packed_quantity: defaultQty,
          pieces_per_package: ppp,
          package_count: Math.max(1, Math.ceil(defaultQty / ppp)),
        }));
      }

      if (!formData.packing_type_id && packingTypes.length > 0) {
        setFormData((prev) => ({
          ...prev,
          packing_type_id: packingTypes[0].id,
        }));
      }
    }
  }, [isPackModalOpen, allOrderItems.length, packingTypes.length]);

  const createPackingMutation = useMutation({
    mutationFn: (data: typeof formData) => apiClient.createPackingRecord(data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['packing_records'] });
      queryClient.invalidateQueries({ queryKey: ['orders_for_packing'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setIsPackModalOpen(false);
      setModalError(null);
      setSuccessSlip(res?.data || { ...formData, packing_number: 'PKG-2026-GENERATED' });
    },
    onError: (err: any) => {
      console.error('Packaging slip creation error:', err);
      const msg = err?.message || 'Failed to generate packaging slip. Please verify item and quantity.';
      setModalError(msg);
    },
  });

  const handleOpenPackModal = (item?: any) => {
    setModalError(null);
    const defaultPackingTypeId = packingTypes[0]?.id || '';

    if (item) {
      const produced = Number(item.produced_quantity || 0);
      const packed = Number(item.packed_quantity || 0);
      const ordered = Number(item.ordered_quantity || 0);
      const available = produced > 0 ? Math.max(0, produced - packed) : Math.max(0, ordered - packed);
      const packQty = available > 0 ? available : (ordered || 100);
      const ppp = 10;

      setFormData({
        sales_order_item_id: item.id,
        packing_type_id: defaultPackingTypeId,
        packed_quantity: packQty,
        pieces_per_package: ppp,
        package_count: Math.max(1, Math.ceil(packQty / ppp)),
        remarks: 'Moisture barrier packaging with edge corner protectors',
      });
    } else {
      const first = allOrderItems[0];
      const packQty = first?.available_qty > 0 ? first.available_qty : 100;
      const ppp = 10;

      setFormData({
        sales_order_item_id: first?.id || '',
        packing_type_id: defaultPackingTypeId,
        packed_quantity: packQty,
        pieces_per_package: ppp,
        package_count: Math.max(1, Math.ceil(packQty / ppp)),
        remarks: 'Standard industrial packaging with edge corner protectors',
      });
    }
    setIsPackModalOpen(true);
  };

  const handleItemSelect = (itemId: string) => {
    const item = allOrderItems.find((i) => i.id === itemId);
    const available = item ? item.available_qty : 100;
    const targetQty = available > 0 ? available : (item?.ordered_qty || 100);
    const ppp = formData.pieces_per_package || 10;

    setFormData((prev) => ({
      ...prev,
      sales_order_item_id: itemId,
      packed_quantity: targetQty,
      package_count: Math.max(1, Math.ceil(targetQty / ppp)),
    }));
    setModalError(null);
  };

  const handleQtyChange = (qty: number, ppp: number) => {
    const safePpp = ppp > 0 ? ppp : 1;
    const packages = Math.max(1, Math.ceil(qty / safePpp));
    setFormData((prev) => ({
      ...prev,
      packed_quantity: qty,
      pieces_per_package: safePpp,
      package_count: packages,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!formData.sales_order_item_id) {
      setModalError('Please select a valid sales order line item.');
      return;
    }

    if (!formData.packing_type_id) {
      setModalError('Please select a packaging type specification.');
      return;
    }

    if (formData.packed_quantity <= 0) {
      setModalError('Packed quantity must be greater than 0 sheets.');
      return;
    }

    createPackingMutation.mutate(formData);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Packaging &amp; Bundle Queue
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Bundle finished sheets into Standard, Raffia, or Cardboard packages with automated slip generation
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasPermission('packing:execute') && (
            <Button
              variant="brand"
              size="sm"
              onClick={() => handleOpenPackModal()}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Packaging Slip
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dispatch')}
            leftIcon={<Truck className="w-4 h-4" />}
          >
            Dispatch Queue
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Packed Sheets"
          value={totalPackedSheets.toLocaleString()}
          unit="Sheets"
          subtitle="Wrapped & strapped"
          icon={<Package className="w-4.5 h-4.5" />}
          variant="amber"
        />
        <StatCard
          title="Bundles in Staging"
          value={totalBundles}
          unit="Packages"
          subtitle="Ready for truck loading"
          icon={<Boxes className="w-4.5 h-4.5" />}
          variant="blue"
        />
        <StatCard
          title="Items Awaiting Packaging"
          value={availableToPackCount}
          unit="Lines"
          subtitle="Extruded batches ready"
          icon={<Layers className="w-4.5 h-4.5" />}
          variant="emerald"
        />
      </div>

      {/* Packaging Type Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/90 via-blue-50/30 to-white dark:from-blue-950/40 dark:to-slate-900 border border-blue-200/90 dark:border-blue-800/70 space-y-2 shadow-sm shadow-blue-500/5 hover:shadow-md hover:shadow-blue-500/10 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-blue-950 dark:text-blue-200">
              Standard Packaging
            </span>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-blue-500 text-white font-bold shadow-xs">
              Default
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Strapped plastic stretch wrap with edge corner guards. Ideal for regional transport.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-emerald-50/30 to-white dark:from-emerald-950/40 dark:to-slate-900 border border-emerald-200/90 dark:border-emerald-800/70 space-y-2 shadow-sm shadow-emerald-500/5 hover:shadow-md hover:shadow-emerald-500/10 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-950 dark:text-emerald-200">
              Raffia Bag Wrapped
            </span>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500 text-white font-bold shadow-xs">
              Heavy Duty
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Woven HDPE/PP moisture-proof sacks for long-distance transit &amp; humid storage.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50/90 via-purple-50/30 to-white dark:from-purple-950/40 dark:to-slate-900 border border-purple-200/90 dark:border-purple-800/70 space-y-2 shadow-sm shadow-purple-500/5 hover:shadow-md hover:shadow-purple-500/10 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-purple-950 dark:text-purple-200">
              Corrugated Cardboard Box
            </span>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500 text-white font-bold shadow-xs">
              Export / VIP
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Reinforced 5-ply cartons for premium Prelam sheets and UV marble panels.
          </p>
        </div>
      </div>

      {/* Packaging Slip Ledger Table */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" />
            <span>Generated Packaging Slips (PKG-2026-XXXXXX)</span>
          </div>
        }
        subtitle="Active bundle records transferred forward into Dispatch eligibility"
      >
        {isPackingLoading ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner text="Loading packaging queue..." />
          </div>
        ) : packingRecords.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-3 font-medium">
            <Boxes className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
            <p>No packaging slips logged yet. Click "Create Packaging Slip" to bundle ready inventory.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase font-sans font-bold">
                <tr>
                  <th className="p-3.5">Packing Number</th>
                  <th className="p-3.5">Product Line</th>
                  <th className="p-3.5">Packing Type</th>
                  <th className="p-3.5 text-right">Packed Qty</th>
                  <th className="p-3.5 text-right">Packages</th>
                  <th className="p-3.5">Packed At</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {packingRecords.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50">
                    <td className="p-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {pkg.packing_number}
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {pkg.sales_order_item?.product?.product_name || 'PVC Celuka Ply'}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-bold">
                        {pkg.sales_order_item?.thickness?.display_label} • {pkg.sales_order_item?.density?.display_label}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {pkg.packing_type?.name || 'Standard Industrial'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-num font-bold text-slate-900 dark:text-white">
                      {pkg.packed_quantity} Sheets
                    </td>
                    <td className="p-3.5 text-right font-num text-slate-600 dark:text-slate-400 font-medium">
                      {pkg.package_count} Bundles ({pkg.pieces_per_package} pcs/ea)
                    </td>
                    <td className="p-3.5 font-num text-slate-500 font-medium">
                      {new Date(pkg.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-center">
                      <StatusBadge status="READY_FOR_DISPATCH" size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pack Modal */}
      {isPackModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => {
            setIsPackModalOpen(false);
            setModalError(null);
          }}
          title="Create Bundle Packaging Slip"
          subtitle="Generate verifiable QR-tagged bundle packing record"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Order Line Item *
              </label>
              <select
                value={formData.sales_order_item_id}
                onChange={(e) => handleItemSelect(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-bold shadow-2xs"
                required
              >
                {allOrderItems.length === 0 ? (
                  <option value="">No order line items found</option>
                ) : (
                  allOrderItems.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.order_number} ({i.party_name}) — {i.product?.product_name || 'Product'} [{i.thickness?.display_label || ''} {i.density?.display_label || ''}] | Available: {i.available_qty} Sheets
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Item Insights Card */}
            {selectedItem && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="font-medium">Customer &amp; Order:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {selectedItem.order_number} • {selectedItem.party_name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="font-medium">Product Specification:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-200">
                    {selectedItem.product?.product_name} ({selectedItem.thickness?.display_label} • {selectedItem.density?.display_label})
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 font-medium">Inventory Status:</span>
                  <span className="font-num font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedItem.available_qty} Sheets Available to Pack (Ordered: {selectedItem.ordered_qty})
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Packaging Type *
                </label>
                <select
                  value={formData.packing_type_id}
                  onChange={(e) => setFormData({ ...formData, packing_type_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold shadow-2xs"
                  required
                >
                  {packingTypes.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Total Packed Quantity (Sheets) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.packed_quantity}
                  onChange={(e) =>
                    handleQtyChange(Number(e.target.value), formData.pieces_per_package)
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-num font-bold text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pieces Per Package (Bundle) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.pieces_per_package}
                  onChange={(e) =>
                    handleQtyChange(formData.packed_quantity, Number(e.target.value))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-num font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Calculated Package Count
                </label>
                <input
                  type="number"
                  readOnly
                  value={formData.package_count}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-num font-bold text-sm cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Quality &amp; Handling Remarks
              </label>
              <input
                type="text"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                placeholder="e.g. Moisture wrap + corner protectors verified"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => {
                  setIsPackModalOpen(false);
                  setModalError(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="brand"
                size="md"
                type="submit"
                isLoading={createPackingMutation.isPending}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Generate Bundle Slip
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Success Confirmation Modal with Print Slip */}
      {successSlip && (
        <Modal
          isOpen={true}
          onClose={() => setSuccessSlip(null)}
          title="Packaging Slip Generated Successfully"
          subtitle="Bundle record registered and queued for logistics dispatch"
        >
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-center space-y-2 shadow-2xs">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-300">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-num text-lg font-bold text-emerald-900 dark:text-emerald-100">
                {successSlip.packing_number || 'PKG-2026-XXXXXX'}
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                {successSlip.packed_quantity} Sheets packed into {successSlip.package_count} Bundles ({successSlip.pieces_per_package} pcs/bundle).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Status:</span>
                <StatusBadge status="READY_FOR_DISPATCH" size="sm" />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Packaging Type:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {successSlip.packing_type?.name || 'Standard Industrial'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Created At:</span>
                <span className="font-num text-slate-700 dark:text-slate-300 font-bold">
                  {new Date().toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Print Slip
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSuccessSlip(null)}
                >
                  Close
                </Button>
                <Button
                  variant="brand"
                  size="sm"
                  onClick={() => {
                    setSuccessSlip(null);
                    navigate('/dispatch');
                  }}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Go to Dispatch
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

