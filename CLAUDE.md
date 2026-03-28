# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start development server (proxies /api to http://localhost:8000 by default)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

No linting or test scripts are configured.

## Environment

Create a `.env` file to override the backend API URL:

```
VITE_API_URL=http://localhost:8000
```

In production (Vercel), `/api` rewrites to `http://13.126.130.56:8001`.

## Architecture

**NexVec** is a React 18 + Vite SPA for a RAG (Retrieval-Augmented Generation) studio — specifically a UI for uploading PDF resumes into a vector database and querying them with semantic search.

**Stack:** React 18, Vite, TailwindCSS (with custom animations), lucide-react icons, react-dropzone. No TypeScript, no router library, no global state manager.

### Routing

Navigation is tab-based, implemented entirely in `App.jsx` via a `activeTab` integer (0=Ingest, 1=Documents, 2=Query). There is no React Router.

### Component structure

```
src/
├── App.jsx              # Root layout: sidebar, header, tab switching, global stats
├── components/
│   ├── Header.jsx       # Top branding bar
│   ├── IngestPage.jsx   # PDF upload + embedding model selection + progress tracking
│   ├── DocumentsPage.jsx# List/delete ingested documents
│   └── QueryPage.jsx    # Semantic search with configurable top-k results
└── api/
    ├── nexvec.js        # All fetch calls: ingestResume, retrieveCandidates, listDocuments, deleteDocument
    └── utils.js         # parseKBList helper
```

### API layer

All backend calls go through `src/api/nexvec.js`. The Vite dev server proxies `/api/*` to `VITE_API_URL`. Key endpoints:

| Function | Method | Endpoint |
|---|---|---|
| `ingestResume` | POST | `/api/ingest` |
| `retrieveCandidates` | POST | `/api/retrieve` |
| `listDocuments` | GET | `/api/documents` |
| `deleteDocument` | DELETE | `/api/documents/{filename}` |

### State management

All state is local to each page component via `useState`/`useEffect`. `App.jsx` holds `activeTab` and `stats` (document count), passing a `refreshStats` callback down to pages that mutate documents.

### Styling

Custom design tokens live in `tailwind.config.js` (custom animations: `pulse-slow`, `spin-slow`, `fade-in`, `slide-up`) and `src/index.css`. Fonts are DM Sans (body) and Playfair Display (headlines), loaded via Google Fonts in `index.html`.
