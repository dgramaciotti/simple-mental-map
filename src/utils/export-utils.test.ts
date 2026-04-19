import { describe, it, expect, beforeEach } from 'vitest';
import { getSvgSource } from './export-utils';

describe('Export Utilities', () => {
  beforeEach(() => {
    // Reset document state
    document.documentElement.setAttribute('style', '');
  });

  it('should capture dynamic CSS variables in the SVG source', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    
    // Simulate setting dynamic theme variables
    document.documentElement.style.setProperty('--bg', '#ff0000');
    document.documentElement.style.setProperty('--accent', '#00ff00');
    document.documentElement.style.setProperty('--map-font-size', '20px');

    const source = getSvgSource(svg);

    // Assertions
    expect(source).toContain(':root');
    expect(source).toContain('--bg: #ff0000');
    expect(source).toContain('--accent: #00ff00');
    expect(source).toContain('--map-font-size: 20px');
  });

  it('should clean up interaction artifacts', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const btn = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    btn.setAttribute('class', 'node-add-btn');
    svg.appendChild(btn);

    const source = getSvgSource(svg);
    expect(source).not.toContain('node-add-btn');
  });
});
