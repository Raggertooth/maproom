# Data format and exports

## Map model

A map contains a title, a visual layout, timestamps, an ordered set of topics, and optional cross-links. Each topic has an ID, parent ID, text, notes, status, style, and sibling order. Each cross-link connects two topic IDs and may have a label.

```json
{
  "id": "service-architecture",
  "title": "Service architecture",
  "layout": "radial",
  "topics": [
    {
      "id": "root",
      "parentId": null,
      "text": "Service architecture",
      "notes": "Context and assumptions go here.",
      "status": "none",
      "style": {},
      "order": 0
    }
  ],
  "links": [],
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

Supported layouts are `radial`, `right`, `left`, and `org-chart`. Topic statuses are `none`, `planned`, `in-progress`, `done`, and `blocked`.

## Storage

The default store is `data/maps.json`, relative to the process working directory. Set `MAPROOM_DATA_PATH` to an absolute file path to select a stable shared location for the browser server and MCP process. The file is written through a temporary file and rename. The file is plain JSON; back it up if maps matter to you.

Do not commit personal maps or notes to a public repository. The store path is ignored by Git by default.

## Export formats

- **OPML:** portable hierarchical outline. Topic text, notes, and non-empty status are emitted. Visual layout, topic colours, and cross-links are not part of this export.
- **SVG:** standalone generated image containing positioned topics and hierarchy/cross-link lines.
- **PNG:** rendered in the browser from the SVG output.
- **PDF:** use the browser's print dialog.

The MCP `export_map` tool currently returns OPML or SVG as text content. PNG and PDF are available from the browser editor.
