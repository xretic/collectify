# Security policy

## Supported versions

Only the latest commit on `main` receives security fixes.

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report vulnerabilities privately through
[GitHub Security Advisories](https://github.com/xretic/collectify/security/advisories/new)
("Report a vulnerability" on the _Security_ tab).

Please include:

- a description of the issue and its impact;
- steps to reproduce or a proof of concept;
- the affected route, component or commit, if known.

We aim to acknowledge reports within **3 business days** and to share a fix timeline once the issue
is confirmed. You will be credited in the advisory unless you prefer to stay anonymous.

## Scope

In scope: authentication and sessions, authorization and role checks, moderation tools, realtime
channels, injection, XSS, CSRF and data exposure through the API.

Out of scope: denial of service through volume, findings that require a compromised device or
browser, and missing hardening headers without a demonstrated impact.
