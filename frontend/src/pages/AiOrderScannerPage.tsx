import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Camera,
  Upload,
  Sparkles,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Eye,
  RefreshCw,
  Plus,
  Trash2,
  Building2,
  Calendar,
  Layers,
  ShieldCheck,
  Zap,
  Info,
  Clock,
  Check,
  X,
  FileText,
  ScanLine,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { Button } from '../components/common/Button';
import { Card, CardHeader } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { ScannedOrder, ScannedOrderItem, Party, Product, Thickness, Density } from '../types';

export const AiOrderScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeScan, setActiveScan] = useState<ScannedOrder | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Editable fields in review mode
  const [selectedPartyId, setSelectedPartyId] = useState<string>('');
  const [requiredDate, setRequiredDate] = useState<string>(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [priority, setPriority] = useState<string>('NORMAL');
  const [remarks, setRemarks] = useState<string>('');
  const [items, setItems] = useState<ScannedOrderItem[]>([]);

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

  const { data: recentScansData, refetch: refetchScans, isLoading: isLoadingScans } = useQuery({
    queryKey: ['scanned-orders-list'],
    queryFn: () => apiClient.getScannedOrders({ limit: 20 }),
  });

  const parties: Party[] = partiesData?.data || [];
  const products: Product[] = productsData?.data || [];
  const thicknesses: Thickness[] = thicknessesData?.data || [];
  const densities: Density[] = densitiesData?.data || [];
  const recentScans: ScannedOrder[] = Array.isArray(recentScansData) ? recentScansData : [];

  // When activeScan changes, populate review form
  useEffect(() => {
    if (activeScan) {
      if (activeScan.dealer_id) {
        setSelectedPartyId(activeScan.dealer_id);
      } else if (parties.length > 0) {
        const found = parties.find(
          (p) =>
            p.party_name.toLowerCase().includes((activeScan.extracted_customer_name || '').toLowerCase()) ||
            (activeScan.extracted_customer_name || '').toLowerCase().includes(p.party_name.toLowerCase())
        );
        setSelectedPartyId(found ? found.id : parties[0].id);
      }

      if (activeScan.extracted_required_date) {
        setRequiredDate(activeScan.extracted_required_date);
      }

      setRemarks(activeScan.extracted_remarks || `Digitized via AI Vision Scanner (${activeScan.scan_number})`);
      setItems(
        activeScan.items && activeScan.items.length > 0
          ? activeScan.items.map((it) => ({
              ...it,
              matched_product_id: it.matched_product_id || (products[0]?.id || ''),
              matched_thickness_id: it.matched_thickness_id || (thicknesses[0]?.id || ''),
              matched_density_id: it.matched_density_id || (densities[0]?.id || ''),
            }))
          : []
      );
    }
  }, [activeScan, parties, products, thicknesses, densities]);

  // Handle local file selection
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploadError(null);
    setSuccessMessage(null);
  };

  // Upload & Process with AI
  const processImageScan = async (fileToUpload?: File, sampleUrl?: string, sampleText?: string) => {
    try {
      setIsScanning(true);
      setUploadError(null);
      setSuccessMessage(null);

      let scanResult: ScannedOrder;
      if (fileToUpload) {
        scanResult = await apiClient.uploadScannedOrder(fileToUpload);
      } else if (sampleUrl) {
        setPreviewUrl(sampleUrl);
        scanResult = await apiClient.uploadScannedOrder(sampleUrl, undefined, sampleText);
      } else if (selectedFile) {
        scanResult = await apiClient.uploadScannedOrder(selectedFile);
      } else {
        throw new Error('Please select an image or use the camera first.');
      }

      setActiveScan(scanResult);
      refetchScans();
      setSuccessMessage(`Order ${scanResult.scan_number} digitized successfully with ${scanResult.overall_confidence}% AI confidence!`);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to scan and extract order details');
    } finally {
      setIsScanning(false);
    }
  };

  // Human Review Handlers
  const handleItemChange = (index: number, field: keyof ScannedOrderItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddItem = () => {
    if (products.length === 0 || thicknesses.length === 0 || densities.length === 0) return;
    const newItem: ScannedOrderItem = {
      product_name: products[0].product_name,
      matched_product_id: products[0].id,
      matched_thickness_id: thicknesses[0].id,
      matched_density_id: densities[0].id,
      thickness_label: thicknesses[0].display_label,
      density_label: densities[0].display_label,
      quantity: 50,
      unit: 'Sheets',
      confidence_score: 95,
      is_ambiguous: false,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Approve & Place Order Mutation
  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!activeScan) throw new Error('No active scan selected');
      if (!selectedPartyId) throw new Error('Please select a customer party');
      if (items.length === 0) throw new Error('Order must have at least one line item');

      // 1. Update draft with latest human adjustments
      await apiClient.updateScannedOrderDraft(activeScan.id, {
        dealer_id: selectedPartyId,
        extracted_required_date: requiredDate,
        extracted_remarks: remarks,
        items: items.map((it) => ({
          product_name: it.product_name,
          matched_product_id: it.matched_product_id,
          matched_thickness_id: it.matched_thickness_id,
          matched_density_id: it.matched_density_id,
          thickness_label: it.thickness_label,
          density_label: it.density_label,
          quantity: it.quantity,
          unit: it.unit,
          confidence_score: it.confidence_score,
          is_ambiguous: it.is_ambiguous,
          raw_item_text: it.raw_item_text || it.product_name,
        })),
      });

      // 2. Approve and promote to official Sales Order
      return await apiClient.approveScannedOrder(activeScan.id, {
        party_id: selectedPartyId,
        priority: priority,
        required_date: requiredDate,
        remarks: remarks,
      });
    },
    onSuccess: (salesOrder: any) => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['scanned-orders-list'] });
      const orderId = salesOrder?.id || salesOrder?.data?.id;
      if (orderId) {
        navigate(`/sales-orders/${orderId}`);
      } else {
        navigate('/sales-orders');
      }
    },
    onError: (err: any) => {
      setUploadError(err.message || 'Failed to approve and place sales order');
    },
  });

  // Reject Scan Mutation
  const rejectMutation = useMutation({
    mutationFn: async () => {
      if (!activeScan) return;
      await apiClient.rejectScannedOrder(activeScan.id, 'Operator marked as invalid scan');
    },
    onSuccess: () => {
      setActiveScan(null);
      refetchScans();
      setSuccessMessage('Scanned document marked as rejected.');
    },
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
              Multimodal Vision AI & Smart OCR
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              AI Mobile Camera Order Scanner
            </h1>
            <p className="text-slate-300 text-sm md:text-base mt-1 max-w-2xl">
              Capture or upload photos of handwritten order slips, dealer chits, or printed purchase orders. The AI extracts line items, matches catalog specifications, and submits confirmed orders with 1-click human approval.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            {/* Standard File Upload Button */}
            <input
              type="file"
              accept="image/*,application/pdf"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  handleFileSelect(f);
                  processImageScan(f);
                }
              }}
            />
            {/* Direct Camera Capture on Mobile */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              id="camera-input-trigger"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  handleFileSelect(f);
                  processImageScan(f);
                }
              }}
            />
            <Button
              variant="secondary"
              onClick={() => document.getElementById('camera-input-trigger')?.click()}
              className="flex-1 sm:flex-initial bg-white/20 hover:bg-white/30 text-white border border-white/30 font-semibold px-4 py-2.5"
            >
              <Camera className="w-4 h-4 mr-2" />
              Snap Photo
            </Button>
            <Button
              variant="primary"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 sm:flex-initial bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/30 border border-purple-400/30 font-semibold px-5 py-2.5"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Chit
            </Button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {uploadError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 flex items-start gap-3 shadow-xs animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm font-medium">{uploadError}</div>
          <button onClick={() => setUploadError(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 flex items-start gap-3 shadow-xs animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm font-medium">{successMessage}</div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Test Preset Order Chits (For Instant Demo & Testing) */}
      {!activeScan && !isScanning && (
        <Card className="border border-purple-100 dark:border-purple-900/30 bg-purple-50/40 dark:bg-purple-950/20">
          <div className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Try Sample Factory Order Chits
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Test the AI extraction engine instantly with realistic pre-scanned handwritten orders
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  processImageScan(
                    undefined,
                    'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&auto=format&fit=crop&q=60',
                    'Apex Doors & Interiors\nPh: 9823456789\nFixoBoard WPC Ply 18mm - 60 sheets\nFixoBoard PVC Foam 12mm - 30 sheets\nSolid WPC Doors 30mm - 15 pcs\nLocation: Bhiwandi Site 4\nRequired: 2026-09-08'
                  )
                }
                className="text-xs bg-white dark:bg-slate-900"
              >
                Sample 1: Apex Doors Chit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  processImageScan(
                    undefined,
                    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=60',
                    'National Plywood Distributors Pune\nContact: 9811223344\nFixoBoard 100% Lead-Free PVC Foam Sheet 18mm - 120 sheets\nFixoBoard Prelam Textured 18mm - 40 sheets\nDeliver: Pune Wagholi Depot'
                  )
                }
                className="text-xs bg-white dark:bg-slate-900"
              >
                Sample 2: National Ply PO
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  processImageScan(
                    undefined,
                    'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=60',
                    'Shree Ganesh Timber & Hardware\nPh: 9765432100\nSolid WPC Door Frames 4x2 - 50 pcs\nFixoBoard WPC Solid Board 25mm - 25 sheets\nUrgent Factory Dispatch'
                  )
                }
                className="text-xs bg-white dark:bg-slate-900"
              >
                Sample 3: Shree Ganesh Hardware
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* AI Processing Radar / Scanning State */}
      {isScanning && (
        <Card className="p-12 text-center flex flex-col items-center justify-center space-y-6 border-purple-200 dark:border-purple-900/50 bg-gradient-to-b from-white to-purple-50/30 dark:from-slate-900 dark:to-purple-950/20 shadow-lg">
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* Spinning Radar circles */}
            <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 animate-ping" />
            <div className="absolute inset-2 rounded-full border-2 border-indigo-500/40 animate-pulse" />
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-purple-500/40">
              <ScanLine className="w-10 h-10 animate-bounce" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600 animate-spin" />
              Multimodal Vision AI Processing Document...
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
              Extracting handwritten and printed texts, recognizing customer details, and matching PVC/WPC product lines against catalog specifications.
            </p>
          </div>
        </Card>
      )}

      {/* Human-in-the-Loop Review Workspace (When an active scan is loaded) */}
      {activeScan && !isScanning && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Image Viewer */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="overflow-hidden border border-slate-200 dark:border-slate-800">
              <CardHeader
                title="Scanned Order Document"
                subtitle={`Scan Ref: ${activeScan.scan_number}`}
                action={
                  <Badge
                    status={`${activeScan.overall_confidence}% AI Confidence`}
                    className={Number(activeScan.overall_confidence) >= 90 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}
                  />
                }
              />
              <div className="p-4 bg-slate-950/5 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800">
                <div className="relative rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-900 flex items-center justify-center min-h-[320px] max-h-[480px]">
                  <img
                    src={previewUrl || activeScan.image_url}
                    alt="Order Scan"
                    className="w-full h-full object-contain max-h-[460px] rounded-lg"
                    onError={(e) => {
                      // Fallback image if local upload not found
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&auto=format&fit=crop&q=60';
                    }}
                  />
                  <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-mono flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    OCR Source Image
                  </div>
                </div>

                {/* Raw OCR Text Snippet Accordion / Info */}
                {activeScan.raw_extracted_text && (
                  <div className="mt-4 p-3 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-xs font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <div className="font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      Transcribed OCR Text
                    </div>
                    <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
                      {activeScan.raw_extracted_text}
                    </pre>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column: Interactive Human Approval Form */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border border-purple-200/80 dark:border-purple-800/50 shadow-md">
              <CardHeader
                title="Human-in-the-Loop Order Review"
                subtitle="Verify and adjust AI extracted data before official placement"
                action={
                  <Badge variant="purple" size="md">
                    <Sparkles className="w-3 h-3 mr-1" />
                    CAT Source (Camera Translated)
                  </Badge>
                }
              />

              <div className="p-6 space-y-6 border-t border-slate-200 dark:border-slate-800">
                {/* Header Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Party / Customer Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Customer / Dealer Party *
                    </label>
                    <select
                      value={selectedPartyId}
                      onChange={(e) => setSelectedPartyId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 font-medium"
                    >
                      {parties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.party_name} ({p.party_code})
                        </option>
                      ))}
                    </select>
                    {activeScan.extracted_customer_name && (
                      <p className="text-2xs text-purple-600 dark:text-purple-400 mt-1 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        AI detected: "{activeScan.extracted_customer_name}"
                        {activeScan.extracted_customer_phone && ` (Ph: ${activeScan.extracted_customer_phone})`}
                      </p>
                    )}
                  </div>

                  {/* Required Delivery Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Required Delivery Date *
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={requiredDate}
                        onChange={(e) => setRequiredDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 font-medium"
                      />
                    </div>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Production Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 font-medium"
                    >
                      <option value="NORMAL">Normal Priority</option>
                      <option value="HIGH">High Priority (Urgent)</option>
                      <option value="URGENT">Critical Expedited (24h)</option>
                    </select>
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Order Remarks
                    </label>
                    <input
                      type="text"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="e.g. Deliver to Bhiwandi Bay 4"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-600" />
                      Extracted Order Line Items ({items.length})
                    </h4>
                    <Button variant="outline" size="sm" onClick={handleAddItem} className="text-xs">
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add Line Item
                    </Button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
                        <tr>
                          <th className="p-3">Product Catalog Item</th>
                          <th className="p-3">Thickness</th>
                          <th className="p-3">Density</th>
                          <th className="p-3 w-24">Qty</th>
                          <th className="p-3 w-20">Unit</th>
                          <th className="p-3 text-center">Confidence</th>
                          <th className="p-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            {/* Product Dropdown */}
                            <td className="p-2.5 min-w-[200px]">
                              <select
                                value={item.matched_product_id}
                                onChange={(e) => {
                                  const p = products.find((x) => x.id === e.target.value);
                                  handleItemChange(idx, 'matched_product_id', e.target.value);
                                  if (p) handleItemChange(idx, 'product_name', p.product_name);
                                }}
                                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                              >
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.product_name}
                                  </option>
                                ))}
                              </select>
                              {item.raw_item_text && (
                                <span className="block text-3xs text-slate-400 mt-0.5 truncate">
                                  Raw: "{item.raw_item_text}"
                                </span>
                              )}
                            </td>

                            {/* Thickness Dropdown */}
                            <td className="p-2.5 min-w-[110px]">
                              <select
                                value={item.matched_thickness_id}
                                onChange={(e) => {
                                  const t = thicknesses.find((x) => x.id === e.target.value);
                                  handleItemChange(idx, 'matched_thickness_id', e.target.value);
                                  if (t) handleItemChange(idx, 'thickness_label', t.display_label);
                                }}
                                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                              >
                                {thicknesses.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.display_label}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Density Dropdown */}
                            <td className="p-2.5 min-w-[110px]">
                              <select
                                value={item.matched_density_id}
                                onChange={(e) => {
                                  const d = densities.find((x) => x.id === e.target.value);
                                  handleItemChange(idx, 'matched_density_id', e.target.value);
                                  if (d) handleItemChange(idx, 'density_label', d.display_label);
                                }}
                                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                              >
                                {densities.map((d) => (
                                  <option key={d.id} value={d.id}>
                                    {d.display_label}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Quantity Input */}
                            <td className="p-2.5">
                              <input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                                className="w-20 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-bold"
                              />
                            </td>

                            {/* Unit */}
                            <td className="p-2.5">
                              <select
                                value={item.unit || 'Sheets'}
                                onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                                className="w-20 px-1.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                              >
                                <option value="Sheets">Sheets</option>
                                <option value="Pieces">Pieces</option>
                                <option value="Sets">Sets</option>
                              </select>
                            </td>

                            {/* Confidence Badge */}
                            <td className="p-2.5 text-center">
                              <Badge
                                variant={Number(item.confidence_score) >= 90 ? 'success' : 'warning'}
                                size="sm"
                              >
                                {item.confidence_score}%
                              </Badge>
                            </td>

                            {/* Delete Action */}
                            <td className="p-2.5 text-center">
                              <button
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                                title="Remove line item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Summary & Place Order Actions */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Total Quantity: <strong className="text-slate-900 dark:text-white font-bold text-sm">{items.reduce((acc, it) => acc + Number(it.quantity || 0), 0)} units</strong> across {items.length} line items
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => rejectMutation.mutate()}
                      isLoading={rejectMutation.isPending}
                      className="px-4"
                    >
                      <X className="w-4 h-4 mr-1.5" />
                      Reject Scan
                    </Button>

                    <Button
                      variant="primary"
                      onClick={() => approveMutation.mutate()}
                      isLoading={approveMutation.isPending}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-6 py-2.5 shadow-lg shadow-emerald-500/20"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Approve & Place Sales Order
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Queue & History of Scanned Orders */}
      <Card>
        <CardHeader
          title="Digital Order Scanner Queue"
          subtitle="Recent camera captures, handwritten receipts, and PO scans"
          action={
            <Button variant="outline" size="sm" onClick={() => refetchScans()} isLoading={isLoadingScans}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh Queue
            </Button>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">Scan Ref #</th>
                <th className="p-4">Customer / Dealer</th>
                <th className="p-4">Extracted Items</th>
                <th className="p-4 text-center">AI Confidence</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4">Scan Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {recentScans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    No order scans captured yet. Take a photo or upload an image to start!
                  </td>
                </tr>
              ) : (
                recentScans.map((scan) => (
                  <tr
                    key={scan.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-4 font-mono font-bold text-purple-600 dark:text-purple-400">
                      {scan.scan_number}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {scan.dealer?.party_name || scan.extracted_customer_name || 'Direct Customer'}
                      </div>
                      {scan.extracted_customer_phone && (
                        <div className="text-xs text-slate-500">Ph: {scan.extracted_customer_phone}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-xs text-slate-700 dark:text-slate-300">
                        {scan.items?.length || 0} line items ({scan.items?.reduce((acc, it) => acc + Number(it.quantity || 0), 0) || 0} units)
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <Badge
                        variant={Number(scan.overall_confidence) >= 90 ? 'success' : 'warning'}
                        size="sm"
                      >
                        {scan.overall_confidence}%
                      </Badge>
                    </td>
                    <td className="p-4 text-center">
                      <Badge
                        variant={
                          scan.status === 'APPROVED'
                            ? 'success'
                            : scan.status === 'REJECTED'
                            ? 'danger'
                            : 'purple'
                        }
                        size="sm"
                      >
                        {scan.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-xs text-slate-500">
                      {new Date(scan.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      {scan.status === 'APPROVED' && scan.converted_sales_order_id ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/sales-orders/${scan.converted_sales_order_id}`)}
                          className="text-xs"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View Order
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setActiveScan(scan);
                            setPreviewUrl(scan.image_url);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="text-xs bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <FileCheck className="w-3.5 h-3.5 mr-1" />
                          Review & Approve
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
