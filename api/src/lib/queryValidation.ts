import { z } from 'zod'

/**
 * Query Result Validation Schemas
 * Validates database query results to ensure data integrity and type safety
 */

export const OHLCDataSchema = z.object({
  symbol: z.string().min(1).max(20),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  open: z.number().positive(),
  high: z.number().positive(),
  low: z.number().positive(),
  close: z.number().positive(),
  volume: z.number().nonnegative(),
})

export type OHLCData = z.infer<typeof OHLCDataSchema>

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['user', 'admin']),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
})

export type User = z.infer<typeof UserSchema>

export const SubscriptionSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  status: z.enum(['trial', 'active', 'past_due', 'canceled']),
  trial_ends_at: z.string().datetime().nullable().optional(),
  current_period_end: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime().optional(),
})

export type Subscription = z.infer<typeof SubscriptionSchema>

export const CompanySchema = z.object({
  symbol: z.string().min(1).max(20),
  name: z.string().min(1),
  sector: z.string().optional(),
  marketCap: z.number().nonnegative().optional(),
  peRatio: z.number().positive().optional(),
})

export type Company = z.infer<typeof CompanySchema>

/**
 * Generic query result validator
 * @param data - Unknown data from database query
 * @param schema - Zod schema to validate against
 * @returns Validated and typed data
 * @throws Validation error with safe client message
 */
export function validateQueryResult<T>(data: unknown, schema: z.ZodSchema<T>): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
      throw new Error(`Data validation failed: ${fieldErrors}`)
    }
    throw error
  }
}

/**
 * Validate OHLC data array
 * @param data - Unknown data from query result
 * @returns Array of validated OHLC data
 */
export function validateOHLCData(data: unknown): OHLCData[] {
  if (!Array.isArray(data)) {
    throw new Error('OHLC data must be an array')
  }
  return data.map(item => validateQueryResult(item, OHLCDataSchema))
}

/**
 * Validate single user
 * @param data - Unknown user data
 * @returns Validated user object
 */
export function validateUser(data: unknown): User {
  return validateQueryResult(data, UserSchema)
}

/**
 * Validate subscription
 * @param data - Unknown subscription data
 * @returns Validated subscription object
 */
export function validateSubscription(data: unknown): Subscription {
  return validateQueryResult(data, SubscriptionSchema)
}

/**
 * Validate company
 * @param data - Unknown company data
 * @returns Validated company object
 */
export function validateCompany(data: unknown): Company {
  return validateQueryResult(data, CompanySchema)
}

/**
 * Safe error message for client response
 * Hides internal validation details while being helpful
 */
export function getSafeValidationError(error: Error): string {
  if (error.message.includes('Data validation failed')) {
    return 'Invalid response format from database'
  }
  return 'Data processing failed'
}

/**
 * ============================================================================
 * PAYLOAD VALIDATION SCHEMAS (For API Request Bodies)
 * Validates incoming data before insert/update to database
 * ============================================================================
 */

/**
 * Payment payload schema for insert/update
 * Validates: amount_npr > 0, status enum, provider enum
 */
export const PaymentPayloadSchema = z.object({
  user_id: z.string().uuid(),
  provider: z.enum(['esewa', 'khalti', 'imepay']),
  amount_npr: z.number().int().positive('Amount must be a positive integer in NPR'),
  txn_id: z.string().optional(),
  status: z.enum(['pending', 'verified', 'failed']).default('pending'),
  meta: z.record(z.any()).optional(),
})

export type PaymentPayload = z.infer<typeof PaymentPayloadSchema>

/**
 * Subscription payload schema for insert/update
 * Validates: status enum, date fields
 */
export const SubscriptionPayloadSchema = z.object({
  user_id: z.string().uuid(),
  plan: z.string().default('monthly'),
  status: z.enum(['trial', 'active', 'past_due', 'canceled']).default('trial'),
  trial_ends_at: z.string().datetime().nullable().optional(),
  current_period_end: z.string().datetime().nullable().optional(),
})

export type SubscriptionPayload = z.infer<typeof SubscriptionPayloadSchema>

/**
 * OHLC payload schema for insert/update
 * Validates: all prices positive, high >= low, volume >= 0
 */
export const OHLCPayloadSchema = z.object({
  symbol: z.string().min(1).max(20),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  open: z.number().positive('Open price must be positive'),
  high: z.number().positive('High price must be positive'),
  low: z.number().positive('Low price must be positive'),
  close: z.number().positive('Close price must be positive'),
  volume: z.number().nonnegative('Volume must be non-negative'),
}).refine(data => data.high >= data.low, {
  message: 'High price must be greater than or equal to low price',
  path: ['high'],
})

export type OHLCPayload = z.infer<typeof OHLCPayloadSchema>

/**
 * Validate payment payload before insert/update
 * Returns validation errors as user-friendly messages
 * @param payload - Payment data from API request
 * @throws Error with user-friendly validation message
 */
export function validatePaymentPayload(payload: unknown): PaymentPayload {
  try {
    return PaymentPayloadSchema.parse(payload)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => e.message).join('; ')
      throw new Error(`Payment validation failed: ${messages}`)
    }
    throw error
  }
}

/**
 * Validate subscription payload before insert/update
 * Returns validation errors as user-friendly messages
 * @param payload - Subscription data from API request
 * @throws Error with user-friendly validation message
 */
export function validateSubscriptionPayload(payload: unknown): SubscriptionPayload {
  try {
    return SubscriptionPayloadSchema.parse(payload)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => e.message).join('; ')
      throw new Error(`Subscription validation failed: ${messages}`)
    }
    throw error
  }
}

/**
 * Validate OHLC payload before insert/update
 * Returns validation errors as user-friendly messages
 * @param payload - OHLC data from API request
 * @throws Error with user-friendly validation message
 */
export function validateOHLCPayload(payload: unknown): OHLCPayload {
  try {
    return OHLCPayloadSchema.parse(payload)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => e.message).join('; ')
      throw new Error(`OHLC validation failed: ${messages}`)
    }
    throw error
  }
}
