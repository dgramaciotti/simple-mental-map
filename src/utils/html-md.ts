/**
 * Simple utilities to convert between HTML and Markdown for inline styles.
 * Note: This is NOT a full parser, it only handles common inline tags used by markmap.
 */

export function htmlToMarkdown(html: string): string {
  if (!html) return '';
  
  let md = html;
  
  // Strong/Bold
  md = md.replace(/<(strong|b)>(.*?)<\/\1>/gi, '**$2**');
  
  // Emphasis/Italic
  md = md.replace(/<(em|i)>(.*?)<\/\1>/gi, '*$2*');
  
  // Code
  md = md.replace(/<code>(.*?)<\/code>/gi, '`$1`');
  
  // Strikethrough
  md = md.replace(/<(del|s|strike)>(.*?)<\/\1>/gi, '~~$2~~');
  
  // Links
  md = md.replace(/<a\s+.*?href="([^"]+)".*?>(.*?)<\/a>/gi, '[$2]($1)');
  
  // Remove any remaining HTML tags
  md = md.replace(/<[^>]+>/g, '');

  // Unescape common entities
  md = md.replace(/&amp;/g, '&')
         .replace(/&lt;/g, '<')
         .replace(/&gt;/g, '>')
         .replace(/&quot;/g, '"')
         .replace(/&#39;/g, "'");
  
  return md;
}

export function markdownToHtml(md: string): string {
  if (!md) return '';
  
  let html = md;
  
  // Bold (must be before italic)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic (using * only if not already part of strong)
  // Simple regex for *italic* - this might match across lines or have issues with **
  // We use a lookahead/lookbehind approach or just a simpler one for now since we expect short inline text
  html = html.replace(/(^|[^\*])\*([^\*]+)\*([^\*]|$)/g, '$1<em>$2</em>$3');
  
  // Inline Code
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  
  // Strikethrough
  html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');
  
  return html;
}
