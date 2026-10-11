import { Trash2, X } from 'lucide-react';
import type { MindMap, TopicStatus } from '../shared/types';

const colors = ['#77a77d', '#e77c3f', '#4d8cc9', '#9a55a5', '#697787'];

interface Props {
  map: MindMap;
  selectedId: string;
  onChange: (map: MindMap) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function Inspector({ map, selectedId, onChange, onDelete, onClose }: Props) {
  const topic = map.topics.find(item => item.id === selectedId);
  if (!topic) return <aside className="inspector empty">Select a topic to edit it.</aside>;
  const update = (changes: Partial<typeof topic>) => onChange({
    ...map,
    topics: map.topics.map(item => item.id === topic.id ? { ...item, ...changes } : item),
  });
  return (
    <aside className="inspector">
      <div className="panel-heading"><h2>Topic</h2><button className="icon-button" onClick={onClose} aria-label="Close inspector"><X size={18} /></button></div>
      <label>Title<input value={topic.text} onChange={event => update({ text: event.target.value })} /></label>
      <label>Notes<textarea value={topic.notes} rows={5} placeholder="Add context for people and agents…" onChange={event => update({ notes: event.target.value })} /></label>
      <fieldset>
        <legend>Color</legend>
        <div className="color-row">
          {colors.map(color => <button key={color} className={`color-swatch${topic.style.color === color ? ' selected' : ''}`} style={{ background: color }} onClick={() => update({ style: { ...topic.style, color } })} aria-label={`Set color ${color}`} />)}
        </div>
      </fieldset>
      <label>Status
        <select value={topic.status} onChange={event => update({ status: event.target.value as TopicStatus })}>
          <option value="none">No status</option><option value="planned">Planned</option><option value="in-progress">In progress</option><option value="done">Done</option><option value="blocked">Blocked</option>
        </select>
      </label>
      <label>Parent
        <select value={topic.parentId ?? ''} disabled={topic.parentId === null} onChange={event => update({ parentId: event.target.value || null })}>
          <option value="">Root</option>
          {map.topics.filter(item => item.id !== topic.id).map(item => <option key={item.id} value={item.id}>{item.text}</option>)}
        </select>
      </label>
      <div className="inspector-section"><span>Cross-links</span><strong>{map.links.filter(link => link.sourceId === topic.id || link.targetId === topic.id).length}</strong></div>
      {topic.parentId !== null && <button className="danger-button" onClick={onDelete}><Trash2 size={15} /> Delete branch</button>}
    </aside>
  );
}
