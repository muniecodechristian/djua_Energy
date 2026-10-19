import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Toaster as SonnerToaster } from 'sonner';
import { useCheckAuth } from './hooks/tanstack/useAuthMutations.js';
import useAuthStore from './hooks/Zustand/useAuthStore.js';


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
const Devis = lazy(() => import('./pages/Devis'));
const TeamManagement = lazy(() => import('./pages/TeamManagement'));
const TechnicianApp = lazy(() => import('./pages/TechnicianApp'));
const AdminReports = lazy(() => import('./pages/AdminReports'));
const ProductCatalog = lazy(() => import('./pages/ProductCatalog'));
const AdminQuotes = lazy(() => import('./pages/AdminQuotes'));

function QuotesHome() {
  const user = useAuthStore(state => state.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'administration';
  return isAdmin ? <AdminQuotes /> : <Devis />;
}

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

        {/* Espace dédié application Technicien */}
        <Route path="/technicien" element={<TechnicianApp />} />

        {/* Pages plateforme */}
        <Route element={<MainLayout />}>
          <Route path="/diagnostics"          element={<Navigate to="/parc" replace />} />
          <Route path="/dashboard"            element={<Dashboard />} />
          <Route path="/devis"                element={<QuotesHome />} />
          <Route path="/devis/nouveau"        element={<Devis />} />
          <Route path="/notification"         element={<FleetStatusFeed />} />
          <Route path="/decision"             element={<Navigate to="/notification" replace />} />
          <Route path="/SmartKitdetails"      element={<SmartKitDetails />} />
          <Route path="/InterventionWizard"   element={<InterventionWizard />} />
          <Route path="/scan-kit"             element={<Navigate to="/technicien" replace />} />
          <Route path="/CustomerProfile"      element={<CustomerProfile />} />
          <Route path="/OperationsOverview"   element={<OperationsOverview />} />
          <Route path="/AdministrationSettings" element={<AdministrationSettings />} />
          <Route path="/equipe"                element={<TeamManagement />} />
          <Route path="/parc"                 element={<OrangeKitsRegistry />} />
          <Route path="/rapports"             element={<AdminReports />} />
          <Route path="/catalogue"            element={<ProductCatalog />} />
          <Route path="/orange-kits"          element={<Navigate to="/parc" replace />} />
          <Route path="/telemetry"            element={<Navigate to="/parc" replace />} />
          <Route path="/geofencing"           element={<Navigate to="/notification" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

export default App;