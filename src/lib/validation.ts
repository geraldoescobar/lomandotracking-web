import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

export const createOrderSchema = z.object({
  customerId: z.string().optional(),
  description: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  type: z.string().optional().default('distribution'),
  originStep: z.object({
    address: z.string().min(1, 'Dirección de origen requerida'),
    street: z.string().optional().default(''),
    number: z.string().optional().default(''),
    apartment: z.string().optional().default(''),
    city: z.string().optional().default(''),
    contactName: z.string().optional().default(''),
    contactPhone: z.string().optional().default(''),
    notes: z.string().optional().default(''),
    saveAddress: z.boolean().optional().default(false),
    addressName: z.string().optional().default(''),
  }),
  destinationSteps: z.array(z.object({
    address: z.string().min(1, 'Dirección de destino requerida'),
    contactName: z.string().optional().default(''),
    contactPhone: z.string().optional().default(''),
    notes: z.string().optional().default(''),
    packageQty: z.number().optional().default(1),
  })).min(1, 'Al menos un destino requerido'),
});

export const updateStepStatusSchema = z.object({
  statusId: z.number({ error: 'statusId requerido' }),
  userId: z.string().optional(),
  observation: z.string().optional().default(''),
  receiverName: z.string().optional().default(''),
  receiverDocument: z.string().optional().default(''),
  photoUrl: z.string().optional().default(''),
});

export const updateOrderStatusSchema = z.object({
  statusId: z.number({ error: 'statusId requerido' }),
  userId: z.string().optional(),
  observation: z.string().optional().default(''),
});

export const createAddressSchema = z.object({
  customerId: z.string({ error: 'customerId requerido' }),
  street: z.string().min(1, 'Calle requerida'),
  number: z.string().nullable().optional(),
  apartment: z.string().nullable().optional(),
  city: z.string().min(1, 'Ciudad requerida'),
  notes: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  saveAddress: z.boolean().optional().default(false),
});

export function getValidationError(result: { success: boolean; error?: { issues: { message: string }[] } }): string | null {
  if (result.success) return null;
  const issue = result.error?.issues[0];
  return issue?.message || 'Datos inválidos';
}
