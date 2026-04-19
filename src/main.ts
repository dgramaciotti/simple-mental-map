import * as d3 from 'd3';
import { MapController } from './layers/engine/controller';
import { MapStore } from './layers/engine/store';
import { initDND } from './layers/interaction/dnd';
import { initPalette } from './ui/palette';
import { initMapList } from './ui/map-list';
import { initMenu } from './ui/menu';
import { throttle } from './utils/perf';
import { ViewManager } from './ui/view-manager';
import { SidebarManager } from './ui/sidebar-manager';
import { startInlineEdit, cancelActiveEdit } from './ui/inline-editor';
import { 
  handleCreateNewMap, 
  handleDeleteMap, 
  handleExportMap, 
  handleImportMap, 
  handleClearMap,
  handleResetApp
} from './ui/app-actions';
import { showModal } from './ui/modal';
import './style.css';

// 0. Security: Frame-busting (Clickjacking Protection)
if (window.self !== window.top) {
  window.top!.location.href = window.location.href;
}

// 0.1 Security & Safety: Register Storage Quota Handler
const store = new MapStore();
store.onQuotaExceeded = () => {
  showModal({
    title: 'Storage Full',
    message: 'Your browser storage is full. Some changes may not be saved. Try deleting other maps or exporting them to free up space.',
    confirmText: 'I Understand',
    danger: true,
    onConfirm: () => {}
  });
};

const DEFAULT_MD = `# Mental Map Demo
- **Core** Features
  - Drag & Drop to organize
  - Inline editing (*Double click*)
  - Dark/Light mode support
- Custom **Styling** 🎨
  - Per-node colors
  - Variable font sizes
  - Custom line colors
- Rich *Content*
  - **Bold** & *Italic*
  - \`Code blocks\`
  - ~~Strikethrough~~`;

// 1. Core State & Controller Initialization
const controller = new MapController({
  store,
  defaultMarkdown: DEFAULT_MD
});

let engine = controller.getEngine();
let selectedNodeId: string | null = null;
let pendingEditId: string | null = null;
let autoSaveTimer: any;

// 2. Component Managers Initialization
const viewManager = new ViewManager({
  svgElement: document.querySelector('#mindmap') as SVGSVGElement,
  onAttachDrag: () => attachDrag(),
  onAutoSave: () => scheduleAutoSave()
});

const sidebarManager = new SidebarManager({
  onLabelInput: (content) => {
    if (selectedNodeId) {
      const node = engine.findNode(selectedNodeId);
      if (node && node.content !== content) {
        controller.pushHistory();
        node.content = content;
        updateView();
      }
    }
  },
  onStyleUpdate: (style) => {
    if (selectedNodeId) {
      controller.updateNodeStyle(selectedNodeId, style);
      updateView();
    }
  },
  onResetStyle: () => {
    if (selectedNodeId) {
      controller.updateNodeStyle(selectedNodeId, { textColor: undefined, lineColor: undefined, fontSize: undefined });
      viewManager.applyLayoutSettings(controller, engine);
      updateView();
      sidebarManager.showSidebar(engine.findNode(selectedNodeId)!, controller);
    }
  },
  onDeleteNode: () => deleteNode(),
  onAddChild: () => {
    if (selectedNodeId) {
      handleSidebarAddChild(selectedNodeId);
    }
  }
});

// 3. UI Actions Helpers
function updateView() {
  viewManager.updateView(engine, selectedNodeId, pendingEditId);
}

function scheduleAutoSave() {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    controller.saveCurrent();
    refreshMapList();
  }, 1000);
}

function refreshMapList() {
  mapList.render(controller.listMaps(), controller.getActiveId());
}

function switchMap(id: string) {
  if (controller.switchMap(id)) {
    engine = controller.getEngine();
    selectedNodeId = null;
    sidebarManager.hideSidebar();
    updateView();
    refreshMapList();
  }
}

function handleSidebarAddChild(parentId: string) {
  controller.pushHistory();
  const newNodeId = engine.addNode(parentId, 'New node');
  if (newNodeId) {
    selectedNodeId = newNodeId;
    pendingEditId = newNodeId;
    updateView();
    
    setTimeout(() => {
      const newNodeElement = d3.selectAll('.markmap-node')
        .filter((d: any) => (d.data?.id || d.id) === newNodeId)
        .node() as Element;
      
      if (newNodeElement) {
        sidebarManager.showSidebar(engine.findNode(newNodeId)!, controller);
        startInlineEdit(newNodeElement, engine.findNode(newNodeId)!, (val) => {
          engine.findNode(newNodeId)!.content = val;
          updateView();
        }, () => updateView());
      }
      pendingEditId = null;
    }, 50);
  }
}

const deleteNode = () => {
  if (!selectedNodeId) return;
  const node = engine.findNode(selectedNodeId);
  if (!node) return;

  if (selectedNodeId === engine.getRoot().id) {
    alert('Cannot delete root node');
    return;
  }

  controller.pushHistory();
  engine.removeNode(selectedNodeId);
  selectedNodeId = null;
  sidebarManager.hideSidebar();
  updateView();
};

// 4. Initialize Core UI Components
const mapList = initMapList({
  container: document.querySelector('#map-list-container')!,
  onSelect: switchMap,
  onDelete: (id) => handleDeleteMap(controller, id, (newId) => newId ? switchMap(newId) : refreshMapList()),
  onRename: (id, name) => {
    controller.renameMap(id, name);
    refreshMapList();
  },
  onCreate: () => handleCreateNewMap(controller, (newId) => {
    controller.switchMap(newId);
    engine = controller.getEngine();
    selectedNodeId = null;
    sidebarManager.hideSidebar();
    updateView();
    refreshMapList();
  })
});

