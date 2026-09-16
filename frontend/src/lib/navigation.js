import { LayoutDashboard, PanelsTopLeft, Bell, Activity, BrainCircuit, Wrench, FileText, Settings } from 'lucide-react';
export const navigation = [
  { section: 'Supervision', label: 'Vue d’ensemble', path: '/dashboard', icon: LayoutDashboard, description: 'Les signaux essentiels pour piloter votre parc solaire.' },
  { section: 'Supervision', label: 'Parc solaire', path: '/parc', icon: PanelsTopLeft, description: 'Équipements, contrats et accès aux fiches techniques.' },
  { section: 'Supervision', label: 'Alertes', path: '/notification', icon: Bell, description: 'Priorisez les anomalies et examinez les faits observés.' },
  { section: 'Supervision', label: 'Télémétrie', path: '/telemetry', icon: Activity, description: 'Mesures des capteurs et commandes des équipements.' },
  { section: 'Exploitation', label: 'Diagnostic IA', path: '/diagnostics', icon: BrainCircuit, description: 'Analysez un équipement à partir de ses mesures et des résultats du modèle.' },
  { section: 'Exploitation', label: 'Maintenance', path: '/InterventionWizard', icon: Wrench, description: 'Préparez et conservez vos brouillons d’intervention.' },
  { section: 'Gestion', label: 'Devis solaires', path: '/devis', icon: FileText, description: 'Dimensionnement et préparation des offres.' },
  { section: 'Gestion', label: 'Paramètres', path: '/AdministrationSettings', icon: Settings, description: 'Configuration de votre espace de travail.' },
];
export function pageInfo(path) {
  return navigation.find(item => item.path.toLowerCase() === path.toLowerCase()) || { label: path.toLowerCase().includes('smartkit') ? 'Fiche équipement' : 'Exploitation', description: 'Supervision du parc solaire' };
}
