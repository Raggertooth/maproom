import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';
import { MapStore } from './store.js';
import { addTopics, createMap, removeTopic, upsertLink } from '../shared/map-ops.js';
import { toOpml, toSvg } from '../shared/exporters.js';

const store = new MapStore();
const layoutSchema = z.enum(['radial', 'right', 'left', 'org-chart']);
const statusSchema = z.enum(['none', 'planned', 'in-progress', 'done', 'blocked']);

function result(value: unknown) {
  return { content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] };
}

function createServer(): McpServer {
  const server = new McpServer({ name: 'maproom', version: '0.1.0' });

  server.registerTool('list_maps', { description: 'List saved mind maps.' }, async () => result((await store.list()).map(map => ({ id: map.id, title: map.title, layout: map.layout, topics: map.topics.length, updatedAt: map.updatedAt }))));

  server.registerTool('get_map', {
    description: 'Get one complete mind map as structured JSON.',
    inputSchema: z.object({ mapId: z.string().describe('Saved map identifier') }),
  }, async ({ mapId }) => result(await store.get(mapId)));

  server.registerTool('create_map', {
    description: 'Create a new locally saved mind map with one root topic.',
    inputSchema: z.object({ title: z.string().min(1), layout: layoutSchema.default('radial') }),
  }, async ({ title, layout }) => result(await store.save(createMap(title, layout))));

  server.registerTool('add_topics', {
    description: 'Add one or more topics. Omit parentId to attach a topic to the map root.',
    inputSchema: z.object({
      mapId: z.string(),
      topics: z.array(z.object({
        id: z.string().optional(),
        parentId: z.string().nullable().optional(),
        text: z.string().min(1),
        notes: z.string().optional(),
        status: statusSchema.optional(),
        color: z.string().optional(),
      })).min(1),
    }),
  }, async ({ mapId, topics }) => {
    const map = await store.get(mapId);
    const updated = addTopics(map, topics.map(topic => ({ ...topic, style: topic.color ? { color: topic.color } : undefined })));
    return result(await store.save(updated));
  });

  server.registerTool('update_topic', {
    description: 'Update the text, notes, status, color or parent of one topic.',
    inputSchema: z.object({
      mapId: z.string(),
      topicId: z.string(),
      text: z.string().min(1).optional(),
      notes: z.string().optional(),
      status: statusSchema.optional(),
      color: z.string().optional(),
      parentId: z.string().nullable().optional(),
    }),
  }, async ({ mapId, topicId, color, ...changes }) => {
    const map = await store.get(mapId);
    if (!map.topics.some(topic => topic.id === topicId)) throw new Error(`Topic not found: ${topicId}`);
    const topics = map.topics.map(topic => topic.id === topicId ? { ...topic, ...changes, style: color ? { ...topic.style, color } : topic.style } : topic);
    return result(await store.save({ ...map, topics }));
  });

  server.registerTool('remove_topic', {
    description: 'Remove a topic and all of its descendants.',
    inputSchema: z.object({ mapId: z.string(), topicId: z.string() }),
  }, async ({ mapId, topicId }) => result(await store.save(removeTopic(await store.get(mapId), topicId))));

  server.registerTool('connect_topics', {
    description: 'Create or update a cross-link between two topics.',
    inputSchema: z.object({ mapId: z.string(), sourceId: z.string(), targetId: z.string(), label: z.string().optional() }),
  }, async ({ mapId, ...link }) => result(await store.save(upsertLink(await store.get(mapId), link))));

  server.registerTool('set_layout', {
    description: 'Choose the automatic visual layout for a map.',
    inputSchema: z.object({ mapId: z.string(), layout: layoutSchema }),
  }, async ({ mapId, layout }) => result(await store.save({ ...(await store.get(mapId)), layout })));

  server.registerTool('export_map', {
    description: 'Export a map as a portable OPML outline or standalone SVG.',
    inputSchema: z.object({ mapId: z.string(), format: z.enum(['opml', 'svg']) }),
  }, async ({ mapId, format }) => {
    const map = await store.get(mapId);
    return result(format === 'opml' ? toOpml(map) : toSvg(map));
  });

  return server;
}

void serveStdio(createServer);
console.error('Maproom MCP server running on stdio');
