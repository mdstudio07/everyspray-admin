'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icons } from '@/lib/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useAuthStore } from '@/lib/stores/auth';

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

function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = async () => {
    await signOut();
    setShowLogoutDialog(false);
    router.push('/login');
  };

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Icons.Trophy className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Perfume Community</span>
                  <span className="truncate text-xs">Contributor</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={`https://avatar.vercel.sh/${user?.email}`} />
                <AvatarFallback className="rounded-lg">
                  {user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user?.email}</span>
                <span className="truncate text-xs">Contributor</span>
              </div>
              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowLogoutDialog(true);
                }}
                className="flex h-auto cursor-pointer items-center justify-center rounded-md p-1 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <Icons.LogOut className="h-4 w-4" />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Logout Confirmation Dialog - Moved outside SidebarMenuButton */}
        <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">Sign out</DialogTitle>
              <DialogDescription>
                Are you sure you want to sign out? You&apos;ll need to sign in again to access your account.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowLogoutDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleLogout}
              >
                Sign out
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function ContributorLayout({ children }: ContributorLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-px bg-sidebar-border" />
            <h1 className="text-lg font-semibold">Contributor Dashboard</h1>
          </div>
          <div className="ml-auto px-4">
            <ThemeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}