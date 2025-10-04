import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      {/* Theme toggle in top right corner */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Left side - Auth form */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {children}
        </div>
      </div>

      {/* Right side - Visual with gradient background */}
      <div className="hidden lg:block relative bg-gradient-to-br from-primary/20 via-background to-secondary/20">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="space-y-6 text-center max-w-lg">
            <h2 className="font-heading text-4xl font-bold tracking-tight">
              EverySpray
            </h2>
            <blockquote className="space-y-2">
              <p className="text-lg italic text-muted-foreground">
                &ldquo;Join our community-driven perfume database. Contribute, discover, and explore the world of fragrances together.&rdquo;
              </p>
            </blockquote>
            <div className="pt-4">
              <p className="text-sm text-muted-foreground">
                Built with Next.js, Supabase, and shadcn/ui
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}