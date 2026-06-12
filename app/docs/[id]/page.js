'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import {
  ArrowLeft,
  FileText,
  Network,
  Settings,
  Copy,
  CheckCircle2,
  Loader2,
  AlertCircle,
  DownloadIcon,
  Palette,
  Zap,
  GitBranch,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navbar } from '@/components/layout/Navbar';

// Import highlight.js theme
import 'highlight.js/styles/github-dark.css';

const DiagramsSection = dynamic(() => import('@/components/docs/DiagramsSection'), { ssr: false });

export default function DocsViewerPage() {
  const params = useParams();
  const router = useRouter();
  const repoId = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [repo, setRepo] = useState(null);
  const [documentation, setDocumentation] = useState(null);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    fetchDocs();
  }, [repoId]);

  async function fetchDocs() {
    try {
      setLoading(true);
      const res = await fetch(`/api/repos/${repoId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch documentation');
      }

      setRepo(data.repo);
      setDocumentation(data.documentation);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(content, id) {
    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      alert('Failed to copy to clipboard');
    }
  }

  function handleDownload(content, filename) {
    if (!content) return;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading documentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center bg-destructive/10 border-destructive/30">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (!documentation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Documentation Found</h2>
          <p className="text-muted-foreground mb-6">This repository has not been analyzed yet.</p>
          <Link href="/analyze">
            <Button>Analyze Repository</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: 'readme', label: 'README', icon: FileText },
    { id: 'architecture', label: 'Architecture', icon: Network },
    { id: 'setup', label: 'Setup Guide', icon: Settings },
    ...(documentation.design?.content ? [{ id: 'design', label: 'Design System', icon: Palette }] : []),
    ...(documentation.clone_prompts ? [{ id: 'clone', label: 'Clone Prompts', icon: Zap }] : []),
    ...(documentation.mermaid_diagrams ? [{ id: 'diagrams', label: 'Diagrams', icon: GitBranch }] : []),
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar
        rightContent={repo?.language && (
          <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
            {repo.language}
          </div>
        )}
      >
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="hidden sm:flex items-center gap-2">
          <div>
            <div className="font-semibold text-sm">{repo?.name || repo?.repo}</div>
            <div className="text-xs text-muted-foreground">{repo?.owner}/{repo?.repo}</div>
          </div>
        </div>
      </Navbar>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Tabs defaultValue="readme" className="w-full">
          <TabsList className="grid w-full mb-8" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Standard Documentation Tabs */}
          {['readme', 'architecture', 'setup'].map(tabId => (
            <TabsContent key={tabId} value={tabId}>
              <DocSection
                content={documentation[tabId]?.content}
                onCopy={() => handleCopy(documentation[tabId]?.content, tabId)}
                onDownload={() => handleDownload(documentation[tabId]?.content, `${repo.repo}_${tabId}.md`)}
                copied={copied === tabId}
              />
            </TabsContent>
          ))}

          {/* Design System Tab */}
          {documentation.design?.content && (
            <TabsContent value="design">
              <DocSection
                content={documentation.design.content}
                onCopy={() => handleCopy(documentation.design.content, 'design')}
                onDownload={() => handleDownload(documentation.design.content, `${repo.repo}_design_system.md`)}
                copied={copied === 'design'}
              />
            </TabsContent>
          )}

          {/* Clone Prompts Tab */}
          {documentation.clone_prompts && (
            <TabsContent value="clone">
              <ClonePromptsSection
                clonePrompts={documentation.clone_prompts}
                onCopy={handleCopy}
                copied={copied}
              />
            </TabsContent>
          )}

          {/* Mermaid Diagrams Tab */}
          {documentation.mermaid_diagrams && (
            <TabsContent value="diagrams">
              <DiagramsSection diagrams={documentation.mermaid_diagrams} />
            </TabsContent>
          )}
        </Tabs>

        {/* Metadata */}
        {documentation.metadata && (
          <Card className="p-4 mt-6 bg-muted/20 border-border">
            <div className="flex gap-6 text-sm text-muted-foreground flex-wrap">
              <div>
                <span className="font-medium">Files Analyzed:</span>{' '}
                {documentation.metadata.analyzed_files || 'N/A'}
              </div>
              {documentation.metadata.has_design_system && (
                <div>
                  <span className="font-medium">Styling:</span>{' '}
                  {documentation.metadata.styling_approach?.join(', ') || 'Detected'}
                </div>
              )}
              <div>
                <span className="font-medium">Generated:</span>{' '}
                {new Date(documentation.created_at).toLocaleDateString()}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function DocSection({ content, onCopy, onDownload, copied }) {
  return (
    <Card className="p-8 bg-card border-border">
      <div className="flex gap-2 mb-6 pb-4 border-b border-border/40">
        <Button variant="outline" size="sm" onClick={onCopy} className="flex items-center gap-2">
          {copied ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          )}
        </Button>
        <Button variant="outline" size="sm" onClick={onDownload} className="flex items-center gap-2">
          <DownloadIcon className="w-4 h-4" />
          Download
        </Button>
      </div>
      <div className="prose prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight, rehypeRaw]}>
          {content || '# No content available'}
        </ReactMarkdown>
      </div>
    </Card>
  );
}

function ClonePromptsSection({ clonePrompts, onCopy, copied }) {
  const prompts = [
    { id: 'architecture', title: '🏗️ Architecture Clone', desc: 'Recreate the system architecture', content: clonePrompts.architecture },
    { id: 'design', title: '🎨 Design Clone', desc: 'Recreate the design system', content: clonePrompts.design },
    { id: 'full', title: '⚡ Full Clone', desc: 'Complete architecture + design', content: clonePrompts.full },
    { id: 'suggestions', title: '💡 Design Improvements', desc: 'AI-suggested enhancements', content: clonePrompts.suggestions },
  ];

  return (
    <div className="space-y-4">
      {prompts.map(prompt => (
        prompt.content && (
          <Card key={prompt.id} className="p-6 bg-card border-border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold mb-1">{prompt.title}</h3>
                <p className="text-sm text-muted-foreground">{prompt.desc}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCopy(prompt.content, prompt.id)}
                className="flex items-center gap-2"
              >
                {copied === prompt.id ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg border border-border/40 max-h-96 overflow-y-auto">
              <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">{prompt.content}</pre>
            </div>
          </Card>
        )
      ))}
    </div>
  );
}


