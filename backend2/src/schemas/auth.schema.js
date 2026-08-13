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

export const loginSchema = z.object({
  body: z.object({
    identifier: z.string().trim(), // <-- 'identifier'
    password: z.string(),
  }),
});
