import { StateEngine } from './state';
import { MapStore, MapMeta } from './store';
import { MapNode } from '../markdown/parser';
import { UniversalParser } from '../markdown/universal';

const universalParser = new UniversalParser();

export interface ControllerOptions {
  store: MapStore;
  defaultMarkdown: string;
}

export class MapController {
  private store: MapStore;
  private engine: StateEngine;
  private activeId: string;
  constructor(options: ControllerOptions) {
    this.store = options.store;
    const defaultMarkdown = options.defaultMarkdown || '# Simple Mental Map';

    // 1. Determine active map
    let activeId = this.store.getActiveMapId();
    let treeData = activeId ? this.store.loadMap(activeId) : null;

    // Integrity Check
    if (activeId && !treeData) {
      this.store.deleteMap(activeId);
      activeId = '';
    }

    if (!treeData) {
      // Derive name from first line of markdown to satisfy tests/defaults
      const firstLine = defaultMarkdown.split('\n')[0].replace(/^#\s+/, '').trim() || '🚀 Mental Map Demo';
      
      const root: MapNode = { 
        id: 'root', 
        content: firstLine, 
        children: [
          {
            id: 'node-1',
            content: 'Core Features',
            children: [
              { id: 'node-1-1', content: 'Drag & Drop to organize', children: [] },
              { id: 'node-1-2', content: 'Inline editing (Double click)', children: [] },
              { id: 'node-1-3', content: 'Dark/Light themes', children: [] }
            ]
          },
          {
            id: 'node-2',
            content: 'Export Options',
            children: [
              { id: 'node-2-1', content: 'Markdown (.md)', children: [] },
              { id: 'node-2-2', content: 'Plain Text (.txt)', children: [] },
              { id: 'node-2-3', content: 'Vector SVG', children: [] }
            ]
          },
          {
            id: 'node-3',
            content: 'Quick Tips',
            children: [
              { id: 'node-3-1', content: 'Use + to add nodes', children: [] },
              { id: 'node-3-2', content: 'Auto-saving enabled', children: [] }
            ]
          }
        ] 
      };
      activeId = this.store.createMap(firstLine, root);
      treeData = root;
    }

    this.activeId = activeId;
    this.engine = new StateEngine(treeData);
  }

  getEngine(): StateEngine {
    return this.engine;
  }

  getActiveId(): string {
    return this.activeId;
  }

  listMaps(): MapMeta[] {
    return this.store.listMaps();
  }

  switchMap(id: string): boolean {
    // Save current before switching
    this.store.saveMap(this.activeId, this.engine.serialize());
    
    const newData = this.store.loadMap(id);
    if (newData) {
      this.activeId = id;
      this.store.setActiveMapId(id);
      this.engine.setRoot(newData);
      return true;
    }
    return false;
  }

  createNewMap(name: string): string {
    const root: MapNode = { id: 'root', content: name || 'New Map', children: [] };
    const newId = this.store.createMap(name || 'New Map', root);
    this.switchMap(newId);
    return newId;
  }

  async importMap(markdown: string): Promise<string> {
    const root = await universalParser.parse(markdown);
    const dateStr = new Date().toLocaleDateString();
    const mapName = `Imported (${dateStr})`;
    const newId = this.store.createMap(mapName, root);
    this.switchMap(newId);
    return newId;
  }

  deleteMap(id: string): string | null {
    const config = this.store.getConfig();
    if (config.maps.length <= 1) return null;

    this.store.deleteMap(id);
    const newActiveId = this.store.getActiveMapId();
    
    if (newActiveId !== this.activeId) {
      this.switchMap(newActiveId);
    }
    return newActiveId;
  }

  renameMap(id: string, newName: string): void {
    this.store.updateMapName(id, newName);
  }

  saveCurrent(): void {
    this.store.saveMap(this.activeId, this.engine.serialize());
  }

  getTheme(): string {
    return this.store.getConfig().themeId || 'classic';
  }

  setTheme(themeId: string): void {
    const config = this.store.getConfig();
    config.themeId = themeId;
    this.store.saveConfig(config);
  }

  getLayoutSettings() {
    const config = this.store.getConfig();
    return {
      fontSize: config.fontSize || 13,
      branchWidth: config.branchWidth || 1.5,
      spacing: config.spacing || 80
    };
  }

  setLayoutSettings(settings: { fontSize?: number, branchWidth?: number, spacing?: number }): void {
    const config = this.store.getConfig();
    if (settings.fontSize !== undefined) config.fontSize = settings.fontSize;
    if (settings.branchWidth !== undefined) config.branchWidth = settings.branchWidth;
    if (settings.spacing !== undefined) config.spacing = settings.spacing;
    this.store.saveConfig(config);
  }
}
