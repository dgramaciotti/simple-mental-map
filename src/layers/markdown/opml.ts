import { MapNode } from './parser';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function escapeXML(str: string): string {
  return str.replace(/[<>&"']/g, (char) => {
    switch (char) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default: return char;
    }
  });
}

/**
 * Encodes a MapNode tree into an OPML XML string.
 * Focuses on structure only (interoperability).
 */
export function encodeOPML(root: MapNode, title: string = 'Mental Map'): string {
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<opml version="2.0">');
  lines.push('  <head>');
  lines.push(`    <title>${escapeXML(title)}</title>`);
  lines.push('  </head>');
  lines.push('  <body>');

  function encodeNode(node: MapNode, indent: number) {
    const space = '  '.repeat(indent);
    const escapedContent = escapeXML(node.content);
    
    if (node.children.length === 0) {
      lines.push(`${space}<outline text="${escapedContent}"/>`);
    } else {
      lines.push(`${space}<outline text="${escapedContent}">`);
      node.children.forEach(child => encodeNode(child, indent + 1));
      lines.push(`${space}</outline>`);
    }
  }

  encodeNode(root, 2);

  lines.push('  </body>');
  lines.push('</opml>');

  return lines.join('\n');
}

/**
 * Decodes an OPML XML string into a MapNode tree.
 */
export function decodeOPML(xml: string): MapNode {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  
  // Find the first <outline> in <body>
  const body = doc.querySelector('body');
  if (!body) {
    return { id: 'root', content: 'Empty Map', children: [] };
  }

  const rootOutlines = Array.from(body.children).filter(el => el.tagName.toLowerCase() === 'outline');
  
  function parseOutline(el: Element): MapNode {
    const getAttr = (name: string) => el.getAttribute(name) || el.getAttribute(name.toUpperCase());
    const content = getAttr('text') || getAttr('title') || '...';
    
    const children = Array.from(el.children)
      .filter(child => child.tagName.toLowerCase() === 'outline')
      .map(child => parseOutline(child));

    return {
      id: generateId(),
      content: content,
      children: children
    };
  }

  if (rootOutlines.length === 0) {
    return { id: 'root', content: 'Empty Map', children: [] };
  }

  // If there are multiple root outlines, we wrap them in a virtual root or take the first
  if (rootOutlines.length > 1) {
    return {
      id: 'root',
      content: 'Imported Map',
      children: rootOutlines.map(el => parseOutline(el))
    };
  }

  return parseOutline(rootOutlines[0]);
}
