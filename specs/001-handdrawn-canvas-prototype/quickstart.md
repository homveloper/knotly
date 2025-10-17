# Quickstart Guide: Handdrawn Canvas Prototype

**Feature**: 001-handdrawn-canvas-prototype
**Date**: 2025-10-17
**Target Audience**: Developers setting up the prototype for the first time

## Overview

This guide walks you through setting up and running the hand-drawn canvas prototype from scratch. You'll initialize a React + Vite + TypeScript project, install dependencies, configure tools, and run the development server to view the prototype.

**Time to Complete**: ~15 minutes

**Prerequisites**:
- Node.js 18+ and pnpm installed
- Modern browser (Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+)
- Code editor (VS Code recommended for TypeScript support)

---

## Step 1: Project Initialization

Create a new React + TypeScript project using Vite:

```bash
# Create project from Vite template
pnpm create vite knotly-frontend --template react-ts

# Navigate to project directory
cd knotly-frontend

# Install base dependencies
pnpm install
```

**What this does**:
- Creates a new directory `knotly-frontend/` with React + TypeScript + Vite setup
- Installs React 18, TypeScript 5.x, and Vite 5.x with default configuration
- Generates `package.json`, `tsconfig.json`, `vite.config.ts`, and basic source files

**Verify**: Run `pnpm dev` and visit http://localhost:5173 to see the default Vite + React page.

---

## Step 2: Install Project Dependencies

Install rough.js for hand-drawn rendering and Tailwind CSS for styling:

```bash
# Install rough.js library
pnpm add roughjs

# Install rough.js TypeScript types
pnpm add -D @types/roughjs

# Install Tailwind CSS and PostCSS
pnpm add -D tailwindcss postcss autoprefixer

# Initialize Tailwind configuration
npx tailwindcss init -p
```

**What this does**:
- `roughjs`: Main library for hand-drawn SVG rendering
- `@types/roughjs`: TypeScript type definitions for rough.js API
- `tailwindcss`, `postcss`, `autoprefixer`: Utility-first CSS framework and build tools
- `tailwindcss init -p`: Generates `tailwind.config.js` and `postcss.config.js`

**Verify**: Check that `node_modules/roughjs/` and `node_modules/tailwindcss/` exist.

---

## Step 3: Configure TypeScript Strict Mode

Open `tsconfig.json` and ensure strict mode is enabled (per Constitution Principle V):

```json
{
  "compilerOptions": {
    "strict": true,  // ← Ensure this is present and true
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Critical setting**: `"strict": true` enables all strict type-checking options, including null safety.

**Verify**: The default Vite template should already have this enabled. Confirm `"strict": true` is present.

---

## Step 4: Configure Tailwind CSS

Edit `tailwind.config.js` to scan your source files:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**What this does**: Tells Tailwind to scan `index.html` and all files in `src/` for utility class usage.

Then, replace the contents of `src/index.css` with Tailwind directives:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**What this does**: Imports Tailwind's base styles, component classes, and utility classes.

**Verify**: The default Vite template includes some CSS in `index.css` and `App.css`. You can remove `App.css` entirely since we'll use Tailwind utilities instead.

---

## Step 5: Add Google Fonts for Nanum Pen Script

Open `index.html` and add Google Fonts preconnect links in the `<head>` section:

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Knotly - Handdrawn Canvas Prototype</title>

    <!-- Google Fonts: Preconnect for performance -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

    <!-- Google Fonts: Nanum Pen Script with display=swap -->
    <link href="https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**What this does**:
- `preconnect` links establish early connections to Google Fonts servers, reducing latency
- `display=swap` prevents FOUT (Flash of Unstyled Text) by showing fallback font until custom font loads
- Loads Nanum Pen Script font for handwritten text rendering

**Performance Note**: Preconnect saves ~100ms on DNS + TLS handshake, helping meet the <500ms font load requirement (SC-005).

---

## Step 6: Create Project Structure

Create the necessary directories and type definitions:

```bash
# Create directories
mkdir -p src/components
mkdir -p src/types

# Create type definition file
touch src/types/node.ts
```

Copy the type definitions from `specs/001-handdrawn-canvas-prototype/contracts/node-structure.ts` into `src/types/node.ts`:

```bash
# From project root
cp specs/001-handdrawn-canvas-prototype/contracts/node-structure.ts src/types/node.ts
```

**What this does**: Sets up the project structure with components and types folders, and imports the Node entity type contracts.

---

## Step 7: Create Canvas Component

Create `src/components/Canvas.tsx` with the following content:

```typescript
import { useRef, useEffect } from 'react';
import rough from 'roughjs';
import { PROTOTYPE_NODE, RENDERING_CONFIG } from '../types/node';

