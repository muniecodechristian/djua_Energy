import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Toaster as SonnerToaster } from 'sonner';
const Diagnostics = lazy(() => import('./pages/Diagnostics'));

import { useCheckAuth } from './hooks/tanstack/useAuthMutations.js';


const Dashboard = lazy(() => import('./pages/Dashboard'));
import LoginTeak from './pages/LoginTeak';
import MainLayout from './pages/MainLayout';
const FleetStatusFeed = lazy(() => import('./pages/FleetStatusFeed'));
const SmartKitDetails = lazy(() => import('./pages/SmartKitDetails'));
const InterventionWizard = lazy(() => import('./pages/InterventionWizard'));
const CustomerProfile = lazy(() => import('./pages/CustomerProfile'));
const OperationsOverview = lazy(() => import('./pages/OperationsOverview'));
const AdministrationSettings = lazy(() => import('./pages/AdministrationSettings'));
const OrangeKitsRegistry = lazy(() => import('./pages/OrangeKitsRegistry'));
const TelemetryDashboard = lazy(() => import('./pages/TelemetryDashboard'));
const Devis = lazy(() => import('./pages/Devis'));

function App() {
  useCheckAuth();

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#111827',
            color: '#f9fafb',
            border: '1px solid rgba(249, 115, 22, 0.4)',
            boxShadow: '0 18px 40px rgba(15, 23, 42, 0.35)',
          },
          success: { style: { borderColor: 'rgba(34, 197, 94, 0.5)' } },
          error: { style: { borderColor: 'rgba(239, 68, 68, 0.5)' } },
        }}
      />
      <SonnerToaster position="top-right" richColors closeButton />
      <Routes>
        {/* Route publique */}
        <Route path="/" element={<LoginTeak />} />

        {/* Pages accessibles sans connexion */}
        <Route element={<MainLayout />}>
          <Route path="/diagnostics" element={<Diagnostics />} />
          <Route path="/dashboard"            element={<Dashboard />} />
          <Route path="/devis"                element={<Devis />} />
          <Route path="/notification"         element={<FleetStatusFeed />} />
          <Route path="/decision"             element={<Navigate to="/notification" replace />} />
          <Route path="/SmartKitdetails"      element={<SmartKitDetails />} />
          <Route path="/InterventionWizard"   element={<InterventionWizard />} />
          <Route path="/CustomerProfile"      element={<CustomerProfile />} />
          <Route path="/OperationsOverview"   element={<OperationsOverview />} />
          <Route path="/AdministrationSettings" element={<AdministrationSettings />} />
          <Route path="/parc"                 element={<OrangeKitsRegistry />} />
          <Route path="/orange-kits"          element={<Navigate to="/parc" replace />} />
          <Route path="/telemetry"            element={<TelemetryDashboard />} />
          <Route path="/geofencing"           element={<Navigate to="/notification" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

export default App;