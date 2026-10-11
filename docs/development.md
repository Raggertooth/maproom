# Development guide

## Requirements

- Node.js 22.19+, 24.11+, or 26+
- npm
- Git

## Start the development environment

```bash
npm ci
npm run dev
```

The API server runs on `http://127.0.0.1:4318`; Vite serves the browser editor on `http://127.0.0.1:5173` and proxies `/api` requests to the API server.

## Production build

```bash
npm run build
npm start
```

The build writes browser files to `dist/web/` and self-contained Node server bundles to `dist/server/`. Run the MCP process with `npm run mcp` or `node dist/server/mcp.js`.

## Project structure

```text
src/client/     React editor
src/server/     HTTP server, MCP server, and local store
src/shared/     Map types, operations, layout, and exporters
tests/          Shared map and export behavior checks
docs/           User and developer documentation
dist/           Production bundles
data/           Local map data (ignored by Git)
```

The JSON file is the persistence layer. Keep changes to map behavior in `src/shared/` where possible so both browser and MCP entry points use the same logic.

## Available scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start API and Vite in watch mode |
| `npm run check` | Type-check the project |
| `npm test` | Run unit tests |
| `npm run build` | Build browser and server bundles |
| `npm start` | Start the production HTTP server |
| `npm run mcp` | Start the MCP server over stdio |
| `npm run smoke:mcp` | Connect an MCP client and check registered tools |

## Configuration

- `PORT` changes the HTTP server port; default `4318`.
- `MAPROOM_DATA_PATH` selects the map JSON file for both server processes.

The HTTP server binds to `127.0.0.1`. Preserve that local-only binding unless authentication and network security are designed first.
