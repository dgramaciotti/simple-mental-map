import { MapNode } from '../markdown/parser';

export interface MapMeta {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppConfig {
  version: number;
  activeMapId: string;
  themeId?: string;
  fontSize?: number;
  branchWidth?: number;
  spacing?: number;
  maps: MapMeta[];
}

const CONFIG_KEY = 'mindmap-config';
const MAP_DATA_PREFIX = 'mindmap-data-';

export class MapStore {
  getConfig(): AppConfig {
    const raw = localStorage.getItem(CONFIG_KEY);
    const config: AppConfig = raw 
      ? JSON.parse(raw) 
      : { version: 1, activeMapId: '', maps: [] };
    
    // Auto-prune orphaned data keys on load
    this.pruneOrphans(config);
    return config;
  }

  private pruneOrphans(config: AppConfig): void {
    const validIds = new Set(config.maps.map(m => m.id));
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(MAP_DATA_PREFIX)) {
        const id = key.substring(MAP_DATA_PREFIX.length);
        if (!validIds.has(id)) {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(k => {
      localStorage.removeItem(k);
    });
  }

  saveConfig(config: AppConfig): void {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }

  loadMap(id: string): MapNode | null {
    const raw = localStorage.getItem(`${MAP_DATA_PREFIX}${id}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error(`[MapStore] Failed to load map ${id}`, e);
      return null;
    }
  }

  saveMap(id: string, root: MapNode): void {
    localStorage.setItem(`${MAP_DATA_PREFIX}${id}`, JSON.stringify(root));
    
    // Update updatedAt in config
    const config = this.getConfig();
    const map = config.maps.find(m => m.id === id);
    if (map) {
      map.updatedAt = new Date().toISOString();
      this.saveConfig(config);
    }
  }

  updateMapName(id: string, newName: string): void {
    const config = this.getConfig();
    const map = config.maps.find(m => m.id === id);
    if (map) {
      map.name = newName;
      map.updatedAt = new Date().toISOString();
      this.saveConfig(config);
    }
  }

  deleteMap(id: string): void {
    localStorage.removeItem(`${MAP_DATA_PREFIX}${id}`);
    
    let config = this.getConfig();
    config.maps = config.maps.filter(m => m.id !== id);
    
    if (config.activeMapId === id) {
      config.activeMapId = config.maps.length > 0 ? config.maps[0].id : '';
    }
    
    this.saveConfig(config);
  }

  createMap(name: string, root: MapNode): string {
    const id = Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();
    
    const config = this.getConfig();
    config.maps.push({
      id,
      name: name || root.content || 'New Map',
      createdAt: now,
      updatedAt: now
    });
    
    if (!config.activeMapId) {
      config.activeMapId = id;
    }
    
    this.saveConfig(config);
    this.saveMap(id, root);
    
    return id;
  }

  listMaps(): MapMeta[] {
    return this.getConfig().maps;
  }

  getActiveMapId(): string {
    return this.getConfig().activeMapId;
  }

  setActiveMapId(id: string): void {
    const config = this.getConfig();
    if (config.maps.some(m => m.id === id)) {
      config.activeMapId = id;
      this.saveConfig(config);
    }
  }
}
