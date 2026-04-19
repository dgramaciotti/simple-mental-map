import { describe, it, expect } from 'vitest';
import { parseMarkdown } from './parser';

describe('Markdown Parser', () => {
  it('should parse a single root heading', () => {
    const md = '# Root';
    const result = parseMarkdown(md);
    expect(result).toEqual({
      id: expect.any(String),
      content: 'Root',
      children: []
    });
  });

  it('should parse nested headings', () => {
    const md = '# Root\n## Child';
    const result = parseMarkdown(md);
    expect(result.content).toBe('Root');
    expect(result.children).toHaveLength(1);
    expect(result.children[0].content).toBe('Child');
  });

  it('should parse list items as children', () => {
    const md = '# Root\n- Item 1\n- Item 2';
    const result = parseMarkdown(md);
    expect(result.children).toHaveLength(2);
    expect(result.children[0].content).toBe('Item 1');
    expect(result.children[1].content).toBe('Item 2');
  });

  it('should parse deep nesting', () => {
    const md = '# Root\n- Level 1\n  - Level 2\n    - Level 3';
    const result = parseMarkdown(md);
    expect(result.children[0].children[0].children[0].content).toBe('Level 3');
  });

  it('should generate unique IDs for all nodes', () => {
    const md = '# Root\n- A\n- B\n  - C';
    const result = parseMarkdown(md);
    const ids = new Set();
    const collectIds = (node: any) => {
      ids.add(node.id);
      node.children.forEach(collectIds);
    };
    collectIds(result);
    // root + A + B + C = 4 nodes
    expect(ids.size).toBe(4);
  });

  it('should unescape HTML entities in content', () => {
    const md = '# B & W'; // markmap converts & to &amp;
    const result = parseMarkdown(md);
    expect(result.content).toBe('B & W');
  });
});
