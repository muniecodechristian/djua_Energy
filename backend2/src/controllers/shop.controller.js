import Shop from '../models/Shop.model.js';
import User from '../models/user.model.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const getShops = async (_req, res) => {
  try {
    const shops = await Shop.find()
      .select('name address region createdAt managerId')
      .populate('managerId', 'nom prenom identifier')
      .sort({ name: 1 })
      .lean();
    return sendSuccess(res, 'Shops retrieved successfully', shops);
  } catch (error) {
    return sendError(res, `Could not load shops: ${error.message}`, [], 500);
  }
};

export const createShop = async (req, res) => {
  try {
    const shop = await Shop.create({
      ...req.body,
      createdBy: req.user._id,
    });
    return sendSuccess(res, 'Shop created successfully', {
      _id: shop._id,
      name: shop.name,
      address: shop.address,
      region: shop.region,
      managerId: null,
      createdAt: shop.createdAt,
    }, 201);
  } catch (error) {
    return sendError(res, `Could not create shop: ${error.message}`, [], 500);
  }
};

/**
 * PUT /api/shops/:shopId/manager
 * Assigne (ou réassigne) un responsable shop à un shop.
 * Réservé aux admins.
 */
export const assignShopManager = async (req, res) => {
  const { shopId } = req.params;
  const { managerId } = req.body;

  try {
    const shop = await Shop.findById(shopId);
    if (!shop) return sendError(res, 'Shop introuvable', [], 404);

    if (!managerId) {
      // Désassigner
      shop.managerId = null;
      await shop.save();
      return sendSuccess(res, 'Responsable shop retiré', {
        _id: shop._id,
        name: shop.name,
        managerId: null,
      });
    }

    const manager = await User.findOne({ _id: managerId, role: { $in: ['shop_manager', 'admin'] } });
    if (!manager) return sendError(res, 'Utilisateur introuvable ou rôle non autorisé', [], 404);

    shop.managerId = manager._id;
    await shop.save();

    // Mettre à jour le shopId du responsable
    if (manager.role === 'shop_manager') {
      manager.shopId = shop._id;
      await manager.save();
    }

    return sendSuccess(res, 'Responsable shop assigné avec succès', {
      _id: shop._id,
      name: shop.name,
      managerId: {
        _id: manager._id,
        nom: manager.nom,
        prenom: manager.prenom,
        identifier: manager.identifier,
      },
    });
  } catch (error) {
    return sendError(res, `Impossible d'assigner le responsable: ${error.message}`, [], 500);
  }
};
