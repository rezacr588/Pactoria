# Backend Bug Report - Pactoria Contract Management Platform

**Date:** December 22, 2024  
**Reviewer:** Backend Architecture Review  
**Scope:** Supabase Edge Functions, Next.js API Routes, Database Schema, and Integrations

---

## Executive Summary

A comprehensive review of the Pactoria backend has identified **23 bugs** across multiple components, with **5 Critical**, **8 High**, **6 Medium**, and **4 Low** severity issues. The most significant concerns involve security vulnerabilities, data integrity risks, and scalability limitations that require immediate attention.

### Critical Issues Requiring Immediate Action:
1. **In-memory rate limiting** causing data loss on Edge Function restarts
2. **Race conditions** in contract versioning system
3. **Missing transaction boundaries** for critical operations
4. **Inconsistent error handling** across API endpoints
5. **Potential RLS policy bypasses** in certain scenarios

---

## 🔴 Critical Severity Issues

### 1. In-Memory Rate Limiting Data Loss
**Location:** `/supabase/functions/ai/index.ts` (lines 52-74)  
**Issue:** Rate limiting uses in-memory storage that resets on cold starts, allowing attackers to bypass limits by triggering function restarts.

```typescript path=/supabase/functions/ai/index.ts start=52
// PROBLEM: This resets on every cold start
const rateLimitStore: RateLimitStore = {}
```

**Impact:** Complete rate limiting bypass, potential for API abuse and cost overruns.

**Fix:**
```typescript
// Use Supabase for persistent rate limiting
async function checkRateLimit(clientId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('client_id', clientId)
    .single()
  
  // Implement proper distributed rate limiting
}
```

### 2. Race Condition in Contract Versioning
**Location:** `/supabase/functions/contracts/index.ts` (lines 88-106)  
**Issue:** Non-atomic version number increment allows duplicate version numbers under concurrent requests.

```typescript path=/supabase/functions/contracts/index.ts start=88
// PROBLEM: Read-then-write pattern creates race condition
const next = (contract.latest_version_number ?? 0) + 1
```

**Impact:** Data corruption, duplicate version numbers, potential data loss.

**Fix:**
```sql
-- Use database-level atomic increment
CREATE OR REPLACE FUNCTION create_contract_version(
  p_contract_id UUID,
  p_content JSONB,
  p_user_id UUID
) RETURNS contract_versions AS $$
DECLARE
  v_version contract_versions;
BEGIN
  INSERT INTO contract_versions (
    contract_id, 
    version_number, 
    content_json, 
    created_by
  )
  SELECT 
    p_contract_id,
    COALESCE(MAX(version_number), 0) + 1,
    p_content,
    p_user_id
  FROM contract_versions
  WHERE contract_id = p_contract_id
  RETURNING * INTO v_version;
  
  UPDATE contracts 
  SET latest_version_number = v_version.version_number
  WHERE id = p_contract_id;
  
  RETURN v_version;
END;
$$ LANGUAGE plpgsql;
```

### 3. Missing Transaction Boundaries
**Location:** Multiple files - contracts snapshot creation  
**Issue:** Critical operations like version creation and contract updates aren't wrapped in transactions.

**Impact:** Partial updates leading to inconsistent state.

**Fix:** Implement proper transaction handling in Edge Functions or use database functions with built-in transactions.

### 4. Inconsistent Authentication Implementation
**Location:** `/apps/web/app/api/contracts/[id]/route.ts`  
**Issue:** Different API routes use different authentication patterns, some missing proper validation.

```typescript path=/apps/web/app/api/contracts/[id]/route.ts start=5
// PROBLEM: Inconsistent client creation across routes
function createRLSClient(authHeader?: string) {
  // Missing validation of auth header format
  return createClient(...)
}
```

**Impact:** Potential authentication bypass, inconsistent security posture.

### 5. Missing Metadata Column in Contracts Table
**Location:** Database schema  
**Issue:** The contracts table doesn't have a metadata column, but the API tries to write to it.

```typescript path=/apps/web/app/api/contracts/route.ts start=59
// PROBLEM: Writing to non-existent column
metadata: Object.keys(metadata).length > 0 ? metadata : {}
```

**Impact:** Contract creation failures, API errors.

**Fix:**
```sql
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
```

---

## 🟡 High Severity Issues

### 6. CORS Configuration Vulnerability
**Location:** `/supabase/functions/ai/index.ts` (lines 40-49)  
**Issue:** CORS origin validation could be bypassed with null origin.

```typescript path=/supabase/functions/ai/index.ts start=42
// PROBLEM: Returns null for missing origin, which allows it
if (!origin) return null
```

**Fix:**
```typescript
origin: (origin) => {
  if (!origin) return false // Deny requests without origin
  return allowedOrigins.includes(origin) ? origin : false
}
```

### 7. SQL Injection Risk in Edge Functions
**Location:** `/supabase/functions/contracts/index.ts`  
**Issue:** While Supabase client provides some protection, dynamic query construction without proper validation poses risks.

**Impact:** Potential data breach or manipulation.

### 8. JWT Secret Handling
**Location:** `/supabase/functions/collab-token/index.ts` (line 54)  
**Issue:** JWT secret retrieved from environment without validation.

