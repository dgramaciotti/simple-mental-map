/**
 * A native, whitelist-based HTML sanitizer using the browser's DOMParser.
 * Protects against XSS while allowing basic formatting and links.
 */

const ALLOWED_TAGS = new Set([
  'STRONG', 'B', 'EM', 'I', 'CODE', 'DEL', 'S', 'STRIKE', 
  'A', 'BR', 'DIV', 'SPAN', 'P', 'UL', 'OL', 'LI', 'IMG'
]);

const ALLOWED_ATTRS = new Set(['HREF', 'SRC', 'ALT', 'TITLE', 'STYLE']);

const SAFE_PROTOCOL_REGEX = /^(https?|#|mailto):/i;

export function sanitizeHTML(html: string): string {
  if (!html) return '';

  // Use DOMParser to parse the string in a safe, non-executing document context
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  function processNode(node: Node): Node | null {
    if (node.nodeType === Node.TEXT_NODE) {
      return document.createTextNode(node.textContent || '');
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toUpperCase();

      if (!ALLOWED_TAGS.has(tagName)) {
        // If tag is not allowed, we don't return the element, 
        // but we might want to process its children (flattening)
        // For security, it's safer to just skip most unauthorized tags
        // but for <script>, <style>, <iframe) we definitely want to skip children.
        if (tagName === 'SCRIPT' || tagName === 'STYLE' || tagName === 'IFRAME' || tagName === 'OBJECT') {
          return null;
        }
        
        // Flatten other tags by returning a fragment of their sanitized children
        const fragment = document.createDocumentFragment();
        Array.from(el.childNodes).forEach(child => {
          const processed = processNode(child);
          if (processed) fragment.appendChild(processed);
        });
        return fragment;
      }

      const newEl = document.createElement(tagName);

      // Sanitize attributes
      Array.from(el.attributes).forEach(attr => {
        const attrName = attr.name.toUpperCase();
        if (ALLOWED_ATTRS.has(attrName)) {
          let value = attr.value;

          // Special handling for URLs
          if (attrName === 'HREF' || attrName === 'SRC') {
            const hasProtocol = value.includes(':');
            if (hasProtocol && !SAFE_PROTOCOL_REGEX.test(value)) {
              // Block dangerous protocols (javascript:, data:, etc.)
              return;
            }
          }
          
          newEl.setAttribute(attr.name, value);
        }
      });

      // Process children
      Array.from(el.childNodes).forEach(child => {
        const processed = processNode(child);
        if (processed) newEl.appendChild(processed);
      });

      return newEl;
    }

    return null;
  }

  const sanitizedFragment = document.createDocumentFragment();
  Array.from(body.childNodes).forEach(node => {
    const processed = processNode(node);
    if (processed) sanitizedFragment.appendChild(processed);
  });

  const wrapper = document.createElement('div');
  wrapper.appendChild(sanitizedFragment);
  return wrapper.innerHTML;
}
