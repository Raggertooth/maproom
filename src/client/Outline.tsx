import { ChevronDown, Circle } from 'lucide-react';
import type { MindMap, Topic } from '../shared/types';

interface Props {
  map: MindMap;
  selectedId: string;
  onSelect: (id: string) => void;
}

function TopicRow({ topic, map, depth, selectedId, onSelect }: { topic: Topic; map: MindMap; depth: number; selectedId: string; onSelect: (id: string) => void }) {
  const children = map.topics.filter(item => item.parentId === topic.id).sort((a, b) => a.order - b.order);
  return (
    <>
      <button className={`outline-row${selectedId === topic.id ? ' active' : ''}`} style={{ paddingLeft: 10 + depth * 18 }} onClick={() => onSelect(topic.id)}>
        {children.length ? <ChevronDown size={13} /> : <span className="outline-spacer" />}
        <Circle size={9} fill={topic.style.color ?? '#8792a0'} color={topic.style.color ?? '#8792a0'} />
        <span>{topic.text}</span>
      </button>
      {children.map(child => <TopicRow key={child.id} topic={child} map={map} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />)}
    </>
  );
}

export function Outline(props: Props) {
  const root = props.map.topics.find(topic => topic.parentId === null);
  return <div className="outline-tree">{root && <TopicRow topic={root} map={props.map} depth={0} selectedId={props.selectedId} onSelect={props.onSelect} />}</div>;
}
