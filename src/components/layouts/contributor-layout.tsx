'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuthStore } from '@/lib/stores/auth';
import { cn } from '@/lib/utils';

interface ContributorLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/contribute/dashboard',
    icon: Icons.Dashboard,
  },
  {
    name: 'Create Perfume',
    href: '/contribute/perfume/create',
    icon: Icons.Plus,
  },
  {
    name: 'Create Brand',
    href: '/contribute/brand/create',
    icon: Icons.Plus,
  },
  {
    name: 'My Contributions',
    href: '/contribute/my-contributions',
    icon: Icons.FileText,
  },
  {
    name: 'Profile',
    href: '/contribute/profile',
    icon: Icons.User,
  },
  {
    name: 'Achievements',
    href: '/contribute/achievements',
    icon: Icons.Trophy,
  },
];

export default function ContributorLayout({ children }: ContributorLayoutProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuthStore();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-foreground">Perfume Community</h1>
            <span className="text-sm text-muted-foreground">Contributor</span>
          </div>

          <div className="ml-auto flex items-center space-x-4">
            <ThemeToggle />

            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={`https://avatar.vercel.sh/${user?.email}`} />
                <AvatarFallback>
                  {user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-foreground">{user?.email}</span>
            </div>

            <Button variant="ghost" size="sm" onClick={signOut}>
              <Icons.LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card min-h-[calc(100vh-4rem)]">
          <nav className="space-y-2 p-4">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}