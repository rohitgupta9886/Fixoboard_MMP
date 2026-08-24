import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ApiResponse, Party, PaginatedResponse, SalesOrder, Dispatch } from '../types';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Table, Column } from '../components/common/Table';
import { ArrowLeft, Building, Phone, Mail, FileText, ShoppingCart, Truck, CreditCard } from 'lucide-react';

export const PartyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: partyData, isLoading: isPartyLoading } = useQuery<ApiResponse<Party>>({
    queryKey: ['party', id],
    queryFn: () => api.get<ApiResponse<Party>>(`/parties/${id}`),
    enabled: !!id,
  });

  const { data: ordersData, isLoading: isOrdersLoading } = useQuery<PaginatedResponse<SalesOrder>>({
    queryKey: ['party_orders', id],
    queryFn: () => api.get<PaginatedResponse<SalesOrder>>('/sales-orders', { party_id: id }),
    enabled: !!id,
  });

  const party = partyData?.data;

  if (isPartyLoading) {
    return <LoadingSpinner text="Loading party profile..." />;
  }

  if (!party) {
    return <div className="p-8 text-center text-slate-500 font-medium">Party not found</div>;
  }

  const orderColumns: Column<SalesOrder>[] = [
    {
      key: 'order_number',
      header: 'Order No',
      render: (row) => <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{row.order_number}</span>,
    },
    {
      key: 'order_date',
      header: 'Order Date',
      render: (row) => <span className="text-xs font-num text-slate-600 dark:text-slate-400">{row.order_date}</span>,
    },
    {
      key: 'total_quantity',
      header: 'Total Qty',
      align: 'right',
      render: (row) => <span className="font-num font-bold text-slate-900 dark:text-white">{row.total_quantity} Shts</span>,
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
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/parties')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to Parties
        </Button>
        <Badge status={party.is_active ? 'ACTIVE' : 'INACTIVE'} />
      </div>

      {/* Customer Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold font-mono text-xl shadow-2xs">
              {party.party_code.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{party.party_name}</h1>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700">
                  {party.party_code}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 font-medium">
                <Building className="w-4 h-4" /> Contact Person: <strong className="text-slate-800 dark:text-slate-200">{party.contact_person || 'N/A'}</strong>
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-sans font-bold uppercase tracking-wider">Credit Limit</span>
            <span className="text-2xl font-extrabold font-num text-emerald-600 dark:text-emerald-400">
              ₹{Number(party.credit_limit).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Contact Info</span>
            <div className="text-slate-800 dark:text-slate-200 mt-1 space-y-1 font-medium">
              <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {party.phone}</p>
              {party.email && <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {party.email}</p>}
            </div>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Tax &amp; Commercial</span>
            <div className="text-slate-800 dark:text-slate-200 mt-1 space-y-1 font-medium">
              <p>GSTIN: <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{party.gst_number || 'N/A'}</span></p>
              <p>Terms: <span className="text-slate-900 dark:text-slate-100 font-bold">{party.payment_terms || 'Standard'}</span></p>
            </div>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Shipping Warehouse</span>
            <p className="text-slate-700 dark:text-slate-300 mt-1 font-medium">{party.shipping_address}</p>
          </div>
        </div>
      </div>

      {/* Historical Sales Orders Table */}
      <Card
        title="Commercial Order History"
        subtitle="All sales orders registered for this counterparty"
        action={
          <Button
            variant="brand"
            size="sm"
            onClick={() => navigate(`/sales-orders/new?party_id=${party.id}`)}
            leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
          >
            Create Order
          </Button>
        }
      >
        <Table
          columns={orderColumns}
          data={ordersData?.data || []}
          keyExtractor={(row) => row.id}
          isLoading={isOrdersLoading}
          onRowClick={(row) => navigate(`/sales-orders/${row.id}`)}
          emptyText="No historical orders recorded for this customer."
        />
      </Card>
    </div>
  );
};

