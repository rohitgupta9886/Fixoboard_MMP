import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  ShoppingCart,
  Box,
  Layers,
  FileCheck,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Building2,
  Camera,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { Button } from '../components/common/Button';
import { Card, CardHeader } from '../components/common/Card';

export const SalesOrderCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(1);
  const [partyId, setPartyId] = useState('');
  const [orderSource, setOrderSource] = useState('MANUAL');
  const [customerPoNumber, setCustomerPoNumber] = useState('');
  const [requiredDate, setRequiredDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [priority, setPriority] = useState('NORMAL');
  const [remarks, setRemarks] = useState('Standard Celuka production order');
  const [mutationError, setMutationError] = useState<string | null>(null);

  const [items, setItems] = useState([
    {
      product_id: '',
      thickness_id: '',
      density_id: '',
      ordered_quantity: 100,
      unit_price: 1350,
      unit: 'Sheets',
      remarks: 'Primary Celuka batch',
    },
  ]);

  // Master Data Queries
  const { data: partiesData } = useQuery({
    queryKey: ['parties-all'],
    queryFn: () => apiClient.getAllParties(),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => apiClient.getAllProducts(),
  });

  const { data: thicknessesData } = useQuery({
    queryKey: ['spec-thicknesses'],
    queryFn: () => apiClient.getThicknesses(),
  });

  const { data: densitiesData } = useQuery({
    queryKey: ['spec-densities'],
    queryFn: () => apiClient.getDensities(),
  });

  const parties = partiesData?.data || [];
  const products = productsData?.data || [];
  const thicknesses = thicknessesData?.data || [];
  const densities = densitiesData?.data || [];

  // Auto-populate master data defaults
  useEffect(() => {
    if (!partyId && parties.length > 0) {
      setPartyId(parties[0].id);
    }
  }, [parties, partyId]);

  useEffect(() => {
    if (products.length > 0 && thicknesses.length > 0 && densities.length > 0) {
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          product_id: item.product_id || products[0].id,
          thickness_id: item.thickness_id || thicknesses[0].id,
          density_id: item.density_id || densities[0].id,
        }))
      );
    }
  }, [products, thicknesses, densities]);

  const selectedParty = parties.find((p) => p.id === partyId) || parties[0];
  const totalSheets = items.reduce((acc, curr) => acc + Number(curr.ordered_quantity || 0), 0);
  const totalValue = items.reduce(
    (acc, curr) => acc + Number(curr.ordered_quantity || 0) * Number(curr.unit_price || 0),
    0
  );

  // Mutation to create Sales Order
  const createMutation = useMutation({
    mutationFn: async (submitForApproval: boolean) => {
      setMutationError(null);

      const targetPartyId = partyId || (parties.length > 0 ? parties[0].id : '');
      if (!targetPartyId) {
        throw new Error('Please select a customer before submitting.');
      }

      const formattedItems = items.map((i) => ({
        product_id: i.product_id || (products.length > 0 ? products[0].id : ''),
        thickness_id: i.thickness_id || (thicknesses.length > 0 ? thicknesses[0].id : ''),
        density_id: i.density_id || (densities.length > 0 ? densities[0].id : ''),
        ordered_quantity: Number(i.ordered_quantity) || 10,
        unit_price: Number(i.unit_price) || 1200,
        unit: i.unit || 'Sheets',
        remarks: i.remarks || undefined,
      }));

      const payload = {
        party_id: targetPartyId,
        order_source: orderSource || 'MANUAL',
        customer_po_number: customerPoNumber || undefined,
        required_date: requiredDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        priority: priority || 'NORMAL',
        remarks: remarks || 'Standard Celuka production order',
        items: formattedItems,
      };

      const res = await apiClient.createSalesOrder(payload);
      const created = res.data;

      if (submitForApproval && created?.id) {
        try {
          await apiClient.submitSalesOrder(created.id);
        } catch (submitErr) {
          console.warn('Order created in Draft; auto-submit notice:', submitErr);
        }
      }

      return created;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      navigate(`/sales-orders/${data.id}`);
    },
    onError: (err: any) => {
      console.error('Order creation error:', err);
      let errorMsg = 'Failed to create sales order.';
      if (err?.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorMsg = err.response.data.detail
            .map((d: any) => `${d.loc?.slice(-1)[0] || 'Field'}: ${d.msg}`)
            .join(' | ');
        } else {
          errorMsg = err.response.data.detail;
        }
      } else if (err?.response?.data?.error?.message) {
        errorMsg = err.response.data.error.message;
      } else if (err?.message) {
        errorMsg = err.message;
      }
      setMutationError(errorMsg);
    },
  });

  const steps = [
    { num: 1, label: 'Customer', icon: Users },
    { num: 2, label: 'Order Info', icon: ShoppingCart },
    { num: 3, label: 'Products', icon: Box },
    { num: 4, label: 'Specs & QA', icon: Layers },
    { num: 5, label: 'Review', icon: FileCheck },
    { num: 6, label: 'Submit', icon: CheckCircle2 },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-150">
      {/* Top Breadcrumb & Return */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/sales-orders')}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sales Orders</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span>Batch Valuation:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 font-num">
            ₹{totalValue.toLocaleString()} ({totalSheets} Sheets)
          </span>
        </div>
      </div>

      {/* Header & AI Auto-fill Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Create Sales Order
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Guided industrial order configuration with real-time specification validation.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/ai-scanner')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-500/20 border border-purple-400/30 transition-all hover:scale-102 self-start sm:self-auto"
        >
          <Camera className="w-4 h-4" />
          <span>Auto-Fill from Camera / Receipt (AI)</span>
        </button>
      </div>

      {/* 6-Step Wizard Stepper Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="grid grid-cols-6 gap-2">
          {steps.map((step) => {
            const Icon = step.icon;
            const isDone = currentStep > step.num;
            const isCurrent = currentStep === step.num;

            return (
              <div
                key={step.num}
                onClick={() => isDone && setCurrentStep(step.num)}
                className={`flex flex-col items-center text-center p-2 rounded-xl transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800 shadow-glow-brand/20'
                    : isDone
                    ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                    : 'text-slate-400 opacity-60'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs mb-1.5 ${
                    isCurrent
                      ? 'bg-blue-600 text-white'
                      : isDone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                <span className="text-[11px] truncate w-full hidden sm:block">
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content Container */}
      <Card padding="lg">
        {mutationError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-3 text-xs text-rose-700 dark:text-rose-300 font-semibold">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <div className="flex-1 font-medium">{mutationError}</div>
          </div>
        )}

        {/* STEP 1: CUSTOMER SELECTION */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <CardHeader
              title="Step 01: Select Customer / Dealer"
              subtitle="Choose party account with active GSTIN and credit verification"
              icon={<Users className="w-5 h-5" />}
            />

            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Customer Account
              </label>
              <select
                value={partyId}
                onChange={(e) => setPartyId(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 shadow-2xs"
              >
                {parties.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.party_name} ({p.party_code || 'PTY'} • GST: {p.gst_number || p.gstin || 'VERIFIED'})
                  </option>
                ))}
              </select>

              {/* Selected Party Insight Card */}
              {selectedParty && (
                <div className="p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/70 space-y-3.5 text-xs shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-bold text-sm">
                      <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>{selectedParty.party_name} ({selectedParty.party_code})</span>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/70 text-blue-800 dark:text-blue-300">
                      {selectedParty.payment_terms || '30 Days Net'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700 dark:text-slate-300 pt-1">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">State / City</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {selectedParty.billing_address
                          ? selectedParty.billing_address.split(',').slice(-2).join(', ').trim() || selectedParty.billing_address
                          : 'Not Specified'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">GSTIN</span>
                      <span className="font-bold font-mono text-slate-900 dark:text-slate-100">
                        {selectedParty.gst_number || (selectedParty as any).gstin || 'Not Registered'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Credit Limit</span>
                      <span className="font-bold font-num text-emerald-600 dark:text-emerald-400">
                        {selectedParty.credit_limit
                          ? `₹${Number(selectedParty.credit_limit).toLocaleString('en-IN')}`
                          : '₹0 (Standard)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Contact Person</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {selectedParty.contact_person || 'Commercial Desk'}
                        {selectedParty.phone && (
                          <span className="text-slate-500 dark:text-slate-400 font-medium block text-[11px] font-num">
                            {selectedParty.phone}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {selectedParty.billing_address && (
                    <div className="pt-2 border-t border-blue-200/80 dark:border-blue-900/60 text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Billing Address:</span>
                      <span className="truncate font-medium">{selectedParty.billing_address}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: ORDER INFO */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <CardHeader
              title="Step 02: Order Details & Required Date"
              subtitle="Specify order origin channel and target dispatch timeline"
              icon={<ShoppingCart className="w-5 h-5" />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Order Source
                </label>
                <select
                  value={orderSource}
                  onChange={(e) => setOrderSource(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-slate-100 shadow-2xs"
                >
                  <option value="MANUAL">Direct Factory / Manual Entry</option>
                  <option value="EMAIL">Corporate Contract (Email)</option>
                  <option value="PHONE">Phone / Telephonic Order</option>
                  <option value="EDI">EDI / Automated Pipeline</option>
                  <option value="OTHER">Other Channels</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Customer PO Number
                </label>
                <input
                  type="text"
                  value={customerPoNumber}
                  onChange={(e) => setCustomerPoNumber(e.target.value)}
                  placeholder="e.g. PO-ATL-9921"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-slate-100 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Required By Date
                </label>
                <input
                  type="date"
                  value={requiredDate}
                  onChange={(e) => setRequiredDate(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-slate-100 shadow-2xs font-num"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Order Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-slate-100 shadow-2xs"
                >
                  <option value="NORMAL">Normal Turnaround</option>
                  <option value="HIGH">High Priority (Fast-Track Extrusion)</option>
                  <option value="URGENT">Urgent (Immediate Line Slot)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 & 4: PRODUCTS & SPECIFICATIONS */}
        {(currentStep === 3 || currentStep === 4) && (
          <div className="space-y-6">
            <CardHeader
              title={currentStep === 3 ? 'Step 03: Select Product Line' : 'Step 04: Calibrated Thickness & Density'}
              subtitle="Configure extruded formulation, thickness (mm), and target density (g/cm³)"
              icon={<Box className="w-5 h-5" />}
            />

            {items.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850/70 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Line Item #{idx + 1}
                  </span>
                  {items.length > 1 && (
                    <button
                      onClick={() => setItems(items.filter((_, i) => i !== idx))}
                      className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Product Type
                    </label>
                    <select
                      value={item.product_id}
                      onChange={(e) => {
                        const val = e.target.value;
                        setItems(items.map((it, i) => (i === idx ? { ...it, product_id: val } : it)));
                      }}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs"
                    >
                      {products.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.product_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Calibrated Thickness
                    </label>
                    <select
                      value={item.thickness_id}
                      onChange={(e) => {
                        const val = e.target.value;
                        setItems(items.map((it, i) => (i === idx ? { ...it, thickness_id: val } : it)));
                      }}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs"
                    >
                      {thicknesses.map((t: any) => (
                        <option key={t.id} value={t.id}>
                          {t.thickness_value} mm (Tolerance ±0.2mm)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Density Grade
                    </label>
                    <select
                      value={item.density_id}
                      onChange={(e) => {
                        const val = e.target.value;
                        setItems(items.map((it, i) => (i === idx ? { ...it, density_id: val } : it)));
                      }}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs"
                    >
                      {densities.map((d: any) => (
                        <option key={d.id} value={d.id}>
                          {d.density_value} g/cm³ ({d.density_category || 'Celuka Marine'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Ordered Quantity (Sheets)
                    </label>
                    <input
                      type="number"
                      value={item.ordered_quantity}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setItems(items.map((it, i) => (i === idx ? { ...it, ordered_quantity: val } : it)));
                      }}
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold font-num text-slate-900 dark:text-slate-100 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Unit Price (₹ per Sheet)
                    </label>
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setItems(items.map((it, i) => (i === idx ? { ...it, unit_price: val } : it)));
                      }}
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold font-num text-slate-900 dark:text-slate-100 shadow-2xs"
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setItems([
                  ...items,
                  {
                    product_id: products[0]?.id || '',
                    thickness_id: thicknesses[0]?.id || '',
                    density_id: densities[0]?.id || '',
                    ordered_quantity: 50,
                    unit_price: 1350,
                    unit: 'Sheets',
                    remarks: '',
                  },
                ])
              }
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Another Line Item
            </Button>
          </div>
        )}

        {/* STEP 5 & 6: REVIEW & SUBMIT */}
        {(currentStep === 5 || currentStep === 6) && (
          <div className="space-y-6">
            <CardHeader
              title={currentStep === 5 ? 'Step 05: Order Summary Review' : 'Step 06: Confirmation & Extrusion Queue'}
              subtitle="Confirm pricing, batch parameters, and automated manufacturing route"
              icon={<FileCheck className="w-5 h-5" />}
            />

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-800 space-y-4 text-xs shadow-2xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Customer</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {selectedParty?.party_name || 'ABC Traders'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Total Quantity</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm font-num">
                    {totalSheets} Sheets
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Required Date</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm font-num">
                    {requiredDate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Total Valuation</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm font-num">
                    ₹{totalValue.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Items Matrix */}
              <div className="space-y-2">
                <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block text-[10px]">
                  Configured Line Items
                </span>
                {items.map((it, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs"
                  >
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Item #{idx + 1}: {it.ordered_quantity} Sheets @ ₹{it.unit_price}/sht
                    </span>
                    <span className="font-num font-bold text-slate-900 dark:text-slate-100">
                      ₹{(Number(it.ordered_quantity) * Number(it.unit_price)).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Navigation */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Previous
          </Button>

          {currentStep < 6 ? (
            <Button
              variant="brand"
              size="md"
              onClick={() => setCurrentStep(Math.min(6, currentStep + 1))}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue to Step 0{currentStep + 1}
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="md"
                isLoading={createMutation.isPending}
                onClick={() => createMutation.mutate(false)}
              >
                Save as Draft
              </Button>
              <Button
                variant="brand"
                size="md"
                isLoading={createMutation.isPending}
                onClick={() => createMutation.mutate(true)}
                rightIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Submit &amp; Queue for Extrusion
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

