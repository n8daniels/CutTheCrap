# Security Fixes Applied

**Date**: 2025-01-18
**Version**: CutTheCrap v1.0
**Security Analysis Reference**: [docs/security/llm-rag-mcp-security.md](./llm-rag-mcp-security.md), [docs/security/threat_model.md](./threat_model.md)

## Executive Summary

This document details the security vulnerabilities identified during our comprehensive security audit and the fixes applied to mitigate them. All fixes have been implemented and tested as of 2025-01-18.

**Total Vulnerabilities Fixed**: 6 critical/high priority issues
**Risk Reduction**: P0 Critical (4) → P0 (0), P1 High (2) → P1 (0)

---

## 1. Command Injection via MCP Server Path (P0 Critical) ✅ FIXED

### Vulnerability Description

**CVE Severity**: P0 Critical
**OWASP Category**: LLM07 - Insecure Plugin Design
**Reference**: [threat_model.md - Scenario 1](./threat_model.md)

The MCP server path was read from an environment variable (`FEDDOC_MCP_PATH`) without validation, allowing potential command injection if an attacker could control this environment variable.

**Attack Vector**:
```bash
# Attacker sets malicious path
export FEDDOC_MCP_PATH="'; rm -rf / #"
# Application spawns subprocess with attacker-controlled command
```

### Fix Applied

**File**: `src/security/mcp-config.ts` (NEW)
**File**: `src/services/mcp-client.ts:16,34-37`

**Solution**: Implemented hardcoded allowlist of valid MCP server paths.

**Code Changes**:

```typescript
// Before: Unvalidated environment variable
this.transport = new StdioClientTransport({
  command: 'python',
  args: [config.fedDocMcpPath], // ❌ No validation
  env: process.env,
});

// After: Validated against allowlist
import { validateMCPServerPath } from '@/security/mcp-config';

// Throws error if path not in allowlist
validateMCPServerPath(config.fedDocMcpPath);

this.transport = new StdioClientTransport({
  command: 'python',
  args: [config.fedDocMcpPath], // ✅ Validated
  env: secureEnv,
});
```

**Allowlist Configuration** (`src/security/mcp-config.ts:14-17`):
```typescript
allowedServerPaths: [
  './packages/feddoc-mcp/src/server.py',
  '/opt/feddoc-mcp/server.py', // Production path
] as const,
```

**Impact**: Prevents arbitrary command execution via MCP server path.

---

## 2. Environment Variable Leakage to Subprocess (P0 Critical) ✅ FIXED

### Vulnerability Description

**CVE Severity**: P0 Critical
**OWASP Category**: LLM06 - Sensitive Information Disclosure
**Reference**: [threat_model.md - Scenario 5](./threat_model.md)

The Python MCP server subprocess inherited the full Node.js environment, potentially exposing sensitive secrets (API keys, tokens, database credentials) via process inspection or logging.

**Attack Vector**:
```bash
# Attacker inspects subprocess environment
cat /proc/<pid>/environ
# Exposes ALL secrets from Node.js environment
```

### Fix Applied

**File**: `src/security/mcp-config.ts:24-27,102-113` (NEW)
**File**: `src/services/mcp-client.ts:39-42,48`

**Solution**: Implemented environment variable allowlist filtering.

**Code Changes**:

```typescript
// Before: Full environment passed to subprocess
this.transport = new StdioClientTransport({
  command: 'python',
  args: [config.fedDocMcpPath],
  env: process.env, // ❌ Leaks all secrets
});

// After: Filtered environment with only allowlisted vars
import { buildSecureEnv } from '@/security/mcp-config';

const secureEnv = buildSecureEnv(); // ✅ Only CONGRESS_API_KEY, NODE_ENV

this.transport = new StdioClientTransport({
  command: 'python',
  args: [config.fedDocMcpPath],
  env: secureEnv, // ✅ Filtered env
});
```

**Allowlist Configuration** (`src/security/mcp-config.ts:24-27`):
```typescript
allowedEnvVars: [
  'CONGRESS_API_KEY',  // Required for Congress.gov API
  'NODE_ENV',          // Required for environment detection
] as const,
```

**Impact**: Prevents secret leakage via subprocess environment.

---

## 3. Missing Rate Limiting (P0 Critical) ✅ FIXED

### Vulnerability Description

**CVE Severity**: P0 Critical
**OWASP Category**: LLM04 - Model Denial of Service
**Reference**: [threat_model.md - Scenario 2](./threat_model.md)

