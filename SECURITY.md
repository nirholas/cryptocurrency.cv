# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

1. **DO NOT** open a public GitHub issue for security vulnerabilities
2. Email: security@cryptocurrency.cv (or open a private security advisory)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Response time**: Within 48 hours
- **Resolution timeline**: Critical issues within 7 days
- **Credit**: We'll credit you in the fix (unless you prefer anonymity)

### Scope

**In scope:**
- API endpoints (`/api/*`)
- Authentication/authorization issues
- Data exposure vulnerabilities
- Injection attacks (SQL, XSS, etc.)
- Rate limiting bypasses
- CORS misconfigurations

**Out of scope:**
- Third-party dependencies (report to them directly)
- Social engineering attacks
- Physical attacks
- DoS attacks on infrastructure

## Security Measures

This project implements:

- ✅ Security headers (CSP, X-Content-Type-Options, etc.)
- ✅ Rate limiting
- ✅ Input validation and sanitization
- ✅ CORS configuration
- ✅ Dependency scanning (Dependabot)
- ✅ Code scanning (CodeQL)
- ✅ No secrets in code

## Best Practices for Users

When using this API:

1. **Don't store sensitive data** - This is a public API
2. **Implement your own rate limiting** - Be a good citizen
3. **Validate responses** - Don't trust any external data
4. **Use HTTPS** - Always use the HTTPS endpoint

## Contact

For security concerns: Open a [GitHub Security Advisory](https://github.com/nirholas/free-crypto-news/security/advisories/new)
