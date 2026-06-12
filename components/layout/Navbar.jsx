'use client';

import Link from 'next/link';
import { FileCode2, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/context';

export function Navbar({ children, rightContent }) {
  const { user, loading, signOut } = useAuth();

  async function handleSignOut() {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  }

  return (
    <nav className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {children}
          <Link href="/" className="flex items-center gap-2">
            <FileCode2 className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
              DocForge AI
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {rightContent}
          {loading ? null : user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span className="truncate max-w-[150px]">{user.email}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-destructive">
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm" className="bg-primary hover:bg-primary/90">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
