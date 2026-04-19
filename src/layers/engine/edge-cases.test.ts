import { describe, it, expect } from 'vitest';
import { StateEngine } from './state';
import { MapNode } from '../markdown/parser';

describe('Edge Case & Stress Tests', () => {

  it('should handle extremely deep nesting (Recursion Limit Check)', () => {
    let root: MapNode = { id: 'root', content: 'Root', children: [] };
    let current = root;
    for (let i = 0; i < 200; i++) {
      const newNode = { id: `node-${i}`, content: `Level ${i}`, children: [] };
      current.children.push(newNode);
      current = newNode;
    }

    const engine = new StateEngine(root);
    expect(engine.countNodes(root)).toBe(201);
    
    // Test a deep lookup
    const deepNode = engine.findNode('node-199');
    expect(deepNode?.content).toBe('Level 199');

    // Test a deep serialization
    const copy = engine.serialize();
    expect(copy.id).toBe('root');
  });

  it('should handle special character injection and escaping', () => {
    const maliciousContent = '<script>alert("xss")</script> & " \' >';
    const root: MapNode = { 
      id: 'root', 
      content: maliciousContent, 
      children: [] 
    };
    const engine = new StateEngine(root);
    
    expect(engine.getRoot().content).toBe(maliciousContent);
  });

  it('should prevent circular references during move operations', () => {
    const root: MapNode = { 
      id: 'root', 
      content: 'Root', 
      children: [
        { id: 'child', content: 'Child', children: [] }
      ] 
    };
    const engine = new StateEngine(root);

    // Attempt to move root into its own child (this should be prevented by move logic)
    expect(() => {
        engine.moveNode('root', 'child');
    }).toThrow();
  });

  it('should handle truly empty maps (Integrity)', () => {
    const root: MapNode = { id: 'root', content: '', children: [] };
    const engine = new StateEngine(root);
    expect(engine.getRoot().content).toBe('');
    
    engine.addNode('root', 'First real node');
    expect(engine.getRoot().children).toHaveLength(1);
  });
});