export const Canvas: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Early return if SVG ref is null (Constitution Principle I)
    if (!svgRef.current) return;

    // Create rough.js SVG generator
    const rc = rough.svg(svgRef.current);

    // Render hand-drawn circle
    const circle = rc.circle(
      PROTOTYPE_NODE.position.x,
      PROTOTYPE_NODE.position.y,
      RENDERING_CONFIG.CIRCLE_DIAMETER,
      {
        roughness: RENDERING_CONFIG.ROUGHNESS,
        fill: PROTOTYPE_NODE.style.backgroundColor,
        stroke: PROTOTYPE_NODE.style.strokeColor,
        strokeWidth: PROTOTYPE_NODE.style.strokeWidth,
        fillStyle: RENDERING_CONFIG.FILL_STYLE,
      }
    );

    // Append circle to SVG
    svgRef.current.appendChild(circle);
  }, []); // Empty deps = run once on mount

  return (
    <svg
      ref={svgRef}
      width={RENDERING_CONFIG.CANVAS_WIDTH}
      height={RENDERING_CONFIG.CANVAS_HEIGHT}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Canvas background */}
      <rect
        x="0"
        y="0"
        width={RENDERING_CONFIG.CANVAS_WIDTH}
        height={RENDERING_CONFIG.CANVAS_HEIGHT}
        fill={RENDERING_CONFIG.CANVAS_BACKGROUND}
      />

      {/* Text content */}
      <text
        x={PROTOTYPE_NODE.position.x}
        y={PROTOTYPE_NODE.position.y + RENDERING_CONFIG.TEXT_Y_OFFSET}
        textAnchor="middle"
        fontFamily={RENDERING_CONFIG.FONT_FAMILY}
        fontSize={RENDERING_CONFIG.FONT_SIZE}
        fill={RENDERING_CONFIG.TEXT_COLOR}
        style={{ lineHeight: RENDERING_CONFIG.LINE_SPACING }}
      >
        {PROTOTYPE_NODE.content}
      </text>
    </svg>
  );
};
```

**What this does**:
- Uses `useRef` to get a reference to the SVG DOM element
- Uses `useEffect` to run rendering logic once on component mount
- Creates a rough.js SVG generator and renders a hand-drawn circle
- Renders SVG text with Nanum Pen Script font

---

## Step 8: Update App Component

Replace the contents of `src/App.tsx`:

```typescript
import { Canvas } from './components/Canvas';

function App() {
  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <Canvas />
    </div>
  );
}