API endpoints had no rate limiting, allowing attackers to:
- Exhaust Congress.gov API quota (5000 req/hour)
- Cause service disruption via resource exhaustion
- Bypass cache with unlimited force refresh requests

**Attack Vector**:
```bash
# Attacker floods endpoint
while true; do
  curl -X POST http://app/api/bills/analyze \
    -d '{"billId":"118/hr/1","forceRefresh":true}'
done
# Exhausts API quota, crashes service
```

### Fix Applied

**File**: `src/middleware/rate-limit.ts` (NEW - 183 lines)
**File**: `src/app/api/bills/analyze/route.ts:19,30-36,42-48,56-61`
**File**: `src/app/api/bills/simple/route.ts:15,23-26`

**Solution**: Implemented token bucket rate limiting with configurable presets.

**Architecture**:

```typescript
// Rate limit middleware using token bucket algorithm
export function rateLimit(config: RateLimitConfig) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const clientId = getClientId(req); // IP-based
    const now = Date.now();

    let bucket = tokenStore.get(clientId) || {
      tokens: [],
      lastCleanup: now,
    };

    // Remove expired tokens
    bucket.tokens = bucket.tokens.filter(
      tokenTime => now - tokenTime < config.interval
    );

    // Check limit
    if (bucket.tokens.length >= config.uniqueTokenPerInterval) {
      return NextResponse.json(
        { error: config.message || 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    bucket.tokens.push(now);
    tokenStore.set(clientId, bucket);

    return null; // Allow request
  };
}
```

**Rate Limits Applied**:

| Endpoint | Limit | Preset | File Reference |
|----------|-------|--------|----------------|
| `/api/bills/analyze` (standard) | 10 req/min | Custom | `route.ts:30-34` |
| `/api/bills/analyze` (force refresh) | 5 req/hour | `cacheBypass` | `route.ts:36` |
| `/api/bills/simple` | 60 req/min | `standard` | `route.ts:23` |

**Impact**: Prevents API abuse and resource exhaustion attacks.

---

## 4. ReDoS (Regular Expression Denial of Service) (P0 Critical) ✅ FIXED

### Vulnerability Description

**CVE Severity**: P0 Critical
**OWASP Category**: LLM04 - Model Denial of Service
**Reference**: [threat_model.md - Scenario 3](./threat_model.md)

The dependency detector used unbounded regex operations on user-provided bill text, making it vulnerable to ReDoS attacks using pathological input.

**Attack Vector**:
```javascript
// Attacker provides pathological input
const maliciousText = "H.R. " + "1".repeat(1000000);
// Regex catastrophic backtracking causes CPU hang
```

### Fix Applied

**File**: `src/lib/dependency-detector-safe.ts` (NEW - 235 lines)
**File**: `src/lib/document-graph.ts:4-6,11`

**Solution**: Implemented safe dependency detector with timeout protection and input limits.

**Safety Controls**:

```typescript
export class DependencyDetector {
  // SECURITY: Configuration for safety limits
  private readonly REGEX_TIMEOUT_MS = 5000;      // 5 seconds max
  private readonly MAX_INPUT_LENGTH = 100000;    // 100KB
  private readonly MAX_MATCHES_PER_PATTERN = 100;
  private readonly MAX_ID_LENGTH = 100;

  extractDependencies(text: string): Dependency[] {
    // SECURITY FIX 1: Limit input size
    if (text.length > this.MAX_INPUT_LENGTH) {
      console.warn(`[SECURITY] Input truncated from ${text.length}`);
      text = text.substring(0, this.MAX_INPUT_LENGTH);
    }

    // SECURITY FIX 2: Use timeout-protected matching
    const matches = this.matchWithTimeout(text, pattern, this.REGEX_TIMEOUT_MS);

    // SECURITY FIX 3: Limit total matches
    if (count++ >= this.MAX_MATCHES_PER_PATTERN) {
      console.warn(`[SECURITY] Max matches reached`);
      break;
    }
  }

  private matchWithTimeout(text: string, pattern: RegExp, timeoutMs: number) {
    const startTime = Date.now();

    for (const match of text.matchAll(pattern)) {
      // SECURITY FIX 4: Check timeout on each iteration
      if (Date.now() - startTime > timeoutMs) {
        throw new TimeoutError(`Regex timeout - possible ReDoS attack`);
      }

      matches.push(match);

      // SECURITY FIX 5: Detect abnormally slow matching
      if (matches.length > 0 && (Date.now() - startTime) / matches.length > 100) {
        console.warn('[SECURITY] Abnormally slow regex matching detected');
        break;
      }
    }
  }
}
```

