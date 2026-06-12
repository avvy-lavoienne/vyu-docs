// GitHub API service wrapper
import { Octokit } from '@octokit/rest';

/**
 * Parse GitHub repository URL
 * @param {string} url - GitHub repository URL
 * @returns {{owner: string, repo: string}}
 */
export function parseGitHubUrl(url) {
  const match = url.match(/github\.com\/([^\/\s?#]+)\/([^\/\s?#]+)/);
  if (!match) {
    throw new Error('Invalid GitHub URL. Expected format: https://github.com/owner/repo');
  }
  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, ''),
  };
}

/**
 * Create authenticated Octokit instance
 * @param {string} pat - Personal Access Token
 * @returns {Octokit}
 */
export function createGitHubClient(pat) {
  if (!pat) throw new Error('GitHub Personal Access Token is required');
  return new Octokit({ auth: pat });
}

/**
 * Fetch repository metadata
 * @param {Octokit} octokit - Authenticated Octokit instance
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 */
export async function getRepoInfo(octokit, owner, repo) {
  try {
    const { data } = await octokit.repos.get({ owner, repo });
    return {
      name: data.name,
      fullName: data.full_name,
      description: data.description || '',
      language: data.language || 'Unknown',
      stars: data.stargazers_count || 0,
      forks: data.forks_count || 0,
      defaultBranch: data.default_branch || 'main',
      topics: data.topics || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    if (error.status === 404) {
      throw new Error('Repository not found. Check URL and permissions.');
    }
    if (error.status === 403) {
      throw new Error('Access denied. Ensure your PAT has "repo" scope.');
    }
    throw new Error(`GitHub API error: ${error.message}`);
  }
}

/**
 * Fetch repository file tree
 * @param {Octokit} octokit
 * @param {string} owner
 * @param {string} repo
 * @param {string} branch
 */
export async function getRepoTree(octokit, owner, repo, branch = 'HEAD') {
  try {
    const { data } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: branch,
      recursive: 'true',
    });
    return data.tree || [];
  } catch (error) {
    throw new Error(`Failed to fetch repository tree: ${error.message}`);
  }
}

/**
 * Select important files for analysis
 * @param {Array} tree - Repository file tree
 * @returns {Array} Selected files
 */
export function selectImportantFiles(tree) {
  const priorityFiles = [
    'README.md', 'readme.md', 'README.mdx',
    'package.json', 'requirements.txt', 'Cargo.toml', 'go.mod',
    'setup.py', 'pyproject.toml', 'composer.json',
    'Dockerfile', 'docker-compose.yml', '.env.example',
    'main.py', 'main.go', 'index.ts', 'index.js',
    'app.py', 'server.py', 'main.ts', 'app.ts',
  ];

  const sourceExtensions = [
    '.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs',
    '.java', '.kt', '.rb', '.php', '.swift', '.c', '.cpp', '.h',
  ];

  const excludePaths = [
    'node_modules/', '.git/', 'dist/', 'build/', '.next/',
    '__pycache__/', 'vendor/', 'coverage/', 'target/',
    '.lock', '.min.js', '.min.css', 'yarn.lock', 'package-lock.json',
  ];

  // Filter out excluded paths
  const files = tree.filter(f =>
    f.type === 'blob' &&
    !excludePaths.some(ex => f.path.includes(ex))
  );

  // Priority files (config, main entry points)
  const important = files.filter(f =>
    priorityFiles.some(p => f.path === p || f.path.endsWith('/' + p))
  );

  // Source code files
  const sourceFiles = files
    .filter(f => {
      if (important.some(i => i.path === f.path)) return false;
      if (!sourceExtensions.some(e => f.path.endsWith(e))) return false;
      if ((f.size || 0) > 25000) return false; // Skip large files
      return true;
    })
    .sort((a, b) => {
      // Prioritize src/, lib/, app/ folders
      const aPriority = (a.path.startsWith('src/') || a.path.startsWith('lib/') || a.path.startsWith('app/')) ? 1 : 0;
      const bPriority = (b.path.startsWith('src/') || b.path.startsWith('lib/') || b.path.startsWith('app/')) ? 1 : 0;
      return bPriority - aPriority;
    });

  // Return up to 10 files total
  return [...important, ...sourceFiles].slice(0, 10);
}

/**
 * Fetch file content
 * @param {Octokit} octokit
 * @param {string} owner
 * @param {string} repo
 * @param {string} path
 */
export async function getFileContent(octokit, owner, repo, path) {
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    if (data.content) {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }
    return null;
  } catch (error) {
    console.warn(`Could not fetch ${path}:`, error.message);
    return null;
  }
}

/**
 * Fetch multiple file contents
 * @param {Octokit} octokit
 * @param {string} owner
 * @param {string} repo
 * @param {Array} files
 */
export async function getMultipleFileContents(octokit, owner, repo, files) {
  const results = [];
  for (const file of files) {
    const content = await getFileContent(octokit, owner, repo, file.path);
    if (content) {
      results.push({
        path: file.path,
        content: content.substring(0, 3000), // Limit per file
      });
    }
  }
  return results;
}