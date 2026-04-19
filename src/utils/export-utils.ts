/**
 * Utilities for exporting SVG-based mind maps to different formats.
 */

/**
 * Capture the current SVG element into a clean XML string.
 * Inlines necessary styles to ensure the SVG is portable and safe for canvas rendering.
 */
export function getSvgSource(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  
  // 1. Clean up interaction artifacts
  clone.querySelectorAll('.node-add-btn').forEach(btn => btn.remove());
  clone.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
  clone.querySelectorAll('.target-highlight').forEach(el => el.classList.remove('target-highlight'));
  
  // 2. Inline Styles
  // We extract relevant CSS rules and current dynamic variables
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = extractRelevantStyles() + '\n' + extractRootVariables();
  clone.prepend(style);

  // 3. Ensure we have namespaces
  if (!clone.getAttribute('xmlns')) {
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }
  
  const serializer = new XMLSerializer();
  return '<?xml version="1.0" standalone="no"?>\r\n' + serializer.serializeToString(clone);
}

/**
 * Extracts dynamic CSS variables from the document element and formats them as a :root block.
 */
function extractRootVariables(): string {
  let vars = ':root {\n';
  const rootStyle = document.documentElement.style;
  
  // Iterate over all properties and find our variables
  for (let i = 0; i < rootStyle.length; i++) {
    const propName = rootStyle[i];
    if (propName.startsWith('--')) {
      vars += `  ${propName}: ${rootStyle.getPropertyValue(propName)};\n`;
    }
  }
  
  vars += '}\n';
  return vars;
}

/**
 * Extracts and filters CSS rules that are relevant to the mindmap rendering.
 */
function extractRelevantStyles(): string {
  let styles = '';
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const rules = Array.from(sheet.cssRules);
        for (const rule of rules) {
          // Only include global variables or rules targeting markmap logic
          if (
            rule.cssText.includes('--') || 
            rule.cssText.includes('.markmap') || 
            rule.cssText.startsWith('text') ||
            rule.cssText.includes('circle') ||
            rule.cssText.includes('path')
          ) {
            styles += rule.cssText + '\n';
          }
        }
      } catch (e) {
        // Skip cross-origin stylesheets that we can't read
        console.warn('[Export] Skipping cross-origin stylesheet', e);
      }
    }
  } catch (e) {
    console.error('[Export] Failed to extract styles', e);
  }
  return styles;
}

/**
 * Triggers a browser download for a Blob.
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
