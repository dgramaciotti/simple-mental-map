import { describe, it, expect } from 'vitest';
import { htmlToMarkdown, markdownToHtml } from './html-md';

describe('html-md utilities', () => {
  describe('htmlToMarkdown', () => {
    it('should convert strong to bold', () => {
      expect(htmlToMarkdown('<strong>bold</strong>')).toBe('**bold**');
    });

    it('should convert em to italic', () => {
      expect(htmlToMarkdown('<em>italic</em>')).toBe('*italic*');
    });

    it('should convert code to inline code', () => {
      expect(htmlToMarkdown('<code>code</code>')).toBe('`code`');
    });

    it('should convert del to strikethrough', () => {
      expect(htmlToMarkdown('<del>strike</del>')).toBe('~~strike~~');
    });

    it('should convert simple links', () => {
      expect(htmlToMarkdown('<a href="https://example.com">text</a>')).toBe('[text](https://example.com)');
    });

    it('should handle plain text', () => {
      expect(htmlToMarkdown('plain text')).toBe('plain text');
    });

    it('should handle mixed content', () => {
      expect(htmlToMarkdown('<strong>bold</strong> and <em>italic</em>')).toBe('**bold** and *italic*');
    });
    
    it('should handle nested-like simple tags (sequential)', () => {
      expect(htmlToMarkdown('<strong>bold</strong><em>italic</em>')).toBe('**bold***italic*');
    });
  });

  describe('markdownToHtml', () => {
    it('should convert bold to strong', () => {
      expect(markdownToHtml('**bold**')).toBe('<strong>bold</strong>');
    });

    it('should convert italic to em', () => {
      expect(markdownToHtml('*italic*')).toBe('<em>italic</em>');
    });

    it('should convert code to inline code', () => {
      expect(markdownToHtml('`code`')).toBe('<code>code</code>');
    });

    it('should convert strikethrough to del', () => {
      expect(markdownToHtml('~~strike~~')).toBe('<del>strike</del>');
    });

    it('should handle plain text', () => {
      expect(markdownToHtml('plain text')).toBe('plain text');
    });
  });
});
