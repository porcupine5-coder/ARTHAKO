/**
 * Database Error Handler
 * Centralized error handling for Supabase/PostgreSQL errors
 * Logs detailed errors server-side, returns sanitized messages to clients
 */

interface ErrorContext {
  error: any
  context: string
  userId?: string
  endpoint?: string
}

interface StandardError {
  code: string
  statusCode: number
  clientMessage: string
  serverMessage: string
  retryable: boolean
}

/**
 * Error code mapping for common PostgreSQL/Supabase errors
 */
const ERROR_CODE_MAP: Record<string, Partial<StandardError>> = {
  '23505': {
    code: 'UNIQUE_VIOLATION',
    statusCode: 409,
    clientMessage: 'This record already exists',
    serverMessage: 'Unique constraint violation',
    retryable: false,
  },
  '23503': {
    code: 'FOREIGN_KEY_VIOLATION',
    statusCode: 400,
    clientMessage: 'Invalid reference to related data',
    serverMessage: 'Foreign key constraint violation',
    retryable: false,
  },
  '23502': {
    code: 'NOT_NULL_VIOLATION',
    statusCode: 400,
    clientMessage: 'Missing required field',
    serverMessage: 'Not null constraint violation',
    retryable: false,
  },
  '23514': {
    code: 'CHECK_VIOLATION',
    statusCode: 400,
    clientMessage: 'Invalid data provided',
    serverMessage: 'Check constraint violation',
    retryable: false,
  },
  '42P01': {
    code: 'TABLE_NOT_FOUND',
    statusCode: 500,
    clientMessage: 'Database error',
    serverMessage: 'Table not found',
    retryable: false,
  },
  'PGRST116': {
    code: 'NO_ROWS_FOUND',
    statusCode: 404,
    clientMessage: 'Record not found',
    serverMessage: 'No rows returned',
    retryable: false,
  },
}

/**
 * Categorize Supabase error by type
 */
function categorizeError(error: any): { type: string; code?: string } {
  if (!error) return { type: 'unknown' }

  // Network errors
  if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
    return { type: 'network' }
  }

  // Authentication errors
  if (error.status === 401 || error.message?.includes('unauthorized')) {
    return { type: 'auth' }
  }

  // PostgreSQL error codes
  if (error.code) {
    return { type: 'postgres', code: error.code }
  }

  // Supabase specific error codes
  if (error.message?.includes('PGRST')) {
    const match = error.message.match(/(PGRST\d+)/i)
    if (match) return { type: 'supabase', code: match[1] }
  }

  // Timeout
  if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
    return { type: 'timeout' }
  }

  return { type: 'unknown' }
}

/**
 * Check if error is retryable (transient failure)
 */
export function isRetryableError(error: any): boolean {
  const { type } = categorizeError(error)
  return type === 'network' || type === 'timeout'
}

/**
 * Handle Supabase error with logging and standardization
 */
export function handleSupabaseError(error: any, context: string, userId?: string, endpoint?: string): StandardError {
  const { type, code } = categorizeError(error)
  const timestamp = new Date().toISOString()

  // Build server-side log message
  const logContext: ErrorContext = {
    error,
    context,
    userId,
    endpoint,
  }

  console.error(
    `[DB Error] ${timestamp}`,
    `Type: ${type}${code ? `, Code: ${code}` : ''}`,
    `Context: ${context}`,
    userId ? `User: ${userId}` : '',
    endpoint ? `Endpoint: ${endpoint}` : '',
    'Details:',
    {
      message: error?.message,
      status: error?.status,
      code: error?.code,
      hint: error?.hint,
      details: error?.details,
    }
  )

  // Lookup standard error or use default
  const standardError = code ? ERROR_CODE_MAP[code] : null
  if (standardError) {
    return {
      code: standardError.code || 'DATABASE_ERROR',
      statusCode: standardError.statusCode || 500,
      clientMessage: standardError.clientMessage || 'Database operation failed',
      serverMessage: standardError.serverMessage || error.message,
      retryable: standardError.retryable || false,
    }
  }

  // Default error response based on type
  switch (type) {
    case 'network':
      return {
        code: 'NETWORK_ERROR',
        statusCode: 503,
        clientMessage: 'Database connection unavailable. Please try again.',
        serverMessage: 'Network error contacting database',
        retryable: true,
      }
    case 'auth':
      return {
        code: 'AUTH_ERROR',
        statusCode: 401,
        clientMessage: 'Authentication failed',
        serverMessage: 'Database authentication error',
        retryable: false,
      }
    case 'timeout':
      return {
        code: 'TIMEOUT_ERROR',
        statusCode: 504,
        clientMessage: 'Request took too long. Please try again.',
        serverMessage: 'Query timeout',
        retryable: true,
      }
    default:
      return {
        code: 'DATABASE_ERROR',
        statusCode: 500,
        clientMessage: 'Database operation failed',
        serverMessage: error?.message || 'Unknown error',
        retryable: false,
      }
  }
}

/**
 * Wrap a promise with timeout
 * @param promise - Promise to wrap
 * @param ms - Timeout in milliseconds
 * @returns Promise that rejects on timeout
 */
export function withTimeout<T>(promise: Promise<T>, ms: number = 5000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Query timeout after ${ms}ms`)), ms)
    ),
  ])
}

/**
 * Retry logic for transient failures
 * @param fn - Async function to retry
 * @param maxAttempts - Maximum retry attempts
 * @param delayMs - Delay between retries in milliseconds
 * @returns Result of successful attempt or final error
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (!isRetryableError(error)) {
        throw error // Don't retry non-transient errors
      }
      if (attempt < maxAttempts) {
        console.log(`[Retry] Attempt ${attempt} failed, retrying in ${delayMs}ms...`)
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt)) // Exponential backoff
      }
    }
  }

  throw lastError
}
