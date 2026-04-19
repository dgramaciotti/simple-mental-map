import { MapNode } from '../markdown/parser';

export class HistoryManager {
  private undoStack: MapNode[] = [];
  private redoStack: MapNode[] = [];
  private maxDepth: number;

  constructor(maxDepth: number = 10) {
    this.maxDepth = maxDepth;
  }

  push(state: MapNode): void {
    // Basic snapshot-based history
    // We clone the state to ensure the history stack remains immutable
    const snapshot = JSON.parse(JSON.stringify(state));
    
    // Check if the new state is actually different from the last one
    if (this.undoStack.length > 0) {
      const last = JSON.stringify(this.undoStack[this.undoStack.length - 1]);
      if (last === JSON.stringify(snapshot)) return;
    }

    this.undoStack.push(snapshot);
    this.redoStack = []; // Clear redo stack on new action

    if (this.undoStack.length > this.maxDepth) {
      this.undoStack.shift();
    }
  }

  undo(currentState: MapNode): MapNode | null {
    if (this.undoStack.length === 0) return null;

    // Save current state to redo stack
    this.redoStack.push(JSON.parse(JSON.stringify(currentState)));
    if (this.redoStack.length > this.maxDepth) {
      this.redoStack.shift();
    }

    return this.undoStack.pop() || null;
  }

  redo(currentState: MapNode): MapNode | null {
    if (this.redoStack.length === 0) return null;

    // Save current state to undo stack
    this.undoStack.push(JSON.parse(JSON.stringify(currentState)));
    if (this.undoStack.length > this.maxDepth) {
      this.undoStack.shift();
    }

    return this.redoStack.pop() || null;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  getStacks() {
    return {
      undo: this.undoStack.length,
      redo: this.redoStack.length
    };
  }
}
