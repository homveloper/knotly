// File I/O utilities for .knotly.md markdown files
// Implements "Error as Value" pattern (constitution.md)

import * as yaml from 'js-yaml';
import type {
  FileResult,
  LoadFileData,
  SaveFileData,
  TokenDefinitions,
  NodeMetadata,
  EdgeTuple,
} from '../types/fileIO';
import type { Node, Edge } from '../types/canvas';

/**
 * Extract markdown content for a specific node ID from file body
 * Uses regex to find content between [node-id] delimiter and next delimiter or EOF
 *
 * @param body - Markdown body section (everything after YAML frontmatter)
 * @param id - Node ID to extract content for
 * @returns Extracted content string (empty if node not found)
 */
export function extractContent(body: string, id: string): string {
  const escapedId = escapeRegex(id);
  const regex = new RegExp(`\\[${escapedId}\\]\\n([\\s\\S]*?)(?=\\n\\[|$)`, 'm');
  const match = body.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * Escape special regex characters in a string
 * Used to safely use node IDs in regex patterns
 *
 * @param str - String to escape
 * @returns Escaped string safe for use in RegExp
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Load and parse a .knotly.md file
 * Parses YAML frontmatter and extracts markdown content for each node
 *
 * @param fileHandle - FileSystemFileHandle or File object
 * @returns Result with LoadFileData or error message
 */
export async function loadKnotlyFile(
  fileHandle: FileSystemFileHandle | File
): Promise<FileResult<LoadFileData>> {
  try {
    // Read file content
    let fileContent: string;
    if ('getFile' in fileHandle) {
      // FileSystemFileHandle
      const file = await fileHandle.getFile();
      fileContent = await file.text();
    } else {
      // File object (fallback for Safari/Firefox)
      fileContent = await fileHandle.text();
    }

    // Split YAML frontmatter and markdown body
    const parts = fileContent.split(/^---\s*$/m);
    if (parts.length < 3) {
      return {
        success: false,
        error: 'Invalid file format: Missing YAML frontmatter delimiters (---)',
      };
    }

    const yamlContent = parts[1].trim();
    const markdownBody = parts.slice(2).join('---').trim();

    // Parse YAML frontmatter
    let frontmatter: any;
    try {
      frontmatter = yaml.load(yamlContent, { schema: yaml.JSON_SCHEMA });
    } catch (yamlError: any) {
      // T082: Enhanced error message with line number if available
      const lineInfo = yamlError.mark ? ` at line ${yamlError.mark.line + 1}` : '';
      return {
        success: false,
        error: `Malformed YAML${lineInfo}: ${yamlError.message || 'Invalid syntax'}`,
      };
    }

    // Validate frontmatter structure
    if (!frontmatter || typeof frontmatter !== 'object') {
      return {
        success: false,
        error: 'YAML frontmatter must be an object',
      };
    }

    const { tokens, nodes, edges } = frontmatter;

    // T083: Graceful handling for missing tokens section - merge with DEFAULT_TOKENS
    // Tokens section is optional - if missing or invalid, will use DEFAULT_TOKENS in canvasStore
    let validTokens = tokens;
    if (!tokens || typeof tokens !== 'object') {
      console.warn('Missing or invalid "tokens" section - will use DEFAULT_TOKENS');
      validTokens = {}; // Empty object, will be merged with DEFAULT_TOKENS in canvasStore
    }

    if (!Array.isArray(nodes)) {
      return {
        success: false,
        error: 'Missing or invalid "nodes" section (must be array) in YAML frontmatter',
      };
    }

    if (!Array.isArray(edges)) {
      return {
        success: false,
        error: 'Missing or invalid "edges" section (must be array) in YAML frontmatter',
      };
    }

    // T084: Duplicate node ID detection with auto-fix
    const seenIds = new Set<string>();
    const validNodes: NodeMetadata[] = [];

    for (const node of nodes as NodeMetadata[]) {
      if (!node.id) {
        console.warn('Skipping node with missing ID:', node);
        continue;
      }

      // Check for duplicate IDs
      if (seenIds.has(node.id)) {
        // Generate new unique ID
        const originalId = node.id;
        let newId = `${originalId}-${Date.now()}`;
        let counter = 1;
        while (seenIds.has(newId)) {
          newId = `${originalId}-${Date.now()}-${counter}`;
          counter++;
        }
        console.warn(`Duplicate node ID detected: "${originalId}" → auto-corrected to "${newId}"`);
        node.id = newId;
      }

      seenIds.add(node.id);
      validNodes.push(node);
    }

    // Extract node content from markdown body
    const nodeContents = new Map<string, string>();
    for (const node of validNodes) {
      const content = extractContent(markdownBody, node.id);
      nodeContents.set(node.id, content);
    }

    return {
      success: true,
      data: {
        tokens: validTokens as TokenDefinitions,
        nodes: validNodes,
        edges: edges as EdgeTuple[],
        nodeContents,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to load file: ${error.message || 'Unknown error'}`,
    };
  }
}

/**
 * Save canvas state to a .knotly.md file
 * Serializes to YAML frontmatter + markdown body format
 *
 * @param fileHandle - FileSystemFileHandle or null (triggers save dialog)
 * @param data - Canvas state to save
 * @returns Result with FileSystemFileHandle or error message
 */
export async function saveKnotlyFile(
  fileHandle: FileSystemFileHandle | null,
  data: SaveFileData
): Promise<FileResult<FileSystemFileHandle>> {
  try {
    // Serialize YAML frontmatter
    const frontmatter = {
      tokens: data.tokens,
      nodes: data.nodes,
      edges: data.edges,
    };

    const yamlContent = yaml.dump(frontmatter, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
      sortKeys: false,
      flowLevel: 2, // Compact arrays/objects for readability
    });

    // Generate markdown body with [node-id] delimiters
    const markdownBody = Array.from(data.nodeContents.entries())
      .map(([id, content]) => `[${id}]\n${content}`)
      .join('\n\n');

    // Combine into final file content
    const fileContent = `---\n${yamlContent}---\n\n${markdownBody}\n`;

    // Write file using File System Access API or fallback
    if ('showSaveFilePicker' in window) {
      // Use File System Access API (Chromium)
      let handle = fileHandle;
      if (!handle) {
        handle = await saveFile();
        if (!handle) {
          return {
            success: false,
            error: 'File save cancelled by user',
          };
        }
      }

      const writable = await handle.createWritable();
      await writable.write(fileContent);
      await writable.close();

      return {
        success: true,
        data: handle,
      };
    } else {
      // Fallback: Blob download for Safari/Firefox
      const blob = new Blob([fileContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'note.knotly.md';
      a.click();
      URL.revokeObjectURL(url);

      // Cannot return FileSystemFileHandle in fallback mode
      return {
        success: false,
        error: 'File saved via download (browser fallback mode)',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to save file: ${error.message || 'Unknown error'}`,
    };
  }
}

/**
 * Open file picker and return FileSystemFileHandle
 * Uses File System Access API with fallback to file input
 *
 * @returns FileSystemFileHandle or null if cancelled
 */
export async function openFile(): Promise<FileSystemFileHandle | File | null> {
  try {
    if ('showOpenFilePicker' in window) {
      // File System Access API (Chromium)
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'Knotly Markdown Files',
            accept: { 'text/markdown': ['.md', '.knotly.md'] },
          },
        ],
        multiple: false,
      });
      return handle;
    } else {
      // Fallback: file input for Safari/Firefox
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md,.knotly.md';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          resolve(file || null);
        };
        input.oncancel = () => resolve(null);
        input.click();
      });
    }
  } catch (error: any) {
    console.error('Failed to open file picker:', error);
    return null;
  }
}

/**
 * Save file picker and return FileSystemFileHandle
 * Uses File System Access API (Chromium only)
 *
 * @param suggestedName - Suggested filename (default: "note.knotly.md")
 * @returns FileSystemFileHandle or null if cancelled
 */
export async function saveFile(
  suggestedName = 'note.knotly.md'
): Promise<FileSystemFileHandle | null> {
  try {
    if ('showSaveFilePicker' in window) {
      const handle = await window.showSaveFilePicker({
        suggestedName,
        types: [
          {
            description: 'Knotly Markdown Files',
            accept: { 'text/markdown': ['.knotly.md', '.md'] },
          },
        ],
      });
      return handle;
    } else {
      // Fallback mode doesn't need picker (uses Blob download)
      return null;
    }
  } catch (error: any) {
    console.error('Failed to show save file picker:', error);
    return null;
  }
}
