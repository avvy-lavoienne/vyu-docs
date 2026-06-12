// Markdown utility functions

/**
 * Extract table of contents from markdown content
 * @param {string} markdown - Markdown content
 * @returns {Array} TOC items
 */
export function extractTableOfContents(markdown) {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const toc = [];
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const title = match[2].trim();
    const id = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

    toc.push({ level, title, id });
  }

  return toc;
}

/**
 * Estimate reading time for markdown content
 * @param {string} markdown
 * @returns {number} Reading time in minutes
 */
export function estimateReadingTime(markdown) {
  const wordsPerMinute = 200;
  const words = markdown.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

/**
 * Strip markdown formatting
 * @param {string} markdown
 * @returns {string} Plain text
 */
export function stripMarkdown(markdown) {
  return markdown
    .replace(/^#{1,6}\s+/gm, '') // Headers
    .replace(/\*\*(.+?)\*\*/g, '$1') // Bold
    .replace(/\*(.+?)\*/g, '$1') // Italic
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Links
    .replace(/`(.+?)`/g, '$1') // Code
    .replace(/^[-*+]\s+/gm, '') // Lists
    .trim();
}