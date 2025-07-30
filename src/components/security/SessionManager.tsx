import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/OptimizedAuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Clock, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Database,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SessionManager() {
  const { sessionHealth, cacheStats, refreshSession, user } = useAuth();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const formatTimeRemaining = (milliseconds: number): string => {
    if (milliseconds <= 0) return 'Expired';
    
    const minutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const handleRefreshSession = async () => {
    setIsRefreshing(true);
    
    try {
      const success = await refreshSession();
      
      if (success) {
        toast({
          title: "Session refreshed",
          description: "Your session has been successfully renewed.",
        });
      } else {
        toast({
          title: "Refresh failed",
          description: "Unable to refresh session. Please sign in again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Refresh error",
        description: "An error occurred while refreshing your session.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Auto-refresh when needed
    if (sessionHealth.needsRefresh && sessionHealth.isHealthy) {
      handleRefreshSession();
    }
  }, [sessionHealth.needsRefresh]);

  if (!user) {
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Session Status</CardTitle>
        <Shield className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session Health */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {sessionHealth.isHealthy ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm">Session</span>
          </div>
          <Badge variant={sessionHealth.isHealthy ? "default" : "destructive"}>
            {sessionHealth.isHealthy ? "Active" : "Expired"}
          </Badge>
        </div>

        {/* Time Remaining */}
        {sessionHealth.isHealthy && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Expires in</span>
            </div>
            <span className="text-sm font-mono">
              {formatTimeRemaining(sessionHealth.expiresIn)}
            </span>
          </div>
        )}

        {/* Cache Status */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Cache Status</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Badge variant={cacheStats.userCached ? "default" : "secondary"} className="text-xs">
              User
            </Badge>
            <Badge variant={cacheStats.sessionCached ? "default" : "secondary"} className="text-xs">
              Session
            </Badge>
            <Badge variant={cacheStats.permissionsCached ? "default" : "secondary"} className="text-xs">
              Perms
            </Badge>
          </div>
        </div>

        {/* Auto-refresh Warning */}
        {sessionHealth.needsRefresh && (
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Session will auto-refresh soon to maintain your login.
            </AlertDescription>
          </Alert>
        )}

        {/* Manual Refresh Button */}
        <Button 
          onClick={handleRefreshSession}
          disabled={isRefreshing || !sessionHealth.isHealthy}
          size="sm"
          variant="outline"
          className="w-full"
        >
          <RefreshCw className={`h-3 w-3 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Session'}
        </Button>

        {/* Last Refresh Time */}
        {sessionHealth.refreshedAt && (
          <div className="text-xs text-muted-foreground text-center">
            Last refreshed: {new Date(sessionHealth.refreshedAt).toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}