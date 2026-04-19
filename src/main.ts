import { Markmap } from 'markmap-view';
import * as d3 from 'd3';
import { MapController } from './layers/engine/controller';
import { MapStore } from './layers/engine/store';
import { encodeMarkdown } from './layers/markdown/encoder';
import { encodePlainText } from './layers/markdown/text-encoder';
import { initDND } from './layers/interaction/dnd';
import { initPalette } from './ui/palette';
import { initMapList } from './ui/map-list';
import { initMenu } from './ui/menu';
import { showModal, showPromptModal, showSelectionModal } from './ui/modal';
import { downloadBlob, getSvgSource } from './utils/export-utils';
import { applyTheme } from './utils/theme';
import './style.css';

const DEFAULT_MD = `# 🚀 Mental Map Demo
- Core Features
  - Drag & Drop to organize
  - Inline editing (Double click)
  - Dark/Light mode support
- Export Options
  - Markdown (.md)
  - Plain Text (.txt)
  - Vector SVG
- Quick Tips
  - Use + button to add children
  - Right click nodes for actions
  - Settings panel for custom design`;

// 1. Initialize Controller
const store = new MapStore();
const controller = new MapController({
  store,
  defaultMarkdown: DEFAULT_MD
});

let engine = controller.getEngine();

// 2. Initialize Markmap
const svg = document.querySelector('#mindmap') as SVGSVGElement;
const mm = Markmap.create(svg);

// Selection state
let selectedNodeId: string | null = null;
let autoSaveTimer: any;

// Sidebar elements
const sidebarEmpty = document.querySelector('#sidebar-empty') as HTMLElement;
const sidebarDetail = document.querySelector('#sidebar-detail') as HTMLElement;
const nodeLabel = document.querySelector('#node-label') as HTMLInputElement;
const nodeIdSpan = document.querySelector('#node-id') as HTMLElement;
const nodeChildrenCount = document.querySelector('#node-children-count') as HTMLElement;

function showSidebar(nodeId: string) {
  const node = engine.findNode(nodeId);
  if (!node) return;

  sidebarEmpty.style.display = 'none';
  sidebarDetail.style.display = 'block';

  nodeLabel.value = node.content;
  nodeIdSpan.textContent = node.id;
  nodeChildrenCount.textContent = String(node.children.length);
}

function hideSidebar() {
  sidebarEmpty.style.display = 'block';
  sidebarDetail.style.display = 'none';
  nodeLabel.value = '';
}

function scheduleAutoSave() {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    controller.saveCurrent();
    refreshMapList();
  }, 1000);
}

function switchMap(id: string) {
  if (controller.switchMap(id)) {
    engine = controller.getEngine(); // Update local engine reference
    selectedNodeId = null;
    hideSidebar();
    updateView();
    refreshMapList();
  }
}

function deleteMap(id: string) {
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
      if (newActiveId) {
        switchMap(newActiveId);
      } else {
        refreshMapList();
      }
    }
  });
}

function renameMap(id: string, newName: string) {
  controller.renameMap(id, newName);
  refreshMapList();
}

function createNewMap() {
  showPromptModal({
    title: 'Create New Map',
    message: 'Enter a name for your new mental map:',
    confirmText: 'Create',
    onConfirm: (name) => {
      controller.createNewMap(name);
      selectedNodeId = null;
      hideSidebar();
      updateView();
      refreshMapList();
    }
  });
}

function refreshMapList() {
  mapList.render(controller.listMaps(), controller.getActiveId());
}

// 3. Initialize UI Components
const mapList = initMapList({
  container: document.querySelector('#map-list-container')!,
  onSelect: switchMap,
  onDelete: deleteMap,
  onRename: renameMap,
  onCreate: createNewMap
});

const importFileInput = document.querySelector('#import-file-input') as HTMLInputElement;

importFileInput.addEventListener('change', (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    const content = event.target?.result as string;
    if (content) {
      await controller.importMap(content);
      engine = controller.getEngine();
      updateView();
      refreshMapList();
    }
    // Clear input so same file can be imported again if needed
    importFileInput.value = '';
  };
  reader.readAsText(file);
});