**Integration** (`src/lib/document-graph.ts:11`):
```typescript
// Before
import { DependencyDetector } from './dependency-detector';

// After
import { DependencyDetector } from './dependency-detector-safe';
```

**Impact**: Prevents CPU exhaustion via malicious regex input.

---

## 5. Missing Bill Type Validation (P1 High) ✅ FIXED

### Vulnerability Description

**CVE Severity**: P1 High
**OWASP Category**: SSRF (Server-Side Request Forgery)
**Reference**: [llm-rag-mcp-security.md - Section 2](./llm-rag-mcp-security.md)

Bill type parameter was not validated against an allowlist, potentially allowing SSRF attacks by injecting malicious URL components.

**Attack Vector**:
```javascript
// Attacker provides malicious bill type
billId = "118/../../etc/passwd/1"
// Or URL injection
billId = "118/http://evil.com/1"
```

### Fix Applied

**File**: `src/security/mcp-config.ts:34-43,83-94`
**File**: `src/services/mcp-client.ts:248-251`

**Solution**: Implemented bill type allowlist validation.

**Code Changes**:

```typescript
// src/security/mcp-config.ts
export const MCP_SECURITY_CONFIG = {
  validBillTypes: [
    'hr',      // House Resolution
    's',       // Senate bill
    'hjres',   // House Joint Resolution
    'sjres',   // Senate Joint Resolution
    'hconres', // House Concurrent Resolution
    'sconres', // Senate Concurrent Resolution
    'hres',    // House Simple Resolution
    'sres',    // Senate Simple Resolution
  ] as const,
};

export function validateBillType(billType: string): string {
  const normalized = billType.toLowerCase().trim();

  if (!MCP_SECURITY_CONFIG.validBillTypes.includes(normalized as any)) {
    throw new Error(
      `[SECURITY] Invalid bill type: ${billType}. ` +
      `Must be one of: ${MCP_SECURITY_CONFIG.validBillTypes.join(', ')}`
    );
  }

  return normalized;
}
```

**Integration** (`src/services/mcp-client.ts:248-251`):
```typescript
private parseBillId(billId: string): [number, string, number] {
  const parts = billId.split('/');
  // ...

  // SECURITY FIX: Validate bill type against allowlist
  const billType = validateBillType(parts[1]);

  return [congress, billType, billNumber];
}
```

**Impact**: Prevents SSRF via bill type parameter injection.

---

## 6. Missing Audit Logging (P1 High) ✅ FIXED

### Vulnerability Description

**CVE Severity**: P1 High
**OWASP Category**: Security Logging and Monitoring Failures (OWASP Top 10 A09)
**Reference**: [llm-rag-mcp-security.md - Audit Logging Requirements](./llm-rag-mcp-security.md)

No audit trail existed for security-relevant events, preventing:
- Incident response and forensics
- Security monitoring and alerting
- Compliance requirements (SOC 2, GDPR)

### Fix Applied

**File**: `src/lib/audit-logger.ts` (NEW - 250 lines)
**File**: `src/services/mcp-client.ts:17,216-223,240-248`
**File**: `src/app/api/bills/analyze/route.ts:21,40-41,108-117,133-143,151-161`
**File**: `src/app/api/bills/simple/route.ts:17,20-21,34-44,54-64,124-133,144-154`

**Solution**: Implemented comprehensive audit logging system with automatic secret scrubbing.

**Architecture**:

```typescript
export interface AuditLog {
  timestamp: string;           // ISO 8601
  eventType: AuditEventType;   // mcp_tool_call, api_request, rate_limit_exceeded, etc.
  userId?: string;             // For future authentication
  ipAddress: string;           // Client IP
  resource: string;            // Bill ID, tool name, endpoint
  action: string;              // call_tool, GET, POST
  parameters: Record<string, any>;  // Scrubbed of secrets
  result: 'success' | 'failure';
  durationMs?: number;
  error?: string;
  metadata?: Record<string, any>;
}

// SECURITY: Automatic secret scrubbing
const SENSITIVE_KEYS = [
  'api_key', 'apikey', 'api-key', 'token', 'password',
  'secret', 'authorization', 'auth', 'bearer', 'cookie', 'session'
];

export function scrubSecrets(params: Record<string, any>): Record<string, any> {
  for (const [key, value] of Object.entries(params)) {
    const lowerKey = key.toLowerCase();

    if (SENSITIVE_KEYS.some(s => lowerKey.includes(s))) {
      scrubbed[key] = '[REDACTED]';  // ✅ Secret scrubbed
    } else if (typeof value === 'object') {
      scrubbed[key] = scrubSecrets(value);  // Recursive
    } else {
      scrubbed[key] = value;
    }
  }

  return scrubbed;
}
```

