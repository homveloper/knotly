# Quickstart: Create Your First .knotly.md Note

**Time**: 2 minutes | **Difficulty**: Beginner | **Version**: v1.0.0

## Overview

This guide will teach you how to create a mind map note with Knotly, save it as a .knotly.md file, and edit it in your favorite text editor. You'll learn the basics of the composable token system and file format.

---

## Step 1: Create a New Note (30 seconds)

1. **Open Knotly** in your browser (Chrome, Edge, or Safari recommended)
2. **Click "New Note"** on the start screen
3. You'll see a blank canvas with a default token library loaded

**What just happened?**
- Knotly initialized a new mind map with 8 colors, 6 sizes, 5 "feel" levels (smooth→messy), and 4 border styles
- Your canvas is ready to capture ideas

---

## Step 2: Add Your First Thought (45 seconds)

1. **Double-click anywhere** on the blank canvas
   - A new node appears with default yellow color
   - Text input is activated automatically

2. **Type your thought**: "Project Ideas"
   - Press Enter or click outside when done

3. **Add a connected thought**:
   - Click the "Project Ideas" node to select it (it highlights)
   - Double-click on blank space again
   - A new node appears, **automatically connected** to "Project Ideas"
   - Type: "Launch mobile app"

4. **Add one more**:
   - With "Launch mobile app" still selected, double-click again
   - Type: "Build MVP first"

**What you learned:**
- Double-click blank space → new node
- Select node + double-click → auto-connected new node
- This is the **fast brainstorming workflow**

---

## Step 3: Style Your Nodes with Tokens (30 seconds)

1. **Right-click** the "Project Ideas" node
2. A **style panel** appears with token buttons
3. **Click tokens to apply**:
   - Click `color-blue` (Colors section)
   - Click `h3` (Sizes section)
   - Click `bold` (Border section)

4. **Watch the node update** in real-time
   - Bottom of panel shows: "color-blue h3 bold"
   - This is your **token combination string**

5. **Try different combinations** on other nodes:
   - "Launch mobile app" → `color-mint h4 neat`
   - "Build MVP first" → `color-red h5 thick`

**What you learned:**
- Tokens are composable (mix colors, sizes, feels, borders)
- Last token wins for conflicts (e.g., `color-blue color-red` → red)
- Styles update instantly

---

## Step 4: Save Your Note (15 seconds)

1. **Press Cmd+S** (Mac) or **Ctrl+S** (Windows/Linux)
2. **Name your file**: `my-first-note.knotly.md`
3. **Choose location**: Desktop or Documents folder
4. **Click Save**

**What you see:**
- Filename appears in titlebar: `my-first-note.knotly.md`
- Checkmark (✓) indicator shows save success
- Dot (●) appears next to filename if you make more changes

---

## Step 5: Open in Text Editor (Optional, 30 seconds)

1. **Open your file** in VS Code, Vim, Sublime Text, or any text editor
2. **See the structure**:

```markdown
---
tokens:
  color-blue: {stroke: '#2563eb', fill: '#dbeafe'}
  color-mint: {stroke: '#059669', fill: '#d1fae5'}
  color-red: {stroke: '#dc2626', fill: '#fee2e2'}
  h3: {width: 240, height: 160, fontSize: 18}
  h4: {width: 200, height: 140, fontSize: 16}
  h5: {width: 180, height: 120, fontSize: 14}
  neat: {roughness: 1.0}
  bold: {strokeWidth: 4}
  thick: {strokeWidth: 3}

nodes:
  - {id: node-abc12345, pos: [100, 200], style: 'color-blue h3 bold'}
  - {id: node-def67890, pos: [300, 250], style: 'color-mint h4 neat'}
  - {id: node-ghi24680, pos: [500, 300], style: 'color-red h5 thick'}

edges:
  - [node-abc12345, node-def67890]
  - [node-def67890, node-ghi24680]
---

[node-abc12345]
Project Ideas

[node-def67890]
Launch mobile app

[node-ghi24680]
Build MVP first
```

**File structure explained:**
- **YAML frontmatter** (between `---` delimiters):
  - `tokens`: Style definitions
  - `nodes`: Position and style metadata
  - `edges`: Connections between nodes

- **Markdown body**:
  - `[node-id]` → Node content delimiter
  - Text below each `[node-id]` is that node's content

**Try editing**:
1. Change node position: `pos: [100, 200]` → `pos: [150, 250]`
2. Save file in text editor
3. Reload in Knotly (Open File → select same file)
4. Node moves to new position!

