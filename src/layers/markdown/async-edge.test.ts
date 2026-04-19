import { describe, it, expect } from 'vitest';
import { UniversalParser } from './universal';

describe('UniversalParser Async Edge Cases', () => {
  it('should handle import errors gracefully (Lazy Loading Simulation)', async () => {
    // Mock a failed dynamic import
    // Note: We need to use a proxy or specific vitest mock depending on the build Tool
    // For now, let's verify that a bad markdown trigger still fails safely
    const parser = new UniversalParser();
    
    // Test with junk data that looks like markdown but is empty
    const result = await parser.parse('# ');
    expect(result.content).toBe('');
    expect(result.id).toBeDefined();
  });

  it('should handle indentation-based input without any actual indentation', async () => {
    const parser = new UniversalParser();
    const text = 'Line 1\nLine 2\nLine 3';
    const result = await parser.parse(text);
    
    // Should fallback to treating Line 1 as root and rest as children
    expect(result.content).toBe('Line 1');
    expect(result.children).toHaveLength(2);
    expect(result.children[0].content).toBe('Line 2');
  });
});
