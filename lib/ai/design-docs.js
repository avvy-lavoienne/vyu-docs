// Design Documentation Generator using DeepSeek
import { callDeepSeek } from './deepseek.js';

/**
 * Generate comprehensive design documentation + clone superprompts
 * @param {Object} repoMeta - Repository metadata
 * @param {Object} designAnalysis - Design system analysis
 * @param {string} designSummary - Design summary text
 * @returns {Object} Design docs and clone prompts
 */
export async function generateDesignDocumentation(repoMeta, designAnalysis, designSummary) {
  if (!designAnalysis.hasStyles) {
    return {
      design: {
        content: '# 🎨 Design System\n\nNo styling detected in this repository.\n\nThis codebase appears to be backend-focused or uses minimal styling.',
      },
      clone_prompts: {
        architecture: '',
        design: '',
        full: '',
        suggestions: '',
      },
    };
  }

  const systemPrompt = `You are a world-class UI/UX designer and design system expert.
Your task is to analyze design systems and create comprehensive documentation + superprompts for cloning designs.

IMPORTANT: Respond ONLY with valid JSON. No markdown fences. Start with { and end with }.`;

  const userPrompt = `Analyze this design system and generate documentation + clone superprompts.

**Repository:** ${repoMeta.owner}/${repoMeta.repo}
**Language:** ${repoMeta.language}
**Styling Approach:** ${designAnalysis.stylingApproach.join(', ')}

**Design Analysis:**
${designSummary}

**Your Task:**
Generate a JSON with this EXACT structure:

{
  "design": {
    "content": "[Write comprehensive Design System documentation in Markdown. Include:\n\n# 🎨 Design System\n\n## Overview\nBrief description of the design approach and philosophy.\n\n## 🎨 Color Palette\nList all colors with hex codes, names, and usage (primary, secondary, accent, etc.). Group by purpose.\n\n## 📝 Typography\n- Font families used\n- Font sizes scale\n- Font weights\n- Line heights\n- Usage guidelines\n\n## 📏 Spacing System\n- Spacing scale (xs, sm, md, lg, xl, etc.)\n- Margin and padding patterns\n- Grid system if present\n\n## 🎭 Component Styles\nDescribe common component patterns:\n- Buttons (variants, states)\n- Cards (styles, elevations)\n- Forms (inputs, labels)\n- Navigation (header, sidebar)\n\n## 🌓 Theme & Variants\n- Dark/light mode support\n- Color schemes\n- Accessibility considerations\n\n## 🛠 Implementation\n- CSS approach (Tailwind/CSS-in-JS/vanilla CSS)\n- File structure\n- How to use the design system\n\nMake it detailed, professional, and actionable!]"
  },
  "clone_prompts": {
    "architecture": "[Create a SUPERPROMPT that can be given to an AI to recreate ONLY the ARCHITECTURE of this application. Include: tech stack, folder structure, key components, data flow, API design, database schema, and architectural patterns. Make it comprehensive enough that an AI can rebuild the same architecture from scratch.]",
    "design": "[Create a SUPERPROMPT that can be given to an AI to recreate ONLY the DESIGN SYSTEM. Include: complete color palette with exact hex codes, typography with font families and scales, spacing system, component styles (buttons, cards, forms), layout patterns, responsive design rules, dark/light mode specs, and CSS/Tailwind config. Make it so detailed that an AI can recreate pixel-perfect designs.]",
    "full": "[Create a COMPREHENSIVE SUPERPROMPT that combines both architecture AND design. This prompt should enable an AI to create a complete clone of the application with identical architecture, design, and functionality. Include everything from both architecture and design prompts, plus integration details.]",
    "suggestions": "[As a design expert, provide 3-5 ACTIONABLE SUGGESTIONS to improve this design system. Consider: modern design trends 2025, accessibility, performance, scalability, developer experience, and user experience. Format as a bulleted list with brief explanations.]"
  }
}

Respond ONLY with this JSON. No markdown fences, no extra text.`;

  const rawResponse = await callDeepSeek(systemPrompt, userPrompt, {
    temperature: 0.4,
    maxTokens: 8000,
  });

  // Clean response
  let cleaned = rawResponse.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  // Extract JSON
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('AI response does not contain valid JSON');
  }

  const jsonStr = cleaned.substring(start, end + 1);
  const parsed = JSON.parse(jsonStr);

  // Validate structure
  if (!parsed.design?.content || !parsed.clone_prompts) {
    throw new Error('AI response missing required sections');
  }

  return parsed;
}

/**
 * Generate Mermaid diagrams for architecture visualization
 * @param {Object} repoMeta - Repository metadata
 * @param {Array} files - Repository files
 * @returns {Object} Mermaid diagrams
 */
export async function generateMermaidDiagrams(repoMeta, files) {
  const systemPrompt = `You are an expert software architect who creates clear, accurate Mermaid diagrams.
Generate Mermaid diagram code based on codebase analysis.

IMPORTANT: Respond ONLY with valid JSON. No markdown fences.`;

  const fileList = files
    .map(f => `${f.path} (${f.content.length} chars)`)
    .join('\n');

  const userPrompt = `Analyze this codebase and generate Mermaid diagrams.

**Repository:** ${repoMeta.owner}/${repoMeta.repo}
**Language:** ${repoMeta.language}

**Files:**
${fileList}

**Sample Content:**
${files.slice(0, 3).map(f => `=== ${f.path} ===\n${f.content.substring(0, 800)}`).join('\n\n')}

**Generate JSON:**
{
  "architecture": "[Mermaid flowchart code showing high-level architecture. Use graph TD format. Show: User -> Frontend -> Backend -> Database. Include key components.]",
  "components": "[Mermaid graph showing component relationships. Show how main modules/components interact. Use graph LR format.]",
  "dataflow": "[Mermaid sequence diagram showing typical data flow. Show: User action -> API call -> Processing -> Response. Use sequenceDiagram format.]"
}

Generate valid Mermaid syntax. Keep diagrams simple and clear (max 10-12 nodes each).`;

  const rawResponse = await callDeepSeek(systemPrompt, userPrompt, {
    temperature: 0.3,
    maxTokens: 3000,
  });

  // Clean and parse
  let cleaned = rawResponse.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) {
    return {
      architecture: 'graph TD\n  A[Repository] --> B[No diagram generated]',
      components: 'graph LR\n  A[Components] --> B[Analysis pending]',
      dataflow: 'sequenceDiagram\n  User->>System: Action',
    };
  }

  const jsonStr = cleaned.substring(start, end + 1);
  return JSON.parse(jsonStr);
}