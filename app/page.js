'use client';

import Link from 'next/link';
import { FileCode2, Sparkles, Zap, BookOpen, Github, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
              DocForge AI
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/analyze">
              <Button className="bg-primary hover:bg-primary/90 shadow-glow">
                Get Started
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-fade-in">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-medium">Powered by DeepSeek AI</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up">
          <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Transform Your Codebase
          </span>
          <br />
          <span className="text-foreground">Into Beautiful Documentation</span>
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up">
          Connect your GitHub repository and let AI generate comprehensive, interactive documentation in seconds.
          No more manual writing.
        </p>

        <div className="flex gap-4 justify-center animate-slide-up">
          <Link href="/analyze">
            <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-glow text-lg px-8 py-6">
              <Github className="mr-2 w-5 h-5" />
              Analyze Repository
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              <BookOpen className="mr-2 w-5 h-5" />
              View Docs
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-3xl mx-auto">
          <Card className="p-6 bg-card border-primary/20 hover:border-primary/50 transition-all hover:shadow-glow">
            <div className="text-4xl font-bold text-primary mb-2">60 sec</div>
            <div className="text-muted-foreground">Average Analysis Time</div>
          </Card>
          <Card className="p-6 bg-card border-primary/20 hover:border-primary/50 transition-all hover:shadow-glow">
            <div className="text-4xl font-bold text-primary mb-2">100%</div>
            <div className="text-muted-foreground">AI-Powered</div>
          </Card>
          <Card className="p-6 bg-card border-primary/20 hover:border-primary/50 transition-all hover:shadow-glow">
            <div className="text-4xl font-bold text-primary mb-2">3+</div>
            <div className="text-muted-foreground">Doc Types Generated</div>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">✨ Powerful Features</h2>
          <p className="text-xl text-muted-foreground">Everything you need to create world-class documentation</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Zap className="w-8 h-8 text-primary" />}
            title="Lightning Fast Analysis"
            description="Connect your repo and get comprehensive docs in under a minute. No waiting, no hassle."
          />
          <FeatureCard
            icon={<FileCode2 className="w-8 h-8 text-primary" />}
            title="Smart Code Understanding"
            description="DeepSeek AI analyzes your codebase structure, patterns, and dependencies intelligently."
          />
          <FeatureCard
            icon={<BookOpen className="w-8 h-8 text-primary" />}
            title="Multiple Doc Types"
            description="Get README, Architecture Overview, and Setup Guide automatically generated."
          />
          <FeatureCard
            icon={<Sparkles className="w-8 h-8 text-primary" />}
            title="Beautiful Formatting"
            description="Professional GitHub Flavored Markdown with syntax highlighting and emojis."
          />
          <FeatureCard
            icon={<Github className="w-8 h-8 text-primary" />}
            title="GitHub Integration"
            description="Simple PAT authentication. Works with public and private repositories."
          />
          <FeatureCard
            icon={<CheckCircle2 className="w-8 h-8 text-primary" />}
            title="Export & Share"
            description="Download docs as Markdown or PDF. Copy to clipboard with one click."
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">🚀 How It Works</h2>
          <p className="text-xl text-muted-foreground">Three simple steps to amazing documentation</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          <StepCard
            number="1"
            title="Connect Your Repository"
            description="Paste your GitHub repository URL and provide a Personal Access Token for secure access."
          />
          <StepCard
            number="2"
            title="AI Analyzes Your Code"
            description="DeepSeek AI scans your codebase, understands structure, reads key files, and identifies patterns."
          />
          <StepCard
            number="3"
            title="Get Beautiful Docs"
            description="View, export, or regenerate comprehensive documentation in an interactive viewer."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="p-12 text-center bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Docs?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join developers who trust DocForge AI to create professional documentation automatically.
          </p>
          <Link href="/analyze">
            <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-glow-lg text-lg px-10 py-6">
              Start Analyzing Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 DocForge AI. Powered by DeepSeek & Supabase.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <Card className="p-6 bg-card border-border hover:border-primary/50 transition-all hover:shadow-glow group">
      <div className="mb-4 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </Card>
  );
}

function StepCard({ number, title, description }) {
  return (
    <div className="flex gap-6 items-start">
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-xl font-bold text-primary">
        {number}
      </div>
      <div>
        <h3 className="text-2xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-lg">{description}</p>
      </div>
    </div>
  );
}
