import { Router } from 'express';
import { protect, authorizeRoles } from '../middlewares/auth.middleware.js';
import {
  createCatalogProduct,
  deleteCatalogProduct,
  listCatalogProducts,
  updateCatalogProduct,
} from '../controllers/catalog.controller.js';

const router = Router();
router.use(protect, authorizeRoles('admin', 'administration', 'commercial', 'shop_manager'));
router.get('/', listCatalogProducts);
router.post('/', authorizeRoles('admin', 'shop_manager'), createCatalogProduct);
router.patch('/:productId', authorizeRoles('admin', 'shop_manager'), updateCatalogProduct);
router.delete('/:productId', authorizeRoles('admin', 'shop_manager'), deleteCatalogProduct);

export default router;
