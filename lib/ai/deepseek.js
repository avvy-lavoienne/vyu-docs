// DeepSeek AI API service

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

/**
 * Call DeepSeek AI API
 * @param {string} systemPrompt - System instructions
 * @param {string} userPrompt - User message
 * @param {object} options - Additional options
 */
export async function callDeepSeek(systemPrompt, userPrompt, options = {}) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options.model || DEEPSEEK_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: options.temperature || 0.3,
      max_tokens: options.maxTokens || 4096,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`DeepSeek API error (${response.status}): ${errorText.substring(0, 200)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Generate comprehensive documentation for a repository
 * @param {object} repoMeta - Repository metadata
 * @param {Array} files - Array of {path, content}
 */
export async function generateDocumentation(repoMeta, files) {
  const fileList = files
    .map(f => `=== ${f.path} ===\n${f.content.substring(0, 2000)}`)
    .join('\n\n---\n\n');

  const systemPrompt = `You are a world-class technical writer and software architect.
Your task is to analyze code and generate comprehensive, developer-friendly documentation.

IMPORTANT: You MUST respond with VALID JSON ONLY. No markdown code fences. No extra text.
Start with { and end with }. The JSON must be parseable.`;

  const userPrompt = `Analyze this GitHub repository and generate professional documentation.

**Repository Info:**
- Name: ${repoMeta.owner}/${repoMeta.repo}
- Description: ${repoMeta.description || 'Not provided'}
- Language: ${repoMeta.language || 'Unknown'}
- Stars: ${repoMeta.stars || 0}

**Key Files Analyzed:**
${fileList}

**Instructions:**
Generate a JSON object with this EXACT structure:

{
  "readme": {
    "content": "[Write a complete README.md in GitHub Flavored Markdown. Include: # Project Title with emoji, badges section (placeholder), compelling project overview (2-3 paragraphs explaining what it does and why it matters), ## ✨ Features (bullet list with emojis), ## 🛠 Tech Stack (detailed list based on files), ## 📁 Project Structure (visual tree of key folders/files), ## 🚀 Getting Started (prerequisites, installation, usage), ## 🤝 Contributing (brief guide). Make it professional, engaging, and detailed. Use real information from the code.]"
  },
  "architecture": {
    "content": "[Write an Architecture Overview in Markdown. Include: # 🏗 Architecture Overview, ## System Design (high-level explanation of how the system works), ## Core Components (detailed breakdown of each module/component found in the code with their responsibilities), ## Data Flow (explain how data moves through the system), ## Key Technologies (explain why each tech was chosen based on the code), ## Design Patterns (identify patterns used). Be technical and precise. Include code snippets where relevant.]"
  },
  "setup": {
    "content": "[Write a detailed Setup & Installation Guide in Markdown. Include: # 🚀 Setup Guide, ## Prerequisites (list exact versions from package.json/requirements.txt), ## Installation Steps (numbered list with actual commands), ## Environment Configuration (list all env variables from .env.example if found, or infer from code), ## Running the Project (dev, build, test commands), ## Docker Setup (if Dockerfile exists), ## Troubleshooting (common issues and solutions). Be extremely detailed and accurate.]"
  }
}

Respond ONLY with this JSON. No backticks, no markdown fences, no explanation.`;

  const rawResponse = await callDeepSeek(systemPrompt, userPrompt, {
    temperature: 0.3,
    maxTokens: 6000,
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
  if (!parsed.readme?.content || !parsed.architecture?.content || !parsed.setup?.content) {
    throw new Error('AI response missing required documentation sections');
  }

  return parsed;
}