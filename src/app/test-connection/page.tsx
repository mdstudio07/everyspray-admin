'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DbInfo {
  connected: boolean;
  authSession: string;
  tablesAccessible: boolean;
  rbacPermissions: number;
}

interface RolePermission {
  role: string;
  permission: string;
}

export default function TestConnectionPage() {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [dbInfo, setDbInfo] = useState<DbInfo | null>(null);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setConnectionStatus('testing');
    setError(null);

    try {
      const supabase = createClient();

      // Test basic connection
      const { error: dbError } = await supabase
        .from('pg_stat_database')
        .select('datname')
        .limit(1);

      if (dbError) {
        throw new Error(`Database connection failed: ${dbError.message}`);
      }

      // Test RBAC tables
      const { data: roles, error: rolesError } = await supabase
        .from('role_permissions')
        .select('role, permission')
        .limit(10);

      if (rolesError) {
        throw new Error(`RBAC tables not accessible: ${rolesError.message}`);
      }

      // Test auth functionality
      const { data: authData } = await supabase.auth.getSession();

      setDbInfo({
        connected: true,
        authSession: authData.session ? 'Active session' : 'No session',
        tablesAccessible: roles?.length > 0,
        rbacPermissions: roles?.length || 0,
      });

      setRolePermissions(roles || []);
      setConnectionStatus('success');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setConnectionStatus('error');
    }
  };

  useEffect(() => {
    // Auto-test on page load
    testConnection();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold font-heading">Database Connection Test</h1>
          <p className="text-muted-foreground">
            Testing Supabase connection and RBAC system
          </p>
        </div>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between font-heading">
              Connection Status
              <Badge
                variant={connectionStatus === 'success' ? 'default' :
                        connectionStatus === 'error' ? 'destructive' :
                        connectionStatus === 'testing' ? 'secondary' : 'outline'}
              >
                {connectionStatus === 'testing' ? 'Testing...' :
                 connectionStatus === 'success' ? 'Connected' :
                 connectionStatus === 'error' ? 'Failed' : 'Not Tested'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {connectionStatus === 'testing' && (
              <p className="text-muted-foreground">Testing database connection...</p>
            )}

            {connectionStatus === 'error' && error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-destructive font-medium">Connection Error:</p>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
              </div>
            )}

            {connectionStatus === 'success' && dbInfo && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Database Connected</p>
                    <p className="text-sm text-muted-foreground">
                      {dbInfo.connected ? '✅ Yes' : '❌ No'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Auth Session</p>
                    <p className="text-sm text-muted-foreground">{dbInfo.authSession}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">RBAC Tables</p>
                    <p className="text-sm text-muted-foreground">
                      {dbInfo.tablesAccessible ? '✅ Accessible' : '❌ Not accessible'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Permissions Found</p>
                    <p className="text-sm text-muted-foreground">{dbInfo.rbacPermissions}</p>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={testConnection}
              disabled={connectionStatus === 'testing'}
              className="w-full"
            >
              {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection Again'}
            </Button>
          </CardContent>
        </Card>

        {/* Role Permissions Preview */}
        {rolePermissions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">RBAC Permissions Preview</CardTitle>
              <CardDescription>
                Sample role-permission mappings from the database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rolePermissions.map((rp, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span className="font-medium">{rp.role}</span>
                    <Badge variant="outline">{rp.permission}</Badge>
                  </div>
                ))}
                {rolePermissions.length >= 10 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    ... and more permissions available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Connection test complete. Ready to test authentication at{' '}
            <a href="/login" className="text-primary hover:underline">
              /login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}