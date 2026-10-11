# Connect an AI agent

Maproom uses the Model Context Protocol (MCP) over stdio. The MCP host starts the server as a child process; both processes run on the same computer and read/write the same map file.

## Build the server

From the project folder:

```bash
npm ci
npm run build
```

Use the absolute path to `dist/server/mcp.js` in your MCP host configuration. Node.js must be on the host process's `PATH`.

## Codex example

Add this to the MCP server configuration, replacing the example paths with your actual checkout and data file paths:

```toml
[mcp_servers.maproom]
command = "node"
args = ["/absolute/path/to/maproom/dist/server/mcp.js"]
env = { MAPROOM_DATA_PATH = "/absolute/path/to/maproom/data/maps.json" }
```

Restart Codex or reload its MCP servers. Maproom should appear as a connected server with its nine tools. Start the browser editor separately with `npm start`, using the same `MAPROOM_DATA_PATH` value, then open `http://127.0.0.1:4318`.

## Generic JSON configuration

Some MCP clients use a JSON configuration shaped like this:

```json
{
  "mcpServers": {
    "maproom": {
      "command": "node",
      "args": ["/absolute/path/to/maproom/dist/server/mcp.js"],
      "env": {
        "MAPROOM_DATA_PATH": "/absolute/path/to/maproom/data/maps.json"
      }
    }
  }
}
```

Use the exact configuration format and location documented by your MCP client. Some clients may require an explicit working directory or a full path to Node.js.

## Example prompts

After connecting, try prompts such as:

> Create a map called “Service architecture”. Add branches for clients, API, authentication, data stores, and external services. Use notes to record assumptions and cross-links to show dependencies.

> Turn this feature brief into a development map. Group the topics under user flow, components, data changes, risks, and acceptance criteria. Mark unresolved items as planned.

> Read the current “Service architecture” map and summarize the main components, dependencies, and unanswered questions.

> Add a “Release readiness” branch with testing, observability, rollout, and rollback topics. Link the rollout topic to the rollback topic with the label “fallback”.

Give the agent access to relevant source code or repository tools separately. Maproom provides the map workspace; it does not browse a codebase by itself.

## Data location and process behavior

The MCP process and browser server use `MAPROOM_DATA_PATH` when set. If it is omitted, each process resolves `data/maps.json` from its current working directory. Set one shared absolute path in both processes to make maps appear consistently. Do not place secrets in map notes if other local users or agents can read the file.

The MCP process communicates through stdin and stdout. Diagnostic messages go to stderr. Do not start it in a terminal-only interactive shell from the MCP host; let the host manage the stdio process.
