# knotly Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-17

## Active Technologies
- TypeScript 5.x (with strict mode enabled) + JavaScript ES2020+ + React 18, Vite 5.x, rough.js ^4.6.6, Tailwind CSS 3.x (001-handdrawn-canvas-prototype)
- TypeScript 5.x with strict mode enabled, React 18 + Zustand (state management), @use-gesture/react (touch gestures), rough.js ^4.6.6 (hand-drawn rendering), uuid (unique IDs), Tailwind CSS 3.x (styling) (002-node-crud-gestures)
- Client-side memory only (Zustand store without persistence middleware) - data lost on page refresh (002-node-crud-gestures)
- TypeScript 5.x with strict mode enabled + React 18, Zustand 4.x, @use-gesture/react, Tailwind CSS 4.x, rough.js ^4.6.6, js-yaml ^4.1.0 (003-markdown-file-tokens)
- Local file system via File System Access API (Chromium) + fallback to file input/Blob download (Safari/Firefox); browser localStorage for recent files list (max 5 entries) (003-markdown-file-tokens)

## Project Structure
```
src/
tests/
```

## Commands
npm test && npm run lint

## Code Style
TypeScript 5.x (with strict mode enabled) + JavaScript ES2020+: Follow standard conventions

## Recent Changes
- 003-markdown-file-tokens: Added TypeScript 5.x with strict mode enabled + React 18, Zustand 4.x, @use-gesture/react, Tailwind CSS 4.x, rough.js ^4.6.6, js-yaml ^4.1.0
- 002-node-crud-gestures: Added TypeScript 5.x with strict mode enabled, React 18 + Zustand (state management), @use-gesture/react (touch gestures), rough.js ^4.6.6 (hand-drawn rendering), uuid (unique IDs), Tailwind CSS 3.x (styling)
- 001-handdrawn-canvas-prototype: Added TypeScript 5.x (with strict mode enabled) + JavaScript ES2020+ + React 18, Vite 5.x, rough.js ^4.6.6, Tailwind CSS 3.x

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
