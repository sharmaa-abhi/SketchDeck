# SketchDeck

SketchDeck is a local-first visual workspace for diagrams, wireframes, mind maps, and brainstorming. It combines a branded workspace dashboard with the official [`@excalidraw/excalidraw`](https://github.com/excalidraw/excalidraw) React component.

## Features

- Dashboard with recent drawings, search, and creation shortcuts.
- Blank canvas plus templates for flowcharts, mind maps, wireframes, system architecture, brainstorming, user journeys, and project planning.
- Excalidraw infinite canvas with shapes, arrows, freehand drawing, text, images, pan, zoom, grouping, and undo/redo.
- Automatic local persistence in IndexedDB, including drawing metadata, canvas state, and refresh recovery.
- Duplicate and delete actions for saved drawings, with confirmation before deletion.
- Light and dark themes saved in `localStorage`.
- PNG, SVG, and native Excalidraw JSON export.
- Excalidraw JSON import with in-app error feedback for invalid files.
- Responsive layouts for desktop, tablet, and mobile.

## Requirements

- Node.js 18 or newer
- npm

## Getting started

```powershell
cd "C:\Users\ABHI SHARMA\OneDrive\Desktop\Tea\SketchDeck"
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Type-check and create a production build. |
| `npm run lint` | Run Oxlint. |
| `npm run preview` | Preview the production build locally. |

## Project structure

- [`src/App.tsx`](./src/App.tsx) contains the dashboard, editor route, templates, IndexedDB persistence, and import/export actions.
- [`src/App.css`](./src/App.css) contains the SketchDeck design system and responsive layout rules.
- [`src/index.css`](./src/index.css) contains global styles and theme variables.
- [`src/main.tsx`](./src/main.tsx) is the React entry point.

The browser URL provides two frontend routes:

- `/` - drawing dashboard
- `/editor/:id` - editor for a saved drawing

## Data and privacy

SketchDeck is local-only. Drawings are stored in the current browser profile using IndexedDB, and the theme preference is stored in `localStorage`. The project has no backend, account system, cloud sync, or collaboration service.

Clearing browser site data removes locally saved drawings. Use the Excalidraw JSON export to create a portable backup.

## Current limitations

- Drawings are available only in the browser profile where they were created.
- The branded Inspector panel reports the selected object's type, position, size, and opacity; Excalidraw's native property controls remain available for editing.
- Import currently accepts `.json` and `.excalidraw` files in native Excalidraw format.

## Validation

```powershell
npm run build
npm run lint
```

The build should complete successfully. Oxlint may report a React guidance warning for the external IndexedDB synchronization effect; this warning does not block the build.
