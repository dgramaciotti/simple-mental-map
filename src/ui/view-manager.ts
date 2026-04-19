import { Markmap } from 'markmap-view';
import * as d3 from 'd3';
import { StateEngine } from '../layers/engine/state';
import { MapController } from '../layers/engine/controller';
import { markdownToHtml } from '../utils/html-md';
import { sanitizeHTML } from '../utils/security';
import { THEMES } from '../utils/theme';

export interface ViewConfig {
  svgElement: SVGSVGElement;
  onAttachDrag: () => void;
  onAutoSave: () => void;
}

export class ViewManager {
  private mm: Markmap;
  private svg: SVGSVGElement;
  private onAttachDrag: () => void;
  private onAutoSave: () => void;
  private observer: MutationObserver;
  private reattachTimer: any;

  constructor(config: ViewConfig) {
    this.svg = config.svgElement;
    this.mm = Markmap.create(this.svg);
    this.onAttachDrag = config.onAttachDrag;
    this.onAutoSave = config.onAutoSave;

    this.observer = new MutationObserver(() => {
      clearTimeout(this.reattachTimer);
      this.reattachTimer = setTimeout(() => {
        this.observer.disconnect();
        this.onAttachDrag();
        this.observer.observe(this.svg, { childList: true, subtree: true });
      }, 600);
    });
    this.observer.observe(this.svg, { childList: true, subtree: true });
  }

  getMarkmap() {
    return this.mm;
  }

  fit() {
    this.mm.fit();
  }

  applyLayoutSettings(controller: MapController, engine: StateEngine) {
    if (!this.mm) return;
    const settings = controller.getLayoutSettings();
    const root = document.documentElement;
    const theme = THEMES.find(t => t.id === controller.getTheme()) || THEMES[0];
    
    // 1. Apply CSS Variables
    root.style.setProperty('--map-font-size', `${settings.fontSize}px`);
    root.style.setProperty('--branch-width', `${settings.branchWidth}px`);
    
    if (settings.textColor) {
      root.style.setProperty('--text', settings.textColor);
    } else {
      root.style.setProperty('--text', theme.variables['--text']);
    }

    // 2. Update Markmap Options
    const colorScale = d3.scaleOrdinal(theme.branchColors);
    
    this.mm.setOptions({
      spacingHorizontal: settings.spacing,
      spacingVertical: Math.max(15, Math.floor(engine.getMaxFontSize(settings.fontSize) * 0.8)),
      paddingX: 16,
      color: (node: any) => {
        return node.data?.style?.lineColor || colorScale(node.state?.path || node.id);
      }
    });
  }

  updateView(engine: StateEngine, selectedNodeId: string | null, pendingEditId: string | null) {
    const styledTree = engine.buildRenderTree((node) => {
      let content = sanitizeHTML(markdownToHtml(node.content));
      const isPending = node.id === pendingEditId;
      
      const styles = [
        node.style?.textColor ? `color: ${node.style.textColor}` : '',
        node.style?.fontSize ? `font-size: ${node.style.fontSize}px` : '',
        isPending ? 'visibility: hidden' : '',
        'line-height: normal',
        'padding: 4px 0',
        'display: block',
        'background: transparent !important'
      ].filter(Boolean).join('; ');

      return `<div style="${styles}">${content}</div>`;
    });

    this.mm.setOptions({ duration: 0 });
    this.mm.setData(styledTree as any);

    setTimeout(() => {
      this.observer.disconnect();
      this.onAttachDrag();

      if (selectedNodeId) {
        d3.selectAll('.markmap-node')
          .filter((d: any) => (d.data?.id || d.id) === selectedNodeId)
          .classed('selected', true);
      }
      
      if (pendingEditId) {
        d3.selectAll('.markmap-node')
          .filter((d: any) => (d.data?.id || d.id) === pendingEditId)
          .classed('editing-source', true);
      }

      this.observer.observe(this.svg, { childList: true, subtree: true });
    }, 50);

    this.onAutoSave();
  }
}
