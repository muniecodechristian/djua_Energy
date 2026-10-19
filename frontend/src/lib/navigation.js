import { LayoutDashboard, PanelsTopLeft, Bell, Wrench, FileText, Settings, Users } from 'lucide-react';

export const navigation = [
  { section: 'Supervision', label: 'Vue d’ensemble', path: '/dashboard', icon: LayoutDashboard, description: 'Les signaux essentiels pour piloter votre parc solaire.' },
  { section: 'Supervision', label: 'Parc solaire', path: '/parc', icon: PanelsTopLeft, description: 'Équipements, contrats et accès aux fiches techniques.' },
  { section: 'Supervision', label: 'Alertes', path: '/notification', icon: Bell, description: 'Priorisez les anomalies et examinez les faits observés.' },
  { section: 'Exploitation', label: 'Maintenance & Interventions', path: '/InterventionWizard', icon: Wrench, description: 'Créez vos interventions, assignez vos techniciens et consultez les rapports.' },
  { section: 'Exploitation', label: 'Équipe', path: '/equipe', icon: Users, description: 'Gérez les techniciens et commerciaux de votre zone.' },
  { section: 'Gestion', label: 'Devis solaires', path: '/devis', icon: FileText, description: 'Dimensionnement et préparation des offres.' },
  { section: 'Gestion', label: 'Paramètres', path: '/AdministrationSettings', icon: Settings, description: 'Configuration de votre espace de travail.' },
];

export function pageInfo(path) {
  if (path.toLowerCase() === '/equipe') return { label: 'Gestion de l’équipe', description: 'Techniciens et commerciaux de votre zone.' };
  if (path.toLowerCase() === '/technicien') return { label: 'Espace Technicien', description: 'Missions, scan et rapports de maintenance.' };
  return navigation.find(item => item.path.toLowerCase() === path.toLowerCase()) || { label: path.toLowerCase().includes('smartkit') ? 'Fiche équipement' : 'Exploitation', description: 'Supervision du parc solaire' };
}

export function navigationForRole(role) {
  const normalizedRole = role === 'administration' ? 'admin' : role;
  
  // Admin Orange : Uniquement et exclusivement la page paramètres
  if (normalizedRole === 'admin') {
    return navigation.filter(item => item.path === '/AdministrationSettings');
  }
  
  // Le commercial est uniquement là pour la partie devis, rien d'autre
  if (normalizedRole === 'commercial') {
    return navigation.filter(item => item.path === '/devis');
  }

  // Le technicien n'a pas accès à la plateforme du responsable de shop : son app est sur /technicien
  if (normalizedRole === 'technician') {
    return [];
  }

  // Responsable Shop (shop_manager) : Vue d'ensemble complète sauf paramètres admin
  return navigation.filter(item => item.path !== '/AdministrationSettings');
}