---

## Step 6: Create a Custom Token (Advanced, 1 minute)

1. **Edit your .knotly.md** in text editor
2. **Add a composite token** to the `tokens` section:

```yaml
tokens:
  # Existing tokens...
  heading-primary: 'color-blue h3 bold'  # NEW composite token
  warning-note: 'color-red h4 thick'     # NEW composite token
```

3. **Save** and **reload** in Knotly
4. **Right-click any node** → Style panel now shows new tokens!
5. **Click `heading-primary`** → Node gets all three styles at once

**What you learned:**
- Composite tokens = shorthand for multiple styles
- Define them in YAML with space-separated token names
- They expand recursively (tokens can reference tokens)

---

## Next Steps

**You now know how to:**
- ✅ Create and save mind map notes
- ✅ Add nodes with automatic connections (double-click workflow)
- ✅ Style nodes with composable tokens
- ✅ Edit .knotly.md files in text editors
- ✅ Create custom composite tokens

**Explore more:**
- **Drag to connect**: Click and drag from node edge to another node (desktop)
- **Long-press to connect**: Long-press node → tap another node (mobile)
- **Delete nodes**: Select node → press Delete/Backspace
- **Zoom/pan**: Pinch to zoom (mobile), scroll to zoom (desktop), two-finger pan
- **Recent files**: Start screen shows last 5 opened files
- **Drag & drop**: Drag .knotly.md file onto app window to open

---

## Common Questions

**Q: What happens if I lose my file?**
A: .knotly.md files are local-only (no cloud sync). Back up important notes to Dropbox/Google Drive manually.

**Q: Can I use markdown formatting in node content?**
A: No, nodes support plain text only. Markdown syntax like `**bold**` will display literally.

**Q: How many nodes can one file have?**
A: Up to 1,000 nodes work smoothly (60fps). 10,000+ nodes show a performance warning but still load.

**Q: Can I change the default colors?**
A: Yes! Edit the `color-blue: {stroke: '#...', fill: '#...'}` values in YAML frontmatter.

**Q: What if my file has a syntax error?**
A: Knotly shows a friendly error message with the line number. Fix it in text editor and reload.

---

## File Format Reference

### Minimal Valid File

```markdown
---
tokens: {}
nodes: []
edges: []
---
```

### Complete Example

```markdown
---
tokens:
  color-blue: {stroke: '#2563eb', fill: '#dbeafe'}
  h4: {width: 200, height: 140, fontSize: 16}
  neat: {roughness: 1.0}
  my-style: 'color-blue h4 neat'

nodes:
  - {id: node-12345678, pos: [100, 200], style: 'my-style'}

edges:
  - [node-12345678, node-87654321]
---

[node-12345678]
Node content goes here.
Multiple lines are supported.

[node-87654321]
Another node's content.
```

### Token Style Properties

| Property | Type | Range | Example | Description |
|----------|------|-------|---------|-------------|
| stroke | string | CSS color | `'#2563eb'` | Outline color |
| fill | string | CSS color | `'#dbeafe'` | Background color |
| strokeWidth | number | 1-10 | `3` | Line thickness |
| width | number | 80-400 | `200` | Node width (px) |
| height | number | 60-300 | `140` | Node height (px) |
| fontSize | number | 10-32 | `16` | Text size (px) |
| fontWeight | number | 100-900 | `700` | Text weight |
| roughness | number | 0-3 | `1.0` | Hand-drawn feel |

---

## Tips & Tricks

1. **Fast node creation**: Keep a node selected while double-clicking → builds a chain of connected thoughts
2. **Token naming**: Use descriptive names like `urgent-task`, `completed-item`, `brainstorm-idea`
3. **Color coding**: Create tokens for project stages (e.g., `stage-planning: 'color-blue h4'`, `stage-done: 'color-mint h4'`)
4. **Version control**: .knotly.md files work great with Git (human-readable diffs)
5. **Keyboard shortcuts**:
   - `Cmd/Ctrl+S` → Save
   - `Delete/Backspace` → Delete selected node
   - `Enter` → Finish text editing
   - `Esc` → Deselect / Close panel

---

**Congratulations!** You've mastered the basics of Knotly. Start creating your mind maps and enjoy the flexibility of plain-text editing combined with visual brainstorming.

**Need help?** Check the full documentation or open an issue on GitHub.
