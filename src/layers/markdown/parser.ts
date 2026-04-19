import { Transformer } from 'markmap-lib';

export interface MapNode {
  id: string;
  content: string;
  children: MapNode[];
  style?: {
    textColor?: string;
    lineColor?: string;
    fontSize?: number;
  };
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

const transformer = new Transformer();

function cleanContent(content: string): string {
  if (!content) return '';
  // Unescape common entities to ensure consistency in the data model
  // Note: Sanitization for rendering still happens in ViewManager.
  return content.replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'");
}

export function parseMarkdown(md: string): MapNode {
  const { root } = transformer.transform(md);
  
  function mapNode(node: any): MapNode {
    return {
      id: generateId(),
      content: cleanContent(node.content || node.v || ''),
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