```typescript path=/supabase/functions/collab-token/index.ts start=54
const secret = Deno.env.get('HOCUSPOCUS_JWT_SECRET')
if (!secret) return c.json({ error: 'server not configured' }, 500)
```

**Impact:** Potential token forgery if secret is compromised.

### 9. Missing Input Validation in Critical Endpoints
**Location:** `/apps/web/app/api/contracts/[id]/route.ts`  
**Issue:** No Zod schema validation for PATCH and DELETE operations.

**Impact:** Malformed data could corrupt database state.

### 10. Unhandled Promise Rejections
**Location:** Multiple Edge Functions  
**Issue:** Async operations without proper error boundaries.

**Impact:** Silent failures, difficult debugging.

### 11. N+1 Query Problem
**Location:** `/apps/web/app/api/contracts/[id]/route.ts` (lines 31-53)  
**Issue:** Separate queries for contract, versions, and approvals.

```typescript path=/apps/web/app/api/contracts/[id]/route.ts start=31
// PROBLEM: Three separate queries
const { data: contract } = await supabase...
const { data: versions } = await supabase...
const { data: approvals } = await supabase...
```

**Fix:** Use a single query with joins or a database function.

### 12. Missing RLS Policies for Billing Tables
**Location:** `/supabase/migrations/20240821000001_add_billing_tables.sql`  
**Issue:** Some billing tables have incomplete RLS policies.

**Impact:** Potential unauthorized access to billing data.

### 13. Weak Error Messages Leaking Information
**Location:** Multiple API routes  
**Issue:** Detailed error messages could reveal system internals.

```typescript path=/apps/web/app/api/auth/route.ts start=66
return NextResponse.json({ error: error.message }, { status: 401 })
```

---

## 🟠 Medium Severity Issues

### 14. Inefficient Bytea Handling
**Location:** `/supabase/functions/contracts/index.ts` (line 97)  
**Issue:** Base64 encoding for bytea fields without size limits.

```typescript path=/supabase/functions/contracts/index.ts start=97
ydoc_state: typeof body.ydoc_state === 'string' ? body.ydoc_state : null
```

**Impact:** Memory issues with large documents.

### 15. Missing Index on Frequently Queried Columns
**Location:** Database schema  
**Issue:** Missing indexes on metadata JSONB fields and other frequently queried columns.

**Impact:** Slow query performance as data grows.

### 16. Inconsistent Response Formats
**Location:** API routes  
**Issue:** Mix of `{ contract }`, `{ data }`, and `{ items }` response patterns.

**Impact:** Frontend integration complexity, potential bugs.

### 17. No Request Timeout Handling
**Location:** Edge Functions AI calls  
**Issue:** No timeout for external API calls to Groq.

**Impact:** Functions could hang indefinitely.

### 18. Missing Idempotency Keys
**Location:** Payment and contract creation endpoints  
**Issue:** No idempotency key handling for critical operations.

**Impact:** Duplicate charges or data on retry.

### 19. Incomplete Approval Status Validation
**Location:** `/supabase/functions/contracts/index.ts` (line 127)  
**Issue:** No validation of status transitions (e.g., approved → rejected).

---

## 🟢 Low Severity Issues

### 20. TypeScript Disabled in Edge Functions
**Location:** `/supabase/functions/contracts/index.ts` (lines 1-2)  
**Issue:** TypeScript checking disabled with @ts-nocheck.

```typescript path=/supabase/functions/contracts/index.ts start=1
// @ts-nocheck
// deno-lint-ignore-file no-explicit-any
```

**Impact:** Type safety lost, potential runtime errors.

### 21. Console Logging in Production
**Location:** Multiple files  
**Issue:** console.error used without proper logging infrastructure.

**Impact:** Poor observability, logs lost in production.

### 22. Hardcoded Configuration Values
**Location:** AI function rate limiting  
**Issue:** Rate limits hardcoded instead of configurable.

```typescript path=/supabase/functions/ai/index.ts start=53
const RATE_LIMIT_REQUESTS = 10 // Should be configurable
```

### 23. Missing API Documentation
**Location:** All API endpoints  
**Issue:** No OpenAPI/Swagger documentation.

**Impact:** Integration difficulty for API consumers.

---

## Risk Assessment Matrix

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Security | 2 | 3 | 1 | 0 | 6 |
| Data Integrity | 2 | 2 | 2 | 0 | 6 |
| Performance | 0 | 1 | 2 | 0 | 3 |
| Error Handling | 1 | 2 | 1 | 2 | 6 |
| Code Quality | 0 | 0 | 0 | 2 | 2 |
| **Total** | **5** | **8** | **6** | **4** | **23** |

---

## Recommended Remediation Timeline

### Immediate (24-48 hours)
1. Add metadata column to contracts table
2. Fix race condition in versioning system
3. Implement persistent rate limiting
4. Fix CORS configuration

### Short-term (1 week)
1. Implement transaction boundaries
2. Add comprehensive input validation
3. Fix N+1 query problems
4. Complete RLS policies for billing tables

