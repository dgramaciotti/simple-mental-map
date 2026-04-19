import { describe, it, expect, beforeEach } from 'vitest';
import { MapStore } from './store';
import { MapNode } from '../markdown/parser';

describe('Map Persistence Integration', () => {
  let store: MapStore;

  beforeEach(() => {
    localStorage.clear();
    store = new MapStore();
  });

  it('should persist rich markdown content (HTML) in nodes', () => {
    const richRoot: MapNode = {
      id: 'root',
      content: '<strong>Bold</strong> <em>Italic</em>',
      children: []
    };
    
    const mapId = store.createMap('Rich Map', richRoot);
    
    // Create a new store instance to simulate refresh
    const newStore = new MapStore();
    const loadedMap = newStore.loadMap(mapId);
    
    expect(loadedMap?.content).toBe('<strong>Bold</strong> <em>Italic</em>');
  });

  it('should persist per-node styles (textColor, lineColor, fontSize)', () => {
    const styledRoot: MapNode = {
      id: 'root',
      content: 'Styled Root',
      style: { textColor: '#ff0000', lineColor: '#00ff00', fontSize: 24 },
      children: [
        {
          id: 'child',
          content: 'Styled Child',
          style: { textColor: '#0000ff', fontSize: 18 },
          children: []
        }
      ]
    };

    const mapId = store.createMap('Styled Map', styledRoot);
    
    // Simulate refresh
    const newStore = new MapStore();
    const loadedMap = newStore.loadMap(mapId);
    
    expect(loadedMap?.style?.textColor).toBe('#ff0000');
    expect(loadedMap?.style?.lineColor).toBe('#00ff00');
    expect(loadedMap?.style?.fontSize).toBe(24);
    expect(loadedMap?.children[0].style?.textColor).toBe('#0000ff');
    expect(loadedMap?.children[0].style?.fontSize).toBe(18);
  });

  it('should persist global layout settings', () => {
    const config = store.getConfig();
    store.saveConfig({
      ...config,
      fontSize: 20,
      spacing: 120,
      branchWidth: 2.5
    });
    
    // Simulate refresh
    const newStore = new MapStore();
    const loadedConfig = newStore.getConfig();
    
    expect(loadedConfig.fontSize).toBe(20);
    expect(loadedConfig.spacing).toBe(120);
    expect(loadedConfig.branchWidth).toBe(2.5);
  });
});
