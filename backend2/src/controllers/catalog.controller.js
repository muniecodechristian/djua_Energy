import { z } from 'zod';
import CatalogProduct from '../models/CatalogProduct.model.js';

const productSchema = z.object({
  name: z.string().trim().min(1).max(100),
  category: z.string().trim().min(1).max(60),
  brand: z.string().trim().max(80).optional().default(''),
  model: z.string().trim().max(80).optional().default(''),
  watts: z.coerce.number().min(0).max(10000000),
  hours: z.coerce.number().min(0).max(24),
  period: z.enum(['day', 'night', 'both', 'continuous']),
  diversity: z.coerce.number().min(0).max(1),
  price: z.coerce.number().min(0),
  currency: z.enum(['USD', 'CDF']),
  imageData: z.string().max(1500000).optional().default(''),
  active: z.boolean().optional().default(true),
}).strict();

const fail = (res, status, message) => res.status(status).json({ success: false, message });
const validImage = value => !value || /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);

export async function listCatalogProducts(req, res) {
  try {
    const { category, search } = req.query;
    const filter = req.user.role === 'admin' || req.user.role === 'administration' ? {} : { active: true };
    if (typeof category === 'string' && category.trim()) filter.category = category.trim().slice(0, 60);
    if (typeof search === 'string' && search.trim()) {
      const safeSearch = search.trim().slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: new RegExp(safeSearch, 'i') },
        { brand: new RegExp(safeSearch, 'i') },
        { model: new RegExp(safeSearch, 'i') },
      ];
    }
    const products = await CatalogProduct.find(filter).sort({ category: 1, name: 1 }).lean();
    return res.json({ success: true, data: products });
  } catch (error) {
    console.error('[Catalog] list failed:', error.message);
    return fail(res, 500, 'Impossible de charger le catalogue.');
  }
}

export async function createCatalogProduct(req, res) {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Vérifiez les informations du produit.');
  if (!validImage(parsed.data.imageData)) return fail(res, 400, 'Image invalide. Utilisez une image JPEG, PNG ou WebP.');
  try {
    const product = await CatalogProduct.create({ ...parsed.data, createdBy: req.user._id });
    return res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error('[Catalog] create failed:', error.message);
    return fail(res, 500, 'Impossible d’enregistrer ce produit.');
  }
}

export async function updateCatalogProduct(req, res) {
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success || Object.keys(parsed.data || {}).length === 0) return fail(res, 400, 'Aucune information valide à enregistrer.');
  if (parsed.data.imageData !== undefined && !validImage(parsed.data.imageData)) return fail(res, 400, 'Image invalide. Utilisez une image JPEG, PNG ou WebP.');
  try {
    const product = await CatalogProduct.findByIdAndUpdate(req.params.productId, { $set: parsed.data }, { returnDocument: 'after', runValidators: true });
    if (!product) return fail(res, 404, 'Produit introuvable.');
    return res.json({ success: true, data: product });
  } catch (error) {
    if (error.name === 'CastError') return fail(res, 404, 'Produit introuvable.');
    console.error('[Catalog] update failed:', error.message);
    return fail(res, 500, 'Impossible de modifier ce produit.');
  }
}

export async function deleteCatalogProduct(req, res) {
  try {
    const product = await CatalogProduct.findByIdAndDelete(req.params.productId);
    if (!product) return fail(res, 404, 'Produit introuvable.');
    return res.json({ success: true, data: { id: String(product._id) } });
  } catch (error) {
    if (error.name === 'CastError') return fail(res, 404, 'Produit introuvable.');
    console.error('[Catalog] delete failed:', error.message);
    return fail(res, 500, 'Impossible de supprimer ce produit.');
  }
}
