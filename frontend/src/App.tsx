import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PartiesPage } from './pages/PartiesPage';
import { PartyDetailPage } from './pages/PartyDetailPage';
import { ProductsPage } from './pages/ProductsPage';
import { SalesOrdersPage } from './pages/SalesOrdersPage';
import { SalesOrderCreatePage } from './pages/SalesOrderCreatePage';
import { SalesOrderDetailPage } from './pages/SalesOrderDetailPage';
import { AiOrderScannerPage } from './pages/AiOrderScannerPage';
import { ProductionMemosPage } from './pages/ProductionMemosPage';
import { ProductionPlanningPage } from './pages/ProductionPlanningPage';
import { ProductionExecutionPage } from './pages/ProductionExecutionPage';
import { MachinesPage } from './pages/MachinesPage';
import { PackingPage } from './pages/PackingPage';
import { DispatchPage } from './pages/DispatchPage';
import { DispatchDetailPage } from './pages/DispatchDetailPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersPage } from './pages/UsersPage';
import { AuditLogPage } from './pages/AuditLogPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 10000,
      gcTime: 1000 * 60 * 5,
      placeholderData: (prev: any) => prev,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Showcase Home Page */}
              <Route path="/" element={<HomePage />} />

              {/* Authentication */}
              <Route path="/login" element={<LoginPage />} />

              {/* Authenticated Industrial Workspace */}
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* AI Mobile Camera Order Scanner */}
                <Route
                  path="/ai-scanner"
                  element={
                    <ProtectedRoute permission="sales_orders:create">
                      <AiOrderScannerPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/scanned-orders"
                  element={
                    <ProtectedRoute permission="sales_orders:create">
                      <AiOrderScannerPage />
                    </ProtectedRoute>
                  }
                />

                {/* Parties */}
                <Route
                  path="/parties"
                  element={
                    <ProtectedRoute permission="parties:read">
                      <PartiesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/parties/:id"
                  element={
                    <ProtectedRoute permission="parties:read">
                      <PartyDetailPage />
                    </ProtectedRoute>
                  }
                />

                {/* Products & Specifications */}
                <Route
                  path="/products"
                  element={
                    <ProtectedRoute permission="products:read">
                      <ProductsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Sales Orders */}
                <Route
                  path="/sales-orders"
                  element={
                    <ProtectedRoute permission="sales_orders:read">
                      <SalesOrdersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sales-orders/new"
                  element={
                    <ProtectedRoute permission="sales_orders:create">
                      <SalesOrderCreatePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sales-orders/:id"
                  element={
                    <ProtectedRoute permission="sales_orders:read">
                      <SalesOrderDetailPage />
                    </ProtectedRoute>
                  }
                />

                {/* Production */}
                <Route
                  path="/production-memos"
                  element={
                    <ProtectedRoute permission="production:read">
                      <ProductionMemosPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/production/planning"
                  element={
                    <ProtectedRoute permission="production:plan">
                      <ProductionPlanningPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/production/execution"
                  element={
                    <ProtectedRoute permission="production:execute">
                      <ProductionExecutionPage />
                    </ProtectedRoute>
                  }
                />

                {/* Machine Line Telemetry */}
                <Route
                  path="/machines"
                  element={
                    <ProtectedRoute permission="machines:read">
                      <MachinesPage />
                    </ProtectedRoute>
                  }
                />

                {/* Packing & Logistics */}
                <Route
                  path="/packing"
                  element={
                    <ProtectedRoute permission="packing:read">
                      <PackingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dispatch"
                  element={
                    <ProtectedRoute permission="dispatch:read">
                      <DispatchPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dispatch/:id"
                  element={
                    <ProtectedRoute permission="dispatch:read">
                      <DispatchDetailPage />
                    </ProtectedRoute>
                  }
                />

                {/* Intelligence & Analytics */}
                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute permission="reports:view">
                      <ReportsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute permission="reports:view">
                      <ReportsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Administration */}
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute permission="users:manage">
                      <UsersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/audit-logs"
                  element={
                    <ProtectedRoute permission="audit:view">
                      <AuditLogPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute permission="users:manage">
                      <UsersPage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};
