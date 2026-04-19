import { describe, it, expect } from 'vitest';
import { parseMarkdown } from './markdown/parser';
import { encodeMarkdown } from './markdown/encoder';
import { StateEngine } from './engine/state';

describe('Mental Map Roundtrip Integration', () => {
  it('should preserve structure after a full parse-manipulate-encode-reparse cycle', () => {
    // 1. Initial State
    const initialMd = '# Root\n\n## Child 1\n\n## Child 2';
    const initialTree = parseMarkdown(initialMd);
    const engine = new StateEngine(initialTree);

    // 2. Manipulate
    // Add child to Child 1
    const child1Id = engine.getRoot().children[0].id;
    engine.addNode(child1Id, 'Grandchild');
    
    // Move Child 2 to be a sibling of Grandchild under Child 1
    const child2Id = engine.getRoot().children[1].id;
    engine.moveNode(child2Id, child1Id);
    
    // Remove "Child 1" (wait, let's keep it to see the structure)
    // Current expected structure: 
    // Root
    //   Child 1
    //     Grandchild
    //     Child 2

    // 3. Encode
    const exportedMd = encodeMarkdown(engine.getRoot());
    
    // 4. Re-parse
    const finalTree = parseMarkdown(exportedMd);
    
    // 5. Verify Structure
    expect(finalTree.content).toBe('Root');
    expect(finalTree.children).toHaveLength(1);
    expect(finalTree.children[0].content).toBe('Child 1');
    expect(finalTree.children[0].children).toHaveLength(2);
    expect(finalTree.children[0].children[0].content).toBe('Grandchild');
    expect(finalTree.children[0].children[1].content).toBe('Child 2');
    
    // 6. Verify ID uniqueness after re-parse
    const ids = new Set();
    const collectIds = (node: any) => {
      ids.add(node.id);
      node.children.forEach(collectIds);
    };
    collectIds(finalTree);
    expect(ids.size).toBe(4);
  });

  it('should handle special characters during the roundtrip', () => {
    const md = '# Special & Characters\n\n- < Tag >\n- "Quotes"';
    const tree = parseMarkdown(md);
    const encoded = encodeMarkdown(tree);
    const reParsed = parseMarkdown(encoded);
    
    expect(reParsed.content).toBe('Special & Characters');
    expect(reParsed.children[0].content).toBe('< Tag >');
    expect(reParsed.children[1].content).toBe('"Quotes"');
  });
});
