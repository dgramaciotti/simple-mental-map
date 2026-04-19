import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MapStore } from './store';
import { MapNode } from '../markdown/parser';

describe('MapStore Quota Management', () => {
  let store: MapStore;
  const mockNode: MapNode = { id: 'root', content: 'Test', children: [] };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    store = new MapStore();
  });

  it('should trigger onQuotaExceeded when localStorage is full', () => {
    const quotaCallback = vi.fn();
    store.onQuotaExceeded = quotaCallback;

    // Simulate QuotaExceededError such that e.name matches
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      const err = new Error('QuotaExceededError');
      err.name = 'QuotaExceededError';
      throw err;
    });

    store.saveMap('test-id', mockNode);

    expect(setItemSpy).toHaveBeenCalled();
    expect(quotaCallback).toHaveBeenCalled();
    
    setItemSpy.mockRestore();
  });

  it('should not crash if no quota callback is provided', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      const err = new Error('QuotaExceededError');
      err.name = 'QuotaExceededError';
      throw err;
    });

    // Should not throw
    expect(() => store.saveMap('test-id', mockNode)).not.toThrow();
    
    setItemSpy.mockRestore();
  });
});
