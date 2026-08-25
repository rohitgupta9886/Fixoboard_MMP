import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { PaginatedResponse, SalesOrder } from '../types';
import { Table, Column } from '../components/common/Table';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Badge } from '../components/common/Badge';
import { StatCard } from '../components/common/StatCard';
import { Plus, Search, Eye, ShoppingCart, Filter, ArrowRight, Layers, Clock, Cpu, Truck, Camera, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SalesOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const { data, isLoading } = useQuery<PaginatedResponse<SalesOrder>>({
    queryKey: ['sales_orders', page, search, statusFilter, priorityFilter],
    queryFn: () =>
      api.get<PaginatedResponse<SalesOrder>>('/sales-orders', {
        page,
        page_size: 15,
        search,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      }),
  });

  const orders = data?.data || [];
  const totalOrders = data?.pagination?.total || orders.length;
  const inProdOrders = orders.filter((o) => o.status === 'IN_PRODUCTION' || o.status === 'APPROVED').length;
  const draftOrders = orders.filter((o) => o.status === 'DRAFT' || o.status === 'SUBMITTED').length;
  const dispatchedOrders = orders.filter((o) => o.status === 'COMPLETED' || o.status === 'PARTIALLY_DISPATCHED').length;

  const columns: Column<SalesOrder>[] = [
    {
      key: 'order_number',
      header: 'Order #',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{row.order_number}</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold">
              {row.order_source}
            </span>
            {row.customer_po_number && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">PO: {row.customer_po_number}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'party',
      header: 'Customer / Party',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-slate-100">{row.party?.party_name || 'Direct Customer'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">{row.party?.party_code}</p>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Order Date / Delivery',
      render: (row) => (
        <div className="text-xs space-y-0.5 font-num">
          <p className="text-slate-600 dark:text-slate-300 font-medium">Booked: {row.order_date}</p>
          <p className="text-amber-600 dark:text-amber-400 font-bold">Req: {row.required_date}</p>
        </div>
      ),
    },
    {
      key: 'total_quantity',
      header: 'Quantity',
      align: 'right',
      render: (row) => (
        <div className="text-right font-num">
          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{row.total_quantity}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 ml-1 font-sans font-medium">Shts</span>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-sans">{row.items?.length || 0} line items</p>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      align: 'center',
      render: (row) => <Badge status={row.priority} size="sm" />,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => <Badge status={row.status} size="sm" />,
    },
    {
      key: 'action',
      header: 'Action',
      align: 'center',
      render: (row) => (
        <Button
          variant="outline"
          size="xs"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/sales-orders/${row.id}`);
          }}
          leftIcon={<Eye className="w-3.5 h-3.5" />}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Sales Orders Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Book commercial orders (CAT + Manual), track line-item manufacturing, and trigger production memos.
          </p>
        </div>
        {hasPermission('sales_orders:create') && (
          <div className="flex items-center gap-2.5">
            <Button
              variant="brand"
              size="sm"
              onClick={() => navigate('/sales-orders/new')}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New Sales Order
            </Button>
          </div>
        )}
      </div>

      {/* KPI Cards (2x2 on mobile, 4-col on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <StatCard
          title="Total Orders"
          value={totalOrders}
          unit="Orders"
          subtitle="Commercial registry"
          icon={<ShoppingCart className="w-4.5 h-4.5" />}
          variant="blue"
        />
        <StatCard
          title="Pending Review"
          value={draftOrders}
          unit="Draft/Review"
          subtitle="Awaiting approval"
          icon={<Clock className="w-4.5 h-4.5" />}
          variant="amber"
        />
        <StatCard
          title="In Extrusion"
          value={inProdOrders}
          unit="Active"
          subtitle="On plant floor"
          icon={<Cpu className="w-4.5 h-4.5" />}
          variant="indigo"
        />
        <StatCard
          title="Dispatched"
          value={dispatchedOrders}
          unit="Orders"
          subtitle="Gate cleared"
          icon={<Truck className="w-4.5 h-4.5" />}
          variant="emerald"
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 flex-wrap">
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search order #, customer PO..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="w-full sm:w-44">
          <Select
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'DRAFT', label: 'Draft' },
              { value: 'SUBMITTED', label: 'Submitted' },
              { value: 'APPROVED', label: 'Approved' },
              { value: 'IN_PRODUCTION', label: 'In Production' },
              { value: 'PARTIALLY_DISPATCHED', label: 'Partially Dispatched' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'REJECTED', label: 'Rejected' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="w-full sm:w-44">
          <Select
            options={[
              { value: '', label: 'All Priorities' },
              { value: 'LOW', label: 'Low' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'HIGH', label: 'High' },
              { value: 'URGENT', label: 'Urgent' },
            ]}
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Data Table with Dual Mobile-Card & Desktop View */}
      <Table
        columns={columns}
        data={orders}
        keyExtractor={(row) => row.id}
        isLoading={isLoading}
        emptyText="No sales orders found."
        onRowClick={(row) => navigate(`/sales-orders/${row.id}`)}
        renderMobileCard={(row) => (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                {row.order_number}
              </span>
              <Badge status={row.status} size="sm" />
            </div>
            <div className="flex items-center justify-between text-xs">
              <p className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[200px]">
                {row.party?.party_name || 'Direct Customer'}
              </p>
              <Badge status={row.priority} size="sm" />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-num pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
              <span>Required: <strong className="text-amber-600 dark:text-amber-400 font-bold">{row.required_date}</strong></span>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {row.total_quantity} <span className="text-xs font-normal text-slate-500">Sheets</span>
              </span>
            </div>
          </div>
        )}
        pagination={
          data?.pagination
            ? {
                page: data.pagination.page,
                pageSize: data.pagination.page_size,
                total: data.pagination.total,
                totalPages: data.pagination.total_pages,
                onPageChange: (newPage) => setPage(newPage),
              }
            : undefined
        }
      />
    </div>
  );
};

