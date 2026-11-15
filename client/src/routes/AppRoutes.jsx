import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';
import DashboardLayout from '../layouts/DashboardLayout';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import AssetManagementPage from '../pages/AssetManagementPage';
import VulnerabilityPage from '../pages/VulnerabilityPage';
import RiskManagementPage from '../pages/RiskManagementPage';
import AuditLogsPage from '../pages/AuditLogsPage';
import NistOverviewPage from '../pages/NistOverviewPage';
import IncidentManagementPage from '../pages/IncidentManagementPage';
import SecurityAlertsPage from '../pages/SecurityAlertsPage';
import IntegrationManagementPage from '../pages/IntegrationManagementPage';
import BackupRecoveryPage from '../pages/BackupRecoveryPage';
import ReportsPage from '../pages/ReportsPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="assets" element={<AssetManagementPage />} />
        <Route path="vulnerabilities" element={<VulnerabilityPage />} />
        <Route path="risks" element={<RiskManagementPage />} />
        <Route
          path="audit-logs"
          element={
            <ProtectedRoute requiredRoles={['Admin', 'Security Analyst']}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
        <Route path="nist-overview" element={<NistOverviewPage />} />

        {/* Stage 3 routes */}
        <Route path="alerts" element={<SecurityAlertsPage />} />
        <Route path="incidents" element={<IncidentManagementPage />} />
        <Route
          path="integrations"
          element={
            <ProtectedRoute requiredRoles={['Admin', 'Security Analyst']}>
              <IntegrationManagementPage />
            </ProtectedRoute>
          }
        />

        {/* Stage 4 routes */}
        <Route
          path="backups"
          element={
            <ProtectedRoute requiredRoles={['Admin', 'IT Manager']}>
              <BackupRecoveryPage />
            </ProtectedRoute>
          }
        />

        {/* Stage 5 routes */}
        <Route
          path="reports"
          element={
            <ProtectedRoute requiredRoles={['Admin', 'Security Analyst', 'IT Manager']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
