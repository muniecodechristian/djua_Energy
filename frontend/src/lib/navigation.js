import { LayoutDashboard, PanelsTopLeft, Bell, Wrench, FileText, Settings, Users, ChartNoAxesColumn, PackageSearch, ClipboardCheck } from 'lucide-react';

export const navigation = [
  { section: 'Supervision', label: 'Vue d’ensemble', path: '/dashboard', icon: LayoutDashboard, description: 'Les signaux essentiels pour piloter votre parc solaire.' },
  { section: 'Supervision', label: 'Parc solaire', path: '/parc', icon: PanelsTopLeft, description: 'Équipements, contrats et accès aux fiches techniques.' },
  { section: 'Supervision', label: 'Alertes', path: '/notification', icon: Bell, description: 'Priorisez les anomalies et examinez les faits observés.' },
  { section: 'Exploitation', label: 'Suivi Installations', path: '/installations', icon: ClipboardCheck, description: 'Traçabilité, assignation et mise en service des kits solaires.' },
  { section: 'Exploitation', label: 'Maintenance & Interventions', path: '/InterventionWizard', icon: Wrench, description: 'Créez vos interventions, assignez vos techniciens et consultez les rapports.' },
  { section: 'Exploitation', label: 'Équipe', path: '/equipe', icon: Users, description: 'Gérez les techniciens et commerciaux de votre zone.' },
  { section: 'Gestion', label: 'Devis solaires', path: '/devis', icon: FileText, description: 'Dimensionnement et préparation des offres.' },
  { section: 'Administration', label: 'Rapports', path: '/rapports', icon: ChartNoAxesColumn, description: 'Consultez les comptes-rendus rédigés après les interventions.' },
  { section: 'Administration', label: 'Catalogue', path: '/catalogue', icon: PackageSearch, description: 'Référentiel des équipements utilisés pour les recommandations.' },
  { section: 'Gestion', label: 'Paramètres', path: '/AdministrationSettings', icon: Settings, description: 'Configuration de votre espace de travail.' },
];

export function pageInfo(path) {
  if (path.toLowerCase() === '/installations') return { label: 'Suivi des Installations', description: 'Module 2 : Traçabilité, planification et mise en service.' };
  if (path.toLowerCase() === '/devis/nouveau') return { label: 'Nouveau devis solaire', description: 'Dimensionnement et préparation d’une offre.' };
  if (path.toLowerCase() === '/equipe') return { label: 'Gestion de l’équipe', description: 'Techniciens et commerciaux de votre zone.' };
  if (path.toLowerCase() === '/technicien') return { label: 'Espace Technicien', description: 'Missions, scan et rapports de maintenance.' };
  return navigation.find(item => item.path.toLowerCase() === path.toLowerCase()) || { label: path.toLowerCase().includes('smartkit') ? 'Fiche équipement' : 'Exploitation', description: 'Supervision du parc solaire' };
}

export function navigationForRole(role) {
  const normalizedRole = role === 'administration' ? 'admin' : role;
  
  // L’administrateur accède aux écrans globaux de gestion et de supervision avec vision complète.
  if (normalizedRole === 'admin') {
    const adminPaths = ['/installations', '/rapports', '/devis', '/parc', '/catalogue', '/AdministrationSettings'];
    return navigation
      .filter(item => adminPaths.includes(item.path))
      .sort((left, right) => adminPaths.indexOf(left.path) - adminPaths.indexOf(right.path))
      .map(item => ({ ...item, label: item.path === '/devis' ? 'Devis' : item.label, section: 'Administration' }));
  }
  
  // Le commercial est uniquement là pour la partie devis, rien d'autre
  if (normalizedRole === 'commercial') {
    const commercialPaths = ['/dashboard', '/devis', '/parc', '/rapports'];
    return navigation.filter(item => commercialPaths.includes(item.path))
      .sort((left, right) => commercialPaths.indexOf(left.path) - commercialPaths.indexOf(right.path))
      .map(item => ({
        ...item,
        label: item.path === '/dashboard' ? 'Tableau de bord' : item.path === '/devis' ? 'Devis' : item.path === '/parc' ? 'Parc solaire' : item.path === '/rapports' ? 'Rapports' : item.label,
        section: 'Espace commercial',
      }));
  }

  // Le technicien n'a pas accès à la plateforme du responsable de shop : son app est sur /technicien
  if (normalizedRole === 'technician') {
    return [];
  }

  // Responsable Shop (shop_manager) : Vue d'ensemble complète sauf paramètres admin
  return navigation.filter(item => !['/AdministrationSettings', '/rapports', '/catalogue'].includes(item.path));
}
