import type { MapLink, MindMap, Topic } from './types.js';

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || `map-${Date.now()}`;
}

export function uniqueId(base: string, existing: Set<string>): string {
  const clean = slugify(base);
  if (!existing.has(clean)) return clean;
  let index = 2;
  while (existing.has(`${clean}-${index}`)) index += 1;
  return `${clean}-${index}`;
}

export function createMap(title: string, layout: MindMap['layout'] = 'radial'): MindMap {
  const timestamp = new Date().toISOString();
  const id = slugify(title);
  return {
    id,
    title,
    layout,
    topics: [{
      id: 'root',
      parentId: null,
      text: title,
      notes: '',
      status: 'none',
      style: { color: '#3b82d0' },
      order: 0,
    }],
    links: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function validateMap(map: MindMap): MindMap {
  const ids = new Set(map.topics.map(topic => topic.id));
  if (ids.size !== map.topics.length) throw new Error('Topic IDs must be unique.');
  const roots = map.topics.filter(topic => topic.parentId === null);
  if (roots.length !== 1) throw new Error('A map must contain exactly one root topic.');
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

export function addTopics(map: MindMap, additions: Array<Partial<Topic> & Pick<Topic, 'text'>>): MindMap {
  const ids = new Set(map.topics.map(topic => topic.id));
  const topics = [...map.topics];
  for (const input of additions) {
    const id = input.id && !ids.has(input.id) ? input.id : uniqueId(input.text, ids);
    const parentId = input.parentId === undefined ? map.topics.find(t => t.parentId === null)?.id ?? null : input.parentId;
    topics.push({
      id,
      parentId,
      text: input.text,
      notes: input.notes ?? '',
      status: input.status ?? 'none',
      style: input.style ?? {},
      order: input.order ?? topics.length,
    });
    ids.add(id);
  }
  return validateMap({ ...map, topics, updatedAt: new Date().toISOString() });
}

export function upsertLink(map: MindMap, link: Omit<MapLink, 'id'> & { id?: string }): MindMap {
  const id = link.id ?? uniqueId(`${link.sourceId}-${link.targetId}`, new Set(map.links.map(item => item.id)));
  const next: MapLink = { ...link, id };
  const links = map.links.some(item => item.id === id)
    ? map.links.map(item => item.id === id ? next : item)
    : [...map.links, next];
  return validateMap({ ...map, links, updatedAt: new Date().toISOString() });
}

export function removeTopic(map: MindMap, topicId: string): MindMap {
  const root = map.topics.find(topic => topic.parentId === null);
  if (root?.id === topicId) throw new Error('The root topic cannot be removed.');
  const removed = new Set<string>([topicId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const topic of map.topics) {
      if (topic.parentId && removed.has(topic.parentId) && !removed.has(topic.id)) {
        removed.add(topic.id);
        changed = true;
      }
    }
  }
  return validateMap({
    ...map,
    topics: map.topics.filter(topic => !removed.has(topic.id)),
    links: map.links.filter(link => !removed.has(link.sourceId) && !removed.has(link.targetId)),
    updatedAt: new Date().toISOString(),
  });
}
