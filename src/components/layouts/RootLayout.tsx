import { ThemeToggle } from '@/components/common/ThemeToggle';
import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-xl font-bold text-foreground">
          Personal Dashboard
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border py-6">
      <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground sm:px-6">
        © {new Date().getFullYear()} Personal Dashboard. All rights reserved.
      </div>
    </footer>
  );
}
