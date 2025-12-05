import rateLimit from 'express-rate-limit'
import helmet from 'helmet'

// Rate limiter: 1000 requests per 15 minutes per IP (relaxed for development)
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res /*, next */) => {
    const ip = req.ip || req.connection.remoteAddress
    console.warn(`[ratelimit] IP ${ip} exceeded rate limit at ${new Date().toISOString()}`)
    res.status(429).json({ error: 'Too many requests, please try again later.' })
  },
})

// Helmet configuration with recommended headers
export const helmetConfig: any = {
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' },
  noSniff: true,
  // xssFilter removed in newer helmet versions; legacy option left out
}

// CORS options factory (callers can pass the result to cors())
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // If no origin (server-to-server or same-origin), allow
    if (!origin) return callback(null, true)

    const defaults = ['http://localhost:5173', 'http://localhost:3000']
    const env = process.env.ALLOWED_ORIGINS || ''
    const extra = env ? env.split(',').map(s => s.trim()).filter(Boolean) : []
    const allowed = new Set([...defaults, ...extra])

    if (allowed.has(origin)) return callback(null, true)
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  optionsSuccessStatus: 200,
}

// Request size limits for body parsers
export const requestSizeLimits = {
  limit: '10kb',
}
