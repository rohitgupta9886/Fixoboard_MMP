import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { PaginatedResponse, Party } from '../types';
import { Table, Column } from '../components/common/Table';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { StatCard } from '../components/common/StatCard';
import { Plus, Search, Eye, Phone, Mail, Building, Users, CreditCard, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PartiesPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    party_code: '',
    party_name: '',
    contact_person: '',
    phone: '',
    email: '',
    billing_address: '',
    shipping_address: '',
    gst_number: '',
    payment_terms: '30 Days Net',
    credit_limit: 500000,
  });

  const { data, isLoading } = useQuery<PaginatedResponse<Party>>({
    queryKey: ['parties', page, search],
    queryFn: () =>
      api.get<PaginatedResponse<Party>>('/parties', {
        page,
        page_size: 15,
        search,
      }),
  });

  const parties = data?.data || [];
  const totalCount = data?.pagination?.total || parties.length;
  const activeCount = parties.filter((p) => p.is_active).length;
  const totalCredit = parties.reduce((acc, p) => acc + Number(p.credit_limit || 0), 0);

  const createMutation = useMutation({
    mutationFn: (newParty: typeof formData) => api.post('/parties', newParty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      setIsCreateModalOpen(false);
      setFormData({
        party_code: '',
        party_name: '',
        contact_person: '',
        phone: '',
        email: '',
        billing_address: '',
        shipping_address: '',
        gst_number: '',
        payment_terms: '30 Days Net',
        credit_limit: 500000,
      });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const columns: Column<Party>[] = [
    {
      key: 'party_code',
      header: 'Party Code',
      render: (row) => <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{row.party_code}</span>,
    },
    {
      key: 'party_name',
      header: 'Customer / Company Name',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{row.party_name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{row.contact_person || 'No Contact'}</p>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Contact Info',
      render: (row) => (
        <div className="text-xs space-y-0.5 font-medium">
          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono">{row.phone}</span>
          </div>
          {row.email && (
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
              <Mail className="w-3.5 h-3.5" />
              <span>{row.email}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'gst_number',
      header: 'GSTIN / City',
      render: (row) => (
        <div className="text-xs">
          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{row.gst_number || 'N/A'}</span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[160px] font-medium">{row.shipping_address}</p>
        </div>
      ),
    },
    {
      key: 'credit_limit',
      header: 'Credit / Terms',
      align: 'right',
      render: (row) => (
        <div className="text-right text-xs">
          <p className="font-num font-bold text-slate-900 dark:text-white">₹{Number(row.credit_limit).toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{row.payment_terms || 'Standard'}</p>
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      align: 'center',
      render: (row) => <Badge status={row.is_active ? 'ACTIVE' : 'INACTIVE'} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'center',
      render: (row) => (
        <Button
          variant="outline"
          size="xs"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/parties/${row.id}`);
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
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Customer / Party Directory</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Manage authorized commercial clients, GSTIN, payment credit limits, and delivery warehouses.
          </p>
        </div>
        {hasPermission('parties:create') && (
          <Button variant="brand" onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            New Customer
          </Button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Registered Accounts"
          value={totalCount}
          unit="Clients"
          subtitle="Enterprise accounts"
          icon={<Users className="w-4.5 h-4.5" />}
          variant="blue"
        />
        <StatCard
          title="Active Commercial Accounts"
          value={activeCount}
          unit="Active"
          subtitle="Orders permitted"
          icon={<CheckCircle2 className="w-4.5 h-4.5" />}
          variant="emerald"
        />
        <StatCard
          title="Total Credit Limit"
          value={`₹${(totalCredit / 100000).toFixed(1)}L`}
          unit="Exposure"
          subtitle="Authorized trade credit"
          icon={<CreditCard className="w-4.5 h-4.5" />}
          variant="purple"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="w-80">
          <Input
            placeholder="Search party code, name, contact..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={data?.data || []}
        keyExtractor={(row) => row.id}
        isLoading={isLoading}
        onRowClick={(row) => navigate(`/parties/${row.id}`)}
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

      {/* Create Party Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Register New Customer / Party"
          subtitle="Create verified commercial customer account with delivery addresses"
          size="lg"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Party Code"
                placeholder="e.g. PTY-004"
                value={formData.party_code}
                onChange={(e) => setFormData({ ...formData, party_code: e.target.value })}
                required
              />
              <Input
                label="Party / Company Name"
                placeholder="e.g. Acme Plywood & Hardware"
                value={formData.party_name}
                onChange={(e) => setFormData({ ...formData, party_name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Contact Person"
                placeholder="e.g. Rajesh Kumar"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              />
              <Input
                label="Phone Number"
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="orders@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="GST Number"
                placeholder="e.g. 24AAACA1234F1Z5"
                value={formData.gst_number}
                onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
              />
              <Input
                label="Credit Limit (₹)"
                type="number"
                value={formData.credit_limit}
                onChange={(e) => setFormData({ ...formData, credit_limit: Number(e.target.value) })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Billing Address *
                </label>
                <textarea
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs font-medium"
                  rows={2}
                  value={formData.billing_address}
                  onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Shipping / Warehouse Address *
                </label>
                <textarea
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs font-medium"
                  rows={2}
                  value={formData.shipping_address}
                  onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="brand" type="submit" isLoading={createMutation.isPending} leftIcon={<Plus className="w-4 h-4" />}>
                Create Customer
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

