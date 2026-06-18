'use client';

import { motion } from 'framer-motion';

import { Link } from '@/i18n/navigation';

export function HeroSection() {
  return (
    <section className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl space-y-6"
      >
        <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
          Personal <span className="text-primary">Dashboard</span>
        </h1>

        <p className="text-lg text-muted-foreground">
          A production-ready Next.js starter built with TypeScript, Tailwind, Zustand, TanStack
          Query, and all the best practices you need.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-6 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Sign In
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
