import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [process.env.MAPROOM_MCP_PATH ?? 'dist/server/mcp.js'],
  cwd: process.env.MAPROOM_CWD ?? process.cwd(),
  stderr: 'pipe',
});

const client = new Client({ name: 'maproom-smoke-test', version: '1.0.0' });

try {
  await client.connect(transport);
  const { tools } = await client.listTools();
  const expected = ['list_maps', 'get_map', 'create_map', 'add_topics', 'update_topic', 'remove_topic', 'connect_topics', 'set_layout', 'export_map'];
  const missing = expected.filter(name => !tools.some(tool => tool.name === name));
  if (missing.length) throw new Error(`Missing MCP tools: ${missing.join(', ')}`);
  const response = await client.callTool({ name: 'list_maps', arguments: {} });
  if (!response.content.length) throw new Error('list_maps returned no content.');
  process.stdout.write(`MCP smoke test passed: ${tools.length} tools available.\n`);
} finally {
  await client.close();
}
