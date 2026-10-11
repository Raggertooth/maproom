// src/server/http.ts
import { createServer } from "node:http";
import { readFile as readFile2, stat } from "node:fs/promises";
import path2 from "node:path";
import { fileURLToPath } from "node:url";

// src/server/store.ts
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

// src/shared/seed.ts
var now = (/* @__PURE__ */ new Date("2026-10-11T00:00:00.000Z")).toISOString();
var branchColors = {
  research: "#77a77d",
  build: "#e77c3f",
  launch: "#4d8cc9",
  learn: "#9a55a5"
};
var rows = [
  ["root", null, "Launch a mindful product", "A healthier, more human approach to building products that create lasting value.", "#3b82d0", "in-progress"],
  ["research", "root", "Research", "Understand the people and the problem before committing to a solution.", branchColors.research, "in-progress"],
  ["research-users", "research", "Understand users", "Interview users and observe their current workflow.", branchColors.research],
  ["research-market", "research", "Analyse market", "", branchColors.research],
  ["research-value", "research", "Define value proposition", "", branchColors.research],
  ["research-stakeholders", "research", "Map stakeholders", "", branchColors.research],
  ["build", "root", "Build", "", branchColors.build, "planned"],
  ["build-design", "build", "Design experience", "", branchColors.build],
  ["build-mvp", "build", "Develop MVP", "", branchColors.build],
  ["build-test", "build", "Test with users", "", branchColors.build],
  ["build-scale", "build", "Prepare for scale", "", branchColors.build],
  ["launch", "root", "Launch", "", branchColors.launch, "planned"],
  ["launch-market", "launch", "Go to market", "", branchColors.launch],
  ["launch-teams", "launch", "Enable teams", "", branchColors.launch],
  ["launch-signals", "launch", "Track early signals", "", branchColors.launch],
  ["launch-iterate", "launch", "Iterate quickly", "", branchColors.launch],
  ["learn", "root", "Learn", "", branchColors.learn, "planned"],
  ["learn-impact", "learn", "Measure impact", "", branchColors.learn],
  ["learn-feedback", "learn", "Gather feedback", "", branchColors.learn],
  ["learn-doc", "learn", "Document learnings", "", branchColors.learn],
  ["learn-next", "learn", "Plan next steps", "", branchColors.learn]
];
var seedMap = {
  id: "launch-a-mindful-product",
  title: "Launch a mindful product",
  layout: "radial",
  topics: rows.map(([id, parentId, text, notes, color, status = "none"], index) => ({
    id,
    parentId,
    text,
    notes,
    status,
    style: { color },
    order: index
  })),
  links: [
    {
      id: "feedback-loop",
      sourceId: "build-test",
      targetId: "learn-feedback",
      label: "Feeds insights"
    }
  ],
  createdAt: now,
  updatedAt: now
};

// src/shared/map-ops.ts
function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `map-${Date.now()}`;
}
function createMap(title, layout = "radial") {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const id = slugify(title);
  return {
    id,
    title,
    layout,
    topics: [{
      id: "root",
      parentId: null,
      text: title,
      notes: "",
      status: "none",
      style: { color: "#3b82d0" },
      order: 0
    }],
    links: [],
    createdAt: timestamp,
    updatedAt: timestamp
  };
}
function validateMap(map) {
  const ids = new Set(map.topics.map((topic) => topic.id));
  if (ids.size !== map.topics.length) throw new Error("Topic IDs must be unique.");
  const roots = map.topics.filter((topic) => topic.parentId === null);
  if (roots.length !== 1) throw new Error("A map must contain exactly one root topic.");
  for (const topic of map.topics) {
    if (topic.parentId !== null && !ids.has(topic.parentId)) {
      throw new Error(`Topic ${topic.id} has an unknown parent ${topic.parentId}.`);
    }
    if (topic.parentId === topic.id) throw new Error(`Topic ${topic.id} cannot parent itself.`);
  }
  for (const link of map.links) {
    if (!ids.has(link.sourceId) || !ids.has(link.targetId)) {
      throw new Error(`Link ${link.id} references an unknown topic.`);
    }
  }
  return map;
}