// File Menu Initialization
initMenu({
  trigger: document.querySelector('#file-menu') as HTMLElement,
  items: [
    {
      label: 'New Map',
      onClick: createNewMap
    },
    {
      label: 'Import...',
      onClick: () => {
        importFileInput.click();
      }
    },
    {
      label: 'Export',
      onClick: () => {
        showSelectionModal({
          title: 'Export Map',
          message: 'Choose a format to save your mental map:',
          options: [
            { id: 'md', label: 'Markdown', description: '.md file for Obsidian, Logseq, etc.' },
            { id: 'txt', label: 'Plain Text', description: '.txt file with indentation-based structure' },
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
            } else if (format === 'svg') {
              const source = getSvgSource(svg);
              downloadBlob(new Blob([source], { type: 'image/svg+xml' }), `${baseName}.svg`);
            }
          }
        });
      }
    },
    {
      label: 'Reset View',
      onClick: () => mm.fit()
    },
    {
      label: 'Clear current map',
      danger: true,
      onClick: () => {
        showModal({
          title: 'Clear Map',
          message: 'Are you sure you want to clear the entire map? All nodes will be lost.',
          confirmText: 'Clear',
          danger: true,
          onConfirm: () => {
            engine.setRoot({ id: 'root', content: 'New Map', children: [] });
            selectedNodeId = null;
            hideSidebar();
            updateView();
          }
        });
      }
    }
  ]
});

function startInlineEdit(nodeId: string, nodeElement: Element) {
  const node = engine.findNode(nodeId);
  if (!node) return;

  // 1. Target the actual text container (ignore the "+" button)
  const textEl = nodeElement.querySelector('foreignObject div, foreignObject span') as HTMLElement;
  const computed = textEl ? window.getComputedStyle(textEl) : null;
  
  // 2. Get screen dimensions (zoomed)
  const foEl = nodeElement.querySelector('foreignObject');
  const bbox = foEl 
    ? foEl.getBoundingClientRect() 
    : (nodeElement as SVGGraphicsElement).getBoundingClientRect();

  // 3. Calculate Visual Scaling
  // We need to match the "screen" font size. 
  // If map is zoomed, the computed.fontSize (e.g. 13px) won't match the screen height.
  let visualFontSize = '13px';
  if (computed && textEl) {
    const logicalHeight = textEl.offsetHeight || parseFloat(computed.lineHeight) || 18;
    const zoomFactor = bbox.height / logicalHeight;
    const baseSize = parseFloat(computed.fontSize);
    visualFontSize = `${baseSize * zoomFactor}px`;
  }

  const editor = document.createElement('div');
  editor.contentEditable = 'true';
  editor.className = 'inline-edit-input';
  editor.innerText = node.content;
  
  // 4. Apply precise visual styles
  if (computed) {
    editor.style.fontFamily = computed.fontFamily;
    editor.style.fontSize = visualFontSize;
    editor.style.fontWeight = computed.fontWeight;
    // Keep text color identical to the theme's standard text, not the selected blue
    editor.style.color = 'var(--text)'; 
  }

  // 5. Align perfectly to the zoomed bbox
  editor.style.position = 'fixed';
  editor.style.top = `${bbox.top}px`;
  editor.style.left = `${bbox.left}px`;
  editor.style.minWidth = `${bbox.width}px`;
  editor.style.height = `${bbox.height}px`;
  editor.style.lineHeight = `${bbox.height}px`;
  
  document.body.appendChild(editor);
  
  // Selection logic for contenteditable
  const range = document.createRange();
  range.selectNodeContents(editor);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  editor.focus();

  const commit = () => {
    const newVal = editor.innerText.trim();
    if (newVal !== undefined && newVal !== node.content) {
      node.content = newVal || '...';
      updateView();
      showSidebar(nodeId);
    }
    cleanup();
  };

  const cleanup = () => {
    nodeElement.classList.remove('editing-source');
    if (editor.parentNode) {
      editor.parentNode.removeChild(editor);
    }
  };
  
  nodeElement.classList.add('editing-source');

  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    }
    if (e.key === 'Escape') {
      cleanup();
    }
  });

  editor.addEventListener('blur', commit);
}

