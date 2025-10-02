'use client';

import Link from 'next/link';
import { Icons } from '@/lib/icons';
import { useAuthStore } from '@/lib/stores/auth';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboard() {
  const { user, isSuperAdmin, isTeamMember } = useAuthStore();

  const stats = [
    {
      title: 'Total Perfumes',
      value: 1542,
      description: '+12 from last month',
      icon: Icons.Package,
      change: '+12',
    },
    {
      title: 'Pending Approvals',
      value: 23,
      description: 'Submissions awaiting review',
      icon: Icons.Loading,
      change: '+5',
    },
    {
      title: 'Active Users',
      value: 387,
      description: 'Contributors this month',
      icon: Icons.Users,
      change: '+18',
    },
    {
      title: 'Total Brands',
      value: 156,
      description: '+2 from last month',
      icon: Icons.Tag,
      change: '+2',
    },
  ];

  const quickActions = [
    {
      title: 'Review Submissions',
      description: 'Approve or reject pending contributions',
      href: '/admin/moderation',
      icon: Icons.Check,
      variant: 'default' as const,
      count: 23,
    },
    {
      title: 'Manage Perfumes',
      description: 'Add, edit, or remove perfumes',
      href: '/admin/perfumes',
      icon: Icons.Package,
      variant: 'outline' as const,
    },
    {
      title: 'Manage Brands',
      description: 'Add, edit, or remove brands',
      href: '/admin/brands',
      icon: Icons.Tag,
      variant: 'outline' as const,
    },
    {
      title: 'Manage Notes',
      description: 'Add, edit, or remove fragrance notes',
      href: '/admin/notes',
      icon: Icons.Database,
      variant: 'outline' as const,
    },
  ];

  // Add super admin actions
  if (isSuperAdmin()) {
    quickActions.push(
      {
        title: 'User Management',
        description: 'Manage users, roles, and permissions',
        href: '/admin/users',
        icon: Icons.Shield,
        variant: 'outline' as const,
      },
      {
        title: 'Analytics',
        description: 'View system metrics and insights',
        href: '/admin/analytics',
        icon: Icons.BarChart3,
        variant: 'outline' as const,
      }
    );
  }

  const recentActivity = [
    {
      type: 'approval',
      title: 'Dior Sauvage approved',
      description: 'Perfume submission approved by John Doe',
      time: '10 minutes ago',
      status: 'approved',
    },
    {
      type: 'submission',
      title: 'New brand submission',
      description: 'Maison Francis Kurkdjian submitted by contributor',
      time: '25 minutes ago',
      status: 'pending',
    },
    {
      type: 'user',
      title: 'New user registered',
      description: 'sarah.j@example.com joined as contributor',
      time: '1 hour ago',
      status: 'new',
    },
    {
      type: 'approval',
      title: 'Chanel No. 5 updated',
      description: 'Notes updated by team member',
      time: '2 hours ago',
      status: 'updated',
    },
  ];

  const roleText = isSuperAdmin() ? 'Super Admin' : isTeamMember() ? 'Team Member' : 'Admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          <h1 className="text-3xl font-bold tracking-tight font-heading">
            {roleText} Dashboard
          </h1>
          <Badge variant="secondary">
            {user?.role?.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          {isSuperAdmin()
            ? 'Full system administration and analytics access.'
            : 'Manage content and moderate submissions.'
          }
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <IconComponent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Quick Actions</CardTitle>
          <CardDescription>
            {isSuperAdmin()
              ? 'Administrative tools and system management'
              : 'Content management and moderation tools'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <Link key={action.title} href={action.href}>
                  <Button
                    variant={action.variant}
                    className="h-auto w-full justify-start p-4"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <IconComponent className="mt-1 h-5 w-5 flex-shrink-0" />
                        {action.count && (
                          <Badge
                            variant="destructive"
                            className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 text-xs"
                          >
                            {action.count}
                          </Badge>
                        )}
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{action.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {action.description}
                        </div>
                      </div>
                    </div>
                  </Button>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Recent Activity</CardTitle>
          <CardDescription>
            Latest system activity and user actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {activity.status === 'pending' && (
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                )}
                {activity.status === 'approved' && (
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                )}
                {activity.status === 'new' && (
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                )}
                {activity.status === 'updated' && (
                  <div className="h-2 w-2 rounded-full bg-purple-500" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{activity.title}</p>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
              </div>
              <div className="text-sm text-muted-foreground">
                {activity.time}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}