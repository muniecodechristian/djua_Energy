import { Router } from 'express';
import { protect, authorizeRoles } from '../middlewares/auth.middleware.js';
import {
  createCatalogProduct,
  deleteCatalogProduct,
  listCatalogProducts,
  updateCatalogProduct,
} from '../controllers/catalog.controller.js';

const router = Router();
router.use(protect, authorizeRoles('admin', 'commercial'));
router.get('/', listCatalogProducts);
router.post('/', authorizeRoles('admin'), createCatalogProduct);
router.patch('/:productId', authorizeRoles('admin'), updateCatalogProduct);
router.delete('/:productId', authorizeRoles('admin'), deleteCatalogProduct);

export default router;
