# API Security Middleware Documentation

## Overview
This document describes the security middleware layers implemented in the NEPSE API to protect against common web vulnerabilities and abuse.

### Security Layers

1. Helmet (Security Headers)
- Purpose: Sets secure HTTP headers to prevent common attacks
- Configuration: Located in `api/src/middleware/security.ts`

2. Rate Limiting
- Purpose: Prevents DDoS and brute force attacks
- Limits: 100 requests per 15 minutes per IP address

3. CORS (Cross-Origin Resource Sharing)
- Purpose: Controls which domains can access the API
- Whitelist: Configured via `ALLOWED_ORIGINS` environment variable

4. Request Size Limits
- Purpose: Prevents large payload attacks
- Limit: 10KB for JSON and URL-encoded bodies

5. Input Validation
- Purpose: Prevents injection attacks and ensures data integrity
- Implementation: Uses `express-validator` with custom validation chains in `api/src/middleware/validation.ts`

Refer to `api/src/middleware/security.ts` and `api/src/middleware/validation.ts` for implementation details.
