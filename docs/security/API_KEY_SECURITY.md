# API Key Security Guide

**Version**: 1.0
**Last Updated**: 2025-01-18
**Applies To**: CutTheCrap v1.0+

---

## Table of Contents

1. [Overview](#overview)
2. [Security Controls](#security-controls)
3. [API Key Rotation](#api-key-rotation)
4. [Quota Monitoring](#quota-monitoring)
5. [Incident Response](#incident-response)
6. [Deployment Guide](#deployment-guide)

---

## Overview

CutTheCrap uses the **Congress.gov API** to fetch federal legislative data. API keys must be protected as they:
- Have usage quotas (5,000 requests/hour)
- Can be rate-limited or revoked if abused
- Could expose your identity if leaked

### Current API Keys

| Key | Purpose | Quota | Required |
|-----|---------|-------|----------|
| `CONGRESS_API_KEY` | Congress.gov API access | 5,000 req/hour | ✅ Yes |
| ~~`OPENAI_API_KEY`~~ | ❌ Removed (not used) | N/A | ❌ No |

---

## Security Controls

### 1. Storage ✅

**Environment Variables Only**
```bash
# ✅ CORRECT: Store in .env file
CONGRESS_API_KEY=abc123xyz789

# ❌ WRONG: Never hardcode in source files
const apiKey = "abc123xyz789"  // NEVER DO THIS
```

**File Locations**:
- Local: `.env` (gitignored)
- Vercel: Environment Variables dashboard
- Docker: Docker secrets or env files

**Verification**:
```bash
# Check .env is gitignored
grep "^\.env$" .gitignore

# Should output: .env
```

### 2. Validation ✅

**Automatic Checks** (`src/lib/config.ts:31-68`):
- ✅ Non-empty
- ✅ Reasonable length (10-100 chars)
- ✅ Not a placeholder value
- ✅ No whitespace characters
- ✅ Optional: Test API call on startup

**Usage**:
```typescript
import { validateConfig } from '@/lib/config';

// Validate format only (fast)
await validateConfig();

// Validate format + test API key (slower, recommended for prod)
await validateConfig({ testApiKey: true });
```

### 3. Subprocess Filtering ✅

**Only Allowlisted Variables Passed** (`src/security/mcp-config.ts:24-27`):
```typescript
allowedEnvVars: [
  'CONGRESS_API_KEY',  // Required for API
  'NODE_ENV',          // Required for env detection
] as const
```

**Impact**: Prevents leaking other secrets (database credentials, auth tokens) to Python subprocess.

### 4. Audit Logging ✅

**Automatic Secret Scrubbing** (`src/lib/audit-logger.ts:25-33`):
```typescript
// API keys automatically redacted in logs
{
  "parameters": {
    "api_key": "[REDACTED]",  // ✅ Scrubbed
    "bill_id": "118/hr/1"     // ✅ Visible
  }
}
```

### 5. Quota Monitoring ✅

**Real-time Tracking** (`src/lib/api-quota-monitor.ts`):
- ✅ Tracks requests per hour
- ✅ Alerts at 70% (warning), 90% (critical), 100% (exceeded)
- ✅ Prevents quota exhaustion attacks

**Usage**:
```typescript
import { getQuotaMonitor } from '@/lib/api-quota-monitor';

const monitor = getQuotaMonitor({
  onAlert: (alert) => {
    if (alert.level === 'exceeded') {
      // Send alert to Slack/PagerDuty/email
      console.error(alert.message);
    }
  }
});

// Check current usage
const usage = monitor.getCurrentUsage();
console.log(`Used: ${usage?.requests}/${usage?.limit}`);
```

---

## API Key Rotation

### When to Rotate

**Immediately** (Emergency):
- ✅ API key leaked (committed to git, posted publicly)
- ✅ Suspected unauthorized access
- ✅ Employee with access departs company
- ✅ Security breach detected

**Scheduled** (Routine):
- ✅ Every 90 days (recommended)
- ✅ After major security incidents (industry-wide)
- ✅ When upgrading to new API version

### Rotation Procedure

#### 1. Generate New API Key

```bash
# Visit Congress.gov API portal
open https://api.congress.gov/sign-up/

# Steps:
# 1. Log in to your account
# 2. Navigate to "API Keys" section
# 3. Click "Generate New Key"
# 4. Copy the new key immediately (only shown once)
# 5. Save to password manager (1Password, LastPass, etc.)
```

#### 2. Test New Key Locally

```bash
# Update .env with new key
echo "CONGRESS_API_KEY=<new_key_here>" > .env.local

# Validate new key
npm run dev

# Should see: [SECURITY] Congress.gov API key validated successfully
```

#### 3. Update Production Environment

**Vercel**:
```bash
# Method 1: Via dashboard
# 1. Go to: https://vercel.com/your-project/settings/environment-variables
# 2. Find CONGRESS_API_KEY
# 3. Click "Edit" → paste new key
# 4. Click "Save"

# Method 2: Via CLI
vercel env rm CONGRESS_API_KEY production
vercel env add CONGRESS_API_KEY production
# Paste new key when prompted
```

**Docker**:
```bash
# Update docker-compose.yml or secrets
docker secret create congress_api_key_v2 <(echo "<new_key>")

# Update service to use new secret
docker service update --secret-rm congress_api_key_v1 \
                       --secret-add congress_api_key_v2 \
                       cuthecrap
```

#### 4. Verify Production

```bash
# Check logs for successful validation
vercel logs --follow

# Should see:
# [CONFIG] ✅ Configuration validation passed
# [SECURITY] Congress.gov API key validated successfully
```

#### 5. Revoke Old Key

```bash
# Visit Congress.gov API portal
open https://api.congress.gov/sign-up/

# Steps:
# 1. Navigate to "API Keys"
# 2. Find old key
# 3. Click "Revoke"
# 4. Confirm revocation
```

#### 6. Document Rotation

```bash
# Update rotation log
echo "$(date -u +%Y-%m-%d): Rotated CONGRESS_API_KEY (emergency/scheduled)" \
  >> docs/security/api_key_rotation_log.txt
```

### Zero-Downtime Rotation

For critical applications, use overlapping keys:

```typescript
// Support multiple keys during transition
const API_KEYS = [
  process.env.CONGRESS_API_KEY_PRIMARY,   // New key
  process.env.CONGRESS_API_KEY_FALLBACK,  // Old key (remove after 24h)
];

function getApiKey(): string {
  return API_KEYS.find(key => key) || '';
}
```

---

## Quota Monitoring

### Congress.gov API Limits

| Limit | Value | Notes |
|-------|-------|-------|
| **Requests/hour** | 5,000 | Per API key |
| **Requests/day** | ~120,000 | Not enforced, but respect fair use |
| **Concurrent requests** | 10 | Recommended limit |

### Monitoring Dashboard

```typescript
import { getQuotaMonitor } from '@/lib/api-quota-monitor';

const monitor = getQuotaMonitor();

// Current usage
const usage = monitor.getCurrentUsage();
console.log(`
  Hour: ${usage?.hour}
  Requests: ${usage?.requests}/${usage?.limit}
  Percent: ${usage?.percentUsed.toFixed(1)}%
  Remaining: ${monitor.getRemainingRequests()}
`);

// Recent alerts
const alerts = monitor.getRecentAlerts(5);
alerts.forEach(alert => {
  console.log(`[${alert.level}] ${alert.message}`);
});
```

### Alert Levels

| Level | Threshold | Action |
|-------|-----------|--------|
| 🟢 **Normal** | 0-70% | No action needed |
| 🟡 **Warning** | 70-90% | Monitor closely, consider throttling |
| 🟠 **Critical** | 90-100% | Throttle non-essential requests |
| 🔴 **Exceeded** | 100%+ | Block new requests, alert on-call |

### Production Integration

**Datadog/CloudWatch**:
```typescript
import { getQuotaMonitor } from '@/lib/api-quota-monitor';
import { metrics } from '@/lib/observability';

const monitor = getQuotaMonitor({
  onAlert: async (alert) => {
    // Send metric to Datadog
    metrics.gauge('congress_api.quota_usage', alert.percentUsed, {
      level: alert.level,
    });

    // Alert on critical/exceeded
    if (alert.level === 'critical' || alert.level === 'exceeded') {
      await metrics.event({
        title: 'Congress.gov API Quota Alert',
        text: alert.message,
        alert_type: alert.level === 'exceeded' ? 'error' : 'warning',
      });
    }
  }
});
```

**Slack Webhook**:
```typescript
const monitor = getQuotaMonitor({
  onAlert: async (alert) => {
    if (alert.level === 'critical' || alert.level === 'exceeded') {
      await fetch(process.env.SLACK_WEBHOOK_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: alert.message,
          blocks: [{
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${alert.level.toUpperCase()}*: ${alert.message}\n` +
                    `Current: ${alert.currentUsage}/${alert.limit} (${alert.percentUsed.toFixed(1)}%)`
            }
          }]
        })
      });
    }
  }
});
```

---

## Incident Response

### API Key Leaked (Public Exposure)

**Timeline**: Execute within 15 minutes

```bash
# 1. Immediately revoke compromised key (0-2 min)
open https://api.congress.gov/sign-up/
# Click "Revoke" on compromised key

