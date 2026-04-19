import { StateEngine } from '../layers/engine/state';
import { showPromptModal } from './modal';
import * as d3 from 'd3';

export function initPalette(engine: StateEngine, updateView: () => void, svgElement: SVGSVGElement) {
  const paletteItem = document.querySelector('#new-node-template');
  if (!paletteItem) return;

  // Real-time highlight during drag
  svgElement.addEventListener('dragover', (e: DragEvent) => {
    e.preventDefault(); // Allow drop
    const target = findNearestToPoint(e.clientX, e.clientY);
    highlightPaletteTarget(target);
  });

  svgElement.addEventListener('dragleave', () => {
    clearPaletteHighlights();
  });

  paletteItem.addEventListener('dragend', (e: any) => {
    clearPaletteHighlights();
    // clientX/Y of the drop position
    const { clientX, clientY } = e;
    
    // We need coordinates relative to the nodes container <g>
    const gElement = svgElement.querySelector('g') as SVGGraphicsElement;
    if (!gElement) return;
    
    // Find nearest node using screen-space coordinates
    const target = findNearestToPoint(clientX, clientY);
    const td = target ? d3.select(target).datum() as any : null;
    const targetId = td?.data?.id || td?.id;

    if (targetId) {
      showPromptModal({
        title: 'New Idea',
        message: 'Enter text for the new node:',
        defaultValue: 'New Idea',
        confirmText: 'Add Node',
        onConfirm: (content) => {
          engine.addNode(targetId, content);
          updateView();
        }
      });
    }
  });
}

function highlightPaletteTarget(target: any) {
  clearPaletteHighlights();
  if (target) {
    d3.select(target).classed('target-highlight', true);
  }
}

function clearPaletteHighlights() {
  d3.selectAll('.markmap-node').classed('target-highlight', false);
}

function findNearestToPoint(clientX: number, clientY: number): any {
  let nearest: any = null;
  let minDistance = 150; // Larger threshold for palette drop

  d3.selectAll('.markmap-node').each(function() {
    const rect = (this as Element).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distance = Math.sqrt(
      Math.pow(clientX - centerX, 2) + 
      Math.pow(clientY - centerY, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearest = this;
    }
  });

  return nearest;
}
