import { param, query, body, validationResult } from 'express-validator'
import type { Request, Response, NextFunction } from 'express'

// Validate :symbol param - alphanumeric, max length 10, uppercase
export const validateSymbol = [
  param('symbol')
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('symbol must be 1-10 characters')
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage('symbol must be alphanumeric')
    .customSanitizer((value) => (typeof value === 'string' ? value.toUpperCase() : value)),
]

// Validate period query - allowed values, default to 30day
export const validatePeriod = [
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.query.period) req.query.period = '30day'
    next()
  },
  query('period')
    .trim()
    .isIn(['1day', '7day', '30day', '90day', '1year', 'all'])
    .withMessage('period must be one of 1day,7day,30day,90day,1year,all')
    .escape(),
]

// Generic sanitizer for body inputs
export const sanitizeInput = [
  body('*').optional({ checkFalsy: true }).trim().escape(),
]

// Handle validation errors
export function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req)
  if (errors.isEmpty()) return next()

  const formatted = (errors.array() as any[]).map((e) => ({ field: e.param, message: e.msg, value: e.value }))
  return res.status(400).json({ errors: formatted })
}
