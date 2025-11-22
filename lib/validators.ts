import { z } from 'zod'

export const clientSchema = z.object({
  fullName: z.string().min(1),
  residence: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
})

export const clientUpdateSchema = clientSchema.extend({
  id: z.number().int().positive(),
})

export const paymentSchema = z.object({
  unitId: z.number().int().positive(),
  clientId: z.number().int().positive(),
  label: z.string().optional().nullable(),
  date: z.preprocess((v) => (v ? new Date(String(v)) : undefined), z.date().optional().nullable()),
  amount: z.number().nonnegative(),
})

export const paymentUpdateSchema = z.object({
  id: z.number().int().positive(),
  unitId: z.number().int().positive(),
  clientId: z.number().int().positive(),
  label: z.string().optional().nullable(),
  date: z.preprocess((v) => (v ? new Date(String(v)) : undefined), z.date().optional().nullable()),
  amount: z.number().nonnegative(),
})

export const unitUpdateSchema = z.object({
  id: z.number().int().positive(),
  pricePerM2: z.number().nonnegative().optional(),
  totalPrice: z.number().nonnegative().optional(),
  comments: z.string().optional().nullable(),
})

export const unitCreateSchema = z.object({
  block: z.string().min(1),
  listNumber: z.preprocess((v) => (v === '' || v === null ? undefined : Number(v)), z.number().int().optional()),
  floor: z.preprocess((v) => (v === '' || v === null ? undefined : Number(v)), z.number().int().optional()),
  apartmentNumber: z.string().optional().nullable(),
  areaM2: z.preprocess((v) => (v === '' || v === null ? undefined : Number(v)), z.number().nonnegative().optional()),
  pricePerM2: z.preprocess((v) => (v === '' || v === null ? undefined : Number(v)), z.number().nonnegative().optional()),
  totalPrice: z.preprocess((v) => (v === '' || v === null ? undefined : Number(v)), z.number().nonnegative().optional()),
  saleDate: z.preprocess((v) => (v ? new Date(String(v)) : undefined), z.date().optional()),
  contractInfo: z.string().optional().nullable(),
  comments: z.string().optional().nullable(),
  clientId: z.preprocess((v) => (v === '' || v === null ? undefined : Number(v)), z.number().int().optional()),
  type: z.enum(['APARTMENT', 'LOCAL']).default('APARTMENT'),
})

export const unitFullUpdateSchema = unitCreateSchema.extend({
  id: z.number().int().positive(),
})

export const blockSchema = z.object({
  name: z.string().min(1).max(100),
})

export const blockDeleteSchema = z.object({
  name: z.string().min(1),
})

export const invoiceSchema = z.object({
  clientId: z.number().int().positive(),
  unitId: z.number().int().positive(),
  issueDate: z.preprocess((v) => (v ? new Date(String(v)) : new Date()), z.date()),
  dueDate: z.preprocess((v) => (v ? new Date(String(v)) : new Date()), z.date()),
  subtotal: z.number().nonnegative(),
  notes: z.string().optional().nullable(),
})

export const invoiceUpdateSchema = invoiceSchema.extend({
  id: z.number().int().positive(),
  invoiceNumber: z.string().min(1).optional(),
})

export const settingsSchema = z.object({
  companyName: z.string().optional().nullable(),
  address1: z.string().optional().nullable(),
  address2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  currencyCode: z.string().min(3).max(3).optional().nullable(),
  locale: z.string().min(2).optional().nullable(),
  invoiceNumberFormat: z.string().optional().nullable(),
  dateFormat: z.string().optional().nullable(),
})

export const allocationSchema = z.object({
  paymentId: z.number().int().positive(),
  invoiceId: z.number().int().positive(),
  amount: z.number().positive(),
})

export type ClientInput = z.infer<typeof clientSchema>
export type ClientUpdateInput = z.infer<typeof clientUpdateSchema>
export type PaymentInput = z.infer<typeof paymentSchema>
export type PaymentUpdateInput = z.infer<typeof paymentUpdateSchema>
export type UnitUpdateInput = z.infer<typeof unitUpdateSchema>
export type UnitCreateInput = z.infer<typeof unitCreateSchema>
export type UnitFullUpdateInput = z.infer<typeof unitFullUpdateSchema>
export type InvoiceInput = z.infer<typeof invoiceSchema>
export type InvoiceUpdateInput = z.infer<typeof invoiceUpdateSchema>
export type BlockInput = z.infer<typeof blockSchema>
export type SettingsInput = z.infer<typeof settingsSchema>
