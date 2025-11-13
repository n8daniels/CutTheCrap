# Security Policy

Security is a primary requirement for the CutTheCrap project. This document outlines our security policies, practices, and guidelines.

## Core Security Principles

1. **Security by Design**: Security is considered from the beginning of every feature
2. **Least Privilege**: All components run with minimum required permissions
3. **Defense in Depth**: Multiple layers of security controls
4. **Transparency**: Security practices are documented and auditable
5. **Regular Updates**: Dependencies are kept current with security patches

## Repository Security

### GitHub Security Features

All CutTheCrap repositories MUST have the following enabled:

- ✅ **Multi-Factor Authentication (MFA)** for all contributors
- ✅ **Dependabot security alerts** for vulnerable dependencies
- ✅ **Dependabot automated security updates**
- ✅ **Secret scanning** to prevent committed secrets
- ✅ **Code scanning** (CodeQL or equivalent)
- ✅ **Branch protection rules**:
  - Require pull request reviews before merging
  - Require status checks to pass
  - Require signed commits (recommended)
  - Restrict who can push to main/master

### Secrets Management

**NEVER commit the following to the repository:**

- API keys
- Database credentials
- JWT secrets
- Session secrets
- Private keys
- `.env` files with actual values
- Configuration files with secrets

**Always:**

- Use environment variables for sensitive data
- Keep `.env.example` updated with variable names only
- Use vault services (AWS Secrets Manager, HashiCorp Vault) in production
- Rotate secrets regularly
- Use different secrets for development, staging, and production

## Application Security

### Authentication & Authorization

#### Verified Author System

- Strong password requirements (min 12 characters, complexity)
- Bcrypt password hashing (12+ rounds)
- JWT tokens with appropriate expiration (7 days default)
- Secure session management
- Role-based access control (RBAC)
- MFA for verified authors (required)

#### Token Security

```typescript
// JWT tokens must include:
- userId
- email
- role
- iat (issued at)
- exp (expiration)

// Tokens must be:
- Signed with HS256 or RS256
- Stored securely (httpOnly cookies for web)
- Validated on every request
- Short-lived (7 days max)
```

### Input Validation

All user input MUST be:

1. **Validated**: Check type, format, length, range
2. **Sanitized**: Remove or escape dangerous characters
3. **Parameterized**: Use prepared statements for SQL queries

#### Validation Rules

- Use Zod for TypeScript runtime validation
- Validate on both client and server
- Reject invalid input immediately
- Log validation failures for security monitoring

#### SQL Injection Prevention

```typescript
// ✅ GOOD - Parameterized query
await query('SELECT * FROM bills WHERE id = $1', [billId]);

// ❌ BAD - String concatenation
await query(`SELECT * FROM bills WHERE id = '${billId}'`);
```

#### XSS Prevention

- Sanitize HTML content with DOMPurify
- Use React's built-in XSS protection (don't use dangerouslySetInnerHTML without sanitization)
- Set proper Content-Security-Policy headers
- Encode output data

### API Security

#### Rate Limiting

All API endpoints must implement rate limiting:

```typescript
// Default: 100 requests per 15 minutes
- Stricter limits for authentication endpoints (5 attempts per 15 minutes)
- IP-based and user-based rate limiting
- Return 429 Too Many Requests when exceeded
```

#### Security Headers

All responses include:

```http
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: [configured per page]
```

#### CSRF Protection

- Use CSRF tokens for state-changing operations
- Validate Origin and Referer headers
- Use SameSite cookies
- Verify tokens on all POST/PUT/DELETE requests

### Database Security

#### Connection Security

- Use SSL/TLS for database connections in production
- Implement connection pooling with limits
- Use read-only connections where appropriate
- Regular connection timeout and cleanup

#### Access Control

```sql
-- Principle of least privilege
CREATE USER app_user WITH PASSWORD 'secure_password';
GRANT SELECT, INSERT, UPDATE ON bills TO app_user;
GRANT SELECT, INSERT, UPDATE ON bill_sections TO app_user;
-- NO DROP, NO DELETE on critical tables
-- NO SUPERUSER privileges
```

#### Data Protection

