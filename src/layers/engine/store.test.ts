import { describe, it, expect, beforeEach } from 'vitest';
import { MapStore } from './store';

describe('MapStore', () => {
  let store: MapStore;

  beforeEach(() => {
    // Mock localStorage since happy-dom might not satisfy it in all contexts
    const mockStorage: Record<string, string> = {};
    global.localStorage = {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => { mockStorage[key] = value; },
      removeItem: (key: string) => { delete mockStorage[key]; },
      clear: () => { for (const key in mockStorage) delete mockStorage[key]; },
      get length() { return Object.keys(mockStorage).length; },
      key: (index: number) => Object.keys(mockStorage)[index] || null,
    } as any;

    store = new MapStore();
  });

  it('should start with an empty config', () => {
    const config = store.getConfig();
    expect(config.maps).toHaveLength(0);
    expect(config.activeMapId).toBe('');
  });

  it('should persist new layout settings', () => {
    const config = store.getConfig();
    config.textColor = '#123456';
    config.lineColor = '#654321';
    config.lineWidth = 3;
    config.maxNodeWidth = 200;
    config.nodePadding = 15;
    store.saveConfig(config);

    const reloaded = store.getConfig();
    expect(reloaded.textColor).toBe('#123456');
    expect(reloaded.lineColor).toBe('#654321');
    expect(reloaded.lineWidth).toBe(3);
    expect(reloaded.maxNodeWidth).toBe(200);
    expect(reloaded.nodePadding).toBe(15);
  });

  it('should create and save a map', () => {
    const root = { id: 'root', content: 'Test Map', children: [] };
    const id = store.createMap('Test Map', root);
    
    expect(id).toBeDefined();
    
    const config = store.getConfig();
    expect(config.maps).toHaveLength(1);
    expect(config.maps[0].id).toBe(id);
    expect(config.activeMapId).toBe(id);
    
    const loaded = store.loadMap(id);
    expect(loaded?.content).toBe('Test Map');
  });

  it('should not update map name automatically on saveMap', () => {
    const id = store.createMap('Manual Name', { id: 'r', content: 'Manual Name', children: [] });
    
    // Changing root content should NOT change map name in meta
    store.saveMap(id, { id: 'r', content: 'New Root Content', children: [] });
    
    const config = store.getConfig();
    expect(config.maps[0].name).toBe('Manual Name');
  });

  it('should update map name via updateMapName', () => {
    const id = store.createMap('Original', { id: 'r', content: 'O', children: [] });
    store.updateMapName(id, 'Renamed');
    
    expect(store.listMaps()[0].name).toBe('Renamed');
  });

  it('should delete a map and cleanup storage', () => {
    const id = store.createMap('To Delete', { id: 'r', content: 'D', children: [] });
    store.deleteMap(id);
    
    expect(store.listMaps()).toHaveLength(0);
    expect(store.loadMap(id)).toBeNull();
  });

  it('should prune orphaned data keys on getConfig()', () => {
    // 1. Setup config with ONE valid map
    const root = { id: 'root', content: 'Valid', children: [] };
    const validId = store.createMap('Valid', root);

    // 2. Inject a "ghost" orphaned key manually
    localStorage.setItem('mindmap-data-ghost-123', JSON.stringify({ content: 'I am a ghost' }));
    
    // 3. Trigger getConfig() which calls pruneOrphans
    store.getConfig();

    // 4. Verify ghost is gone but valid map remains
    expect(localStorage.getItem('mindmap-data-ghost-123')).toBeNull();
    expect(localStorage.getItem(`mindmap-data-${validId}`)).not.toBeNull();
  });

  it('should switch active map and persist', () => {
    const id1 = store.createMap('Map 1', { id: 'r', content: 'M1', children: [] });
    const id2 = store.createMap('Map 2', { id: 'r', content: 'M2', children: [] });
    
    // Last created becomes active by default in our implementation if empty, 
    // but lets check
    store.setActiveMapId(id1);
    expect(store.getActiveMapId()).toBe(id1);
    
    store.setActiveMapId(id2);
    expect(store.getActiveMapId()).toBe(id2);
  });
});
