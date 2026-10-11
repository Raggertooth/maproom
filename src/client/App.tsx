import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2, ChevronDown, CirclePlus, Download, FilePlus2, Focus,
  GitBranch, LayoutTemplate, Link2, Minus, Plus, Redo2, Search, Undo2,
} from 'lucide-react';
import { api } from './api';
import { MapCanvas } from './MapCanvas';
import { Outline } from './Outline';
import { Inspector } from './Inspector';
import { addTopics, removeTopic, upsertLink } from '../shared/map-ops';
import { toSvg } from '../shared/exporters';
import type { MapLayout, MindMap } from '../shared/types';

const clone = (map: MindMap): MindMap => structuredClone(map);

function download(content: BlobPart, type: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [maps, setMaps] = useState<MindMap[]>([]);
  const [map, setMap] = useState<MindMap | null>(null);
  const [selectedId, setSelectedId] = useState('root');
  const [zoom, setZoom] = useState(100);
  const [search, setSearch] = useState('');
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [linkMode, setLinkMode] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const history = useRef<{ past: MindMap[]; future: MindMap[] }>({ past: [], future: [] });
  const saveTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    api.listMaps().then(items => {
      setMaps(items);
      if (items[0]) {
        setMap(items[0]);
        setSelectedId(items[0].topics.find(topic => topic.parentId === null)?.id ?? 'root');
      }
    }).catch(() => setSaveState('error'));
  }, []);

  useEffect(() => {
    if (!map) return;
    window.clearTimeout(saveTimer.current);
    setSaveState('saving');
    saveTimer.current = window.setTimeout(() => {
      api.saveMap(map).then(saved => {
        setMaps(items => items.map(item => item.id === saved.id ? saved : item));
        setSaveState('saved');
      }).catch(() => setSaveState('error'));
    }, 450);
    return () => window.clearTimeout(saveTimer.current);
  }, [map]);

  const commit = (next: MindMap) => {
    if (!map) return;
    history.current.past.push(clone(map));
    history.current.future = [];
    setMap(next);
  };

  const undo = () => {
    if (!map) return;
    const previous = history.current.past.pop();
    if (!previous) return;
    history.current.future.push(clone(map));
    setMap(previous);
  };

  const redo = () => {
    if (!map) return;
    const next = history.current.future.pop();
    if (!next) return;
    history.current.past.push(clone(map));
    setMap(next);
  };

  const chooseTopic = (id: string) => {
    if (!map) return;
    if (linkMode && linkMode !== id) {
      commit(upsertLink(map, { sourceId: linkMode, targetId: id, label: 'Related' }));
      setLinkMode(null);
    }
    setSelectedId(id);
    setInspectorOpen(true);
  };

  const addTopic = () => {
    if (!map) return;
    const next = addTopics(map, [{ parentId: selectedId, text: 'New topic', style: { color: map.topics.find(item => item.id === selectedId)?.style.color } }]);
    const added = next.topics[next.topics.length - 1];
    commit(next);
    setSelectedId(added.id);
  };

  const createNew = async () => {
    const title = window.prompt('Name this map', 'Untitled map')?.trim();
    if (!title) return;
    const created = await api.createMap(title);
    setMaps(items => [...items, created]);
    setMap(created);
    setSelectedId('root');
    history.current = { past: [], future: [] };
  };

  const selectMap = (next: MindMap) => {
    setMap(next);
    setSelectedId(next.topics.find(topic => topic.parentId === null)?.id ?? 'root');
    history.current = { past: [], future: [] };
  };

  const exportPng = () => {
    if (!map) return;
    const svg = toSvg(map);
    const image = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1400; canvas.height = 900;
      canvas.getContext('2d')!.drawImage(image, 0, 0);
      canvas.toBlob(blob => blob && download(blob, 'image/png', `${map.id}.png`));
      URL.revokeObjectURL(url);
    };
    image.src = url;
  };

  const filteredMaps = useMemo(() => maps.filter(item => item.title.toLowerCase().includes(search.toLowerCase())), [maps, search]);
  if (!map) return <div className="loading-screen">Opening Maproom…</div>;

  return (
    <main className={`app-shell${inspectorOpen ? '' : ' inspector-closed'}`}>
      <header className="toolbar">
        <div className="brand"><span className="brand-mark"><GitBranch size={18} /></span><strong>Maproom</strong></div>
        <nav className="toolbar-actions" aria-label="Map controls">
          <button onClick={createNew}><FilePlus2 /><span>New map</span></button>
          <span className="toolbar-divider" />
          <button onClick={undo} disabled={!history.current.past.length}><Undo2 /><span>Undo</span></button>
          <button onClick={redo} disabled={!history.current.future.length}><Redo2 /><span>Redo</span></button>
          <span className="toolbar-divider" />
          <button onClick={addTopic}><CirclePlus /><span>Add topic</span></button>
          <button className={linkMode ? 'active' : ''} onClick={() => setLinkMode(linkMode ? null : selectedId)}><Link2 /><span>{linkMode ? 'Choose target' : 'Add link'}</span></button>
          <label className="toolbar-select"><LayoutTemplate /><select value={map.layout} onChange={event => commit({ ...map, layout: event.target.value as MapLayout })}><option value="radial">Radial</option><option value="right">Right</option><option value="left">Left</option><option value="org-chart">Org chart</option></select></label>
          <button onClick={() => setZoom(100)}><Focus /><span>Fit</span></button>
          <div className="export-wrap">
            <button onClick={() => setExportOpen(value => !value)}><Download /><span>Export</span><ChevronDown size={13} /></button>
            {exportOpen && <div className="export-menu">
              <a href={`/api/maps/${map.id}/opml`} download>OPML outline</a>
              <a href={`/api/maps/${map.id}/svg`} download>SVG image</a>
              <button onClick={exportPng}>PNG image</button>
              <button onClick={() => window.print()}>Print / PDF</button>
            </div>}
          </div>
        </nav>
        <label className="search-box"><Search size={16} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search maps…" /></label>
      </header>

      <aside className="left-rail">
        <div className="rail-title"><h2>Maps</h2><button className="icon-button" onClick={createNew} aria-label="Create map"><Plus size={18} /></button></div>
        <div className="map-list">
          {filteredMaps.map(item => <button key={item.id} className={item.id === map.id ? 'active' : ''} onClick={() => selectMap(item)}><GitBranch size={15} /><span>{item.title}</span></button>)}
        </div>
        <div className="rail-separator" />
        <h2 className="outline-title">Outline</h2>
        <Outline map={map} selectedId={selectedId} onSelect={chooseTopic} />
      </aside>

      <section className="canvas-region">
        {linkMode && <div className="mode-banner">Select another topic to create a cross-link. <button onClick={() => setLinkMode(null)}>Cancel</button></div>}
        <MapCanvas map={map} selectedId={selectedId} onSelect={chooseTopic} zoom={zoom} />
      </section>

      {inspectorOpen && <Inspector
        map={map}
        selectedId={selectedId}
        onChange={commit}
        onDelete={() => {
          const next = removeTopic(map, selectedId);
          commit(next);
          setSelectedId(next.topics.find(topic => topic.parentId === null)?.id ?? 'root');
        }}
        onClose={() => setInspectorOpen(false)}
      />}

      <footer className="statusbar">
        <span className={`save-state ${saveState}`}><CheckCircle2 size={15} />{saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Save failed' : 'Saved locally'}</span>
        <span>{map.topics.length} topics · {map.links.length} cross-link{map.links.length === 1 ? '' : 's'}</span>
        <div className="zoom-control"><button onClick={() => setZoom(value => Math.max(60, value - 10))}><Minus size={15} /></button><span>{zoom}%</span><button onClick={() => setZoom(value => Math.min(140, value + 10))}><Plus size={15} /></button></div>
      </footer>
    </main>
  );
}