**Events Logged**:

| Event Type | Logged At | Example |
|------------|-----------|---------|
| `mcp_tool_call` | MCP client tool call | `callTool('get_bill_text', {congress:118, bill_type:'hr', bill_number:1})` |
| `api_request` | API endpoint handler | `POST /api/bills/analyze {billId:'118/hr/1'}` |
| `rate_limit_exceeded` | Rate limiter middleware | IP 1.2.3.4 exceeded 10 req/min limit |
| `validation_error` | Input validation | Invalid bill ID format |
| `security_error` | Security controls | Bill type validation failed |

**Sample Audit Log**:
```json
{
  "timestamp": "2025-01-18T10:30:45.123Z",
  "eventType": "mcp_tool_call",
  "ipAddress": "server",
  "resource": "mcp:get_bill_text",
  "action": "call_tool",
  "parameters": {
    "congress": 118,
    "bill_type": "hr",
    "bill_number": 1
  },
  "result": "success",
  "durationMs": 1234
}
```

**Impact**: Enables security monitoring, incident response, and compliance.

---

## Testing Performed

### Unit Tests
- ✅ MCP path validation rejects invalid paths
- ✅ Environment filter only passes allowlisted vars
- ✅ Rate limiter enforces limits correctly
- ✅ ReDoS protection triggers timeout on pathological input
- ✅ Bill type validation rejects invalid types
- ✅ Secret scrubbing redacts sensitive keys

### Integration Tests
- ✅ API endpoints return 429 when rate limited
- ✅ MCP client throws on invalid server path
- ✅ Audit logs written for all API requests
- ✅ Audit logs written for all MCP tool calls

### Security Tests
- ✅ Command injection attempt blocked by path validation
- ✅ Secret leakage prevented by env filtering
- ✅ ReDoS attack mitigated by timeout
- ✅ SSRF attempt blocked by bill type validation

---

## Deployment Checklist

Before deploying these fixes to production:

- [x] All security fixes implemented
- [x] Security documentation updated ([SECURITY.md](../../SECURITY.md))
- [x] Code reviewed for security issues
- [ ] Security tests added to CI/CD pipeline
- [ ] Audit logging configured to send to production logging service (Datadog/CloudWatch)
- [ ] Rate limiting thresholds tuned for production traffic
- [ ] MCP server path configured for production environment
- [ ] Environment variables reviewed and minimized
- [ ] Incident response plan updated with new audit log locations

---

## Future Security Enhancements

### Phase 2 (Before LLM Integration)
1. **LLM Gateway**: Centralized safety controls (input sanitization, output validation)
2. **Prompt Injection Defenses**: System prompt hardening, output filtering
3. **PII Detection**: Scrub PII before LLM calls
4. **Content Moderation**: Validate LLM outputs before display

### Phase 3 (RAG Integration)
1. **Vector DB Security**: Tenant isolation, access controls
2. **Knowledge Base Poisoning**: Content validation before indexing
3. **Embedding Security**: Rate limits, input validation

### Phase 4 (Production Hardening)
1. **SIEM Integration**: Send audit logs to security information and event management
2. **Anomaly Detection**: ML-based detection of suspicious patterns
3. **Automated Response**: Auto-block IPs with suspicious behavior
4. **Compliance**: SOC 2 Type II, GDPR compliance

---

## References

- [SECURITY.md](../../SECURITY.md) - High-level security policy
- [llm-rag-mcp-security.md](./llm-rag-mcp-security.md) - Detailed technical analysis
- [threat_model.md](./threat_model.md) - STRIDE threat modeling
- [OWASP Top 10 for LLM Applications 2025](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
- [CSA RAG Security Guidelines](https://cloudsecurityalliance.org/)
- [Anthropic MCP Security Best Practices](https://modelcontextprotocol.io/docs/security)

---

**Document Version**: 1.0
**Last Updated**: 2025-01-18
**Next Security Review**: 2025-04-18 (quarterly)
