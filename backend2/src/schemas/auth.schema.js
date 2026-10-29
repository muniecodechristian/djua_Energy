import { z } from 'zod';

const emailSchema = z.string().email('Invalid email address');
const phoneSchema = z.string().regex(/^\+?[1-9]\d{5,14}$/, 'Invalid international phone number format');

const identifierSchema = z.string()
  .trim()
  .toLowerCase()
  .refine(
    (val) => emailSchema.safeParse(val).success || phoneSchema.safeParse(val).success,
    { message: 'Identifier must be a valid email address or international phone number' }
  );

// Password strength requirements: min 8, at least 1 upper, 1 lower, 1 number, 1 special character
const passwordStrengthSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[@$!%*?&_\-#:;.]/, 'Password must contain at least one special character (@$!%*?&_-#:;.)');

export const registerSchema = z.object({
  body: z.object({
    nom: z.string({ required_error: 'Nom is required' })
      .trim()
      .min(2, 'Nom must be at least 2 characters long'),
    prenom: z.string({ required_error: 'Prenom is required' })
      .trim()
      .min(2, 'Prenom must be at least 2 characters long'),
    postNom: z.string().trim().optional(),
    identifier: identifierSchema,
    password: passwordStrengthSchema,
  }),
});

export const teamUserSchema = z.object({
  body: z.object({
    nom: z.string().trim().min(2),
    prenom: z.string().trim().min(2),
    postNom: z.string().trim().optional(),
    identifier: identifierSchema,
    whatsapp: z.string().trim().min(6, 'Le numéro WhatsApp est requis (ex: +243...)').optional(),
    password: passwordStrengthSchema,
    role: z.enum(['admin', 'shop_manager', 'technician', 'commercial']),
    zone: z.string().trim().optional(),
  }),
});

export const updateTeamUserSchema = z.object({
  params: z.object({ userId: z.string().regex(/^[a-f\d]{24}$/i) }),
  body: z.object({
    nom: z.string().trim().min(2).optional(),
    prenom: z.string().trim().min(2).optional(),
    postNom: z.string().trim().optional(),
    identifier: identifierSchema.optional(),
    whatsapp: z.string().trim().min(6).optional(),
    password: passwordStrengthSchema.optional(),
    role: z.enum(['shop_manager', 'technician', 'commercial']).optional(),
    zone: z.string().trim().optional(),
  }),
});

export const teamMemberStatusSchema = z.object({
  params: z.object({ userId: z.string().regex(/^[a-f\d]{24}$/i) }),
  body: z.object({ status: z.enum(['active', 'suspended']) }),
});

export const teamMemberParamsSchema = z.object({
  params: z.object({ userId: z.string().regex(/^[a-f\d]{24}$/i) }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: passwordStrengthSchema,
  }),
});

export const loginSchema = z.object({
  body: z.object({
    identifier: z.string().trim(), // <-- 'identifier'
    password: z.string(),
  }),
});
