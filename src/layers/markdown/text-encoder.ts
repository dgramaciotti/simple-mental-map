import { MapNode } from './parser';

export interface TextExportOptions {
  indent?: string;
}

/**
 * Encodes a MapNode tree into a plain text string with indentation.
 * Useful for exporting to .txt files that follow standard hierarchy.
 */
export function encodePlainText(node: MapNode, options: TextExportOptions = {}): string {
  const indent = options.indent ?? '\t';
  const lines: string[] = [];

  function walk(n: MapNode, level: number) {
    const currentIndent = indent.repeat(level);
    lines.push(`${currentIndent}${n.content}`);
    
    for (const child of n.children) {
      walk(child, level + 1);
    }
  }

  walk(node, 0);
  return lines.join('\n');
}
