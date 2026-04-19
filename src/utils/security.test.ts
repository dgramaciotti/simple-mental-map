import { describe, it, expect } from 'vitest';
import { sanitizeHTML } from './security';

describe('sanitizeHTML', () => {
  it('should preserve safe text', () => {
    const input = 'Hello World';
    expect(sanitizeHTML(input)).toBe('Hello World');
  });

  it('should preserve allowed tags', () => {
    const input = '<strong>Bold</strong> <em>Italic</em> <code>Code</code>';
    expect(sanitizeHTML(input)).toContain('<strong>Bold</strong>');
    expect(sanitizeHTML(input)).toContain('<em>Italic</em>');
    expect(sanitizeHTML(input)).toContain('<code>Code</code>');
  });

  it('should remove script tags', () => {
    const input = 'Safe<script>alert("xss")</script>Text';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
    expect(result).toBe('SafeText');
  });

  it('should strip event handler attributes', () => {
    const input = '<img src="x" onerror="alert(1)">';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('onerror');
    expect(result).toContain('<img src="x">');
  });

  it('should block javascript: links', () => {
    const input = '<a href="javascript:alert(1)">Click me</a>';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('javascript:');
    expect(result).toContain('<a>Click me</a>');
  });

  it('should allow safe links', () => {
    const input = '<a href="https://google.com">Google</a>';
    const result = sanitizeHTML(input);
    expect(result).toContain('href="https://google.com"');
  });

  it('should strip nested dangerous elements', () => {
    const input = '<div><p><script>evil()</script>Safe</p></div>';
    expect(sanitizeHTML(input)).toBe('<div><p>Safe</p></div>');
  });
});