const importFileInput = document.querySelector('#import-file-input') as HTMLInputElement;
importFileInput?.addEventListener('change', (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    handleImportMap(controller, file, () => {
      engine = controller.getEngine();
      updateView();
      refreshMapList();
      importFileInput.value = '';
    });
  }
});

initMenu({
  trigger: document.querySelector('#file-menu') as HTMLElement,
  items: [
    { label: 'New Map', onClick: () => handleCreateNewMap(controller, (newId) => switchMap(newId)) },
    { label: 'Import...', onClick: () => importFileInput.click() },
    { label: 'Export', onClick: () => handleExportMap(controller, engine, document.querySelector('#mindmap') as SVGSVGElement) },
    { 
      label: 'Clear current map', 
      danger: true, 
      onClick: () => handleClearMap(engine, () => {
        controller.pushHistory();
        selectedNodeId = null;
        sidebarManager.hideSidebar();
        updateView();
      }) 
    },
    {
      label: 'Reset App (Wipe everything)',
      danger: true,
      onClick: () => handleResetApp(controller)
    }
  ]
});

// 5. Interaction & Layout Initialization
const attachDrag = initDND({
  engine,
  updateView,
  onBeforeMove: () => controller.pushHistory(),
  svgElement: document.querySelector('#mindmap') as unknown as SVGElement,
  onSelect: (nodeId) => {
    selectedNodeId = nodeId;
    sidebarManager.showSidebar(engine.findNode(nodeId)!, controller);
  },
  onDoubleClick: (nodeId, nodeElement) => {
    startInlineEdit(nodeElement, engine.findNode(nodeId)!, (val) => {
      engine.findNode(nodeId)!.content = val;
      updateView();
      sidebarManager.showSidebar(engine.findNode(nodeId)!, controller);
    }, () => updateView());
  },
  onAddChild: (parentId) => handleSidebarAddChild(parentId)
});

initPalette(engine, updateView, document.querySelector('#mindmap') as SVGSVGElement);

// Global Layout Listeners
const fontSizeSlider = document.getElementById('font-size-slider') as HTMLInputElement;
const branchWidthSlider = document.getElementById('branch-width-slider') as HTMLInputElement;
const spacingSlider = document.getElementById('spacing-slider') as HTMLInputElement;
const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
const resetViewBtn = document.getElementById('reset-view-btn');

fontSizeSlider?.addEventListener('input', throttle(() => {
  controller.setLayoutSettings({ fontSize: parseInt(fontSizeSlider.value) });
  viewManager.applyLayoutSettings(controller, engine);
}, 16));

branchWidthSlider?.addEventListener('input', throttle(() => {
  controller.setLayoutSettings({ branchWidth: parseFloat(branchWidthSlider.value) });
  viewManager.applyLayoutSettings(controller, engine);
}, 16));

spacingSlider?.addEventListener('input', throttle(() => {
  controller.setLayoutSettings({ spacing: parseInt(spacingSlider.value) });
  viewManager.applyLayoutSettings(controller, engine);
  updateView();
}, 16));

themeSelect?.addEventListener('change', () => {
  controller.setTheme(themeSelect.value);
  viewManager.applyLayoutSettings(controller, engine);
  updateView();
});

resetViewBtn?.addEventListener('click', () => viewManager.fit());

// Accordion Toggle
document.querySelector('.design-header')?.addEventListener('click', () => {
  document.getElementById('design-container')?.classList.toggle('collapsed');
});

// Window Events
window.addEventListener('resize', () => viewManager.getMarkmap().fit());
window.addEventListener('beforeunload', () => controller.saveCurrent());
window.addEventListener('keydown', (e) => {
  if (selectedNodeId && e.key === 'Delete') {
    const isEditing = document.activeElement?.tagName === 'INPUT' || 
                      document.activeElement?.tagName === 'TEXTAREA' ||
                      document.activeElement?.getAttribute('contenteditable') === 'true';
    if (isEditing) return;
    deleteNode();
  }

  // Undo / Redo
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const isUndo = (e.key === 'z' || e.key === 'Z') && (isMac ? e.metaKey : e.ctrlKey) && !e.shiftKey;
  const isRedo = ((e.key === 'z' || e.key === 'Z') && (isMac ? e.metaKey : e.ctrlKey) && e.shiftKey) ||
                 ((e.key === 'y' || e.key === 'Y') && (isMac ? e.metaKey : e.ctrlKey));

  if (isUndo) {
    e.preventDefault();
    cancelActiveEdit();
    if (controller.undo()) {
      selectedNodeId = null;
      sidebarManager.hideSidebar();
      updateView();
    }
  }

  if (isRedo) {
    e.preventDefault();
    cancelActiveEdit();
    if (controller.redo()) {
      selectedNodeId = null;
      sidebarManager.hideSidebar();
      updateView();
    }
  }
});

document.querySelector('#mindmap')?.addEventListener('click', (e) => {
  if (e.target === document.querySelector('#mindmap')) {
    selectedNodeId = null;
    d3.selectAll('.markmap-node').classed('selected', false);
    sidebarManager.hideSidebar();
  }
});

// 6. Initial Render
const currentTheme = controller.getTheme();
if (themeSelect) themeSelect.value = currentTheme;
viewManager.applyLayoutSettings(controller, engine);
updateView();
refreshMapList();
setTimeout(() => viewManager.fit(), 800);
