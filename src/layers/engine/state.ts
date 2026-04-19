import { MapNode } from '../markdown/parser';

export class StateEngine {
  private root: MapNode;

  constructor(initialRoot: MapNode) {
    this.root = JSON.parse(JSON.stringify(initialRoot));
  }

  getRoot(): MapNode {
    return this.root;
  }

  setRoot(root: MapNode): void {
    this.root = JSON.parse(JSON.stringify(root));
  }

  serialize(): MapNode {
    return JSON.parse(JSON.stringify(this.root));
  }

  findNode(id: string): MapNode | null {
    const result = this.findNodeAndParent(id, this.root);
    return result ? result.node : null;
  }

  private findNodeAndParent(id: string, current: MapNode, parent: MapNode | null = null): { node: MapNode, parent: MapNode | null } | null {
    if (current.id === id) return { node: current, parent };
    for (const child of current.children) {
      const result = this.findNodeAndParent(id, child, current);
      if (result) return result;
    }
    return null;
  }

  private isDescendant(parentId: string, nodeId: string): boolean {
    const parent = this.findNodeAndParent(parentId, this.root);
    if (!parent) return false;
    
    const search = (current: MapNode): boolean => {
      if (current.id === nodeId) return true;
      return current.children.some(search);
    };

    return search(parent.node);
  }

  addNode(parentId: string, content: string): string | null {
    const result = this.findNodeAndParent(parentId, this.root);
    if (result) {
      const newNodeId = Math.random().toString(36).substring(2, 9);
      result.node.children.push({
        id: newNodeId,
        content,
        children: []
      });
      return newNodeId;
    }
    return null;
  }

  removeNode(id: string): void {
    const result = this.findNodeAndParent(id, this.root);
    if (result && result.parent) {
      result.parent.children = result.parent.children.filter(c => c.id !== id);
    }
  }

  moveNode(id: string, newParentId: string): void {
    const nodeResult = this.findNodeAndParent(id, this.root);
    const parentResult = this.findNodeAndParent(newParentId, this.root);

    if (!nodeResult || !parentResult) return;
    if (!nodeResult.parent) {
      throw new Error('Cannot move the root node');
    }

    // Validation: prevent moving a node under itself or its descendants
    if (this.isDescendant(id, newParentId)) {
      throw new Error('Cannot move a node under its own descendant');
    }

    // Remove from old parent
    nodeResult.parent.children = nodeResult.parent.children.filter(c => c.id !== id);

    // Add to new parent
    parentResult.node.children.push(nodeResult.node);
  }

  countNodes(node: MapNode): number {
    let count = 1;
    for (const child of node.children) {
      count += this.countNodes(child);
    }
    return count;
  }
}
