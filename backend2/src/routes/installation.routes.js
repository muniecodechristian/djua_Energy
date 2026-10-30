import { Router } from 'express';
import { protect, authorizeRoles } from '../middlewares/auth.middleware.js';
import {
  listInstallations,
  getInstallationDetail,
  assignTechnician,
  updateInstallationStatus,
  commissionInstallation,
  validateInstallation,
  acceptInstallation,
  reportInstallationIssue,
  markInstalled,
  getInstallationMessages,
  sendInstallationMessage,
  markInstallationMessagesRead,
  acknowledgeInstallation,
  listInstallationConversations
} from '../controllers/installation.controller.js';

const router = Router();

router.use(protect);

// Liste des conversations de chat pour la surveillance (Admin, Superviseur, Technicien)
router.get('/conversations', listInstallationConversations);

// Vision et listing selon rôles (admin a la vision totale)
router.get('/', listInstallations);
router.get('/:id', getInstallationDetail);

// Assignation technicien + date (Admin, Shop Manager & Commercial)
router.patch('/:id/assign', authorizeRoles('admin', 'administration', 'shop_manager', 'commercial'), assignTechnician);

// Accusé de réception de la mission par le technicien (l'information remonte immédiatement)
router.post('/:id/acknowledge', authorizeRoles('technician', 'admin', 'administration', 'shop_manager'), acknowledgeInstallation);

// Acceptation de mission par le technicien
router.patch('/:id/accept', authorizeRoles('technician', 'admin', 'administration', 'shop_manager'), acceptInstallation);

// Signalement d'obstacle / matériel manquant par le technicien
router.patch('/:id/report-issue', authorizeRoles('technician', 'admin', 'administration', 'shop_manager'), reportInstallationIssue);

// Matériel posé sur site (statut 'installee')
router.patch('/:id/mark-installed', authorizeRoles('technician', 'admin', 'administration', 'shop_manager'), markInstalled);

// Changement de statut générique (technicien assigné, admin, shop manager)
router.patch('/:id/status', updateInstallationStatus);

// Mise en service avec checklist + Box IoT + GPS (technicien, admin, manager)
router.post('/:id/commission', authorizeRoles('technician', 'admin', 'administration', 'shop_manager'), commissionInstallation);

// Validation finale de conformité (Admin uniquement)
router.patch('/:id/validate', authorizeRoles('admin', 'administration'), validateInstallation);

// Fil de discussion en temps réel (texte, vocal audio, images)
router.get('/:id/messages', getInstallationMessages);
router.post('/:id/messages', sendInstallationMessage);
router.patch('/:id/messages/read', markInstallationMessagesRead);

export default router;
