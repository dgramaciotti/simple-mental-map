import { MapNode } from './parser';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function unescapeHTML(html: string): string {
  if (!html) return '';
  return html.replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'");
}

export class UniversalParser {
  async parse(input: string): Promise<MapNode> {
    const trimmed = input.trim();
    if (!trimmed) {
      return { id: generateId(), content: 'Untitled Map', children: [] };
    }

    if (this.isMarkdown(trimmed)) {
      return await this.parseAsMarkdown(trimmed);
    }

    return this.parseAsIndented(trimmed);
  }

  private isMarkdown(input: string): boolean {
    const lines = input.split('\n');
    // Simple heuristic: does it have headings or list items in the first few lines?
    return lines.slice(0, 5).some(line => 
      line.trim().startsWith('#') || 
      line.trim().startsWith('- ') || 
      line.trim().startsWith('* ')
    );
  }

  private async parseAsMarkdown(md: string): Promise<MapNode> {
    // Lazy load the heavy parser library
    const { Transformer } = await import('markmap-lib');
    const transformer = new Transformer();
    const { root } = transformer.transform(md);
    
    function mapNode(node: any): MapNode {
      return {
        id: generateId(),
        content: unescapeHTML(node.content || node.v || ''),
        children: (node.children || node.c || []).map(mapNode)
      };
    }

    const parsed = mapNode(root);
    if (!parsed.content && parsed.children.length > 0) {
      return parsed.children[0];
    }
    return parsed;
  }

  private parseAsIndented(text: string): MapNode {
    // Standardize line endings and filter out truly empty lines
    const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length === 0) return { id: generateId(), content: 'Untitled Map', children: [] };

    const firstLine = lines[0];
    const root: MapNode = { id: generateId(), content: firstLine.trim(), children: [] };
    
    // Process lines starting from the second one
    const childrenLines = lines.slice(1);
    if (childrenLines.length === 0) return root;

    // Fallback logic: if NO lines are indented, we'll treat all as children of root
    const hasIndentation = childrenLines.some(l => l.startsWith(' ') || l.startsWith('\t'));
    
    if (!hasIndentation) {
      childrenLines.forEach(line => {
        root.children.push({ id: generateId(), content: line.trim(), children: [] });
      });
      return root;
    }

    // Stack tracks: { node, depth }
    const stack: { node: MapNode, depth: number }[] = [{ node: root, depth: -1 }];

    childrenLines.forEach(line => {
      const depth = this.getIndentationDepth(line);
      const content = line.trim();
      const newNode: MapNode = { id: generateId(), content, children: [] };

      // Pop until we find the parent (depth < current depth)
      while (stack.length > 1 && stack[stack.length - 1].depth >= depth) {
        stack.pop();
      }

      const parent = stack[stack.length - 1].node;
      parent.children.push(newNode);
      stack.push({ node: newNode, depth });
    });

    return root;
  }

  private getIndentationDepth(line: string): number {
    const match = line.match(/^(\s+)/);
    if (!match) return 0;
    
    const indent = match[1];
    // Simple sum: tabs count as 4 spaces for relative depth
    let depth = 0;
    for (const char of indent) {
      if (char === '\t') depth += 4;
      else depth += 1;
    }
    return depth;
  }
}
