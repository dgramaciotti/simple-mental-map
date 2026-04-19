import { MapNode } from './parser';

export function encodeMarkdown(node: MapNode, level: number = 1): string {
  const prefix = '#'.repeat(level);
  const currentLine = `${prefix} ${node.content}`;
  const childrenLines = node.children.map(child => encodeMarkdown(child, level + 1));
  
  if (childrenLines.length === 0) {
    return currentLine;
  }
  
  return [currentLine, ...childrenLines].join('\n\n');
}