### Medium-term (2-4 weeks)
1. Implement proper logging infrastructure
2. Add request timeout handling
3. Standardize API response formats
4. Add idempotency key support

### Long-term (1-2 months)
1. Implement comprehensive testing suite
2. Add API documentation
3. Refactor for better type safety
4. Implement monitoring and alerting

---

## Testing Recommendations

### Unit Tests Required
- Rate limiting logic
- Version number generation
- Authentication middleware
- Input validation schemas

### Integration Tests Required
- Contract creation flow
- Approval workflow
- Billing operations
- AI integration endpoints

### Load Tests Required
- Rate limiting effectiveness
- Concurrent version creation
- Database query performance
- Edge Function cold starts

### Security Tests Required
- Authentication bypass attempts
- SQL injection testing
- CORS policy validation
- JWT token validation

---

## Quick Fixes vs Long-term Solutions

### Quick Fixes (Can be done immediately)
```sql
-- Add missing metadata column
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add missing indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_metadata 
ON public.contracts USING gin(metadata);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_status 
ON public.contracts(status);
```

### Long-term Solutions
1. **Replace in-memory rate limiting** with Redis or database-backed solution
2. **Implement event sourcing** for contract versioning
3. **Add comprehensive monitoring** with Datadog or similar
4. **Implement API Gateway** for consistent authentication/authorization
5. **Add circuit breakers** for external service calls

---

## Conclusion

The Pactoria backend has several critical issues that need immediate attention, particularly around data integrity and security. The most pressing concerns are:

1. The race condition in contract versioning that could lead to data corruption
2. The in-memory rate limiting that provides no real protection
3. Missing database columns that cause API failures
4. Inconsistent error handling and authentication patterns

Addressing these issues should be the top priority before the platform goes to production. The recommended approach is to:

1. Apply immediate SQL fixes for missing columns and indexes
2. Implement database-level atomic operations for versioning
3. Move rate limiting to a persistent store
4. Standardize authentication and error handling patterns
5. Add comprehensive testing to prevent regression

With these fixes in place, the platform will be significantly more robust and production-ready.

---

## Appendix: Code Snippets for Fixes

### Fix 1: Atomic Version Creation Function
```sql
-- Place in a new migration file
CREATE OR REPLACE FUNCTION create_contract_snapshot(
  p_contract_id UUID,
  p_content_json JSONB,
  p_content_md TEXT,
  p_ydoc_state BYTEA,
  p_user_id UUID
) RETURNS contract_versions AS $$
DECLARE
  v_version contract_versions;
  v_new_version_number INT;
BEGIN
  -- Lock the contract row to prevent concurrent updates
  PERFORM 1 FROM contracts WHERE id = p_contract_id FOR UPDATE;
  
  -- Get next version number atomically
  SELECT COALESCE(MAX(version_number), 0) + 1 
  INTO v_new_version_number
  FROM contract_versions 
  WHERE contract_id = p_contract_id;
  
  -- Create new version
  INSERT INTO contract_versions (
    contract_id,
    version_number,
    content_json,
    content_md,
    ydoc_state,
    created_by
  ) VALUES (
    p_contract_id,
    v_new_version_number,
    p_content_json,
    p_content_md,
    p_ydoc_state,
    p_user_id
  ) RETURNING * INTO v_version;
  
  -- Update contract's latest version
  UPDATE contracts 
  SET 
    latest_version_number = v_new_version_number,
    updated_at = NOW()
  WHERE id = p_contract_id;
  
  RETURN v_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Fix 2: Persistent Rate Limiting Table
```sql
-- Create rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, endpoint, window_start)
);

CREATE INDEX idx_rate_limits_client ON public.rate_limits(client_id);
CREATE INDEX idx_rate_limits_window ON public.rate_limits(window_end);

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_client_id TEXT,
  p_endpoint TEXT,
  p_limit INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_count INTEGER;
  v_window_start TIMESTAMPTZ;
  v_window_end TIMESTAMPTZ;
BEGIN
  v_window_start := date_trunc('minute', NOW());
  v_window_end := v_window_start + (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Upsert rate limit record
  INSERT INTO public.rate_limits (
    client_id, 
    endpoint, 
    request_count, 
    window_start, 
    window_end
  ) VALUES (
    p_client_id, 
    p_endpoint, 
    1, 
    v_window_start, 
    v_window_end
  )
  ON CONFLICT (client_id, endpoint, window_start) 
  DO UPDATE SET request_count = rate_limits.request_count + 1
  RETURNING request_count INTO v_current_count;
  
  -- Clean old records
  DELETE FROM public.rate_limits WHERE window_end < NOW() - INTERVAL '1 hour';
  
  RETURN v_current_count <= p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Fix 3: Standardized Error Handler
```typescript
// lib/api/error-handler.ts
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleAPIError(error: unknown): NextResponse {
  console.error('API Error:', error);
  
  if (error instanceof APIError) {
    return NextResponse.json(
      { 
        error: error.message,
        code: error.code 
      },
      { status: error.statusCode }
    );
  }
  
  // Don't leak internal errors
  return NextResponse.json(
    { 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    },
    { status: 500 }
  );
}
```
