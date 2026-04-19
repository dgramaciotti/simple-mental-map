import * as d3 from 'd3';
import { StateEngine } from '../engine/state';

export interface DNDOptions {
  engine: StateEngine;
  updateView: () => void;
  svgElement: SVGElement;
  onSelect?: (nodeId: string, nodeElement: Element) => void;
  onDoubleClick?: (nodeId: string, nodeElement: Element) => void;
  onAddChild?: (parentId: string) => void;
  onBeforeMove?: () => void;
}

// Module-level state for highlight tracking
let lastHighlighted: any = null;

function highlightTarget(target: any) {
  if (target === lastHighlighted) return;
  clearHighlights();
  if (target) {
    d3.select(target).classed('target-highlight', true);
    lastHighlighted = target;
  } else {
    lastHighlighted = null;
  }
}

function clearHighlights() {
  d3.selectAll('.markmap-node').classed('target-highlight', false);
  lastHighlighted = null;
}

function findNearestNode(clientX: number, clientY: number, exclude: any): any {
  let nearest: any = null;
  let minDistance = 100;

  d3.selectAll('.markmap-node').each(function() {
    if (this === exclude) return;
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

function findTargetUnderMouse(clientX: number, clientY: number): any {
  const element = document.elementFromPoint(clientX, clientY);
  if (!element) return null;
  const node = element.closest('.markmap-node');
  return node;
}

export function initDND({ engine, updateView, svgElement, onSelect, onDoubleClick, onAddChild, onBeforeMove }: DNDOptions) {
  const svg = d3.select(svgElement);

  let dragActivated = false;
  let startX = 0;
  let startY = 0;

  const drag = d3.drag<any, any>()
    .on('start', function(event) {
      dragActivated = false;
      startX = event.x;
      startY = event.y;

      event.sourceEvent.stopPropagation();
    })
    .on('drag', function(event) {
      event.sourceEvent.preventDefault();
      event.sourceEvent.stopPropagation();

      const dx = event.x - startX;
      const dy = event.y - startY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (!dragActivated && distance > 8) {
        dragActivated = true;
        // Make dragged node invisible to elementFromPoint
        d3.select(this).style('pointer-events', 'none');

        // Hoist for visual z-order
        this.parentNode.appendChild(this);
        d3.select(this).classed('dragging', true);
      }

      if (dragActivated) {
        d3.select(this).attr('transform', `translate(${event.x}, ${event.y})`);

        // Area-based detection first, proximity fallback
        let target = findTargetUnderMouse(event.sourceEvent.clientX, event.sourceEvent.clientY);
        if (!target) {
          target = findNearestNode(event.sourceEvent.clientX, event.sourceEvent.clientY, this);
        }

        highlightTarget(target);
      }
    })
    .on('end', function(event) {
      if (!dragActivated) {
        // Restore pointer events for click-only
        d3.select(this).style('pointer-events', null);
        return;
      }

      // 1. DETECT TARGET FIRST (while dragged node still has pointer-events: none)
      let target = findTargetUnderMouse(event.sourceEvent.clientX, event.sourceEvent.clientY);
      if (!target) {
        target = findNearestNode(event.sourceEvent.clientX, event.sourceEvent.clientY, this);
      }
      const td = target ? d3.select(target).datum() as any : null;
      const targetId = td?.data?.id || td?.id;

      // 2. RESTORE VISUALS (after detection)
      d3.select(this)
        .style('pointer-events', null)
        .classed('dragging', false)
        .attr('transform', null);

      const d = d3.select(this).datum() as any;
      const sourceId = d?.data?.id || d?.id;

      // 3. EXECUTE MOVE
      if (targetId && targetId !== sourceId) {
        try {
          if (onBeforeMove) onBeforeMove();
          engine.moveNode(sourceId, targetId);
          updateView();
        } catch (e) {
          updateView();
        }
      } else {
        updateView();
      }

      clearHighlights();
    });

  return function attachDrag() {
    const nodes = svg.selectAll('.markmap-node');

    // Inject hit-area rects and disable foreignObject pointer-events
    nodes.each(function() {
      const node = d3.select(this);
      const d = node.datum() as any;
      const nodeId = d?.data?.id || d?.id;

      node.selectAll('.hit-area').remove();
      node.selectAll('.node-add-btn').remove();
      node.selectAll('foreignObject').attr('pointer-events', 'none');

      const bbox = (this as SVGGraphicsElement).getBBox();

      // 1. Hit-area
      node.insert('rect', ':first-child')
        .attr('class', 'hit-area')
        .attr('x', bbox.x - 4)
        .attr('y', bbox.y - 4)
        .attr('width', bbox.width + 8)
        .attr('height', bbox.height + 8)
        .attr('fill', 'transparent')
        .attr('pointer-events', 'all');

      // 2. "+" Button
      const addBtn = node.append('g')
        .attr('class', 'node-add-btn')
        .attr('transform', `translate(${bbox.x + bbox.width + 12}, ${bbox.y + bbox.height / 2})`)
        .on('click', (event) => {
          event.stopPropagation();
          if (onAddChild && nodeId) {
            onAddChild(nodeId);
          }
        });

      addBtn.append('circle')
        .attr('r', 8);
      
      addBtn.append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .text('+');

      // 3. Click/Double-click Selection
      node.on('click', function(event) {
        event.stopPropagation();
        d3.selectAll('.markmap-node').classed('selected', false);
        d3.select(this).classed('selected', true);
        if (onSelect && nodeId) {
          onSelect(nodeId, this as unknown as Element);
        }
      });

      node.on('dblclick', function(event) {
        event.stopPropagation();
        if (onDoubleClick && nodeId) {
          onDoubleClick(nodeId, this as unknown as Element);
        }
      });

      // Mark as processed
      node.attr('data-dnd-attached', 'true');
    });


    nodes.call(drag as any);
  };
}
