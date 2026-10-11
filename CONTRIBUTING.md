# Contributing

Thanks for your interest in improving Maproom. Before making a large change, open a GitHub issue describing the user problem and proposed direction so the scope can be discussed.

## Development workflow

1. Fork the repository and create a focused branch from `main`.
2. Install dependencies with `npm ci`.
3. Keep shared map behavior in `src/shared/` where both the editor and MCP server can use it.
4. Update the relevant documentation when commands, behavior, exports, or MCP tools change.
5. Run the checks relevant to your change: `npm run check`, `npm test`, and `npm run build`.
6. Open a pull request with a summary, user impact, screenshots for visible changes, and verification notes.

## Contribution guidelines

- Keep changes focused and explain trade-offs in the pull request.
- Preserve user map data and backward compatibility where practical.
- Do not add telemetry, external services, or network listeners without discussion.
- Do not include real personal, customer, or confidential data in examples or screenshots.
- Avoid introducing generated dependency directories or local map data into commits.

By submitting a contribution to this repository, you agree that it may be distributed under the project's [MIT License](LICENSE).
