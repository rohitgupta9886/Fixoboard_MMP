import {
  ApiResponse,
  PaginatedResponse,
  SalesOrder,
  ProductionMemo,
  ProductionRun,
  PackingRecord,
  Dispatch,
  Party,
  Product,
  Thickness,
  Density,
  Machine,
  PackingType,
  ScannedOrder,
  ScannedOrderUpdate,
  ScannedOrderApprove,
  AIAdvisorRequest,
  AIAdvisorResponse,
} from '../types';

const RAW_API_URL = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
const BASE_URL = `${RAW_API_URL}/api/v1`;

export const getFullApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${RAW_API_URL}${cleanEndpoint}`;
};

class ApiClient {
  private getAuthHeader(): HeadersInit {
    const token = localStorage.getItem('fixo_access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeader(),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      localStorage.removeItem('fixo_access_token');
      localStorage.removeItem('fixo_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }

    const data = await response.json();

    if (!response.ok) {
      let errorMsg = 'An unexpected error occurred';
      if (data?.error?.message) {
        errorMsg = data.error.message;
      } else if (typeof data?.detail === 'string') {
        errorMsg = data.detail;
      } else if (Array.isArray(data?.detail)) {
        errorMsg = data.detail.map((d: any) => `${d.loc?.slice(-1)[0] || 'field'}: ${d.msg}`).join(', ');
      } else if (data?.message) {
        errorMsg = data.message;
      }
      throw new Error(errorMsg);
    }

    return data;
  }

  get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let query = '';
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          searchParams.append(k, String(v));
        }
      });
      const qs = searchParams.toString();
      if (qs) query = `?${qs}`;
    }
    return this.request<T>(`${endpoint}${query}`, { method: 'GET' });
  }

  post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Typed Domain Helper Methods
  getDashboardSummary() {
    return this.get<ApiResponse<any>>('/dashboards');
  }

  getNotifications(limit: number = 30) {
    return this.get<ApiResponse<any[]>>('/notifications', { limit });
  }

  getPublicDashboardSummary() {
    return this.get<ApiResponse<any>>('/dashboards/public');
  }

  getSalesOrders(params?: any) {
    return this.get<PaginatedResponse<SalesOrder>>('/sales-orders', params);
  }

  getSalesOrderById(id: string) {
    return this.get<ApiResponse<SalesOrder>>(`/sales-orders/${id}`);
  }

  createSalesOrder(data: any) {
    return this.post<ApiResponse<SalesOrder>>('/sales-orders', data);
  }

  submitSalesOrder(id: string) {
    return this.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/submit`);
  }

  approveSalesOrder(id: string) {
    return this.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/approve`);
  }

  rejectSalesOrder(id: string) {
    return this.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/reject`);
  }

  getAllParties() {
    return this.get<ApiResponse<Party[]>>('/parties/all');
  }

  getAllProducts() {
    return this.get<ApiResponse<Product[]>>('/products/all');
  }

  getThicknesses() {
    return this.get<ApiResponse<Thickness[]>>('/specifications/thicknesses');
  }

  getDensities() {
    return this.get<ApiResponse<Density[]>>('/specifications/densities');
  }

  getAllMachines() {
    return this.get<ApiResponse<Machine[]>>('/machines/all');
  }

  getMachines(params?: any) {
    return this.get<PaginatedResponse<Machine>>('/machines', params);
  }

  getPackingTypes() {
    return this.get<ApiResponse<PackingType[]>>('/specifications/packing-types');
  }

  getProductionMemos(params?: any) {
    return this.get<PaginatedResponse<ProductionMemo>>('/production-memos', params);
  }

  createProductionMemo(data: any) {
    return this.post<ApiResponse<ProductionMemo>>('/production-memos', data);
  }

  releaseProductionMemo(id: string) {
    return this.post<ApiResponse<ProductionMemo>>(`/production-memos/${id}/release`);
  }

  getProductionRuns(params?: any) {
    return this.get<PaginatedResponse<ProductionRun>>('/production-runs', params);
  }

  startProductionRun(data: any) {
    return this.post<ApiResponse<ProductionRun>>('/production-runs/start', data);
  }

  logProductionOutput(id: string, data: any) {
    return this.post<ApiResponse<ProductionRun>>(`/production-runs/${id}/output`, data);
  }

  pauseProductionRun(id: string, data: any = {}) {
    return this.post<ApiResponse<ProductionRun>>(`/production-runs/${id}/pause`, data);
  }

  resumeProductionRun(id: string) {
    return this.post<ApiResponse<ProductionRun>>(`/production-runs/${id}/resume`);
  }

  completeProductionRun(id: string, data: any) {
    return this.post<ApiResponse<ProductionRun>>(`/production-runs/${id}/complete`, data);
  }

  getPackingRecords(params?: any) {
    return this.get<PaginatedResponse<PackingRecord>>('/packing', params);
  }

  createPackingRecord(data: any) {
    return this.post<ApiResponse<PackingRecord>>('/packing', data);
  }

  getDispatches(params?: any) {
    return this.get<PaginatedResponse<Dispatch>>('/dispatches', params);
  }

  getDispatchById(id: string) {
    return this.get<ApiResponse<Dispatch>>(`/dispatches/${id}`);
  }

  createDispatch(data: any) {
    return this.post<ApiResponse<Dispatch>>('/dispatches', data);
  }

  confirmDispatch(id: string) {
    return this.post<ApiResponse<Dispatch>>(`/dispatches/${id}/confirm`);
  }

  async getDispatchPdf(id: string): Promise<Blob> {
    const token = localStorage.getItem('fixo_access_token');
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${BASE_URL}/dispatches/${id}/pdf`, { headers });
    if (!res.ok) throw new Error('Failed to generate PDF');
    return res.blob();
  }

  // ==========================================
  // AI ORDER SCANNER & DIGITIZATION API
  // ==========================================
  async uploadScannedOrder(
    fileOrUrl: File | string,
    dealerId?: string,
    mockRawText?: string
  ): Promise<ScannedOrder> {
    const formData = new FormData();
    if (typeof fileOrUrl === 'string') {
      formData.append('image_url', fileOrUrl);
    } else {
      formData.append('file', fileOrUrl);
    }
    if (dealerId) formData.append('dealer_id', dealerId);
    if (mockRawText) formData.append('mock_raw_text', mockRawText);

    const token = localStorage.getItem('fixo_access_token');
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await fetch(`${BASE_URL}/scanned-orders/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.detail || data?.error?.message || 'Failed to upload and parse order image');
    }
    return data;
  }

  getScannedOrders(params?: { skip?: number; limit?: number; status?: string; dealer_id?: string }) {
    return this.get<ScannedOrder[]>('/scanned-orders', params);
  }

  getScannedOrderById(id: string) {
    return this.get<ScannedOrder>(`/scanned-orders/${id}`);
  }

  updateScannedOrderDraft(id: string, data: ScannedOrderUpdate) {
    return this.put<ScannedOrder>(`/scanned-orders/${id}`, data);
  }

  approveScannedOrder(id: string, data: ScannedOrderApprove) {
    return this.post<SalesOrder>(`/scanned-orders/${id}/approve`, data);
  }

  rejectScannedOrder(id: string, reason?: string) {
    const formData = new FormData();
    if (reason) formData.append('reason', reason);
    const token = localStorage.getItem('fixo_access_token');
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    return fetch(`${BASE_URL}/scanned-orders/${id}/reject`, {
      method: 'POST',
      headers,
      body: formData,
    }).then((res) => res.json());
  }

  deleteScannedOrder(id: string) {
    return this.delete(`/scanned-orders/${id}`);
  }

  // ==========================================
  // SMART AI PRODUCT ADVISOR API
  // ==========================================
  chatAiAdvisor(data: AIAdvisorRequest) {
    return this.post<AIAdvisorResponse>('/ai-advisor/chat', data);
  }
}

export const api = new ApiClient();
export const apiClient = api;