// src/server/store.ts
var MapStore = class {
  filePath;
  constructor(filePath = process.env.MAPROOM_DATA_PATH ?? path.resolve("data/maps.json")) {
    this.filePath = filePath;
  }
  async readAll() {
    try {
      const content = await readFile(this.filePath, "utf8");
      const maps = JSON.parse(content);
      return maps.map(validateMap);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      await this.writeAll([seedMap]);
      return [structuredClone(seedMap)];
    }
  }
  async writeAll(maps) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const temporary = `${this.filePath}.${process.pid}.tmp`;
    await writeFile(temporary, `${JSON.stringify(maps, null, 2)}
`, "utf8");
    await rename(temporary, this.filePath);
  }
  async list() {
    return this.readAll();
  }
  async get(id) {
    const map = (await this.readAll()).find((item) => item.id === id);
    if (!map) throw new Error(`Map not found: ${id}`);
    return map;
  }
  async save(map) {
    const next = validateMap({ ...map, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
    const maps = await this.readAll();
    const index = maps.findIndex((item) => item.id === next.id);
    if (index >= 0) maps[index] = next;
    else maps.push(next);
    await this.writeAll(maps);
    return next;
  }
  async delete(id) {
    const maps = await this.readAll();
    const filtered = maps.filter((item) => item.id !== id);
    if (filtered.length === maps.length) throw new Error(`Map not found: ${id}`);
    await this.writeAll(filtered);
  }
};

// src/shared/layout.ts
var NODE_WIDTH = 164;
var NODE_HEIGHT = 54;
var ROOT_WIDTH = 230;
var ROOT_HEIGHT = 90;
function childrenOf(map, parentId) {
  return map.topics.filter((topic) => topic.parentId === parentId).sort((a, b) => a.order - b.order);
}
function layoutMap(map, width = 1200, height = 760) {
  const root = map.topics.find((topic) => topic.parentId === null);
  if (!root) return [];
  const centerX = width / 2;
  const centerY = height / 2;
  const branchDistance = Math.min(260, width * 0.18);
  const childDistance = Math.min(300, width * 0.22);
  const positioned = [{ ...root, x: centerX, y: centerY, width: ROOT_WIDTH, height: ROOT_HEIGHT, depth: 0 }];
  const branches = childrenOf(map, root.id);
  if (map.layout === "org-chart") {
    const branchGap = Math.min(250, (width - 100) / Math.max(1, branches.length));
    branches.forEach((branch, branchIndex) => {
      const x = centerX + (branchIndex - (branches.length - 1) / 2) * branchGap;
      positioned.push({ ...branch, x, y: centerY + 160, width: NODE_WIDTH, height: NODE_HEIGHT, depth: 1 });
      childrenOf(map, branch.id).forEach((child, index, siblings) => {
        positioned.push({ ...child, x: x + (index - (siblings.length - 1) / 2) * 120, y: centerY + 300, width: 145, height: 48, depth: 2 });
      });
    });
    return positioned;
  }
  branches.forEach((branch, branchIndex) => {
    let side;
    if (map.layout === "right") side = 1;
    else if (map.layout === "left") side = -1;
    else side = branchIndex % 2 === 0 ? -1 : 1;
    const sideBranches = branches.filter((_, index) => map.layout === "radial" ? index % 2 === (side === -1 ? 0 : 1) : true);
    const positionInSide = sideBranches.findIndex((item) => item.id === branch.id);
    const verticalGap = Math.min(270, height / Math.max(2.7, sideBranches.length));
    const y = centerY + (positionInSide - (sideBranches.length - 1) / 2) * verticalGap;
    const x = centerX + side * branchDistance;
    positioned.push({ ...branch, x, y, width: NODE_WIDTH, height: NODE_HEIGHT, depth: 1 });
    const children = childrenOf(map, branch.id);
    children.forEach((child, index) => {
      const childY = y + (index - (children.length - 1) / 2) * 68;
      positioned.push({ ...child, x: x + side * childDistance, y: childY, width: 170, height: 46, depth: 2 });
    });
  });
  return positioned;
}
function connectionPath(source, target) {
  const direction = target.x >= source.x ? 1 : -1;
  const sx = source.x + direction * source.width / 2;
  const tx = target.x - direction * target.width / 2;
  const bend = Math.max(50, Math.abs(tx - sx) * 0.48);
  return `M ${sx} ${source.y} C ${sx + direction * bend} ${source.y}, ${tx - direction * bend} ${target.y}, ${tx} ${target.y}`;
}

// src/shared/exporters.ts
var escapeXml = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
function opmlTopic(topic, map, depth) {
  const children = map.topics.filter((item) => item.parentId === topic.id).sort((a, b) => a.order - b.order);
  const attrs = [
    `text="${escapeXml(topic.text)}"`,
    topic.notes ? `_note="${escapeXml(topic.notes)}"` : "",
    topic.status !== "none" ? `_status="${topic.status}"` : ""
  ].filter(Boolean).join(" ");
  const indent = "  ".repeat(depth);
  if (!children.length) return `${indent}<outline ${attrs}/>`;
  return `${indent}<outline ${attrs}>
${children.map((child) => opmlTopic(child, map, depth + 1)).join("\n")}
${indent}</outline>`;
}
function toOpml(map) {
  const root = map.topics.find((topic) => topic.parentId === null);
  if (!root) throw new Error("Map has no root topic.");
  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>${escapeXml(map.title)}</title>
  </head>
  <body>
${opmlTopic(root, map, 2)}
  </body>
</opml>
`;
}
function toSvg(map, width = 1400, height = 900) {
  const topics = layoutMap(map, width, height);
  const byId = new Map(topics.map((topic) => [topic.id, topic]));
  const hierarchy = topics.filter((topic) => topic.parentId).map((topic) => {
    const parent = byId.get(topic.parentId);
    if (!parent) return "";
    return `<path d="${connectionPath(parent, topic)}" fill="none" stroke="${topic.style.color ?? "#8a97a5"}" stroke-width="3" stroke-linecap="round"/>`;
  }).join("");
  const links = map.links.map((link) => {
    const source = byId.get(link.sourceId);
    const target = byId.get(link.targetId);
    if (!source || !target) return "";
    return `<path d="${connectionPath(source, target)}" fill="none" stroke="#8f4c99" stroke-width="2" stroke-dasharray="6 6"/>`;
  }).join("");
  const nodes = topics.map((topic) => {
    const color = topic.style.color ?? "#64748b";
    const fill = topic.depth === 0 ? "#edf5ff" : `${color}18`;
    const x = topic.x - topic.width / 2;
    const y = topic.y - topic.height / 2;
    const fontSize = topic.depth === 0 ? 22 : topic.depth === 1 ? 17 : 14;
    return `<g><rect x="${x}" y="${y}" width="${topic.width}" height="${topic.height}" rx="14" fill="${fill}" stroke="${color}" stroke-width="${topic.depth === 0 ? 3 : 1.5}"/><text x="${topic.x}" y="${topic.y + fontSize * 0.35}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="${fontSize}" font-weight="${topic.depth < 2 ? 650 : 500}" text-anchor="middle" fill="#172033">${escapeXml(topic.text)}</text></g>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#ffffff"/>${hierarchy}${links}${nodes}</svg>`;
}

// src/server/http.ts
var store = new MapStore();
var port = Number(process.env.PORT ?? 4318);
var host = "127.0.0.1";
var moduleDir = path2.dirname(fileURLToPath(import.meta.url));
var webRoot = path2.resolve(moduleDir, "../../dist/web");
function json(response, status, body2) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body2));
}
async function body(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    const next = Buffer.from(chunk);
    size += next.length;
    if (size > 2e6) throw new Error("Request body exceeds 2 MB.");
    chunks.push(next);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
async function serveStatic(urlPath, response) {
  const requested = urlPath === "/" ? "index.html" : urlPath.replace(/^\//, "");
  const safe = path2.normalize(requested).replace(/^(\.\.(\/|\\|$))+/, "");
  let target = path2.join(webRoot, safe);
  try {
    if (!(await stat(target)).isFile()) target = path2.join(webRoot, "index.html");
  } catch {
    target = path2.join(webRoot, "index.html");
  }
  const extension = path2.extname(target);
  const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml" };
  const content = await readFile2(target);
  response.writeHead(200, { "content-type": types[extension] ?? "application/octet-stream" });
  response.end(content);
}
var server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? host}`);
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments[0] !== "api") return await serveStatic(url.pathname, response);
    if (request.method === "GET" && url.pathname === "/api/health") return json(response, 200, { ok: true, service: "maproom" });
    if (request.method === "GET" && url.pathname === "/api/maps") return json(response, 200, await store.list());
    if (request.method === "POST" && url.pathname === "/api/maps") {
      const input = await body(request);
      return json(response, 201, await store.save(createMap(input.title?.trim() || "Untitled map", input.layout)));
    }
    if (segments[1] === "maps" && segments[2]) {
      const id = decodeURIComponent(segments[2]);
      if (request.method === "GET" && segments.length === 3) return json(response, 200, await store.get(id));
      if (request.method === "PUT" && segments.length === 3) return json(response, 200, await store.save(await body(request)));
      if (request.method === "DELETE" && segments.length === 3) {
        await store.delete(id);
        response.writeHead(204).end();
        return;
      }
      if (request.method === "GET" && segments[3] === "opml") {
        const map = await store.get(id);
        response.writeHead(200, { "content-type": "text/x-opml; charset=utf-8", "content-disposition": `attachment; filename="${id}.opml"` });
        response.end(toOpml(map));
        return;
      }
      if (request.method === "GET" && segments[3] === "svg") {
        const map = await store.get(id);
        response.writeHead(200, { "content-type": "image/svg+xml; charset=utf-8", "content-disposition": `attachment; filename="${id}.svg"` });
        response.end(toSvg(map));
        return;
      }
    }
    return json(response, 404, { error: "Not found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return json(response, message.startsWith("Map not found") ? 404 : 400, { error: message });
  }
});
server.listen(port, host, () => {
  console.error(`Maproom available at http://${host}:${port}`);
});
