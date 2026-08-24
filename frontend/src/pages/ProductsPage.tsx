import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { PaginatedResponse, Product, ApiResponse, Thickness, Density, ProductCategory } from '../types';
import { Table, Column } from '../components/common/Table';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { Plus, Package, Layers, Sliders, Check, Box, Ruler, Gauge } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ProductsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const [activeTab, setActiveTab] = useState<'products' | 'thicknesses' | 'densities'>('products');
  const [page, setPage] = useState(1);
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [isCreateThicknessOpen, setIsCreateThicknessOpen] = useState(false);
  const [isCreateDensityOpen, setIsCreateDensityOpen] = useState(false);

  // Form states
  const [productForm, setProductForm] = useState({
    category_id: '',
    product_code: '',
    product_name: '',
    unit: 'Sheets',
    description: '',
  });

  const [thicknessForm, setThicknessForm] = useState({
    value_mm: '',
    display_label: '',
  });

  const [densityForm, setDensityForm] = useState({
    value_g_cm3: '',
    display_label: '',
  });

  // Queries
  const { data: productsData, isLoading: isProductsLoading } = useQuery<PaginatedResponse<Product>>({
    queryKey: ['products', page],
    queryFn: () => api.get<PaginatedResponse<Product>>('/products', { page, page_size: 15 }),
    enabled: activeTab === 'products',
  });

  const { data: categoriesData } = useQuery<ApiResponse<ProductCategory[]>>({
    queryKey: ['categories'],
    queryFn: () => api.get<ApiResponse<ProductCategory[]>>('/products/categories'),
  });

  const { data: thicknessesData, isLoading: isThicknessLoading } = useQuery<ApiResponse<Thickness[]>>({
    queryKey: ['thicknesses'],
    queryFn: () => api.get<ApiResponse<Thickness[]>>('/specifications/thicknesses'),
  });

  const { data: densitiesData, isLoading: isDensityLoading } = useQuery<ApiResponse<Density[]>>({
    queryKey: ['densities'],
    queryFn: () => api.get<ApiResponse<Density[]>>('/specifications/densities'),
  });

  const products = productsData?.data || [];
  const thicknesses = thicknessesData?.data || [];
  const densities = densitiesData?.data || [];

  // Mutations
  const createProductMutation = useMutation({
    mutationFn: (data: typeof productForm) => api.post('/products', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsCreateProductOpen(false);
      setProductForm({ category_id: '', product_code: '', product_name: '', unit: 'Sheets', description: '' });
    },
  });

  const createThicknessMutation = useMutation({
    mutationFn: (data: typeof thicknessForm) =>
      api.post('/specifications/thicknesses', {
        value_mm: Number(data.value_mm),
        display_label: data.display_label || `${data.value_mm} mm`,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thicknesses'] });
      setIsCreateThicknessOpen(false);
      setThicknessForm({ value_mm: '', display_label: '' });
    },
  });

  const createDensityMutation = useMutation({
    mutationFn: (data: typeof densityForm) =>
      api.post('/specifications/densities', {
        value_g_cm3: Number(data.value_g_cm3),
        display_label: data.display_label || `${data.value_g_cm3} g/cm³`,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['densities'] });
      setIsCreateDensityOpen(false);
      setDensityForm({ value_g_cm3: '', display_label: '' });
    },
  });

  // Columns for Products
  const productColumns: Column<Product>[] = [
    {
      key: 'product_code',
      header: 'Product Code',
      render: (row) => <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{row.product_code}</span>,
    },
    {
      key: 'product_name',
      header: 'Product Name',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{row.product_name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{row.description || 'No description'}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{row.category?.name || 'Standard'}</span>,
    },
    {
      key: 'unit',
      header: 'UoM (Unit)',
      align: 'center',
      render: (row) => (
        <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          {row.unit}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      align: 'center',
      render: (row) => <Badge status={row.is_active ? 'ACTIVE' : 'INACTIVE'} size="sm" />,
    },
  ];

  // Columns for Thicknesses
  const thicknessColumns: Column<Thickness>[] = [
    {
      key: 'value_mm',
      header: 'Gauge Value (mm)',
      render: (row) => <span className="font-num font-bold text-blue-600 dark:text-blue-400 text-base">{Number(row.value_mm)} mm</span>,
    },
    {
      key: 'display_label',
      header: 'Display Label',
      render: (row) => <span className="text-slate-900 dark:text-slate-100 font-bold">{row.display_label}</span>,
    },
    {
      key: 'is_active',
      header: 'Status',
      align: 'center',
      render: (row) => <Badge status={row.is_active ? 'ACTIVE' : 'INACTIVE'} size="sm" />,
    },
  ];

  // Columns for Densities
  const densityColumns: Column<Density>[] = [
    {
      key: 'value_g_cm3',
      header: 'Density (g/cm³)',
      render: (row) => <span className="font-num font-bold text-emerald-600 dark:text-emerald-400 text-base">{Number(row.value_g_cm3)} g/cm³</span>,
    },
    {
      key: 'display_label',
      header: 'Display Label',
      render: (row) => <span className="text-slate-900 dark:text-slate-100 font-bold">{row.display_label}</span>,
    },
    {
      key: 'is_active',
      header: 'Status',
      align: 'center',
      render: (row) => <Badge status={row.is_active ? 'ACTIVE' : 'INACTIVE'} size="sm" />,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Tab navigation */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Product &amp; Specification Master</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Configurable product taxonomy, manufactured thicknesses, and specific gravity density masters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'products' && hasPermission('products:create') && (
            <Button variant="brand" onClick={() => setIsCreateProductOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              New Product
            </Button>
          )}
          {activeTab === 'thicknesses' && hasPermission('products:create') && (
            <Button variant="brand" onClick={() => setIsCreateThicknessOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Add Thickness (mm)
            </Button>
          )}
          {activeTab === 'densities' && hasPermission('products:create') && (
            <Button variant="brand" onClick={() => setIsCreateDensityOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Add Density (g/cm³)
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Catalog SKUs"
          value={productsData?.pagination?.total ?? products.length}
          unit="Products"
          subtitle="Board, Doors &amp; Frames"
          icon={<Box className="w-4.5 h-4.5" />}
          variant="blue"
        />
        <StatCard
          title="Active Calibrated Gauges"
          value={thicknesses.length}
          unit="Gauges"
          subtitle="4mm to 30mm thickness"
          icon={<Ruler className="w-4.5 h-4.5" />}
          variant="indigo"
        />
        <StatCard
          title="Calibrated Density Grades"
          value={densities.length}
          unit="Grades"
          subtitle="0.45 to 0.70 g/cm³"
          icon={<Gauge className="w-4.5 h-4.5" />}
          variant="emerald"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'products'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Products Catalog</span>
        </button>

        <button
          onClick={() => setActiveTab('thicknesses')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'thicknesses'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Configurable Thickness (mm)</span>
        </button>

        <button
          onClick={() => setActiveTab('densities')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'densities'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Configurable Density (g/cm³)</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'products' && (
        <Table
          columns={productColumns}
          data={productsData?.data || []}
          keyExtractor={(row) => row.id}
          isLoading={isProductsLoading}
          pagination={
            productsData?.pagination
              ? {
                  page: productsData.pagination.page,
                  pageSize: productsData.pagination.page_size,
                  total: productsData.pagination.total,
                  totalPages: productsData.pagination.total_pages,
                  onPageChange: setPage,
                }
              : undefined
          }
        />
      )}

      {activeTab === 'thicknesses' && (
        <Table
          columns={thicknessColumns}
          data={thicknessesData?.data || []}
          keyExtractor={(row) => row.id}
          isLoading={isThicknessLoading}
        />
      )}

      {activeTab === 'densities' && (
        <Table
          columns={densityColumns}
          data={densitiesData?.data || []}
          keyExtractor={(row) => row.id}
          isLoading={isDensityLoading}
        />
      )}

      {/* Modal: Create Product */}
      {isCreateProductOpen && (
        <Modal
          isOpen={isCreateProductOpen}
          onClose={() => setIsCreateProductOpen(false)}
          title="Add Catalog Product"
          subtitle="Define new manufactured finished product item"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createProductMutation.mutate(productForm);
            }}
            className="space-y-4"
          >
            <Select
              label="Product Category"
              options={(categoriesData?.data || []).map((c) => ({ value: c.id, label: c.name }))}
              value={productForm.category_id}
              onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
              placeholder="Select product category"
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Product Code"
                placeholder="e.g. PROD-PVC-003"
                value={productForm.product_code}
                onChange={(e) => setProductForm({ ...productForm, product_code: e.target.value })}
                required
              />
              <Select
                label="Unit of Measure (UoM)"
                options={[
                  { value: 'Sheets', label: 'Sheets (Standard Board)' },
                  { value: 'Pieces', label: 'Pieces (Doors)' },
                  { value: 'Running Feet', label: 'Running Feet (Frames)' },
                  { value: 'Sq. Meter', label: 'Sq. Meter' },
                ]}
                value={productForm.unit}
                onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                required
              />
            </div>

            <Input
              label="Product Name"
              placeholder="e.g. FixoBoard Ultra Density Board"
              value={productForm.product_name}
              onChange={(e) => setProductForm({ ...productForm, product_name: e.target.value })}
              required
            />

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Description / Application
              </label>
              <textarea
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs font-medium"
                rows={2}
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" type="button" onClick={() => setIsCreateProductOpen(false)}>
                Cancel
              </Button>
              <Button variant="brand" type="submit" isLoading={createProductMutation.isPending} leftIcon={<Plus className="w-4 h-4" />}>
                Save Product
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Create Thickness */}
      {isCreateThicknessOpen && (
        <Modal
          isOpen={isCreateThicknessOpen}
          onClose={() => setIsCreateThicknessOpen(false)}
          title="Add Configurable Thickness"
          subtitle="Register dynamic millimeter gauge dimension"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createThicknessMutation.mutate(thicknessForm);
            }}
            className="space-y-4"
          >
            <Input
              label="Thickness Value in mm *"
              type="number"
              step="0.1"
              placeholder="e.g. 17 or 22"
              value={thicknessForm.value_mm}
              onChange={(e) => setThicknessForm({ ...thicknessForm, value_mm: e.target.value })}
              required
            />
            <Input
              label="Display Label"
              placeholder="e.g. 17 mm (Medium Gauge)"
              value={thicknessForm.display_label}
              onChange={(e) => setThicknessForm({ ...thicknessForm, display_label: e.target.value })}
            />
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" type="button" onClick={() => setIsCreateThicknessOpen(false)}>
                Cancel
              </Button>
              <Button variant="brand" type="submit" isLoading={createThicknessMutation.isPending} leftIcon={<Plus className="w-4 h-4" />}>
                Save Thickness
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Create Density */}
      {isCreateDensityOpen && (
        <Modal
          isOpen={isCreateDensityOpen}
          onClose={() => setIsCreateDensityOpen(false)}
          title="Add Configurable Density"
          subtitle="Register specific gravity material grade"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createDensityMutation.mutate(densityForm);
            }}
            className="space-y-4"
          >
            <Input
              label="Density Value in g/cm³ *"
              type="number"
              step="0.01"
              placeholder="e.g. 0.48 or 0.65"
              value={densityForm.value_g_cm3}
              onChange={(e) => setDensityForm({ ...densityForm, value_g_cm3: e.target.value })}
              required
            />
            <Input
              label="Display Label"
              placeholder="e.g. 0.48 g/cm³ (Commercial Grade)"
              value={densityForm.display_label}
              onChange={(e) => setDensityForm({ ...densityForm, display_label: e.target.value })}
            />
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" type="button" onClick={() => setIsCreateDensityOpen(false)}>
                Cancel
              </Button>
              <Button variant="brand" type="submit" isLoading={createDensityMutation.isPending} leftIcon={<Plus className="w-4 h-4" />}>
                Save Density
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

