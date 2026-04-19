import { describe, it, expect } from 'vitest';
import { encodePlainText } from './text-encoder';
import { MapNode } from './parser';

describe('PlainTextEncoder', () => {
  it('should encode a simple root node', () => {
    const root: MapNode = { id: 'root', content: 'Root', children: [] };
    expect(encodePlainText(root)).toBe('Root');
  });

  it('should encode a tree with single-level children', () => {
    const root: MapNode = {
      id: 'root',
      content: 'Root',
      children: [
        { id: '1', content: 'Child 1', children: [] },
        { id: '2', content: 'Child 2', children: [] }
      ]
    };
    // Default indentation is typically TAB
    expect(encodePlainText(root)).toBe('Root\n\tChild 1\n\tChild 2');
  });

  it('should encode deeply nested children', () => {
    const root: MapNode = {
      id: 'root',
      content: 'Root',
      children: [{
        id: '1',
        content: 'Child 1',
        children: [{
          id: '1.1',
          content: 'Grandchild',
          children: []
        }]
      }]
    };
    expect(encodePlainText(root)).toBe('Root\n\tChild 1\n\t\tGrandchild');
  });

  it('should support custom indentation (e.g., 2 spaces)', () => {
    const root: MapNode = {
      id: 'root',
      content: 'Root',
      children: [{ id: '1', content: 'Child 1', children: [] }]
    };
    expect(encodePlainText(root, { indent: '  ' })).toBe('Root\n  Child 1');
  });
});
