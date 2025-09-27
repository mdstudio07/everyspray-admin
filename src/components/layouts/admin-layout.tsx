'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuthStore } from '@/lib/stores/auth';
import { isSuperAdmin } from '@/lib/auth/roles';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: Icons.Dashboard,
  },
  {
    name: 'Perfumes',
    href: '/admin/perfumes',
    icon: Icons.Package,
  },
  {
    name: 'Brands',
    href: '/admin/brands',
    icon: Icons.Database,
  },
  {
    name: 'Notes',
    href: '/admin/notes',
    icon: Icons.Tag,
  },
  {
    name: 'Moderation',
    href: '/admin/moderation',
    icon: Icons.Shield,
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Icons.Settings,
  },
];

const superAdminItems = [
  {
    name: 'Users',
    href: '/admin/users',
    icon: Icons.Users,
  },
  {
    name: 'Team Management',
    href: '/admin/team-management',
    icon: Icons.Settings,
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: Icons.BarChart3,
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuthStore();
  const isSuper = user ? isSuperAdmin(user.role) : false;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-foreground">Perfume Community</h1>
            <span className="text-sm text-muted-foreground">
              {isSuper ? 'Super Admin' : 'Admin'}
            </span>
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

            {/* Super Admin Section */}
            {isSuper && (
              <>
                <div className="border-t pt-4 mt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                    Super Admin
                  </p>
                </div>
                {superAdminItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-destructive text-destructive-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </>
            )}
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