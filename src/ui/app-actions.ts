import { MapController } from '../layers/engine/controller';
import { StateEngine } from '../layers/engine/state';
import { showModal, showPromptModal, showSelectionModal } from './modal';
import { encodeMarkdown } from '../layers/markdown/encoder';
import { encodePlainText } from '../layers/markdown/text-encoder';
import { encodeOPML } from '../layers/markdown/opml';
import { downloadBlob, getSvgSource } from '../utils/export-utils';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_NODE_COUNT = 5000;

function countNodes(node: any): number {
  let count = 1;
  const children = node.children || node.c || [];
  for (const child of children) {
    count += countNodes(child);
  }
  return count;
}

export function handleCreateNewMap(controller: MapController, onComplete: (newId: string) => void) {
  showPromptModal({
    title: 'Create New Map',
    message: 'Enter a name for your new mental map:',
    confirmText: 'Create',
    onConfirm: (name) => {
      const newId = controller.createNewMap(name);
      onComplete(newId);
    }
  });
}

export function handleDeleteMap(controller: MapController, id: string, onComplete: (newActiveId?: string) => void) {
  const mapMeta = controller.listMaps().find(m => m.id === id);
  if (!mapMeta) return;

  if (controller.listMaps().length <= 1) {
    alert('Cannot delete the last map.');
    return;
  }
  
  showModal({
    title: 'Delete Map',
    message: `Are you sure you want to delete "${mapMeta.name}"? This action cannot be undone.`,
    confirmText: 'Delete',
    danger: true,
    onConfirm: () => {
      const newActiveId = controller.deleteMap(id);
      onComplete(newActiveId ?? undefined);
    }
  });
}

export function handleExportMap(controller: MapController, engine: StateEngine, svg: SVGSVGElement) {
  showSelectionModal({
    title: 'Export Map',
    message: 'Choose a format to save your mental map:',
    options: [
      { id: 'md', label: 'Markdown', description: '.md file for Obsidian, Logseq, etc.' },
      { id: 'txt', label: 'Plain Text', description: '.txt file with indentation-based structure' },
      { id: 'opml', label: 'OPML / XML', description: '.opml file for Miro, MindNode, XMind, etc.' },
      { id: 'svg', label: 'Vector Graphic (SVG)', description: 'Scalable vector image for printing or editing' }
    ],
    onSelect: async (format) => {
      const root = engine.getRoot();
      const activeId = controller.getActiveId();
      const activeMap = controller.listMaps().find(m => m.id === activeId);
      const baseName = activeMap ? activeMap.name : activeId;

      if (format === 'md') {
        const content = encodeMarkdown(root);
        downloadBlob(new Blob([content], { type: 'text/markdown' }), `${baseName}.md`);
      } else if (format === 'txt') {
        const content = encodePlainText(root);
        downloadBlob(new Blob([content], { type: 'text/plain' }), `${baseName}.txt`);
      } else if (format === 'opml') {
        const content = encodeOPML(root, baseName);
        downloadBlob(new Blob([content], { type: 'text/xml' }), `${baseName}.opml`);
      } else if (format === 'svg') {
        const source = getSvgSource(svg);
        downloadBlob(new Blob([source], { type: 'image/svg+xml' }), `${baseName}.svg`);
      }
    }
  });
}

export async function handleImportMap(controller: MapController, file: File, onComplete: () => void) {
  if (file.size > MAX_FILE_SIZE) {
    alert(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum allowed size is 5MB.`);
    return;
  }

  const reader = new FileReader();
  reader.onload = async (event) => {
    const content = event.target?.result as string;
    if (!content) return;

    // We check node count after parsing to be accurate across formats
    // MapController.importMap already uses the universal parser
    try {
      // Temporary parse to check node count
      const { UniversalParser } = await import('../layers/markdown/universal');
      const parser = new UniversalParser();
      const tempRoot = await parser.parse(content);
      const nodeCount = countNodes(tempRoot);

      if (nodeCount > MAX_NODE_COUNT) {
        showModal({
          title: 'Large Map Warning',
          message: `This map has ${nodeCount.toLocaleString()} nodes, which exceeds the recommended limit of 5,000. Performance may be degraded. Do you want to continue?`,
          confirmText: 'Import Anyway',
          onConfirm: async () => {
            await controller.importMap(content);
            onComplete();
          }
        });
      } else {
        await controller.importMap(content);
        onComplete();
      }
    } catch (e) {
      console.error('Import failed', e);
      alert('Failed to parse the map file.');
    }
  };
  reader.readAsText(file);
}

export function handleResetApp(controller: MapController) {
  showModal({
    title: 'Clear All Data',
    message: 'Are you sure you want to delete ALL maps and reset all settings? This action cannot be undone.',
    confirmText: 'Clear Everything',
    danger: true,
    onConfirm: () => {
      // Use the store instance via controller or direct
      const store = (controller as any).store; 
      if (store && typeof store.clearAll === 'function') {
        store.clearAll();
      } else {
        // Fallback if type casting fails
        localStorage.clear();
      }
      window.location.reload();
    }
  });
}

export function handleClearMap(engine: StateEngine, onComplete: () => void) {
  showModal({
    title: 'Clear Map',
    message: 'Are you sure you want to clear the entire map? All nodes will be lost.',
    confirmText: 'Clear',
    danger: true,
    onConfirm: () => {
      engine.setRoot({ id: 'root', content: 'New Map', children: [] });
      onComplete();
    }
  });
}
