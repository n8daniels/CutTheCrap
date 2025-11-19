# Security Policy

## Overview

FedDocMCP takes security seriously. This document outlines our security practices and how to report vulnerabilities.

## Security Best Practices

### API Key Security

1. **Never Commit API Keys**
   - Always store API keys in environment variables
   - Use `.env` files for local development (already gitignored)
   - Never hardcode API keys in source code

2. **Environment Variables**
   ```bash
   # Good - using environment variable
   export CONGRESS_API_KEY=your_api_key_here

   # Bad - hardcoded in code
   api_key = "actual_api_key_here"  # NEVER DO THIS
   ```

3. **API Key Rotation**
   - Rotate your Congress.gov API key periodically
   - If a key is compromised, revoke it immediately at https://api.congress.gov
   - Update the key in all environments

### MCP Client Configuration

When configuring FedDocMCP in your MCP client (e.g., Claude Desktop):

1. **Protect Configuration Files**
   ```json
   {
     "mcpServers": {
       "feddocmcp": {
         "env": {
           "CONGRESS_API_KEY": "your_key_here"
         }
       }
     }
   }
   ```
   - Set appropriate file permissions (0600 on Unix systems)
   - Never commit client configuration files with API keys

2. **Use Absolute Paths**
   - Specify absolute paths for `cwd` parameter
   - Avoid relative paths that could execute code from unintended directories

### Dependency Security

1. **Keep Dependencies Updated**
   ```bash
   # Check for outdated packages
   pip list --outdated

   # Update specific package
   pip install --upgrade package-name
   ```

2. **Security Scanning**
   ```bash
   # Install safety
   pip install safety

   # Scan for known vulnerabilities
   safety check
   ```

3. **Use Virtual Environments**
   - Always use virtual environments (`venv`) for isolation
   - Never install packages globally

### Data Privacy

1. **No User Data Storage**
   - FedDocMCP does not store user data
   - All requests are proxied to Congress.gov API
   - Responses are cached temporarily (5 minutes by default) in memory only

2. **Response Caching**
   - Cache is in-memory only (not persisted to disk)
   - Cache is cleared on server restart
   - Cached data contains only public Congressional information
   - No personally identifiable information (PII) is cached

3. **Logging**
   - Logs are written to stderr only
   - API keys are never logged
   - Request/response bodies are logged at DEBUG level only
   - Production deployments should use INFO or WARNING level

### Network Security

1. **HTTPS Only**
   - Congress.gov API uses HTTPS
   - All API requests are encrypted in transit

2. **Rate Limiting**
   - Built-in rate limiting (5000 req/hour) prevents abuse
   - Respects Congress.gov API limits

3. **Timeout Configuration**
   - 30-second timeout prevents hanging connections
   - Configurable via client settings

### Code Security

1. **Input Validation**
   - All user inputs are validated using Pydantic
   - Type checking with mypy prevents type-related bugs
   - SQL injection not applicable (no database)

2. **Error Handling**
   - Errors do not expose sensitive information
   - Stack traces are logged to stderr, not sent to clients
   - User-facing error messages are generic

3. **No Code Execution**
   - Server does not execute arbitrary code
   - All operations are predefined tool calls
   - No eval() or exec() usage

## Reporting Security Vulnerabilities

### How to Report

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead:

1. **Email**: Send details to [repository owner's email]
2. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

### What to Expect

1. **Acknowledgment**: Within 48 hours
2. **Assessment**: Within 1 week
3. **Fix Timeline**: Depends on severity
   - Critical: Within 7 days
   - High: Within 30 days
   - Medium: Within 90 days
   - Low: Best effort

4. **Disclosure**: After fix is deployed and users have time to update

### Security Disclosure Policy

- We will acknowledge your report within 48 hours
- We will provide a detailed response within 1 week
- We will work with you to understand and fix the issue
- We will credit researchers (unless they prefer to remain anonymous)
- We will publicly disclose the issue after it's fixed

## Security Checklist for Developers

Before releasing new code, verify:

- [ ] No API keys or secrets in code
- [ ] All inputs are validated
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies are up to date
- [ ] Tests pass (including security-related tests)
- [ ] Code follows principle of least privilege
- [ ] Logging doesn't expose secrets
- [ ] .gitignore includes sensitive files
- [ ] Documentation doesn't contain secrets

## Security Checklist for Users

Before deploying FedDocMCP:

- [ ] API key is stored in environment variable
- [ ] Configuration file permissions are restricted (0600)
- [ ] Using virtual environment for isolation
- [ ] Log level is set appropriately (INFO or higher in production)
- [ ] Dependencies are from trusted sources
- [ ] Server is run with minimal privileges
- [ ] Network access is restricted to necessary endpoints

## Known Limitations

1. **No Authentication for MCP Protocol**
   - stdio transport has no built-in authentication
   - Server runs with same privileges as calling process
   - Use system-level access controls

2. **In-Memory Cache**
   - Cache is not encrypted (public data only)
   - Cache persists for server lifetime
   - Clear cache if handling sensitive queries

3. **Rate Limiting**
   - Rate limiting is per-client instance
   - Multiple instances share the API key's rate limit
   - Monitor usage to avoid hitting Congress.gov limits

## Compliance

- **Data Privacy**: No user data collected or stored
- **API Terms**: Complies with Congress.gov API terms of service
- **Open Source**: MIT License - no warranty provided

## Security Updates

Subscribe to repository notifications for security updates:

1. Watch the repository on GitHub
2. Enable security alerts
3. Monitor releases for security patches

## Resources

- [Congress.gov API Documentation](https://api.congress.gov)
- [MCP Security Best Practices](https://modelcontextprotocol.io/docs/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Python Security Best Practices](https://python.readthedocs.io/en/latest/library/security_warnings.html)

## Contact

For security concerns: [Add security contact email]

For general issues: GitHub Issues

---

Last Updated: 2025-11-15
