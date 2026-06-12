'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileCode2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { GitHubIcon } from '@/components/ui/github-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Navbar } from '@/components/layout/Navbar';

export default function AnalyzePage() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState('');
  const [pat, setPat] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  function addProgress(message, type = 'info') {
    setProgress(prev => [...prev, { message, type, timestamp: Date.now() }]);
  }

  async function handleAnalyze(e) {
    e.preventDefault();
    if (!repoUrl.trim() || !pat.trim()) {
      setError('Mohon isi Repository URL dan Personal Access Token');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setProgress([]);
    setSuccess(false);

    try {
      addProgress('🔗 Connecting to GitHub...', 'info');
      await new Promise(r => setTimeout(r, 500));

      addProgress('📊 Fetching repository info...', 'info');
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: repoUrl.trim(), pat: pat.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.migration_needed) {
          throw new Error(
            `Database belum siap! ${data.instructions || 'Silakan run migration SQL di Supabase.'}`
          );
        }
        throw new Error(data.error || 'Analysis failed');
      }

      addProgress('🌲 Reading file structure...', 'info');
      await new Promise(r => setTimeout(r, 800));

      addProgress('🤖 AI analyzing codebase...', 'info');
      await new Promise(r => setTimeout(r, 1500));

      addProgress('📝 Generating documentation...', 'info');
      await new Promise(r => setTimeout(r, 1000));

      addProgress('✅ Documentation generated successfully!', 'success');
      setSuccess(true);

      setTimeout(() => {
        router.push(`/docs/${data.repoId}`);
      }, 1500);
    } catch (err) {
      addProgress(`❌ Error: ${err.message}`, 'error');
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar rightContent={
        <Link href="/dashboard">
          <Button variant="outline">Dashboard</Button>
        </Link>
      } />

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🔍 Analyze Repository</h1>
          <p className="text-muted-foreground">Generate comprehensive documentation for your GitHub repository</p>
        </div>

        <Card className="p-8 bg-card border-border">
          <form onSubmit={handleAnalyze} className="space-y-6">
            {/* Repository URL */}
            <div>
              <Label htmlFor="repoUrl" className="text-base font-semibold mb-2 block">
                <GitHubIcon className="inline w-5 h-5 mr-2" />
                GitHub Repository URL
              </Label>
              <Input
                id="repoUrl"
                type="url"
                placeholder="https://github.com/owner/repository"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                disabled={analyzing}
                className="bg-input border-border text-foreground"
              />
              <p className="text-xs text-muted-foreground mt-2">Contoh: https://github.com/vercel/next.js</p>
            </div>

            {/* Personal Access Token */}
            <div>
              <Label htmlFor="pat" className="text-base font-semibold mb-2 block">
                🔑 GitHub Personal Access Token
              </Label>
              <Input
                id="pat"
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={pat}
                onChange={(e) => setPat(e.target.value)}
                disabled={analyzing}
                className="bg-input border-border text-foreground"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Token harus memiliki scope <code className="bg-muted px-1 py-0.5 rounded">repo</code>. 
                <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener noreferrer" className="text-primary underline ml-1">
                  Buat token →
                </a>
              </p>
            </div>

            {/* Error */}
            {error && (
              <Card className="p-4 bg-destructive/10 border-destructive/30">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              </Card>
            )}

            {/* Progress */}
            {progress.length > 0 && (
              <Card className="p-4 bg-muted/20 border-border max-h-60 overflow-y-auto">
                <div className="space-y-2">
                  {progress.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      {item.type === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />}
                      {item.type === 'error' && <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
                      {item.type === 'info' && <Loader2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5 animate-spin" />}
                      <span className={item.type === 'error' ? 'text-red-400' : item.type === 'success' ? 'text-green-400' : 'text-muted-foreground'}>
                        {item.message}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={analyzing || success}
              className="w-full bg-primary hover:bg-primary/90 shadow-glow text-lg py-6"
            >
              {analyzing ? (
                <>
                  <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="mr-2 w-5 h-5" />
                  Success! Redirecting...
                </>
              ) : (
                <>
                  <FileCode2 className="mr-2 w-5 h-5" />
                  Generate Documentation
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Card className="p-4 bg-card border-primary/20">
            <div className="text-2xl font-bold text-primary mb-1">60 sec</div>
            <div className="text-sm text-muted-foreground">Average time</div>
          </Card>
          <Card className="p-4 bg-card border-primary/20">
            <div className="text-2xl font-bold text-primary mb-1">3 Docs</div>
            <div className="text-sm text-muted-foreground">README, Arch, Setup</div>
          </Card>
          <Card className="p-4 bg-card border-primary/20">
            <div className="text-2xl font-bold text-primary mb-1">AI-Powered</div>
            <div className="text-sm text-muted-foreground">DeepSeek V4 Pro</div>
          </Card>
        </div>
      </div>
    </div>
  );
}