export default App;
```

**What this does**:
- Imports the Canvas component
- Uses Tailwind utilities to center the canvas vertically and horizontally
- Sets a light gray background (`bg-gray-50`) for the page

**Note**: You can delete `src/App.css` if it exists, since we're using Tailwind instead.

---

## Step 9: Clean Up Default Styles

Ensure `src/index.css` only contains Tailwind directives:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Remove any default Vite styles or custom CSS. The Tailwind directives should be the only content.

---

## Step 10: Run Development Server

Start the Vite development server:

```bash
pnpm dev
```

**Expected output**:
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

Open your browser and navigate to http://localhost:5173.

**What you should see**:
- A light gray page background
- A yellow circle node in the center with a hand-drawn (slightly imperfect) outline
- Korean text "손글씨 노트 프로토타입" inside the circle, rendered in Nanum Pen Script font
- Text should appear handwritten and slightly informal

---

## Step 11: Validate Success Criteria

### Visual Validation

1. **Hand-drawn appearance** (SC-002):
   - Look closely at the circle outline - it should have slight waviness/trembling
   - The outline should NOT be a perfect circle
   - Compare mentally to tools like MindMeister or Miro (which use perfect geometric shapes)

2. **Font rendering** (SC-001):
   - Text should appear in handwritten style (Nanum Pen Script)
   - Text should be legible and clear
   - No font loading flash should occur (thanks to display=swap)

3. **Color contrast** (SC-006):
   - Text (#333) on yellow background (#FFE082) should be easily readable
   - Contrast ratio is 5.89:1 (exceeds WCAG AA requirement of 4.5:1)

### Performance Validation

Open Chrome DevTools (F12 or Cmd+Option+I on Mac):

1. **Performance Tab** (SC-004):
   ```
   1. Click "Performance" tab
   2. Click the record button (⚫)
   3. Refresh the page
   4. Stop recording after page loads
   5. Check FPS graph - should show consistent 60fps
   ```

2. **Network Tab** (SC-005):
   ```
   1. Click "Network" tab
   2. Refresh the page
   3. Find "Nanum+Pen+Script" in the list
   4. Check "Time" column - should be <500ms
   5. Total page load should be <1s
   ```

3. **Lighthouse** (SC-003):
   ```
   1. Click "Lighthouse" tab
   2. Select "Performance" category
   3. Click "Analyze page load"
   4. Check First Contentful Paint - should be <1s
   5. Check Performance score - should be 90+
   ```

4. **Zoom Test** (SC-007):
   ```
   1. Zoom in to 200% (Ctrl/Cmd + +)
   2. Text and circle should remain sharp (SVG advantage)
   3. Zoom out to 50% (Ctrl/Cmd + -)
   4. Still sharp and clear
   ```

---

## Troubleshooting

### Issue: Font doesn't load or looks different

**Symptoms**: Text appears in system font (not handwritten), or browser console shows font loading error.

**Solutions**:
1. Check browser Network tab for font request - should return 200 OK
2. Verify Google Fonts links are in `<head>` of `index.html`
3. Check browser console for CORS errors
4. Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: Circle is not visible or missing

**Symptoms**: Only background and text appear, no yellow circle.

**Solutions**:
1. Check browser console for JavaScript errors
2. Verify rough.js is installed: `pnpm list roughjs`
3. Check that Canvas.tsx imports are correct
4. Inspect SVG element in DevTools - should contain rough.js path elements

### Issue: TypeScript errors about null/undefined

**Symptoms**: IDE or terminal shows TS errors like "Object is possibly null".

**Solutions**:
1. Verify `"strict": true` is in tsconfig.json
2. Ensure early return is present: `if (!svgRef.current) return;`
3. Check that all types are imported: `SVGSVGElement`, `React.FC`

### Issue: Tailwind classes don't work

**Symptoms**: Layout doesn't center, or `bg-gray-50` doesn't apply.

**Solutions**:
1. Verify `tailwind.config.js` has correct content paths
2. Check that `@tailwind` directives are in `src/index.css`
3. Restart dev server after Tailwind configuration changes

### Issue: Performance is poor (<60fps)

**Symptoms**: DevTools Performance tab shows frame drops or jank.

**Solutions**:
1. Close other browser tabs to free resources
2. Check if browser extensions are interfering (test in incognito mode)
3. Ensure no infinite loops in useEffect (check dependencies array is `[]`)
4. For a single static node, 60fps should be trivial - investigate system resources

---

## Next Steps

### For Team Validation (SC-001, SC-002)

Share http://localhost:5173 with team members and collect feedback:

1. Ask: "Does this feel different from tools like MindMeister or Miro?"
2. Ask: "What adjectives would you use? Warm? Friendly? Handwritten?"
3. Collect responses from at least 5 team members
4. Success: At least 3/5 use terms like "warm", "friendly", "hand-drawn"
5. Success: At least 4/5 say it feels "different from existing tools"

### For Development (Next Milestone)

If the prototype is approved:

1. Review `specs/001-handdrawn-canvas-prototype/spec.md` for full requirements
2. Run `/speckit.tasks` to generate implementation task list
3. Set up testing infrastructure (Vitest, React Testing Library, Playwright)
4. Begin implementing interactive features (drag, edit, multiple nodes)

### For Deployment (Optional)

Deploy to static hosting for remote team members:

```bash
# Build production bundle
pnpm build

# Preview production build locally
pnpm preview

# Deploy to Vercel/Netlify/GitHub Pages
# (follow platform-specific instructions)
```

---

## Reference Links

- **Feature Spec**: [spec.md](./spec.md)
- **Implementation Plan**: [plan.md](./plan.md)
- **Data Model**: [data-model.md](./data-model.md)
- **Type Contracts**: [contracts/node-structure.ts](./contracts/node-structure.ts)
- **Research**: [research.md](./research.md)

- **Vite Guide**: https://vitejs.dev/guide/
- **React Docs**: https://react.dev/
- **rough.js**: https://github.com/rough-stuff/rough
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Google Fonts**: https://fonts.google.com/specimen/Nanum+Pen+Script

---

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review feature specification and plan documents
3. Consult Constitution for coding standards: `.specify/memory/constitution.md`
4. Open an issue in the project repository with reproduction steps

---

**Last Updated**: 2025-10-17
**Version**: 1.0.0
