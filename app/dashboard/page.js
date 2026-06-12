'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileCode2, Trash2, ExternalLink, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Navbar } from '@/components/layout/Navbar';

export default function DashboardPage() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRepos();
  }, []);

  async function fetchRepos() {
    try {
      setLoading(true);
      const res = await fetch('/api/repos');
      const data = await res.json();
      
      if (!res.ok) {
        if (data.migration_needed) {
          setError(
            <div>
              <p className="font-semibold mb-2">Database belum siap!</p>
              <p className="text-sm mb-4">{data.error}</p>
              <a 
                href={data.sql_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline text-sm"
              >
                Buka Supabase SQL Editor →
              </a>
            </div>
          );
          return;
        }
        throw new Error(data.error || 'Failed to fetch repositories');
      }
      
      setRepos(data.repos || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(repoId) {
    if (!confirm('Hapus repository ini? Dokumentasi juga akan terhapus.')) return;
    
    try {
      const res = await fetch(`/api/repos/${repoId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      
      // Refresh list
      setRepos(repos.filter(r => r.id !== repoId));
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar rightContent={
        <Link href="/analyze">
          <Button className="bg-primary hover:bg-primary/90">Analyze New Repo</Button>
        </Link>
      } />

      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">📚 Your Repositories</h1>
          <p className="text-muted-foreground">Manage and view all your analyzed repositories</p>
        </div>

        {/* Error State */}
        {error && (
          <Card className="p-6 bg-destructive/10 border-destructive/30 mb-6">
            <div className="flex items-start gap-3">
              <XCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
              <div className="text-destructive">{error}</div>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && repos.length === 0 && (
          <Card className="p-12 text-center">
            <FileCode2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-2">Belum ada repository</h3>
            <p className="text-muted-foreground mb-6">Mulai analyze repository GitHub pertama Anda!</p>
            <Link href="/analyze">
              <Button className="bg-primary hover:bg-primary/90">Analyze Repository</Button>
            </Link>
          </Card>
        )}

        {/* Repos Grid */}
        {!loading && !error && repos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repos.map(repo => (
              <RepoCard key={repo.id} repo={repo} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RepoCard({ repo, onDelete }) {
  const statusConfig = {
    pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Pending' },
    analyzing: { icon: Loader2, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Analyzing...', spin: true },
    complete: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Complete' },
    error: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Error' },
  };

  const status = statusConfig[repo.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <Card className="p-6 bg-card border-border hover:border-primary/50 transition-all hover:shadow-glow group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate mb-1">{repo.name || repo.repo}</h3>
          <p className="text-sm text-muted-foreground truncate">{repo.owner}/{repo.repo}</p>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${status.bg} flex-shrink-0 ml-2`}>
          <StatusIcon className={`w-4 h-4 ${status.color} ${status.spin ? 'animate-spin' : ''}`} />
          <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
        </div>
      </div>

      {repo.description && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{repo.description}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
        {repo.language && <span className="flex items-center gap-1">🔷 {repo.language}</span>}
        {repo.stars !== null && <span>⭐ {repo.stars}</span>}
      </div>

      {repo.status === 'error' && repo.error && (
        <div className="text-xs text-red-500 bg-red-500/10 p-2 rounded mb-4">
          {repo.error}
        </div>
      )}

      <div className="flex gap-2">
        {repo.status === 'complete' && repo.doc_id && (
          <Link href={`/docs/${repo.id}`} className="flex-1">
            <Button className="w-full bg-primary hover:bg-primary/90" size="sm">
              View Docs
              <ExternalLink className="ml-2 w-3 h-3" />
            </Button>
          </Link>
        )}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onDelete(repo.id)}
          className="text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}