'use client';

import Link from 'next/link';
import { Icons } from '@/lib/icons';
import { useAuthStore } from '@/lib/stores/auth';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ContributeDashboard() {
  const { user } = useAuthStore();

  const stats = [
    {
      title: 'Total Submissions',
      value: user?.profile?.contribution_count || 0,
      description: 'Perfumes and brands submitted',
      icon: Icons.FileText,
    },
    {
      title: 'Pending Reviews',
      value: 3,
      description: 'Waiting for team approval',
      icon: Icons.Loading,
    },
    {
      title: 'Approved',
      value: Math.max(0, (user?.profile?.contribution_count || 0) - 3),
      description: 'Successfully approved submissions',
      icon: Icons.Check,
    },
    {
      title: 'Trust Level',
      value: user?.profile?.trust_level || 'new',
      description: `${user?.profile?.approval_rate || 0}% approval rate`,
      icon: Icons.Trophy,
    },
  ];

  const quickActions = [
    {
      title: 'Add Perfume',
      description: 'Submit a new perfume to the database',
      href: '/contribute/perfume/create',
      icon: Icons.Plus,
      variant: 'default' as const,
    },
    {
      title: 'Add Brand',
      description: 'Submit a new brand to the database',
      href: '/contribute/brand/create',
      icon: Icons.Package,
      variant: 'outline' as const,
    },
    {
      title: 'My Contributions',
      description: 'View all your submissions and their status',
      href: '/contribute/my-contributions',
      icon: Icons.FileText,
      variant: 'outline' as const,
    },
    {
      title: 'Achievements',
      description: 'View your badges and milestones',
      href: '/contribute/achievements',
      icon: Icons.Trophy,
      variant: 'outline' as const,
    },
  ];

  const recentActivity = [
    {
      type: 'submission',
      title: 'Creed Aventus submitted',
      description: 'Perfume submission pending review',
      time: '2 hours ago',
      status: 'pending',
    },
    {
      type: 'approval',
      title: 'Tom Ford Black Orchid approved',
      description: 'Your submission has been approved',
      time: '1 day ago',
      status: 'approved',
    },
    {
      type: 'achievement',
      title: 'First Submission badge earned',
      description: 'Congratulations on your first contribution!',
      time: '3 days ago',
      status: 'achievement',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-heading">
          Welcome back, {user?.profile?.full_name || user?.profile?.username || 'Contributor'}!
        </h1>
        <p className="text-muted-foreground">
          Track your contributions and help build the perfume community database.
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
                <div className="text-2xl font-bold">
                  {stat.title === 'Trust Level' ? (
                    <Badge variant="secondary" className="text-sm">
                      {String(stat.value).charAt(0).toUpperCase() + String(stat.value).slice(1)}
                    </Badge>
                  ) : (
                    stat.value
                  )}
                </div>
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
            Common tasks to help you contribute to the perfume database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <Link key={action.title} href={action.href}>
                  <Button
                    variant={action.variant}
                    className="h-auto w-full justify-start p-4"
                  >
                    <div className="flex items-start space-x-3">
                      <IconComponent className="mt-1 h-5 w-5 flex-shrink-0" />
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
            Your latest contributions and achievements
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
                {activity.status === 'achievement' && (
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
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