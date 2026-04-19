import { describe, it, expect, beforeEach } from 'vitest';
import { HistoryManager } from './history';
import { MapNode } from '../markdown/parser';

describe('HistoryManager', () => {
  let history: HistoryManager;
  let state1: MapNode, state2: MapNode, state3: MapNode, state4: MapNode;

  beforeEach(() => {
    history = new HistoryManager(3); // Small limit for testing
    state1 = { id: '1', content: 'State 1', children: [] };
    state2 = { id: '1', content: 'State 2', children: [] };
    state3 = { id: '1', content: 'State 3', children: [] };
    state4 = { id: '1', content: 'State 4', children: [] };
  });

  it('should push and undo snapshots', () => {
    history.push(state1);
    const undone = history.undo(state2);
    expect(undone).toEqual(state1);
    expect(history.getStacks().redo).toBe(1);
  });

  it('should redo undone snapshots', () => {
    history.push(state1);
    history.undo(state2);
    const redone = history.redo(state1);
    expect(redone).toEqual(state2);
    expect(history.getStacks().undo).toBe(1);
  });

  it('should respect max depth by shifting out oldest states', () => {
    history = new HistoryManager(2);
    history.push(state1);
    history.push(state2);
    history.push(state3);
    
    // With depth 2, state1 should be gone. Stack should be [state2, state3]
    expect(history.getStacks().undo).toBe(2);
    
    // Current state is state4. Undo should give state3.
    expect(history.undo(state4)).toEqual(state3);
    // Undo again should give state2.
    expect(history.undo(state3)).toEqual(state2);
    // Undo again should be null.
    expect(history.undo(state2)).toBeNull();
  });

  it('should clear history', () => {
    history.push(state1);
    history.clear();
    expect(history.getStacks().undo).toBe(0);
    expect(history.getStacks().redo).toBe(0);
  });

  it('should not push identical consecutive states', () => {
    history.push(state1);
    history.push(state1);
    expect(history.getStacks().undo).toBe(1);
  });
});
