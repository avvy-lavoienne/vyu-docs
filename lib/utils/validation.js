// Validation utilities

/**
 * Validate GitHub repository URL
 * @param {string} url
 * @returns {boolean}
 */
export function isValidGitHubUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const pattern = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+\/?$/;
  return pattern.test(url.trim());
}

/**
 * Validate GitHub Personal Access Token format
 * @param {string} token
 * @returns {boolean}
 */
export function isValidGitHubPAT(token) {
  if (!token || typeof token !== 'string') return false;
  // GitHub PATs start with 'ghp_' (classic) or 'github_pat_' (fine-grained)
  return token.startsWith('ghp_') || token.startsWith('github_pat_');
}

/**
 * Sanitize user input
 * @param {string} input
 * @returns {string}
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>]/g, '');
}