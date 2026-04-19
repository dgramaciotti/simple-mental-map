import { Transformer } from 'markmap-lib';

export interface MapNode {
  id: string;
  content: string;
  children: MapNode[];
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

const transformer = new Transformer();

function unescapeHTML(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.documentElement.textContent || html;
}

export function parseMarkdown(md: string): MapNode {
  const { root } = transformer.transform(md);
  
  function mapNode(node: any): MapNode {
    return {
      id: generateId(),
      content: unescapeHTML(node.content || node.v || ''),
      children: (node.children || node.c || []).map(mapNode)
    };
  }

  const parsed = mapNode(root);

  // If the top node is a placeholder (no content and children exist), skip it.
  if (!parsed.content && parsed.children.length > 0) {
    return parsed.children[0];
  }

  return parsed;
}
// Moving to encoder.ts next
