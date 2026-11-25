import Shop from '../models/Shop.model.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const getShops = async (_req, res) => {
  try {
    const shops = await Shop.find().select('name address region createdAt').sort({ name: 1 }).lean();
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
      createdAt: shop.createdAt,
    }, 201);
  } catch (error) {
    return sendError(res, `Could not create shop: ${error.message}`, [], 500);
  }
};
