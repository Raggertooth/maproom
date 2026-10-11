import { describe, expect, it } from 'vitest';
import { addTopics, createMap, removeTopic, upsertLink } from '../src/shared/map-ops.js';
import { toOpml, toSvg } from '../src/shared/exporters.js';

describe('Maproom shared model', () => {
  it('creates a map and adds a nested topic', () => {
    const map = createMap('Customer journey');
    const next = addTopics(map, [{ id: 'discover', text: 'Discover' }, { id: 'search', parentId: 'discover', text: 'Search', notes: 'Observe query intent' }]);
    expect(next.topics).toHaveLength(3);
    expect(next.topics.find(topic => topic.id === 'search')?.parentId).toBe('discover');
  });

  it('removes a complete branch and its links', () => {
    let map = addTopics(createMap('Plan'), [{ id: 'a', text: 'A' }, { id: 'a-1', parentId: 'a', text: 'A1' }, { id: 'b', text: 'B' }]);
    map = upsertLink(map, { sourceId: 'a-1', targetId: 'b', label: 'Depends on' });
    const next = removeTopic(map, 'a');
    expect(next.topics.map(topic => topic.id)).toEqual(['root', 'b']);
    expect(next.links).toHaveLength(0);
  });

  it('exports a portable OPML outline', () => {
    const map = addTopics(createMap('Roadmap'), [{ id: 'mvp', text: 'MVP', notes: 'Ship the smallest useful version', status: 'planned' }]);
    const opml = toOpml(map);
    expect(opml).toContain('<opml version="2.0">');
    expect(opml).toContain('text="Roadmap"');
    expect(opml).toContain('_note="Ship the smallest useful version"');
    expect(opml).toContain('_status="planned"');
  });

  it('renders a standalone SVG with topics and connections', () => {
    const map = addTopics(createMap('Strategy'), [{ id: 'research', text: 'Research', style: { color: '#77a77d' } }]);
    const svg = toSvg(map);
    expect(svg).toContain('<svg');
    expect(svg).toContain('Strategy');
    expect(svg).toContain('Research');
    expect(svg).toContain('<path');
  });
});
