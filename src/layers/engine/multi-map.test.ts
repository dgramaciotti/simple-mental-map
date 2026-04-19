import { describe, it, expect, beforeEach } from 'vitest';
import { MapController } from './controller';
import { MapStore } from './store';

describe('Multi-Map Integration (MapController)', () => {
  let store: MapStore;
  let controller: MapController;
  const DEFAULT_MD = '# Init';

  beforeEach(() => {
    // Mock localStorage
    const mockStorage: Record<string, string> = {};
    global.localStorage = {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => { mockStorage[key] = value; },
      removeItem: (key: string) => { delete mockStorage[key]; },
      clear: () => { for (const key in mockStorage) delete mockStorage[key]; },
      length: 0,
      key: (index: number) => Object.keys(mockStorage)[index] || null,
    } as any;

    store = new MapStore();
    controller = new MapController({ store, defaultMarkdown: DEFAULT_MD });
  });

  it('should initialize with a default map', () => {
    expect(controller.listMaps()).toHaveLength(1);
    expect(controller.getEngine().getRoot().content).toBe('Init');
  });

  it('should create and switch to a new map', () => {
    const id2 = controller.createNewMap('New Map');
    expect(controller.listMaps()).toHaveLength(2);
    expect(controller.getActiveId()).toBe(id2);
    expect(controller.getEngine().getRoot().content).toBe('New Map');
  });

  it('should maintain independent content between maps', () => {
    const id1 = controller.getActiveId();
    controller.getEngine().getRoot().content = 'Changed 1';
    
    controller.createNewMap('Map 2');
    controller.getEngine().getRoot().content = 'Changed 2';
    
    // Switch back to Map 1
    controller.switchMap(id1);
    expect(controller.getEngine().getRoot().content).toBe('Changed 1');
  });

  it('should rename a map independently from its content', () => {
    const id = controller.getActiveId();
    const rootTextBefore = controller.getEngine().getRoot().content;
    
    controller.renameMap(id, 'New Sidebar Name');
    
    expect(controller.listMaps()[0].name).toBe('New Sidebar Name');
    expect(controller.getEngine().getRoot().content).toBe(rootTextBefore); // Should stay independent
  });

  it('should handle map deletion and switch active map', () => {
    const id1 = controller.getActiveId();
    const id2 = controller.createNewMap('Map 2');
    
    expect(controller.getActiveId()).toBe(id2);
    
    controller.deleteMap(id2);
    expect(controller.listMaps()).toHaveLength(1);
    expect(controller.getActiveId()).toBe(id1);
  });

  it('should import a new map from markdown', async () => {
    const md = '# Imported Root\n- Node 1\n- Node 2';
    const newId = await controller.importMap(md);
    
    expect(newId).toBeDefined();
    expect(controller.listMaps()).toHaveLength(2);
    expect(controller.getActiveId()).toBe(newId);
    expect(controller.getEngine().getRoot().content).toBe('Imported Root');
    expect(controller.getEngine().getRoot().children).toHaveLength(2);
  });

  it('should persist renamed map name across application restarts', () => {
    const id = controller.getActiveId();
    controller.renameMap(id, 'Persisted Name');
    
    // Simulate restart by creating new store/controller using same storage
    const newStore = new MapStore();
    const newController = new MapController({ store: newStore, defaultMarkdown: DEFAULT_MD });
    
    const map = newController.listMaps().find(m => m.id === id);
    expect(map?.name).toBe('Persisted Name');
  });

  it('should heal itself by removing broken config entries if data is missing', () => {
    const id = controller.getActiveId();
    
    // Simulate data corruption by removing ONLY the data key but keeping it in config
    localStorage.removeItem(`mindmap-data-${id}`);
    
    // Re-initialize controller
    const newStore = new MapStore();
    const newController = new MapController({ store: newStore, defaultMarkdown: '# Recovered' });
    
    // Verify:
    // 1. The broken map entry should be GONE
    // 2. A new default map should have been created
    const maps = newController.listMaps();
    expect(maps).toHaveLength(1);
    expect(maps[0].id).not.toBe(id);
    expect(newController.getEngine().getRoot().content).toBe('Recovered');
  });

  it('should import indented text (Edraw style) correctly via the controller', async () => {
    const text = 'Root\n\tChild 1\n\tChild 2';
    const newId = await controller.importMap(text);
    
    expect(controller.getActiveId()).toBe(newId);
    const root = controller.getEngine().getRoot();
    expect(root.content).toBe('Root');
    expect(root.children).toHaveLength(2);
    expect(root.children[0].content).toBe('Child 1');
  });

  it('should maintain state correctly after importing and deleting maps', async () => {
    const id1 = controller.getActiveId();
    
    // Import a map
    const id2 = await controller.importMap('# Map 2');
    
    // Delete the original map
    controller.deleteMap(id1);
    
    // Verify currently active is Map 2
    expect(controller.getActiveId()).toBe(id2);
    expect(controller.listMaps()).toHaveLength(1);
    
    // Final check: persistent across "restart"
    const newStore = new MapStore();
    const newController = new MapController({ store: newStore, defaultMarkdown: '# Fallback' });
    expect(newController.getActiveId()).toBe(id2);
    expect(newController.getEngine().getRoot().content).toBe('Map 2');
  });

  it('should persist current engine state via saveCurrent()', () => {
    const id = controller.getActiveId();
    const engine = controller.getEngine();
    
    engine.getRoot().content = 'Updated Content';
    controller.saveCurrent();
    
    // Reload from store
    const root = store.loadMap(id);
    expect(root?.content).toBe('Updated Content');
  });

  it('should get and set global layout settings', () => {
    // Check defaults
    const settings = controller.getLayoutSettings();
    expect(settings.fontSize).toBe(13);
    
    // Set new values
    controller.setLayoutSettings({
      fontSize: 20,
      textColor: '#ff0000',
      lineColor: '#00ff00',
      lineWidth: 4,
      maxNodeWidth: 300,
      nodePadding: 20
    });
    
    // Verify
    const updated = controller.getLayoutSettings();
    expect(updated.fontSize).toBe(20);
    expect(updated.textColor).toBe('#ff0000');
    expect(updated.lineColor).toBe('#00ff00');
    expect(updated.lineWidth).toBe(4);
    expect(updated.maxNodeWidth).toBe(300);
    expect(updated.nodePadding).toBe(20);
  });
});
