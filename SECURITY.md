# Security policy

Maproom is an early local application. Its HTTP server binds to `127.0.0.1`, does not authenticate requests, and stores maps as plain JSON files. Do not expose the HTTP server to a LAN or public network, and do not put secrets in map notes.

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting feature for this repository if it is enabled. Otherwise, contact the maintainer through the contact method on the GitHub profile and include a concise description, impact, and steps to reproduce. Do not post credentials, private map content, or a working exploit in a public issue.

The maintainer will acknowledge a report when able and coordinate a fix before public disclosure when practical. No response-time guarantee is currently offered.
