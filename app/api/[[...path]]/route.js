import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabase/server';
import {
  createGitHubClient,
  parseGitHubUrl,
  getRepoInfo,
  getRepoTree,
  selectImportantFiles,
  getMultipleFileContents,
} from '@/lib/github/api';
import { generateDocumentation } from '@/lib/ai/deepseek';
import { analyzeDesignSystem, createDesignSummary } from '@/lib/design/analyzer';
import { generateDesignDocumentation, generateMermaidDiagrams } from '@/lib/ai/design-docs';

export const maxDuration = 90;

// ============================================
// Helper: Handle Supabase errors
// ============================================
function handleDbError(error) {
  if (!error) return null;
  const msg = error?.message || '';
  if (msg.includes('does not exist') || error?.code === 'PGRST205' || error?.code === '42P01') {
    return NextResponse.json({
      error: 'Database tables not found. Please run the SQL migration first.',
      migration_needed: true,
      instructions: 'Run the SQL file at /app/supabase/migrations/001_initial_schema.sql in your Supabase SQL Editor',
      sql_url: `https://supabase.com/dashboard/project/gsytlheevnquetnmdind/sql/new`,
    }, { status: 503 });
  }
  return null;
}

// ============================================
// GET - Fetch repositories and documentation
// ============================================
export async function GET(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/?/, '');
  const segments = path.split('/').filter(Boolean);

  try {
    // Health check
    if (segments.length === 0) {
      return NextResponse.json({
        status: 'ok',
        service: 'DocForge AI',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      });
    }

    // GET /api/repos - List all repositories
    if (segments[0] === 'repos' && segments.length === 1) {
      const { data, error } = await supabaseAdmin
        .from('repositories')
        .select('*')
        .order('created_at', { ascending: false });

      const dbErr = handleDbError(error);
      if (dbErr) return dbErr;
      if (error) throw error;

      return NextResponse.json({ repos: data || [] });
    }

    // GET /api/repos/[id] - Get specific repository with documentation
    if (segments[0] === 'repos' && segments[1]) {
      const repoId = segments[1];

      const { data: repo, error: repoErr } = await supabaseAdmin
        .from('repositories')
        .select('*')
        .eq('id', repoId)
        .single();

      const dbErr = handleDbError(repoErr);
      if (dbErr) return dbErr;
      if (repoErr || !repo) {
        return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
      }

      // Fetch associated documentation
      let documentation = null;
      if (repo.doc_id) {
        const { data: docData } = await supabaseAdmin
          .from('documentation')
          .select('*')
          .eq('id', repo.doc_id)
          .single();
        documentation = docData;
      }

      return NextResponse.json({ repo, documentation });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (err) {
    console.error('GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ============================================
// POST - Analyze repository
// ============================================
export async function POST(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/?/, '');
  const segments = path.split('/').filter(Boolean);

  try {
    // POST /api/analyze - Analyze GitHub repository
    if (segments[0] === 'analyze') {
      const body = await request.json();
      const { repoUrl, pat } = body;

      // Validation
      if (!repoUrl?.trim()) {
        return NextResponse.json({ error: 'Repository URL is required' }, { status: 400 });
      }
      if (!pat?.trim()) {
        return NextResponse.json({ error: 'GitHub Personal Access Token is required' }, { status: 400 });
      }

      // Parse GitHub URL
      let owner, repo;
      try {
        const parsed = parseGitHubUrl(repoUrl.trim());
        owner = parsed.owner;
        repo = parsed.repo;
      } catch (parseErr) {
        return NextResponse.json({ error: parseErr.message }, { status: 400 });
      }

      // Create GitHub client
      const octokit = createGitHubClient(pat.trim());

      // Create repository record in database
      const { data: newRepo, error: insertErr } = await supabaseAdmin
        .from('repositories')
        .insert({
          url: repoUrl.trim(),
          owner,
          repo,
          status: 'analyzing',
        })
        .select()
        .single();

      const dbErr = handleDbError(insertErr);
      if (dbErr) return dbErr;
      if (insertErr) throw insertErr;

      const repoId = newRepo.id;

      try {
        // Step 1: Fetch repository info
        const repoInfo = await getRepoInfo(octokit, owner, repo);

        // Step 2: Fetch repository tree
        const tree = await getRepoTree(octokit, owner, repo, repoInfo.defaultBranch);

        // Step 3: Select important files
        const selectedFiles = selectImportantFiles(tree);

        if (selectedFiles.length === 0) {
          throw new Error('No files found to analyze. Repository might be empty.');
        }

        // Step 4: Fetch file contents
        const filesWithContent = await getMultipleFileContents(octokit, owner, repo, selectedFiles);

        if (filesWithContent.length === 0) {
          throw new Error('Could not read any files. Verify PAT permissions (needs "repo" scope).');
        }

        // Step 5: Generate documentation with DeepSeek AI
        const documentation = await generateDocumentation(
          {
            owner,
            repo,
            description: repoInfo.description,
            language: repoInfo.language,
            stars: repoInfo.stars,
          },
          filesWithContent
        );

        // Step 6: Analyze Design System
        const designAnalysis = analyzeDesignSystem(filesWithContent);
        const designSummary = createDesignSummary(designAnalysis, filesWithContent);
        
        // Step 7: Generate Design Documentation + Clone Superprompts (if design exists)
        let designDocs = { design: { content: '' }, clone_prompts: {} };
        if (designAnalysis.hasStyles) {
          designDocs = await generateDesignDocumentation(
            { owner, repo, language: repoInfo.language },
            designAnalysis,
            designSummary
          );
        }

        // Step 8: Generate Mermaid Diagrams
        const mermaidDiagrams = await generateMermaidDiagrams(
          { owner, repo, language: repoInfo.language },
          filesWithContent
        );

        // Step 9: Save documentation to database
        const { data: docRecord, error: docErr } = await supabaseAdmin
          .from('documentation')
          .insert({
            repo_id: repoId,
            readme: documentation.readme,
            architecture: documentation.architecture,
            setup: documentation.setup,
            design: designDocs.design || {},
            clone_prompts: designDocs.clone_prompts || {},
            mermaid_diagrams: mermaidDiagrams || {},
            files_analyzed: filesWithContent.map(f => f.path),
            metadata: {
              total_files: selectedFiles.length,
              analyzed_files: filesWithContent.length,
              has_design_system: designAnalysis.hasStyles,
              styling_approach: designAnalysis.stylingApproach,
            },
          })
          .select()
          .single();

        if (docErr) throw docErr;

        // Step 10: Update repository status to complete
        await supabaseAdmin
          .from('repositories')
          .update({
            status: 'complete',
            doc_id: docRecord.id,
            name: repoInfo.name,
            description: repoInfo.description,
            language: repoInfo.language,
            stars: repoInfo.stars,
            forks: repoInfo.forks,
            default_branch: repoInfo.defaultBranch,
            analyzed_at: new Date().toISOString(),
          })
          .eq('id', repoId);

        return NextResponse.json({
          success: true,
          repoId,
          docId: docRecord.id,
          message: 'Documentation generated successfully',
        });
      } catch (analysisError) {
        // Update repository with error status
        await supabaseAdmin
          .from('repositories')
          .update({
            status: 'error',
            error: analysisError.message,
          })
          .eq('id', repoId);

        throw analysisError;
      }
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (err) {
    console.error('POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ============================================
// DELETE - Delete repository
// ============================================
export async function DELETE(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/?/, '');
  const segments = path.split('/').filter(Boolean);

  try {
    // DELETE /api/repos/[id]
    if (segments[0] === 'repos' && segments[1]) {
      const { error } = await supabaseAdmin
        .from('repositories')
        .delete()
        .eq('id', segments[1]);

      if (error) throw error;

      return NextResponse.json({ success: true, message: 'Repository deleted' });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (err) {
    console.error('DELETE error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
