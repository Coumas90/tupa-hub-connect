import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOptimizedAuth } from '@/contexts/OptimizedAuthProvider';
import { useRequireAdmin } from '@/hooks/useOptimizedAuth';
import { supabase } from '@/integrations/supabase/client';

export function AdminDebugPanel() {
  const authContext = useOptimizedAuth();
  const adminGuard = useRequireAdmin();

  const testAdminFunction = async () => {
    if (!authContext.session?.user) {
      console.error('No session/user available');
      return;
    }

    try {
      console.info('🔍 Testing is_admin function...');
      const { data, error } = await supabase.rpc('is_admin', {
        _user_id: authContext.session.user.id
      });
      
      console.info('is_admin result:', { data, error });
    } catch (err) {
      console.error('is_admin test failed:', err);
    }
  };

  const testDirectQuery = async () => {
    if (!authContext.session?.user) {
      console.error('No session/user available');
      return;
    }

    try {
      console.info('🔍 Testing direct user_roles query...');
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', authContext.session.user.id);
      
      console.info('Direct query result:', { data, error });
    } catch (err) {
      console.error('Direct query test failed:', err);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔧 Admin Debug Panel
          {authContext.isAdmin && <Badge variant="secondary">Admin Detected</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Auth Context State */}
          <div>
            <h3 className="font-semibold mb-2">Auth Context State</h3>
            <div className="space-y-1 text-sm">
              <div>User ID: <Badge variant="outline">{authContext.user?.id || 'None'}</Badge></div>
              <div>Email: <Badge variant="outline">{authContext.user?.email || 'None'}</Badge></div>
              <div>Role: <Badge variant="outline">{authContext.userRole || 'None'}</Badge></div>
              <div>Is Admin: <Badge variant={authContext.isAdmin ? 'default' : 'secondary'}>{authContext.isAdmin ? 'Yes' : 'No'}</Badge></div>
              <div>Loading: <Badge variant="outline">{authContext.loading ? 'Yes' : 'No'}</Badge></div>
              <div>Error: <Badge variant={authContext.error ? 'destructive' : 'outline'}>{authContext.error || 'None'}</Badge></div>
            </div>
          </div>

          {/* Admin Guard State */}
          <div>
            <h3 className="font-semibold mb-2">Admin Guard State</h3>
            <div className="space-y-1 text-sm">
              <div>Is Admin: <Badge variant={adminGuard.isAdmin ? 'default' : 'secondary'}>{adminGuard.isAdmin ? 'Yes' : 'No'}</Badge></div>
              <div>Is Authenticated: <Badge variant={adminGuard.isAuthenticated ? 'default' : 'secondary'}>{adminGuard.isAuthenticated ? 'Yes' : 'No'}</Badge></div>
              <div>Loading: <Badge variant="outline">{adminGuard.loading ? 'Yes' : 'No'}</Badge></div>
              <div>Error: <Badge variant={adminGuard.error ? 'destructive' : 'outline'}>{adminGuard.error || 'None'}</Badge></div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button onClick={testAdminFunction} variant="outline" size="sm">
            Test is_admin() Function
          </Button>
          <Button onClick={testDirectQuery} variant="outline" size="sm">
            Test Direct Query
          </Button>
          <Button onClick={authContext.refreshUserData} variant="outline" size="sm">
            Refresh User Data
          </Button>
        </div>

        {/* Instructions */}
        <div className="bg-muted p-3 rounded-md text-sm">
          <p className="font-medium mb-1">Debug Instructions:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Check the console for detailed logs when clicking test buttons</li>
            <li>If "Is Admin" shows "No" but you should have admin access, click "Refresh User Data"</li>
            <li>If tests fail, check your network connection and database permissions</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}