import { describe, it, expect } from 'vitest';
import { encodeOPML, decodeOPML } from './opml';
import { MapNode } from './parser';

describe('OPML Encoding', () => {
  it('should encode a simple tree into valid OPML XML', () => {
    const root: MapNode = {
      id: 'root',
      content: 'Root Node',
      children: [
        { id: 'c1', content: 'Child 1', children: [] },
        { id: 'c2', content: 'Child 2', children: [
          { id: 'gc1', content: 'Grandchild', children: [] }
        ]}
      ]
    };

    const xml = encodeOPML(root, 'Test Map');
    
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<opml version="2.0">');
    expect(xml).toContain('<title>Test Map</title>');
    expect(xml).toContain('<outline text="Root Node">');
    expect(xml).toContain('<outline text="Child 1"/>');
    expect(xml).toContain('<outline text="Grandchild"/>');
  });

  it('should escape special characters in content', () => {
    const root: MapNode = {
      id: 'root',
      content: 'Root & "Quotes"',
      children: []
    };

    const xml = encodeOPML(root);
    expect(xml).toContain('text="Root &amp; &quot;Quotes&quot;"');
  });
});

describe('OPML Decoding', () => {
  it('should decode a valid OPML string back to a MapNode tree', () => {
    const xml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <opml version="2.0">
        <body>
          <outline text="Root">
            <outline text="Child A" />
            <outline text="Child B">
              <outline text="Grandchild" />
            </outline>
          </outline>
        </body>
      </opml>
    `;

    const root = decodeOPML(xml);
    
    expect(root.content).toBe('Root');
    expect(root.children).toHaveLength(2);
    expect(root.children[0].content).toBe('Child A');
    expect(root.children[1].children[0].content).toBe('Grandchild');
  });

  it('should handle OPML files starting with the body content (skipping wrapper)', () => {
    // Some tools might export just the body or multiple nodes at root level
    const xml = `
      <opml>
        <body>
          <outline text="Node 1" />
          <outline text="Node 2" />
        </body>
      </opml>
    `;

    const root = decodeOPML(xml);
    // If multiple root-level nodes exist in body, we wrap them in a virtual root or take the first
    // For our app, we usually expect a single root.
    expect(root.children).toHaveLength(2);
  });
});
