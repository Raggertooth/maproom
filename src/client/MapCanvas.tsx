import { useMemo } from 'react';
import { connectionPath, layoutMap } from '../shared/layout';
import type { MindMap, PositionedTopic } from '../shared/types';

interface Props {
  map: MindMap;
  selectedId: string;
  onSelect: (id: string) => void;
  zoom: number;
}

function nodeFill(topic: PositionedTopic): string {
  const color = topic.style.color ?? '#64748b';
  return topic.depth === 0 ? '#edf5ff' : `${color}18`;
}

export function MapCanvas({ map, selectedId, onSelect, zoom }: Props) {
  const topics = useMemo(() => layoutMap(map, 1000, 700), [map]);
  const byId = useMemo(() => new Map(topics.map(topic => [topic.id, topic])), [topics]);

  return (
    <div className="canvas-viewport" aria-label="Mind map canvas">
      <svg className="map-canvas" viewBox="0 0 1000 700" role="img" aria-label={map.title} style={{ transform: `scale(${zoom / 100})` }}>
        <g className="hierarchy-lines">
          {topics.filter(topic => topic.parentId).map(topic => {
            const parent = byId.get(topic.parentId!);
            if (!parent) return null;
            return <path key={topic.id} d={connectionPath(parent, topic)} stroke={topic.style.color ?? '#94a3b8'} />;
          })}
        </g>
        <g className="cross-links">
          {map.links.map(link => {
            const source = byId.get(link.sourceId);
            const target = byId.get(link.targetId);
            if (!source || !target) return null;
            const midpointX = (source.x + target.x) / 2;
            const midpointY = (source.y + target.y) / 2;
            return (
              <g key={link.id}>
                <path d={connectionPath(source, target)} />
                {link.label && <text x={midpointX} y={midpointY - 8}>{link.label}</text>}
              </g>
            );
          })}
        </g>
        <g className="topic-nodes">
          {topics.map(topic => {
            const selected = topic.id === selectedId;
            const color = topic.style.color ?? '#64748b';
            const splitAt = topic.text.lastIndexOf(' ', 17);
            const lines = topic.text.length > 18 && topic.depth === 0 && splitAt > 0
              ? [topic.text.slice(0, splitAt), topic.text.slice(splitAt + 1)]
              : [topic.text];
            return (
              <g
                key={topic.id}
                className={`topic-node depth-${topic.depth}${selected ? ' selected' : ''}`}
                transform={`translate(${topic.x - topic.width / 2} ${topic.y - topic.height / 2})`}
                onClick={() => onSelect(topic.id)}
                role="button"
                tabIndex={0}
                onKeyDown={event => event.key === 'Enter' && onSelect(topic.id)}
              >
                <rect width={topic.width} height={topic.height} rx={topic.depth === 0 ? 18 : 13} fill={nodeFill(topic)} stroke={color} />
                {topic.status !== 'none' && topic.depth > 0 && <circle cx="13" cy="13" r="4" fill={topic.status === 'done' ? '#2f8f62' : topic.status === 'blocked' ? '#c65252' : color} />}
                <text x={topic.width / 2} y={topic.height / 2 - ((lines.length - 1) * 12)}>
                  {lines.map((line, index) => <tspan key={line} x={topic.width / 2} dy={index === 0 ? '0.35em' : '1.2em'}>{line}</tspan>)}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
