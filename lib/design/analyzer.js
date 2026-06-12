// Design System Analyzer

/**
 * Detect styling files from repository tree
 * @param {Array} files - Array of {path, content}
 * @returns {Object} Categorized styling files
 */
export function detectStylingFiles(files) {
  const styling = {
    css: [],
    tailwind: [],
    styledComponents: [],
    designTokens: [],
    other: [],
  };

  files.forEach(file => {
    const path = file.path.toLowerCase();
    
    // Tailwind config
    if (path.includes('tailwind.config')) {
      styling.tailwind.push(file);
    }
    // CSS/SCSS files
    else if (path.endsWith('.css') || path.endsWith('.scss') || path.endsWith('.sass')) {
      styling.css.push(file);
    }
    // Styled components or CSS-in-JS
    else if (
      file.content.includes('styled-components') ||
      file.content.includes('import styled from') ||
      file.content.includes('@emotion') ||
      file.content.includes('css`')
    ) {
      styling.styledComponents.push(file);
    }
    // Design tokens (JSON/JS with theme/colors/tokens in name)
    else if (
      (path.includes('theme') || path.includes('token') || path.includes('color') || path.includes('design')) &&
      (path.endsWith('.js') || path.endsWith('.json') || path.endsWith('.ts'))
    ) {
      styling.designTokens.push(file);
    }
  });

  return styling;
}

/**
 * Extract colors from CSS/config files
 * @param {string} content - File content
 * @returns {Array} Array of colors
 */
export function extractColors(content) {
  const colors = [];
  
  // Hex colors
  const hexRegex = /#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})\b/g;
  const hexMatches = content.match(hexRegex) || [];
  colors.push(...hexMatches);
  
  // RGB/RGBA colors
  const rgbRegex = /rgba?\([^)]+\)/g;
  const rgbMatches = content.match(rgbRegex) || [];
  colors.push(...rgbMatches);
  
  // HSL colors
  const hslRegex = /hsla?\([^)]+\)/g;
  const hslMatches = content.match(hslRegex) || [];
  colors.push(...hslMatches);
  
  // Remove duplicates
  return [...new Set(colors)];
}

/**
 * Extract typography information
 * @param {string} content - File content
 * @returns {Object} Typography info
 */
export function extractTypography(content) {
  const typography = {
    fonts: [],
    sizes: [],
    weights: [],
  };
  
  // Font families
  const fontRegex = /font-family:\s*([^;]+)/gi;
  let match;
  while ((match = fontRegex.exec(content)) !== null) {
    typography.fonts.push(match[1].trim());
  }
  
  // Font sizes
  const sizeRegex = /font-size:\s*([\d.]+(?:px|rem|em))/gi;
  while ((match = sizeRegex.exec(content)) !== null) {
    typography.sizes.push(match[1]);
  }
  
  // Font weights
  const weightRegex = /font-weight:\s*(\d+|bold|normal|light)/gi;
  while ((match = weightRegex.exec(content)) !== null) {
    typography.weights.push(match[1]);
  }
  
  return {
    fonts: [...new Set(typography.fonts)],
    sizes: [...new Set(typography.sizes)],
    weights: [...new Set(typography.weights)],
  };
}

/**
 * Extract spacing scale
 * @param {string} content - File content  
 * @returns {Array} Spacing values
 */
export function extractSpacing(content) {
  const spacing = [];
  
  // Margin/padding values
  const spacingRegex = /(?:margin|padding|gap)(?:-[a-z]+)?:\s*([\d.]+(?:px|rem|em))/gi;
  let match;
  while ((match = spacingRegex.exec(content)) !== null) {
    spacing.push(match[1]);
  }
  
  return [...new Set(spacing)];
}

/**
 * Analyze complete design system from files
 * @param {Array} files - Array of {path, content}
 * @returns {Object} Complete design analysis
 */
export function analyzeDesignSystem(files) {
  const stylingFiles = detectStylingFiles(files);
  
  // Combine all content
  const allContent = files.map(f => f.content).join('\n');
  
  const analysis = {
    hasStyles: Object.values(stylingFiles).some(arr => arr.length > 0),
    stylingApproach: [],
    colors: extractColors(allContent),
    typography: extractTypography(allContent),
    spacing: extractSpacing(allContent),
    files: {
      css: stylingFiles.css.map(f => f.path),
      tailwind: stylingFiles.tailwind.map(f => f.path),
      styledComponents: stylingFiles.styledComponents.map(f => f.path),
      designTokens: stylingFiles.designTokens.map(f => f.path),
    },
  };
  
  // Determine styling approach
  if (stylingFiles.tailwind.length > 0) analysis.stylingApproach.push('Tailwind CSS');
  if (stylingFiles.css.length > 0) analysis.stylingApproach.push('CSS/SCSS');
  if (stylingFiles.styledComponents.length > 0) analysis.stylingApproach.push('CSS-in-JS');
  if (stylingFiles.designTokens.length > 0) analysis.stylingApproach.push('Design Tokens');
  
  return analysis;
}

/**
 * Create summary for AI analysis
 * @param {Object} designAnalysis - Design analysis result
 * @param {Array} files - Original files
 * @returns {string} Summary text for AI
 */
export function createDesignSummary(designAnalysis, files) {
  if (!designAnalysis.hasStyles) {
    return 'No styling files detected in this repository.';
  }
  
  const summary = [];
  
  summary.push(`Styling Approach: ${designAnalysis.stylingApproach.join(', ')}`);
  summary.push(`\nColors Found: ${designAnalysis.colors.length} unique colors`);
  summary.push(`Color Palette: ${designAnalysis.colors.slice(0, 20).join(', ')}...`);
  
  if (designAnalysis.typography.fonts.length > 0) {
    summary.push(`\nFont Families: ${designAnalysis.typography.fonts.join(', ')}`);
  }
  
  if (designAnalysis.typography.sizes.length > 0) {
    summary.push(`Font Sizes: ${designAnalysis.typography.sizes.slice(0, 10).join(', ')}...`);
  }
  
  if (designAnalysis.spacing.length > 0) {
    summary.push(`\nSpacing Values: ${designAnalysis.spacing.slice(0, 10).join(', ')}...`);
  }
  
  // Include key styling files
  summary.push('\n\n=== KEY STYLING FILES ===');
  
  const keyFiles = [
    ...files.filter(f => designAnalysis.files.tailwind.includes(f.path)),
    ...files.filter(f => designAnalysis.files.css.includes(f.path)),
    ...files.filter(f => designAnalysis.files.designTokens.includes(f.path)),
  ].slice(0, 3);
  
  keyFiles.forEach(file => {
    summary.push(`\n--- ${file.path} ---`);
    summary.push(file.content.substring(0, 1000));
  });
  
  return summary.join('\n');
}