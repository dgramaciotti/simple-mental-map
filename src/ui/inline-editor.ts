import { MapNode } from '../layers/markdown/parser';
import { htmlToMarkdown } from '../utils/html-md';

let activeCleanup: (() => void) | null = null;

export function cancelActiveEdit() {
  if (activeCleanup) {
    activeCleanup();
    activeCleanup = null;
  }
}

export function startInlineEdit(
  nodeElement: Element,
  node: MapNode,
  onCommit: (newValMd: string) => void,
  onCancel: () => void
) {
  // 1. Target the actual text container (prioritize the styled span)
  let textEl = nodeElement.querySelector('foreignObject span[style]') as HTMLElement;
  if (!textEl) {
    textEl = nodeElement.querySelector('foreignObject div, foreignObject span') as HTMLElement;
  }
  const computed = textEl ? window.getComputedStyle(textEl) : null;
  
  // 2. Get screen dimensions (zoomed)
  const foEl = nodeElement.querySelector('foreignObject');
  const bbox = foEl 
    ? foEl.getBoundingClientRect() 
    : (nodeElement as SVGGraphicsElement).getBoundingClientRect();

  // 3. Calculate Visual Scaling
  let visualFontSize = '13px';
  if (computed && textEl) {
    const logicalHeight = textEl.offsetHeight || parseFloat(computed.lineHeight) || 18;
    const zoomFactor = bbox.height / logicalHeight;
    const baseSize = parseFloat(computed.fontSize);
    visualFontSize = `${baseSize * zoomFactor}px`;
  }

  const editor = document.createElement('div');
  editor.contentEditable = 'true';
  editor.className = 'inline-edit-input';
  editor.innerText = htmlToMarkdown(node.content);
  
  // 4. Apply precise visual styles
  if (computed) {
    editor.style.fontFamily = computed.fontFamily;
    editor.style.fontSize = visualFontSize;
    editor.style.fontWeight = computed.fontWeight;
    editor.style.color = 'var(--text)'; 
  }

  // 5. Align perfectly to the zoomed bbox
  editor.style.position = 'fixed';
  editor.style.top = `${bbox.top}px`;
  editor.style.left = `${bbox.left}px`;
  editor.style.minWidth = `${bbox.width}px`;
  editor.style.height = `${bbox.height}px`;
  editor.style.lineHeight = `${bbox.height}px`;
  
  document.body.appendChild(editor);
  
  // Selection logic for contenteditable
  const range = document.createRange();
  range.selectNodeContents(editor);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  editor.focus();

  const commit = () => {
    const newValMd = editor.innerText.trim();
    if (newValMd !== undefined) {
      onCommit(newValMd);
    }
    cleanup();
  };

  const cleanup = () => {
    nodeElement.classList.remove('editing-source');
    if (editor.parentNode) {
      editor.parentNode.removeChild(editor);
    }
    activeCleanup = null;
  };
  
  // Clean up any existing editor before starting a new one
  cancelActiveEdit();
  activeCleanup = cleanup;
  
  nodeElement.classList.add('editing-source');

  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    }
    if (e.key === 'Escape') {
      cleanup();
      onCancel();
    }
  });

  editor.addEventListener('blur', commit);
}
