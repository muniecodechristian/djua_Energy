import { Router } from 'express';
import { protect, authorizeRoles } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createShop, getShops } from '../controllers/shop.controller.js';
import { createShopSchema } from '../schemas/shop.schema.js';

const router = Router();

router.get('/', protect, authorizeRoles('admin'), getShops);
router.post('/', protect, authorizeRoles('admin'), validate(createShopSchema), createShop);

export default router;
