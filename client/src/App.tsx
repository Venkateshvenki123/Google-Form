import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';

// Layouts
import { AdminLayout } from './components/layout/AdminLayout';
import { PublicLayout } from './components/layout/PublicLayout';

// Admin Pages
import { AdminLogin } from './pages/admin/AdminLogin';
import { Dashboard } from './pages/admin/Dashboard';
import { FormsList } from './pages/admin/FormsList';
import { FormBuilderPage } from './pages/admin/FormBuilderPage';
import { ResponsesPage } from './pages/admin/ResponsesPage';
import { AnalyticsPage } from './pages/admin/AnalyticsPage';
import { GlobalSettingsPage } from './pages/admin/GlobalSettingsPage';

// Public Pages
import { FormsDirectoryPage } from './pages/public/FormsDirectoryPage';
import { FormRendererPage } from './pages/public/FormRendererPage';

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Form Pages */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Navigate to="/forms" replace />} />
              <Route path="/forms" element={<FormsDirectoryPage />} />
              <Route path="/forms/:slug" element={<FormRendererPage />} />
            </Route>

            {/* Admin Authentication */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Protected Admin Suite */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="forms" element={<FormsList />} />
              <Route path="forms/new" element={<FormBuilderPage />} />
              <Route path="forms/:id/edit" element={<FormBuilderPage />} />
              <Route path="forms/:id/analytics" element={<AnalyticsPage />} />
              <Route path="responses" element={<ResponsesPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="settings" element={<GlobalSettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/forms" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
