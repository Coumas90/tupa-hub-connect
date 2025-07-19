/**
 * Zod validation schemas for TUPÁ Hub SDK
 */
import { z } from 'zod';

// Base schemas
export const SaleItemSchema = z.object({
  id: z.string().min(1, 'Item ID is required'),
  name: z.string().min(1, 'Item name is required'),
  quantity: z.number().positive('Quantity must be positive'),
  price: z.number().min(0, 'Price must be non-negative'),
  category: z.string().optional(),
  sku: z.string().optional()
});

export const SalePayloadSchema = z.object({
  id: z.string().min(1, 'Sale ID is required'),
  total: z.number().min(0, 'Total must be non-negative'),
  date: z.string().datetime('Date must be valid ISO datetime'),
  clientId: z.string().optional(),
  items: z.array(SaleItemSchema).min(1, 'At least one item is required'),
  paymentMethod: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

export const ClientPayloadSchema = z.object({
  id: z.string().min(1, 'Client ID is required'),
  name: z.string().min(1, 'Client name is required'),
  email: z.string().email('Valid email required').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  type: z.enum(['individual', 'business']).optional(),
  metadata: z.record(z.unknown()).optional()
});

export const ProductSchema = z.object({
  id: z.string().min(1, 'Product ID is required'),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be non-negative'),
  category: z.string().optional(),
  sku: z.string().optional(),
  stock: z.number().int().min(0, 'Stock must be non-negative integer').optional(),
  active: z.boolean()
});

export const TupaConfigSchema = z.object({
  apiKey: z.string().min(1, 'API Key is required'),
  endpoint: z.string().url('Valid endpoint URL required'),
  version: z.string().default('v1'),
  timeout: z.number().positive('Timeout must be positive').default(30000),
  maxRetries: z.number().int().min(1, 'Max retries must be at least 1').default(3)
});

export const TupaResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => z.object({
  data: dataSchema,
  success: z.boolean(),
  message: z.string().optional(),
  timestamp: z.string().datetime()
});

// Product list parameters schema
export const ProductListParamsSchema = z.object({
  category: z.string().optional(),
  active: z.boolean().optional(),
  limit: z.number().int().positive('Limit must be positive').max(1000, 'Limit cannot exceed 1000').optional(),
  offset: z.number().int().min(0, 'Offset must be non-negative').optional()
});

/**
 * Validation helper functions
 */
export const validateSalePayload = (data: unknown) => SalePayloadSchema.parse(data);
export const validateClientPayload = (data: unknown) => ClientPayloadSchema.parse(data);
export const validateProduct = (data: unknown) => ProductSchema.parse(data);
export const validateTupaConfig = (data: unknown) => TupaConfigSchema.parse(data);
export const validateProductListParams = (data: unknown) => ProductListParamsSchema.parse(data);

/**
 * Safe validation functions that return results instead of throwing
 */
export const safeParseSalePayload = (data: unknown) => SalePayloadSchema.safeParse(data);
export const safeParseClientPayload = (data: unknown) => ClientPayloadSchema.safeParse(data);
export const safeParseProduct = (data: unknown) => ProductSchema.safeParse(data);
export const safeParseTupaConfig = (data: unknown) => TupaConfigSchema.safeParse(data);

/**
 * Type guards using Zod validation
 */
export const isSalePayload = (data: unknown): data is z.infer<typeof SalePayloadSchema> => {
  return SalePayloadSchema.safeParse(data).success;
};

export const isClientPayload = (data: unknown): data is z.infer<typeof ClientPayloadSchema> => {
  return ClientPayloadSchema.safeParse(data).success;
};

export const isProduct = (data: unknown): data is z.infer<typeof ProductSchema> => {
  return ProductSchema.safeParse(data).success;
};

// Export inferred types
export type ValidatedSalePayload = z.infer<typeof SalePayloadSchema>;
export type ValidatedClientPayload = z.infer<typeof ClientPayloadSchema>;
export type ValidatedProduct = z.infer<typeof ProductSchema>;
export type ValidatedTupaConfig = z.infer<typeof TupaConfigSchema>;
export type ValidatedProductListParams = z.infer<typeof ProductListParamsSchema>;