import { describe, it, expect } from 'vitest';
import { UniversalParser } from './universal';

describe('UniversalParser', () => {
  const parser = new UniversalParser();

  describe('Markdown Detection', () => {
    it('should parse markdown headers correctly', async () => {
      const md = '# Root\n## Child 1\n### Grandchild\n## Child 2';
      const root = await parser.parse(md);
      
      expect(root.content).toBe('Root');
      expect(root.children).toHaveLength(2);
      expect(root.children[0].content).toBe('Child 1');
      expect(root.children[0].children[0].content).toBe('Grandchild');
    });

    it('should parse markdown lists correctly', async () => {
      const md = '# Root\n- Item 1\n  - Sub 1\n- Item 2';
      const root = await parser.parse(md);
      
      expect(root.content).toBe('Root');
      expect(root.children).toHaveLength(2);
      expect(root.children[0].children[0].content).toBe('Sub 1');
    });
  });

  describe('Indentation-based Text (Edraw Style)', () => {
    it('should parse TAB-indented text', async () => {
      const text = 'Root\n\tChild 1\n\t\tGrandchild\n\tChild 2';
      const root = await parser.parse(text);
      
      expect(root.content).toBe('Root');
      expect(root.children).toHaveLength(2);
      expect(root.children[0].content).toBe('Child 1');
      expect(root.children[0].children[0].content).toBe('Grandchild');
    });

    it('should parse SPACE-indented text (2 spaces)', async () => {
      const text = 'Root\n  Child 1\n    Grandchild\n  Child 2';
      const root = await parser.parse(text);
      
      expect(root.content).toBe('Root');
      expect(root.children).toHaveLength(2);
      expect(root.children[0].children[0].content).toBe('Grandchild');
    });

    it('should parse SPACE-indented text (4 spaces)', async () => {
      const text = 'Root\n    Child 1\n        Grandchild\n    Child 2';
      const root = await parser.parse(text);
      
      expect(root.content).toBe('Root');
      expect(root.children).toHaveLength(2);
      expect(root.children[0].children[0].content).toBe('Grandchild');
    });
  });

  describe('Flash/Fallback Logic (exemplo.txt Style)', () => {
    it('should handle flat text by nesting under first line as root', async () => {
      const text = 'Topic 1\nTopic 2\nTopic 3';
      const root = await parser.parse(text);
      
      expect(root.content).toBe('Topic 1');
      expect(root.children).toHaveLength(2);
      expect(root.children[0].content).toBe('Topic 2');
      expect(root.children[1].content).toBe('Topic 3');
    });

    it('should handle empty or whitespace-only strings', async () => {
      const root = await parser.parse('   \n  ');
      expect(root.content).toBe('Untitled Map');
      expect(root.children).toHaveLength(0);
    });

    it('should handle Windows-style CRLF line endings', async () => {
      const text = 'Root\r\n\tChild 1\r\n\tChild 2';
      const root = await parser.parse(text);
      expect(root.content).toBe('Root');
      expect(root.children).toHaveLength(2);
      expect(root.children[0].content).toBe('Child 1');
    });

    it('should skip blank lines and avoid ghost nodes', async () => {
      const text = 'Root\n\n\n\tItem 1\n\n\tItem 2\n';
      const root = await parser.parse(text);
      expect(root.content).toBe('Root');
      expect(root.children).toHaveLength(2);
      expect(root.children[0].content).toBe('Item 1');
    });
  });
});
