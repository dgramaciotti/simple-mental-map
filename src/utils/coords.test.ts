import { describe, it, expect } from 'vitest';
import { screenToSVG } from './coords';

describe('Coordinate Utility', () => {
  const svgMock = {
    getScreenCTM: () => ({
      inverse: () => ({
        a: 1, b: 0, c: 0, d: 1, e: -100, f: -50 // Mock translation offset
      })
    }),
    createSVGPoint: () => ({
      x: 0, y: 0,
      matrixTransform: function(m: any) {
        return {
          x: this.x + m.e,
          y: this.y + m.f
        };
      }
    })
  } as unknown as SVGSVGElement;

  it('should map screen coordinates to SVG coordinates based on CTM', () => {
    const point = screenToSVG(svgMock, 200, 150);
    // 200 + (-100) = 100
    // 150 + (-50) = 100
    expect(point.x).toBe(100);
    expect(point.y).toBe(100);
  });
});