// Rename on label change
nodeLabel.addEventListener('input', () => {
  if (selectedNodeId) {
    const node = engine.findNode(selectedNodeId);
    if (node) {
      node.content = nodeLabel.value;
      scheduleAutoSave();
    }
  }
});

nodeLabel.addEventListener('change', () => {
  if (selectedNodeId) {
    updateView();
  }
});

// Initialize DND
const attachDrag = initDND({
  engine,
  updateView,
  svgElement: svg as unknown as SVGElement,
  onSelect: (nodeId) => {
    selectedNodeId = nodeId;
    showSidebar(nodeId);
  },
  onDoubleClick: (nodeId, nodeElement) => {
    startInlineEdit(nodeId, nodeElement);
  },
  onAddChild: (parentId) => {
    const newNodeId = engine.addNode(parentId, 'New node');
    if (newNodeId) {
      updateView();
      
      // Wait for the transition to finish before showing the editor
      // Matches the 500ms duration used in updateView
      const nodeCount = engine.countNodes(engine.getRoot());
      const delay = nodeCount > 100 ? 50 : 600; 

      setTimeout(() => {
        const newNodeElement = d3.selectAll('.markmap-node')
          .filter((d: any) => (d.data?.id || d.id) === newNodeId)
          .node() as Element;
        
        if (newNodeElement) {
          selectedNodeId = newNodeId;
          showSidebar(newNodeId);
          startInlineEdit(newNodeId, newNodeElement);
        }
      }, delay);
    }
  }
});

// Initialize Palette
initPalette(engine, updateView, svg as SVGSVGElement);

// Theme Support
const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;

function applyThemeColors(themeId: string) {
  const theme = applyTheme(themeId);
  const colorScale = d3.scaleOrdinal(theme.branchColors);
  mm.setOptions({ 
    color: (node: any) => colorScale(node.state?.path || node.id) 
  });
}

if (themeSelect) {
  const currentTheme = controller.getTheme();
  themeSelect.value = currentTheme;
  applyThemeColors(currentTheme);

  themeSelect.addEventListener('change', () => {
    const newThemeId = themeSelect.value;
    controller.setTheme(newThemeId);
    applyThemeColors(newThemeId);
    updateView();
  });
}

// Layout Support
const fontSizeSlider = document.getElementById('font-size-slider') as HTMLInputElement;
const fontSizeVal = document.getElementById('font-size-val');
const branchWidthSlider = document.getElementById('branch-width-slider') as HTMLInputElement;
const branchWidthVal = document.getElementById('branch-width-val');
const spacingSlider = document.getElementById('spacing-slider') as HTMLInputElement;
const spacingVal = document.getElementById('spacing-val');

function applyLayoutSettings() {
  const settings = controller.getLayoutSettings();
  const root = document.documentElement;
  
  // Apply CSS Variables
  root.style.setProperty('--map-font-size', `${settings.fontSize}px`);
  root.style.setProperty('--branch-width', `${settings.branchWidth}px`);
  
  // Update Value Hints
  if (fontSizeVal) fontSizeVal.textContent = `${settings.fontSize}px`;
  if (branchWidthVal) branchWidthVal.textContent = `${settings.branchWidth}px`;
  if (spacingVal) spacingVal.textContent = `${settings.spacing}`;
  
  // Sync Sliders
  if (fontSizeSlider) fontSizeSlider.value = settings.fontSize.toString();
  if (branchWidthSlider) branchWidthSlider.value = settings.branchWidth.toString();
  if (spacingSlider) spacingSlider.value = settings.spacing.toString();

  // Apply to Markmap Engine
  mm.setOptions({
    spacingHorizontal: settings.spacing,
    spacingVertical: Math.floor(settings.spacing / 8) // proportional vertical spacing
  });
}

// Initialize
applyLayoutSettings();

