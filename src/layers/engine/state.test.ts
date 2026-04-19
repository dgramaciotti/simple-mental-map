import { describe, it, expect, beforeEach } from 'vitest';
import { StateEngine } from './state';
import { MapNode } from '../markdown/parser';

describe('StateEngine', () => {
  let initialRoot: MapNode;
  let engine: StateEngine;

  beforeEach(() => {
    initialRoot = {
      id: 'root',
      content: 'Root',
      children: [
        {
          id: 'child1',
          content: 'Child 1',
          children: []
        }
      ]
    };
    engine = new StateEngine(initialRoot);
  });

  describe('Management', () => {
    it('should set a new root', () => {
      const newRoot = { id: 'new', content: 'New', children: [] };
      engine.setRoot(newRoot);
      expect(engine.getRoot().id).toBe('new');
    });

    it('should serialize to a deep clone', () => {
      const serialized = engine.serialize();
      expect(serialized).toEqual(initialRoot);
      expect(serialized).not.toBe(engine.getRoot()); // Should be a clone
    });
  });

  describe('findNode', () => {
    it('should find an existing node', () => {
      const node = engine.findNode('child1');
      expect(node).not.toBeNull();
      expect(node?.content).toBe('Child 1');
    });

    it('should find the root node', () => {
      const node = engine.findNode('root');
      expect(node?.id).toBe('root');
    });

    it('should return null for unknown id', () => {
      const node = engine.findNode('nope');
      expect(node).toBeNull();
    });
  });

  it('should add a child node and return its ID', () => {
    const newId = engine.addNode('child1', 'Grandchild');
    expect(newId).toBeDefined();
    expect(typeof newId).toBe('string');
    
    const root = engine.getRoot();
    expect(root.children[0].children[0].content).toBe('Grandchild');
    expect(root.children[0].children[0].id).toBe(newId);
  });

  it('should remove a node', () => {
    engine.removeNode('child1');
    const root = engine.getRoot();
    expect(root.children).toHaveLength(0);
  });

  it('should not remove the root node', () => {
    engine.removeNode('root');
    expect(engine.getRoot()).not.toBeNull();
    expect(engine.getRoot().id).toBe('root');
  });

  it('should move a node to a different parent', () => {
    // Setup: root -> child1, root -> child2
    engine.addNode('root', 'Child 2');
    const child2Id = engine.getRoot().children[1].id;
    
    // Move child1 to be a child of child2
    engine.moveNode('child1', child2Id);
    
    const root = engine.getRoot();
    expect(root.children).toHaveLength(1); // Only child2 left
    expect(root.children[0].content).toBe('Child 2');
    expect(root.children[0].children[0].id).toBe('child1');
  });

  it('should prevent moving a node under its own descendant', () => {
    engine.addNode('child1', 'Grandchild');
    const grandchildId = engine.getRoot().children[0].children[0].id!;
    
    // Try to move child1 to its own grandchild
    expect(() => engine.moveNode('child1', grandchildId)).toThrow();
  });

  it('should allow moving a node back to the root', () => {
    const child2Id = engine.addNode('child1', 'Child 2')!;
    
    // Structure: root -> child1 -> child2
    // Move child2 to root
    engine.moveNode(child2Id, 'root');
    
    const root = engine.getRoot();
    expect(root.children).toHaveLength(2);
    expect(root.children[1].id).toBe(child2Id);
    expect(root.children[0].children).toHaveLength(0);
  });

  it('should handle moving a node to its current parent (no-op)', () => {
    const initialStructure = JSON.stringify(engine.getRoot());
    engine.moveNode('child1', 'root');
    expect(JSON.stringify(engine.getRoot())).toBe(initialStructure);
  });

  it('should update node style', () => {
    engine.updateNodeStyle('child1', { textColor: '#ff0000', lineColor: '#00ff00', fontSize: 24 });
    const node = engine.findNode('child1');
    expect(node?.style?.textColor).toBe('#ff0000');
    expect(node?.style?.lineColor).toBe('#00ff00');
    expect(node?.style?.fontSize).toBe(24);
  });
});