# 2. Generate new key (2-3 min)
# Copy new key from portal

# 3. Update production immediately (3-5 min)
vercel env rm CONGRESS_API_KEY production
vercel env add CONGRESS_API_KEY production
# Paste new key

# 4. Trigger redeploy (5-7 min)
vercel --prod

# 5. Verify (7-10 min)
vercel logs --follow
# Watch for: [CONFIG] ✅ Configuration validation passed

# 6. Document incident (10-15 min)
echo "$(date -u): EMERGENCY rotation - key leaked in commit abc123" \
  >> docs/security/incidents.log

# 7. If key was in git history, rewrite history (15+ min)
git filter-branch --tree-filter \
  'find . -name ".env*" -exec rm -f {} \;' HEAD
git push --force
```

### Quota Exhaustion Attack

**Symptoms**:
- 🔴 Quota exceeded alerts
- 🔴 API requests failing with 429 errors
- 🔴 Unusual traffic patterns

**Response**:
```bash
# 1. Check quota monitor
node -e "
  const { getQuotaMonitor } = require('./dist/lib/api-quota-monitor');
  const monitor = getQuotaMonitor();
  console.log(monitor.getCurrentUsage());
"

# 2. Review audit logs for suspicious IPs
grep "rate_limit_exceeded" logs/audit.log | \
  jq -r '.ipAddress' | sort | uniq -c | sort -rn

