import { z } from 'zod';

export const createShopSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2),
    address: z.string().trim().min(3),
    region: z.string().trim().min(2),
  }),
});
