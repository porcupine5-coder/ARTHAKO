# CI/CD Integration for Database Security Verification

## Overview

This document describes how to integrate database security verification scripts into your CI/CD pipeline. The verification scripts (`npm run db:verify-rls` and `npm run db:test-queries`) should run on every pull request and deployment to ensure database security policies are correctly configured.

## GitHub Actions Workflow

A complete GitHub Actions workflow is provided in `.github/workflows/database-verification.yml`. This workflow:

1. **Runs on**: Pull requests and pushes to `main` and `develop` branches
2. **Installs dependencies**: Sets up Node.js and installs api packages
3. **Verifies RLS policies**: Runs `npm run db:verify-rls` and fails if exit code is non-zero
4. **Tests database queries**: Runs `npm run db:test-queries` and fails if exit code is non-zero
5. **Blocks deployment**: If any verification fails, the workflow fails and prevents merge/deployment
6. **Comments on PRs**: Provides status feedback in pull request comments
7. **Uploads logs**: Archives verification logs for audit trail

## Environment Variables Setup

### GitHub Secrets

You must configure the following secrets in your GitHub repository settings:

```
SUPABASE_URL           - Your Supabase project URL
SUPABASE_KEY           - Supabase service role key (for admin operations)
SUPABASE_ANON_KEY      - Supabase anonymous key (for user operations)
SUPABASE_JWT_SECRET    - JWT secret for token validation
```

**Setup Steps**:
1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret with the exact names above
4. Values should match your `.env` file (without quotes)

### Local Testing

To test the verification scripts locally:

```bash
cd api

# Set environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_KEY="your-service-role-key"
export SUPABASE_ANON_KEY="your-anon-key"
export SUPABASE_JWT_SECRET="your-jwt-secret"

# Run verification
npm run db:verify-rls
npm run db:test-queries
```

Or use the `.env` file:

```bash
cd api
cat .env  # Verify all required variables are set
npm run db:verify-rls
npm run db:test-queries
```

## What the Verification Scripts Check

### RLS Policy Verification (`npm run db:verify-rls`)

Verifies that Row Level Security policies are correctly configured:

- **User-scoped policies**: Ensures `auth.uid() = user_id` is enforced
- **Authenticated-user policies**: Ensures `auth.role() = 'authenticated'` allows public data access
- **Admin policies**: Verifies admin-level policies (for future custom JWT claims)
- **Policy enforcement**: Confirms policies are enabled on each table

**Exit Codes**:
- `0`: All policies verified ✅
- `1`: Policy verification failed ❌ (deployment blocked)

### Database Query Tests (`npm run db:test-queries`)

Tests that critical queries work correctly with the configured credentials:

- **User queries**: Validates user auth, subscription, and payment reads
- **Admin queries**: Validates admin user listing with service role
- **OHLC data**: Ensures market data queries work correctly
- **Error handling**: Verifies proper error responses for invalid queries

**Exit Codes**:
- `0`: All queries passed ✅
- `1`: Query test failed ❌ (deployment blocked)

## Workflow Triggers

### Automatic

The workflow runs automatically on:
- **Pull requests** to `main` or `develop`
- **Pushes** to `main` or `develop`

### Manual Trigger (if enabled)

You can also manually trigger the workflow from the GitHub Actions tab.

## Monitoring and Debugging

### View Workflow Runs

1. Go to Actions tab in your repository
2. Select "Database Security Verification" workflow
3. Click a run to see details

### Logs

Each workflow run creates detailed logs:
- **Verification output**: Shows each policy/query tested
- **Error messages**: Detailed failures with remediation steps
- **Artifacts**: `db-verification-logs/` contains timestamped logs for audit trail

### Troubleshooting

**Problem**: Workflow fails with "Missing environment variables"
- **Solution**: Verify all GitHub secrets are configured (see Environment Variables Setup above)

**Problem**: RLS policy verification fails
- **Solution**: Check that `.github/workflows/database-verification.yml` has all required environment variables
- **Action**: Run locally with same environment variables to debug

**Problem**: Database query tests fail
- **Solution**: Verify `SUPABASE_URL` and `SUPABASE_KEY` are correct for your environment
- **Action**: Run `npm run db:test-queries` locally with same credentials

## Integration with Deployment

### Blocking Failed Verifications

The workflow exits with code `1` if any verification fails, which:
- ❌ Prevents merge of PR to `main`/`develop` (if branch protection is enabled)
- ❌ Prevents automatic deployment (if deployment requires workflow success)

### Recommended Configuration

1. **Branch Protection** (Settings → Branches → Add rule):
   - Enable "Require status checks to pass before merging"
   - Select "Database Security Verification" workflow
   
2. **Deployment Gate** (in your CD tool):
   - Require successful GitHub Actions workflow before deploying
   - Fail deployment if verification scripts exit with non-zero code

## Example Workflow States

### ✅ Success

```
database-verification (pass)
  ├─ Verify RLS Policies ✅
  ├─ Test Database Queries ✅
  └─ Comment PR with Results ✅

lint-and-build (pass)
  ├─ Build TypeScript ✅
  └─ Run ESLint ✅
```

### ❌ Failure (RLS Policy Issue)

```
database-verification (fail)
  ├─ Verify RLS Policies ❌ (Missing policy on payments table)
  ├─ Test Database Queries ⊘ (skipped)
  └─ Comment PR with Results ✅

→ Merge blocked until RLS policy is added
```

### ❌ Failure (Query Test Issue)

```
database-verification (fail)
  ├─ Verify RLS Policies ✅
  ├─ Test Database Queries ❌ (User auth query failed)
  └─ Comment PR with Results ✅

→ Merge blocked until query issue is resolved
```

## Advanced Configuration

### Customize Branches

Edit `.github/workflows/database-verification.yml` to run on additional branches:

```yaml
on:
  pull_request:
    branches: [main, develop, production]
  push:
    branches: [main, develop, production]
```

### Notification Integration

Add Slack notifications (example using actions/slack):

```yaml
- name: Notify Slack on Failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "Database verification failed in ${{ github.repository }}"
      }
```

### Conditional Deployment

Only deploy if verification passes (add to your deployment job):

```yaml
needs: database-verification
if: success() && github.event_name == 'push' && github.ref == 'refs/heads/main'
```

## Maintenance

### Update Verification Scripts

If you modify `verifyRLS.ts` or `testQueries.ts`:

1. Update the scripts in `api/scripts/`
2. Commit changes
3. Push to feature branch
4. Workflow automatically tests the new verification logic
5. Merge after verification passes

### Review Logs

Regularly review verification logs in Actions artifacts to:
- Identify patterns of failures
- Monitor database performance (query times)
- Track security policy compliance
- Archive audit trail

## Security Best Practices

1. **Rotate secrets regularly**: Update GitHub secrets every 90 days
2. **Audit log retention**: Set artifact retention to 30+ days for compliance
3. **Principle of least privilege**: Use `SUPABASE_KEY` only for service role operations
4. **Separate environments**: Use different secrets for dev/staging/production
5. **Lock workflow file**: Require approval to modify `.github/workflows/database-verification.yml`

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Supabase JWT Documentation](https://supabase.com/docs/guides/auth/jwt)
- [Row Level Security Documentation](db/schema.sql)
- [Database Verification Scripts](api/scripts/)