# 3. Block malicious IPs (if applicable)
# Add to rate limiter IP blocklist

# 4. If legitimate traffic, request quota increase
# Contact api@mail.house.gov with:
# - Your use case
# - Current usage patterns
# - Requested quota

# 5. Implement aggressive caching
# Increase cache TTL in src/lib/document-cache.ts
```

---

## Deployment Guide

### Local Development

```bash
# 1. Copy template
cp .env.example .env

# 2. Get API key
open https://api.congress.gov/sign-up/

# 3. Add to .env
echo "CONGRESS_API_KEY=your_actual_key_here" >> .env

# 4. Validate
npm run dev
# Should see: [CONFIG] ✅ Configuration validation passed
```

### Vercel Production

```bash
# 1. Add environment variable
vercel env add CONGRESS_API_KEY production
# Paste your API key when prompted

# 2. Deploy
vercel --prod

# 3. Verify in logs
vercel logs --follow
# Should see: [SECURITY] Congress.gov API key validated successfully
```

### Docker

```dockerfile
# Use Docker secrets (recommended)
version: '3.8'
services:
  app:
    image: cutthecrap:latest
    secrets:
      - congress_api_key
    environment:
      CONGRESS_API_KEY_FILE: /run/secrets/congress_api_key

secrets:
  congress_api_key:
    external: true
```

---

## Security Checklist

### Development
- [ ] API key in `.env` (not in code)
- [ ] `.env` gitignored
- [ ] No placeholder values
- [ ] Validation passes locally

### Deployment
- [ ] API key set in production environment
- [ ] Test API call succeeds on startup
- [ ] Quota monitoring configured
- [ ] Alert webhooks configured (Slack/PagerDuty)

### Operations
- [ ] Rotation schedule defined (90 days)
- [ ] Incident response plan documented
- [ ] Access control list maintained
- [ ] Audit logs reviewed monthly

### Compliance
- [ ] API keys stored in password manager
- [ ] Rotation documented in logs
- [ ] Principle of least privilege applied
- [ ] Annual security review scheduled

---

## References

- [Congress.gov API Documentation](https://api.congress.gov/v3/app/)
- [Congress.gov Sign Up](https://api.congress.gov/sign-up/)
- [SECURITY.md](../../SECURITY.md) - High-level security policy
- [llm-rag-mcp-security.md](./llm-rag-mcp-security.md) - Detailed threat analysis
- [threat_model.md](./threat_model.md) - STRIDE threat modeling

---

**Document Version**: 1.0
**Last Review**: 2025-01-18
**Next Review**: 2025-04-18 (quarterly)
