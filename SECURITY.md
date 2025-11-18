# Security Policy

## Overview

CutTheCrap is an AI-powered federal legislation analysis platform that processes public legislative data from Congress.gov. This document outlines our security posture, threat model, and how we mitigate risks related to AI/LLM systems, Model Context Protocol (MCP), and data processing.

## Data Handling

### Data Types
- **Public Legislative Data**: Bill text, status, metadata from Congress.gov API
- **User Input**: Bill IDs, search parameters, analysis preferences
- **API Keys**: Congress.gov API key (sensitive)
- **Cached Data**: Document graphs, bill content (24-hour TTL)

### No PII Currently
CutTheCrap does not currently collect, process, or store Personally Identifiable Information (PII). All data is public legislative information.

### Future Considerations
When LLM integration is added:
- User queries may contain PII (names, locations, etc.)
- Implement PII detection/scrubbing before LLM calls
- Add data retention policies for chat history

## Threat Model Summary

### Trust Boundaries
1. User → Next.js API (HTTP)
2. Next.js → Python MCP Server (subprocess/STDIO)
3. MCP Server → Congress.gov API (HTTPS)
4. Backend → Cache (Redis/Memory)
5. **Future**: Backend → LLM Provider (HTTPS)

### Key Threats
See [docs/security/threat_model.md](docs/security/threat_model.md) for detailed analysis.

High-priority risks:
- **Command Injection**: MCP server path from environment variable
- **Rate Limiting**: No protection against API quota exhaustion
- **ReDoS**: Regex-based dependency detection vulnerable to pathological input
- **Future Prompt Injection**: AIContextBuilder prepares unsanitized content for LLM use
- **Secret Leakage**: API keys in subprocess environment and logs

## OWASP LLM Top 10 Mitigation

| Risk | Current Status | Mitigation |
|------|---------------|------------|
| **LLM01: Prompt Injection** | Not applicable yet (no LLM) | **Planned**: Input sanitization, output validation, system prompt constraints |
| **LLM02: Insecure Output Handling** | Not applicable yet | **Planned**: Output encoding, validation before display |
| **LLM03: Training Data Poisoning** | Low risk (public data source) | **Current**: Trust Congress.gov data. **Planned**: Response validation |
| **LLM04: Model Denial of Service** | Not applicable yet | **Planned**: Token limits, rate limiting, request timeouts |
| **LLM05: Supply Chain Vulnerabilities** | Medium risk | **Current**: Using official MCP SDK. **Planned**: Dependency scanning, SBOMs |
| **LLM06: Sensitive Information Disclosure** | **High risk** | **NEEDS WORK**: Secret scrubbing, separate env for subprocess, audit logging |
| **LLM07: Insecure Plugin Design** | **High risk** (MCP) | **NEEDS WORK**: MCP path validation, tool allowlisting, RBAC |
| **LLM08: Excessive Agency** | Medium risk | **Current**: Depth limits, dependency caps. **Planned**: Tool confirmation, scope restrictions |
| **LLM09: Overreliance** | Not applicable yet | **Planned**: Confidence scores, source attribution |
| **LLM10: Model Theft** | Not applicable | N/A |

## MCP/RAG Security Posture

### MCP Server Security
- **Current**: Python MCP server with 3 read-only tools
- **Concerns**:
  - No authentication between Node.js and Python server
  - Subprocess inherits full environment (secret leakage risk)
  - No resource limits on spawned process
  - No audit logging of tool calls

### Recommended MCP Controls
1. **Tool Allowlisting**: Explicitly define allowed tools in config
2. **Parameter Validation**: Strong typing and bounds checking on all tool params
3. **Audit Logging**: Log every MCP tool call with timestamp, tool, args, result
4. **Resource Limits**: Timeout, memory limits on Python subprocess
5. **Least Privilege**: Separate service account for MCP server, minimal env vars

### RAG Security (Future)
When vector database is added:
- Implement tenant isolation with metadata filters
- Validate/sanitize all content before indexing
- Guard against knowledge base poisoning (PoisonedRAG attacks)
- Rate limit embedding generation
- Audit trail for document ingestion

## Current Security Controls

✅ **Input Validation**: Zod schema validation on API endpoints
✅ **Depth Limiting**: Max dependency depth of 3
✅ **Cycle Detection**: Prevents infinite loops in document graphs
✅ **Request Timeouts**: 30s timeout on Congress.gov API calls
✅ **Caching**: Reduces external API calls, prevents quota exhaustion
✅ **Error Handling**: Try-catch blocks, graceful degradation

## Known Issues & TODOs

🚨 **High Priority**
- [ ] **MCP Path Injection**: Validate or hardcode `FEDDOC_MCP_PATH`
- [ ] **Rate Limiting**: Add per-IP/user rate limits on API routes
- [ ] **Secret Management**: Use secret manager, don't pass full env to subprocess
- [ ] **Audit Logging**: Log all MCP tool calls and API requests

⚠️ **Medium Priority**
- [ ] **ReDoS Protection**: Add timeout to regex operations
- [ ] **Bill Type Validation**: Whitelist allowed bill types
- [ ] **Response Validation**: Validate Congress.gov API responses
- [ ] **Dependency Scanning**: Implement automated CVE scanning
- [ ] **CORS Configuration**: Restrict API access to known origins

📝 **Future (Before LLM Integration)**
- [ ] **LLM Gateway**: Centralized wrapper with safety controls
- [ ] **Prompt Injection Defenses**: Input sanitization, output filtering
- [ ] **PII Detection**: Scrub PII before LLM calls
- [ ] **Content Moderation**: Validate LLM outputs before display
- [ ] **System Prompt Hardening**: Prevent jailbreaks/prompt leaking

## Reporting Security Issues

**DO NOT** open public GitHub issues for security vulnerabilities.

Instead, email security concerns to: [security@example.com] *(update with actual contact)*

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We aim to respond within 48 hours and will credit reporters (with permission) in our security advisories.

## Security Update Policy

- **Critical vulnerabilities**: Patched within 24-48 hours
- **High severity**: Patched within 7 days
- **Medium severity**: Patched within 30 days
- **Low severity**: Included in next regular release

Security updates will be announced via:
- GitHub Security Advisories
- Release notes with `[SECURITY]` tag

## Compliance & Standards

- Following **OWASP Top 10 for LLM Applications (2025)**
- Implementing **CSA RAG Security Guidelines**
- Adhering to **Anthropic MCP Security Best Practices**
- Planning alignment with **SOC 2 Type II** controls (future)

## Version

This security policy applies to CutTheCrap v1.0 and above.

**Last Updated**: 2025-01-18
**Next Review**: 2025-04-18 (quarterly reviews)

---

For detailed technical security information, see:
- [docs/security/llm-rag-mcp-security.md](docs/security/llm-rag-mcp-security.md)
- [docs/security/threat_model.md](docs/security/threat_model.md)
