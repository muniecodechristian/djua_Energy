import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Bot, Sparkles } from 'lucide-react';
import { useCheckAuth } from './hooks/tanstack/useAuthMutations.js';
import useAuthStore from './hooks/Zustand/useAuthStore.js';

import Dashboard from './pages/Dashboard';
import LoginTeak from './pages/LoginTeak';
import MainLayout from './pages/MainLayout';
import FleetStatusFeed from './pages/FleetStatusFeed';
import Discussion from './pages/Discussion';
import SmartKitDetails from './pages/SmartKitDetails';
import InterventionWizard from './pages/InterventionWizard';
import CustomerProfile from './pages/CustomerProfile';
import OperationsOverview from './pages/OperationsOverview';
import AdministrationSettings from './pages/AdministrationSettings';
import FleetMonitoring from './pages/FleetMonitoring';
import SubscriptionForm from './pages/SubscriptionForm';
import OrangeKitsRegistry from './pages/OrangeKitsRegistry';
import TelemetryDashboard from './pages/TelemetryDashboard';

// ─── Loader affiché pendant la vérification de session ────────────────────────
const AuthLoader = () => (
  <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black">
    <div className="relative flex flex-col items-center gap-5">
      <div className="relative flex items-center justify-center">
        <div className="w-14 h-14 rounded-full border-2 border-zinc-900 border-t-[#FF7900] animate-spin" />
        <div className="absolute w-9 h-9 rounded-xl bg-black border border-zinc-800 flex items-center justify-center shadow-sm">
          <Bot size={18} className="text-[#FF7900]" />
        </div>
      </div>
      <div className="text-center space-y-1.5">
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs font-extrabold text-white tracking-wider uppercase">
            Vérification de session
          </span>
          <Sparkles size={13} className="text-[#FF7900] animate-pulse" />
        </div>
        <p className="text-[11px] font-medium text-zinc-500 tracking-wide">
          Authentification en cours...
        </p>
      </div>
      <div className="w-40 h-1 bg-zinc-900 rounded-full overflow-hidden">
        <div className="w-full h-full bg-[#FF7900] animate-pulse" />
      </div>
    </div>
  </div>
);

// ─── Guard de route protégée ──────────────────────────────────────────────────
// Ce composant lit l'état Zustand et décide :
//   - loader si la vérif est en cours
//   - redirect vers / si non authentifié
//   - <Outlet /> si authentifié (affiche les routes enfants)
const ProtectedLayout = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);

  if (isCheckingAuth) return <AuthLoader />;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  return <MainLayout />;
};

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  useCheckAuth();

  return (
    <Routes>
      {/* Route publique */}
      <Route path="/" element={<LoginTeak />} />

      {/* Routes protégées */}
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard"            element={<Dashboard />} />
        <Route path="/notification"         element={<FleetStatusFeed />} />
        <Route path="/decision"             element={<Discussion />} />
        <Route path="/SmartKitdetails"      element={<SmartKitDetails />} />
        <Route path="/InterventionWizard"   element={<InterventionWizard />} />
        <Route path="/CustomerProfile"      element={<CustomerProfile />} />
        <Route path="/OperationsOverview"   element={<OperationsOverview />} />
        <Route path="/AdministrationSettings" element={<AdministrationSettings />} />
        <Route path="/FleetMonitoring"      element={<FleetMonitoring />} />
        <Route path="/subscription"         element={<SubscriptionForm />} />
        <Route path="/orange-kits"          element={<OrangeKitsRegistry />} />
        <Route path="/telemetry"            element={<TelemetryDashboard />} />
      </Route>
    </Routes>
  );
}

export default App;