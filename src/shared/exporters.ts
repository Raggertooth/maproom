import { connectionPath, layoutMap } from './layout.js';
import type { MindMap, Topic } from './types.js';

const escapeXml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

function opmlTopic(topic: Topic, map: MindMap, depth: number): string {
  const children = map.topics.filter(item => item.parentId === topic.id).sort((a, b) => a.order - b.order);
  const attrs = [
    `text="${escapeXml(topic.text)}"`,
    topic.notes ? `_note="${escapeXml(topic.notes)}"` : '',
    topic.status !== 'none' ? `_status="${topic.status}"` : '',
  ].filter(Boolean).join(' ');
  const indent = '  '.repeat(depth);
  if (!children.length) return `${indent}<outline ${attrs}/>`;
  return `${indent}<outline ${attrs}>\n${children.map(child => opmlTopic(child, map, depth + 1)).join('\n')}\n${indent}</outline>`;
}

export function toOpml(map: MindMap): string {
  const root = map.topics.find(topic => topic.parentId === null);
  if (!root) throw new Error('Map has no root topic.');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<opml version="2.0">\n  <head>\n    <title>${escapeXml(map.title)}</title>\n  </head>\n  <body>\n${opmlTopic(root, map, 2)}\n  </body>\n</opml>\n`;
}

export function toSvg(map: MindMap, width = 1400, height = 900): string {
  const topics = layoutMap(map, width, height);
  const byId = new Map(topics.map(topic => [topic.id, topic]));
  const hierarchy = topics.filter(topic => topic.parentId).map(topic => {
    const parent = byId.get(topic.parentId!);
    if (!parent) return '';
    return `<path d="${connectionPath(parent, topic)}" fill="none" stroke="${topic.style.color ?? '#8a97a5'}" stroke-width="3" stroke-linecap="round"/>`;
  }).join('');
  const links = map.links.map(link => {
    const source = byId.get(link.sourceId);
    const target = byId.get(link.targetId);
    if (!source || !target) return '';
    return `<path d="${connectionPath(source, target)}" fill="none" stroke="#8f4c99" stroke-width="2" stroke-dasharray="6 6"/>`;
  }).join('');
  const nodes = topics.map(topic => {
    const color = topic.style.color ?? '#64748b';
    const fill = topic.depth === 0 ? '#edf5ff' : `${color}18`;
    const x = topic.x - topic.width / 2;
    const y = topic.y - topic.height / 2;
    const fontSize = topic.depth === 0 ? 22 : topic.depth === 1 ? 17 : 14;
    return `<g><rect x="${x}" y="${y}" width="${topic.width}" height="${topic.height}" rx="14" fill="${fill}" stroke="${color}" stroke-width="${topic.depth === 0 ? 3 : 1.5}"/><text x="${topic.x}" y="${topic.y + fontSize * .35}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="${fontSize}" font-weight="${topic.depth < 2 ? 650 : 500}" text-anchor="middle" fill="#172033">${escapeXml(topic.text)}</text></g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#ffffff"/>${hierarchy}${links}${nodes}</svg>`;
}