- Encrypt sensitive data at rest
- Hash passwords with bcrypt (12+ rounds)
- Sanitize data before storage
- Regular backups with encryption
- Audit logging for sensitive operations

### LLM Integration Security

#### Ollama (Local)

- Run Ollama in isolated environment
- No internet access required
- Validate all prompts before submission
- Limit prompt length (prevent prompt injection)
- Rate limit LLM requests

#### OpenAI (Optional)

- Store API keys in vault, never in code
- Use environment-specific keys
- Monitor usage and costs
- Implement request quotas
- Log all API calls for audit

### Content Security

#### Caching

- Hash content with SHA-256
- Validate cache integrity
- Set appropriate TTL
- Regular cache cleanup
- Prevent cache poisoning

#### User-Generated Content

All user-generated content (partisan perspectives) must:

1. Be validated and sanitized
2. Go through moderation queue
3. Be attributed to verified authors only
4. Include audit trail
5. Support flagging and removal

## Vulnerability Disclosure

### Reporting a Vulnerability

If you discover a security vulnerability:

1. **DO NOT** open a public GitHub issue
2. Email security@cutthecrap.example.com (or use GitHub Security Advisories)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

- **24 hours**: Initial acknowledgment
- **72 hours**: Initial assessment and triage
- **7 days**: Status update
- **30 days**: Fix and disclosure (if applicable)

### Disclosure Policy

- Coordinated disclosure with 90-day embargo
- Credit given to reporters (unless they prefer anonymity)
- CVE assignment for significant vulnerabilities
- Public disclosure after fix is deployed

## Security Checklist

### For Every Pull Request

- [ ] No secrets or API keys committed
- [ ] Input validation implemented
- [ ] Output encoding applied
- [ ] SQL queries use parameters
- [ ] Authentication/authorization checked
- [ ] Security headers configured
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies are up to date
- [ ] Tests include security scenarios

### For Every Release

- [ ] Security scan completed (npm audit)
- [ ] Dependency updates applied
- [ ] Security headers verified
- [ ] Authentication flows tested
- [ ] Rate limiting tested
- [ ] Audit logs reviewed
- [ ] Secrets rotated (if needed)
- [ ] Backup and recovery tested

## Security Audit Log

All security-relevant events are logged:

- Authentication attempts (success and failure)
- Authorization failures
- Admin actions
- Sensitive data access
- Configuration changes
- API key usage
- Rate limit violations

Logs include:
- Timestamp
- User ID
- Action
- IP address
- User agent
- Result (success/failure)

## Compliance

### Data Privacy

- GDPR compliance for EU users
- CCPA compliance for California users
- Clear privacy policy
- User data export capability
- Right to deletion (Right to be Forgotten)

### Accessibility

- WCAG 2.1 Level AA compliance
- Security features accessible to all users
- Clear security notifications

## Security Training

All contributors should:

1. Complete OWASP Top 10 training
2. Understand secure coding practices
3. Know how to use security tools
4. Review this security policy
5. Stay updated on security best practices

## Security Tools

### Recommended Tools

- **npm audit**: Dependency vulnerability scanning
- **Snyk**: Continuous security monitoring
- **ESLint security plugin**: Static code analysis
- **OWASP ZAP**: Penetration testing
- **Burp Suite**: Security testing
- **SonarQube**: Code quality and security

### CI/CD Security

- Security scans in CI pipeline
- Automated dependency updates
- Secret scanning
- Container scanning (if using Docker)
- Infrastructure as Code (IaC) scanning

## Incident Response

### In Case of Security Incident

1. **Contain**: Isolate affected systems
2. **Assess**: Determine scope and impact
3. **Notify**: Alert stakeholders and affected users
4. **Remediate**: Fix the vulnerability
5. **Review**: Post-incident analysis
6. **Improve**: Update security measures

### Communication

- Use secure channels
- Follow disclosure timeline
- Be transparent with users
- Document lessons learned

## Contact

For security-related questions or concerns:

- Email: security@cutthecrap.example.com
- GitHub Security Advisories: [Create advisory]
- Emergency: [Emergency contact procedure]

## Updates to This Policy

This security policy is reviewed and updated quarterly. Last update: 2025-11-13

---

**Remember**: Security is everyone's responsibility. When in doubt, ask or err on the side of caution.