fontSizeSlider?.addEventListener('input', () => {
  const val = parseInt(fontSizeSlider.value);
  controller.setLayoutSettings({ fontSize: val });
  applyLayoutSettings();
});

branchWidthSlider?.addEventListener('input', () => {
  const val = parseFloat(branchWidthSlider.value);
  controller.setLayoutSettings({ branchWidth: val });
  applyLayoutSettings();
});

spacingSlider?.addEventListener('input', () => {
  const val = parseInt(spacingSlider.value);
  controller.setLayoutSettings({ spacing: val });
  applyLayoutSettings();
  updateView(); // Re-layout necessary for spacing change
});

// 4. Design Accordion Toggle
const designHeader = document.querySelector('.design-header');
const designContainer = document.getElementById('design-container');
designHeader?.addEventListener('click', () => {
  designContainer?.classList.toggle('collapsed');
});

function updateView() {
  const root = engine.getRoot();

  // Perf: disable transitions for large maps
  const nodeCount = engine.countNodes(root);
  mm.setOptions({ duration: nodeCount > 100 ? 0 : 500 });

  // Force a fresh object reference to ensure Markmap's D3 diffing triggers a visual update
  const rootClone = JSON.parse(JSON.stringify(root));
  mm.setData(rootClone as any);
  
  // Removed automatic mm.fit() from here to prevent "dislocation" during edits

  setTimeout(() => {
    // Perf: pause observer to prevent feedback loop
    observer.disconnect();
    attachDrag();

    // RESTORE VISUAL SELECTION
    if (selectedNodeId) {
      d3.selectAll('.markmap-node')
        .filter((d: any) => (d.data?.id || d.id) === selectedNodeId)
        .classed('selected', true);
    }

    observer.observe(svg, { childList: true, subtree: true });
  }, 500);

  scheduleAutoSave();
}

// Initial Render
updateView();
refreshMapList();
setTimeout(() => mm.fit(), 800); // Fit once on initial load

// MutationObserver for Markmap internals
let reattachTimer: any;
const observer = new MutationObserver(() => {
  clearTimeout(reattachTimer);
  reattachTimer = setTimeout(() => {
    // Perf: pause observer to prevent feedback loop
    observer.disconnect();
    attachDrag();
    observer.observe(svg, { childList: true, subtree: true });
  }, 600);
});
observer.observe(svg, { childList: true, subtree: true });

// Deletion Logic
const deleteNode = () => {
  if (!selectedNodeId) return;
  const node = engine.findNode(selectedNodeId);
  if (!node) return;

  if (selectedNodeId === engine.getRoot().id) {
    alert('Cannot delete root node');
    return;
  }

  showModal({
    title: 'Delete Node',
    message: `Are you sure you want to delete "${node.content}" and all its children?`,
    confirmText: 'Delete',
    danger: true,
    onConfirm: () => {
      engine.removeNode(selectedNodeId!);
      selectedNodeId = null;
      hideSidebar();
      updateView();
    }
  });
};

document.querySelector('#delete-node')?.addEventListener('click', deleteNode);
window.addEventListener('keydown', (e) => {
  if (selectedNodeId && e.key === 'Delete') {
    if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
    deleteNode();
  }
});

window.addEventListener('resize', () => mm.fit());
window.addEventListener('beforeunload', () => {
  controller.saveCurrent();
});

// Sidebar: Add child explicitly
document.querySelector('#add-child')?.addEventListener('click', () => {
  if (!selectedNodeId) return;
  showPromptModal({
    title: 'Add Child Node',
    message: 'Enter text for the new child node:',
    confirmText: 'Add Node',
    onConfirm: (content) => {
      engine.addNode(selectedNodeId!, content);
      updateView();
      showSidebar(selectedNodeId!);
    }
  });
});

svg.addEventListener('click', (e) => {
  if (e.target === svg) {
    selectedNodeId = null;
    d3.selectAll('.markmap-node').classed('selected', false);
    hideSidebar();
    // mm.fit() removed from here to prevent dislocation
  }
});
