# Database Security: Comprehensive Implementation Guide

## 1. Overview

This document outlines the defense-in-depth database security architecture for the NEPSE API. The system is built on three layers of protection:

1. **Query Safety**: All database queries use Supabase's parameterized query builder (safe from SQL injection)
2. **Result Validation**: Query results are validated against Zod schemas to ensure data integrity
3. **Access Control**: Row Level Security (RLS) policies enforce user-scoped data access
4. **Error Handling**: Centralized error handling with logging and safe client messages

## 2. Query Safety

### Current Architecture

All database queries use Supabase's query builder methods, which are parameterized by default:

✅ **Safe** (Parameterized):
```typescript
// Symbol is passed as parameter, safe from injection
const { data } = await userClient
  .from('prices_ohlc')
  .select('*')
  .eq('symbol', symbol)  // Symbol is parameterized
```

✅ **Safe** (Insert with validation):
```typescript
// Email and role are parameterized
const { data } = await adminClient
  .from('users')
  .insert({ email, role: 'user' })
  .select()
  .single()
```

❌ **Unsafe** (Would require special care):
```typescript
// Do NOT use raw SQL strings with user input
const { data } = await client.rpc('raw_sql', { query: `SELECT * FROM users WHERE email = '${email}'` })
```

### Best Practices

1. **Always use query builder methods**: `.select()`, `.insert()`, `.update()`, `.delete()`, `.eq()`, `.in()`, etc.
2. **Never build SQL strings**: Avoid template literals or string concatenation with user input
3. **Validate input before queries**: Use middleware to validate symbol, email, numbers before querying
4. **Use `.rpc()` carefully**: If using PostgreSQL functions, sanitize parameters and document assumptions

## 3. Connection Pooling Setup

### When to Enable

Enable connection pooling in production deployments for:
- Serverless functions (Lambda, Cloud Functions, Edge Functions)
- High-concurrency APIs (>100 concurrent connections)
- Cost optimization (share connections across processes)

### Configuration in Supabase Dashboard

1. Navigate to **Database** → **Connection Pooling**
2. Enable **PgBouncer** (Supabase's connection pooler)
3. Choose mode:
   - **Transaction**: Better for short queries (default)
   - **Session**: Maintains per-user sessions, better for long-lived connections
4. Copy **Pooler URL** (ends with `:6543`)
5. Set in `.env.example` as `SUPABASE_POOLER_URL`

### Environment Variables

```bash
# Use pooler URL for production
SUPABASE_POOLER_URL=postgresql://postgres.xxxxx.supabase.co:6543/postgres?pgbouncer=true

# Pool sizing (optional, defaults: min=2, max=10)
DB_POOL_MIN=2
DB_POOL_MAX=10
```

### Connection Mode Comparison

| Mode | Use Case | Latency | Overhead |
|------|----------|---------|----------|
| **Transaction** | Short queries, serverless | Lower | Lower |
| **Session** | Long connections, complex transactions | Same | Higher |
| **None** | Single instance, low concurrency | Very Low | None |

## 4. Row Level Security (RLS) Implementation

### Enabling RLS in Supabase Dashboard

1. Go to **Database** → **Tables**
2. Select table (e.g., `users`)
3. Click **RLS** button → **Enable RLS**
4. Click **New Policy** to add policies

### RLS Policies Applied

#### User Data (User-Scoped)

**users table:**
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only read their own data
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can only update their own data
CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid() = id);
```

**subscriptions table:**
```sql
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own subscriptions
CREATE POLICY subscriptions_select_own ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own subscriptions
CREATE POLICY subscriptions_insert_own ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

**payments table:**
```sql
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can only read their own payments
CREATE POLICY payments_select_own ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own payments
CREATE POLICY payments_insert_own ON payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

#### Public Data (Authenticated Users)

**companies, prices_ohlc, fundamentals, news, etc:**
```sql
ALTER TABLE prices_ohlc ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read public market data
CREATE POLICY prices_ohlc_select_authenticated ON prices_ohlc
  FOR SELECT USING (auth.role() = 'authenticated');
