import { describe, it, expect } from 'vitest';
import { encodeMarkdown } from './encoder';
import { MapNode } from './parser';

describe('Markdown Encoder', () => {
  it('should encode a single root node', () => {
    const node: MapNode = {
      id: 'root-id',
      content: 'Root',
      children: []
    };
    expect(encodeMarkdown(node)).toBe('# Root');
  });

  it('should encode nested nodes to Level 3', () => {
    const node: MapNode = {
      id: 'r',
      content: 'Root',
      children: [{
        id: 'c1',
        content: 'L1',
        children: [{
          id: 'c2',
          content: 'L2',
          children: []
        }]
      }]
    };
    expect(encodeMarkdown(node)).toBe('# Root\n\n## L1\n\n### L2');
  });

  it('should handle special characters in content', () => {
    const node: MapNode = {
      id: 'r',
      content: 'B&W < "Quotes" >',
      children: []
    };
    expect(encodeMarkdown(node)).toBe('# B&W < "Quotes" >');
  });
});
