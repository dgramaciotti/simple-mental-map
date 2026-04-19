/**
 * Converts screen coordinates (clientX, clientY) to SVG coordinate space.
 * Takes the current SVG transformation (zoom/pan) into account.
 * Using an SVGGraphicsElement (like a <g>) allows mapping to local group space.
 */
export function screenToSVG(element: SVGGraphicsElement, clientX: number, clientY: number) {
  const svg = element.ownerSVGElement || (element as unknown as SVGSVGElement);
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  
  const ctm = element.getScreenCTM();
  if (!ctm) return { x: clientX, y: clientY };
  
  const transformed = pt.matrixTransform(ctm.inverse());
  return {
    x: transformed.x,
    y: transformed.y
  };
}
