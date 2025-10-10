import { ThemeToggle } from '@/components/ui/theme-toggle';

/**
 * Auth Layout Component
 *
 * Responsive split-screen layout for authentication pages.
 * Left: Auth forms | Right: Brand visual
 *
 * Follows:
 * - Rule 41: Spacing scale (py-12, px-8, space-y-8)
 * - Rule 46: Semantic HTML (<main>, <section>, <header>)
 * - Rule 47: Responsive design (mobile-first, lg:grid-cols-2)
 * - Rule 53: Information hierarchy (Section → Group → Element)
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      {/* Theme toggle - fixed position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Left side - Auth form */}
      <main className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        {/* Max width container with standard spacing (Rule 41) */}
        <div className="w-full max-w-md space-y-8">
          {children}
        </div>
      </main>

      {/* Right side - Brand visual */}
      <aside
        className="hidden lg:flex relative bg-gradient-to-br from-primary/20 via-background to-secondary/20"
        aria-label="Brand showcase"
      >
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <section className="space-y-8 text-center max-w-lg">
            {/* Header with hierarchy (Rule 42, Rule 53) */}
            <header className="space-y-4">
              <h2 className="font-heading text-4xl font-bold tracking-tight">
                EverySpray
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Join our community-driven perfume database. Contribute,
                discover, and explore the world of fragrances together.
              </p>
            </header>

            {/* Tech stack footer */}
            <footer>
              <p className="text-sm text-muted-foreground">
                Built with Next.js, Supabase, and shadcn/ui
              </p>
            </footer>
          </section>
        </div>
      </aside>
    </div>
  );
}
