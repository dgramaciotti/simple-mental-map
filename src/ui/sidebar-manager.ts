import { MapController } from '../layers/engine/controller';
import { MapNode } from '../layers/markdown/parser';
import { THEMES } from '../utils/theme';

export interface SidebarConfig {
  onLabelInput: (value: string) => void;
  onStyleUpdate: (style: Partial<NonNullable<MapNode['style']>>) => void;
  onResetStyle: () => void;
  onDeleteNode: () => void;
  onAddChild: () => void;
}

export class SidebarManager {
  private sidebarEmpty: HTMLElement;
  private sidebarDetail: HTMLElement;
  private nodeLabel: HTMLInputElement;
  private nodeIdSpan: HTMLElement;
  private nodeChildrenCount: HTMLElement;
  
  private nodeTextColorPicker: HTMLInputElement;
  private nodeLineColorPicker: HTMLInputElement;
  private nodeFontSizeSlider: HTMLInputElement;
  private nodeFontSizeVal: HTMLElement | null;
  private resetNodeStyleBtn: HTMLElement | null;
  
  private deleteNodeBtn: HTMLElement | null;
  private addChildBtn: HTMLElement | null;

  constructor(config: SidebarConfig) {
    this.sidebarEmpty = document.querySelector('#sidebar-empty') as HTMLElement;
    this.sidebarDetail = document.querySelector('#sidebar-detail') as HTMLElement;
    this.nodeLabel = document.querySelector('#node-label') as HTMLInputElement;
    this.nodeIdSpan = document.querySelector('#node-id') as HTMLElement;
    this.nodeChildrenCount = document.querySelector('#node-children-count') as HTMLElement;
    
    this.nodeTextColorPicker = document.getElementById('node-text-color-picker') as HTMLInputElement;
    this.nodeLineColorPicker = document.getElementById('node-line-color-picker') as HTMLInputElement;
    this.nodeFontSizeSlider = document.getElementById('node-font-size-slider') as HTMLInputElement;
    this.nodeFontSizeVal = document.getElementById('node-font-size-val');
    this.resetNodeStyleBtn = document.getElementById('reset-node-style');
    
    this.deleteNodeBtn = document.querySelector('#delete-node');
    this.addChildBtn = document.querySelector('#add-child');

    this.initEventListeners(config);
  }

  private initEventListeners(config: SidebarConfig) {
    this.nodeLabel.addEventListener('input', () => config.onLabelInput(this.nodeLabel.value));
    
    this.nodeTextColorPicker?.addEventListener('input', () => {
      config.onStyleUpdate({ textColor: this.nodeTextColorPicker.value });
    });
    
    this.nodeLineColorPicker?.addEventListener('input', () => {
      config.onStyleUpdate({ lineColor: this.nodeLineColorPicker.value });
    });
    
    this.nodeFontSizeSlider?.addEventListener('input', () => {
      const val = parseInt(this.nodeFontSizeSlider.value);
      if (this.nodeFontSizeVal) this.nodeFontSizeVal.textContent = `${val}px`;
      config.onStyleUpdate({ fontSize: val });
    });

    this.resetNodeStyleBtn?.addEventListener('click', () => config.onResetStyle());
    this.deleteNodeBtn?.addEventListener('click', () => config.onDeleteNode());
    this.addChildBtn?.addEventListener('click', () => config.onAddChild());
  }

  showSidebar(node: MapNode, controller: MapController) {
    this.sidebarEmpty.style.display = 'none';
    this.sidebarDetail.style.display = 'block';

    this.nodeLabel.value = node.content;
    this.nodeIdSpan.textContent = node.id;
    this.nodeChildrenCount.textContent = String(node.children.length);

    // Per-node styles
    const defaultText = getComputedStyle(document.documentElement).getPropertyValue('--text').trim();
    const theme = THEMES.find(t => t.id === controller.getTheme()) || THEMES[0];
    const defaultLine = theme.branchColors[0];

    if (this.nodeTextColorPicker) {
      this.nodeTextColorPicker.value = node.style?.textColor || (defaultText.startsWith('#') ? defaultText : '#e0e0e0');
    }
    if (this.nodeLineColorPicker) {
      this.nodeLineColorPicker.value = node.style?.lineColor || defaultLine;
    }
    
    if (this.nodeFontSizeSlider) {
      const settings = controller.getLayoutSettings();
      this.nodeFontSizeSlider.value = (node.style?.fontSize || settings.fontSize).toString();
      if (this.nodeFontSizeVal) {
        this.nodeFontSizeVal.textContent = node.style?.fontSize ? `${node.style.fontSize}px` : 'inherit';
      }
    }
  }

  hideSidebar() {
    this.sidebarEmpty.style.display = 'block';
    this.sidebarDetail.style.display = 'none';
    this.nodeLabel.value = '';
  }
}