```

#### Admin-Only Data

**admin_logs table:**
```sql
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can access audit logs
CREATE POLICY admin_logs_admin_only ON admin_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
```

### Testing RLS Policies

Use Supabase SQL Editor to test policies:

```sql
-- Simulate authenticated user
set role authenticated;
set request.jwt.claims.sub = 'uuid-of-test-user';

-- This should work (user's own data)
select * from users where id = current_user_id();

-- This should be blocked (another user's data)
select * from users where id = 'different-uuid';

-- Verify result is empty (policy enforced)
```

### Common Pitfalls

1. **Forgetting to enable RLS**: Policy exists but RLS is disabled → all users see all data
2. **Overly permissive policies**: `USING (true)` allows all access
3. **Service role bypasses RLS**: When using SUPABASE_KEY, RLS policies are NOT enforced
4. **Auth context missing**: Policies depend on `auth.uid()` and `auth.jwt()` being set correctly

## 5. Least-Privilege Access

### Client Types

**adminClient (Service Role Key)**
```typescript
const adminClient = createClient(SUPABASE_URL, SUPABASE_KEY)
// Full database access
// Use for: user creation, admin operations, data updates
// RLS policies are BYPASSED
```

**userClient (Anon Key)**
```typescript
const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
// Limited by RLS policies
// Use for: read-only public data, user-scoped queries
// RLS policies are ENFORCED
```

### Usage Patterns

| Operation | Client | RLS | Reason |
|-----------|--------|-----|--------|
| Create user | adminClient | ❌ Bypassed | Needs full write access |
| Read user's own subscription | userClient | ✅ Enforced | Respects user boundaries |
| Admin list all users | adminClient | ❌ Bypassed | Admin needs full visibility |
| Read public OHLC data | userClient | ✅ Enforced | Authenticated users only |
| Update payment status | adminClient | ❌ Bypassed | Payments are sensitive |

### API Key Rotation

If SUPABASE_KEY is exposed:

1. **Immediate**: Revoke key in Supabase Dashboard
2. **Within minutes**: Update `.env` with new key
3. **Within hours**: Redeploy application with new key
4. **Next 24h**: Monitor audit logs for unauthorized access
5. **Follow-up**: Implement API key rotation schedule (quarterly recommended)

## 6. Query Result Validation

### Validation Layer

The `api/src/lib/queryValidation.ts` module provides Zod schema validation:

```typescript
import { validateOHLCData, validateUser, validateSubscription } from './lib/queryValidation'

// Validate array of OHLC data
const ohlcData = await userClient.from('prices_ohlc').select()
const validated = validateOHLCData(ohlcData)  // Throws if invalid
```

### Available Schemas

**OHLCDataSchema:**
```typescript
{
  symbol: string,
  date: ISO datetime or YYYY-MM-DD,
  open: positive number,
  high: positive number,
  low: positive number,
  close: positive number,
  volume: non-negative number
}
```

**UserSchema:**
```typescript
{
  id: UUID,
  email: valid email,
  role: 'user' | 'admin',
  created_at: ISO datetime (optional),
  updated_at: ISO datetime (optional)
}
```

**SubscriptionSchema:**
```typescript
{
  status: 'trial' | 'active' | 'past_due' | 'canceled',
  trial_ends_at: ISO datetime (nullable),
  current_period_end: ISO datetime (nullable)
}
```

### Adding New Validation Schemas

```typescript
// 1. Define schema
export const PaymentSchema = z.object({
  id: z.string().uuid(),
  amount_npr: z.number().positive(),
  status: z.enum(['pending', 'verified', 'failed']),
})

export type Payment = z.infer<typeof PaymentSchema>

// 2. Export validation function
export function validatePayment(data: unknown): Payment {
  return validateQueryResult(data, PaymentSchema)
}

// 3. Use in endpoint
const payment = validatePayment(data)
```

### Error Handling

Validation errors are caught and returned with safe client message:

```typescript
try {
  const validated = validateOHLCData(data)
  res.json(validated)
} catch (error) {
  console.error('Full error:', error)  // Log server-side
  res.status(500).json({ 
    error: getSafeValidationError(error)  // Return sanitized message
  })
}
```

## 7. Schema Constraints

### Data Integrity Constraints

**Subscriptions:**
```sql
ALTER TABLE subscriptions 
  ADD CONSTRAINT subscription_status_check 
  CHECK (status in ('trial', 'active', 'past_due', 'canceled'));
```

**Payments:**
```sql
ALTER TABLE payments 
  ADD CONSTRAINT payment_amount_positive CHECK (amount_npr > 0);

ALTER TABLE payments 
  ADD CONSTRAINT payment_status_check 
  CHECK (status in ('pending', 'verified', 'failed'));

ALTER TABLE payments 
  ADD CONSTRAINT payment_provider_check 
  CHECK (provider in ('esewa', 'khalti', 'imepay'));
```

**Prices:**
```sql
ALTER TABLE prices_ohlc 
  ADD CONSTRAINT prices_positive 
  CHECK (open > 0 and high > 0 and low > 0 and close > 0);

ALTER TABLE prices_ohlc 
  ADD CONSTRAINT volume_non_negative CHECK (volume >= 0);

ALTER TABLE prices_ohlc 
  ADD CONSTRAINT high_low_check CHECK (high >= low);
```

### Handling Constraint Violations

```typescript
const { error } = await adminClient.from('payments').insert({ amount_npr: -100 })

if (error?.code === '23514') {  // CHECK_VIOLATION
  console.error('Constraint violation:', error.message)
  res.status(400).json({ error: 'Invalid data provided' })
}
```

## 8. Audit Logging

### Audit Log Table

```sql
CREATE TABLE admin_logs (
  id BIGSERIAL PRIMARY KEY,
  admin_email TEXT,
  action TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_logs_admin_email ON admin_logs(admin_email);
CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at DESC);
```

### Sample Audit Log Entry

```json
{
  "id": 12345,
  "admin_email": "admin@example.com",
  "action": "user_created",
  "meta": {
    "user_id": "uuid",
    "email": "newuser@example.com",
    "timestamp": "2025-02-01T10:30:00Z"
  },
  "created_at": "2025-02-01T10:30:00Z"
}
```

### Querying Audit Logs

```sql
-- Recent admin actions
SELECT * FROM admin_logs 
WHERE created_at > now() - interval '7 days' 
ORDER BY created_at DESC;

-- User creation history
SELECT * FROM admin_logs 
WHERE action = 'user_created' 
ORDER BY created_at DESC;

-- Admin activity by email
SELECT admin_email, COUNT(*) as action_count
FROM admin_logs
WHERE created_at > now() - interval '30 days'
GROUP BY admin_email;
```

### Retention Policy

Recommended: 90 days for compliance, 1 year for analytics

```sql
-- Delete logs older than 90 days
DELETE FROM admin_logs 
WHERE created_at < now() - interval '90 days';
```

## 9. Performance Optimization

### Indexes

Added indexes for common queries:

| Table | Index | Reason |
|-------|-------|--------|
| users | email | Fast lookups in auth |
| subscriptions | user_id | User-scoped queries |
| payments | user_id | User-scoped queries |
| prices_ohlc | (company_id, date) | Time-series queries |
| prices_ohlc | symbol | Symbol-based lookups |
| fundamentals | company_id | Company detail lookups |
| admin_logs | (admin_email, created_at) | Audit queries |

### Query Performance Monitoring

In Supabase Dashboard:

1. Go to **Database** → **Query Performance**
2. Monitor slow queries (>100ms typical)
3. Look for missing indexes (sequential scans)
4. Check for N+1 query problems

### Composite Index Example

For time-series queries with date range:

```sql
CREATE INDEX idx_prices_symbol_date 
ON prices_ohlc(symbol, date DESC)
WHERE close > 0;  -- Partial index for valid prices
```

## 10. Testing & Verification

### RLS Policy Testing

Use `api/src/scripts/verifyRLS.ts` to test policies:

```bash
npm run db:verify-rls
```

Tests verify:
- User isolation (A can't see B's data)
- Public data access (authenticated can read companies)
- Admin access (admins can read all users)
- Write restrictions (can't insert for others)

### Query Testing

Use `api/src/scripts/testQueries.ts` to verify:

```bash
npm run db:test-queries
```

Tests verify:
- Connection pooling (20 concurrent queries)
- Query validation (data conforms to schemas)
- Error handling (proper error codes returned)
- Query timeouts (requests don't hang)
- Index usage (EXPLAIN ANALYZE checks)

### Manual Testing

```sql
-- Test 1: User can read own subscription
SELECT * FROM subscriptions 
WHERE user_id = auth.uid();  -- Should return data

-- Test 2: User cannot read other's subscription
SELECT * FROM subscriptions 
WHERE user_id != auth.uid();  -- Should return empty

-- Test 3: Public data is readable
SELECT * FROM companies LIMIT 5;  -- Should return data

-- Test 4: Constraint enforcement
INSERT INTO payments (user_id, amount_npr, status)
VALUES ('uuid', -100, 'pending');  -- Should fail with CHECK_VIOLATION
```

## 11. Production Checklist

- [ ] Enable RLS on all user-scoped tables (users, subscriptions, payments)
- [ ] Configure connection pooling in Supabase Dashboard
- [ ] Set `SUPABASE_POOLER_URL` in production environment
- [ ] Set `SUPABASE_ANON_KEY` in `.env`
- [ ] Implement database backups (Supabase provides automated daily)
- [ ] Monitor query performance with Supabase Dashboard
- [ ] Set up alerts for failed authentication attempts
- [ ] Review and test all RLS policies before going live
- [ ] Verify least-privilege access patterns (use userClient for reads)
- [ ] Implement API key rotation schedule (quarterly)
- [ ] Set up audit logging for sensitive tables
- [ ] Configure query result validation in all endpoints
- [ ] Test error handling with intentional failures
- [ ] Load test connection pooling with production traffic patterns

## 12. Troubleshooting

### RLS Blocking Legitimate Queries

**Symptom**: Query returns empty but data exists

**Debug**:
```sql
-- Check if RLS is enabled
SELECT * FROM pg_class 
WHERE relname = 'subscriptions' 
AND pg_has_role(relowner, 'USAGE');

-- Check policies
SELECT * FROM pg_policies 
WHERE tablename = 'subscriptions';

-- Test policy with explicit user
SET request.jwt.claims.sub = 'correct-uuid';
SELECT * FROM subscriptions;
```

**Fix**: Verify `auth.uid()` matches user ID in policies

### Connection Pool Exhaustion

**Symptom**: "too many connections" errors

**Debug**:
```bash
# Check active connections in Supabase Dashboard
# Database → Connection Pool → Active connections

# Test pool limits
for i in {1..50}; do
  curl http://localhost:8082/api/health &
done
```

**Fix**: Increase `DB_POOL_MAX` or implement connection retry logic

### Constraint Violations in Updates

**Symptom**: Updates fail with unexpected constraint error

**Debug**:
```sql
-- Check all constraints on table
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'payments';

-- Test constraint
INSERT INTO payments (amount_npr) VALUES (-100);  -- Should fail
```

**Fix**: Validate data before queries using `queryValidation.ts`

### Slow Query Performance

**Symptom**: Requests take >1 second

**Debug**:
```sql
-- Analyze query plan
EXPLAIN ANALYZE
SELECT * FROM prices_ohlc 
WHERE symbol = 'NABIL' 
AND date > '2025-01-01';
```

**Fix**: Add indexes on frequently filtered columns

## 13. References

- **Supabase RLS**: https://supabase.com/docs/guides/auth/row-level-security
- **Connection Pooling**: https://supabase.com/docs/guides/database/connecting-to-postgres
- **PostgreSQL Constraints**: https://www.postgresql.org/docs/current/ddl-constraints.html
- **Zod Validation**: https://zod.dev/
- **PostgreSQL Indexes**: https://www.postgresql.org/docs/current/sql-createindex.html
