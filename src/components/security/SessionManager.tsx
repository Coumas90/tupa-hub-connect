import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Smartphone, 
  Monitor, 
  AlertTriangle, 
  X, 
  RefreshCw,
  Eye
} from 'lucide-react';
import { useRefreshTokenRotation } from '@/hooks/useRefreshTokenRotation';
import { useToastNotifications } from '@/hooks/use-toast-notifications';

interface SessionInfo {
  id: string;
  device_info: {
    user_agent?: string;
    device_id?: string;
  };
  last_used_at: string;
  created_at: string;
  expires_at: string;
}

export default function SessionManager() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(false);
  const { getActiveSessions, revokeAllSessions, refreshSession } = useRefreshTokenRotation();
  const toastNotifications = useToastNotifications();

  const loadSessions = async () => {
    setLoading(true);
    try {
      const activeSessions = await getActiveSessions();
      setSessions(activeSessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      toastNotifications.showError('Failed to load active sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    setRevoking(true);
    try {
      const success = await revokeAllSessions();
      if (success) {
        setSessions([]);
      }
    } finally {
      setRevoking(false);
    }
  };

  const handleRefreshSession = async () => {
    try {
      const success = await refreshSession();
      if (success) {
        toastNotifications.showSuccess('Session refreshed successfully');
        await loadSessions();
      } else {
        toastNotifications.showError('Failed to refresh session');
      }
    } catch (error) {
      toastNotifications.showError('Session refresh failed');
    }
  };

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return <Monitor className="h-4 w-4" />;
    
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return <Smartphone className="h-4 w-4" />;
    }
    
    return <Monitor className="h-4 w-4" />;
  };

  const getDeviceName = (userAgent?: string) => {
    if (!userAgent) return 'Unknown Device';
    
    if (userAgent.includes('Chrome')) return 'Chrome Browser';
    if (userAgent.includes('Firefox')) return 'Firefox Browser';
    if (userAgent.includes('Safari')) return 'Safari Browser';
    if (userAgent.includes('Edge')) return 'Edge Browser';
    if (userAgent.includes('Mobile')) return 'Mobile Device';
    
    return 'Unknown Browser';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isCurrentSession = (session: SessionInfo) => {
    // Simple heuristic: most recently used session is likely current
    return sessions.length > 0 && session.id === sessions[0]?.id;
  };

  useEffect(() => {
    loadSessions();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Session Security Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This app uses advanced refresh token rotation for security. 
              You can have up to 5 active sessions. Suspicious activity will automatically revoke all sessions.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button 
              onClick={loadSessions} 
              variant="outline" 
              size="sm"
              disabled={loading}
            >
              <Eye className="h-4 w-4 mr-2" />
              {loading ? 'Loading...' : 'Refresh List'}
            </Button>
            
            <Button 
              onClick={handleRefreshSession} 
              variant="outline" 
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Session
            </Button>
            
            <Button 
              onClick={handleRevokeAllSessions} 
              variant="destructive" 
              size="sm"
              disabled={revoking}
            >
              <X className="h-4 w-4 mr-2" />
              {revoking ? 'Revoking...' : 'Revoke All Sessions'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Sessions ({sessions.length}/5)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No active sessions found
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div 
                  key={session.id} 
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(session.device_info.user_agent)}
                      <span className="font-medium">
                        {getDeviceName(session.device_info.user_agent)}
                      </span>
                      {isCurrentSession(session) && (
                        <Badge variant="default">Current Session</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>
                      <strong>Device ID:</strong> {session.device_info.device_id?.slice(0, 8)}...
                    </div>
                    <div>
                      <strong>Last Used:</strong> {formatDate(session.last_used_at)}
                    </div>
                    <div>
                      <strong>Created:</strong> {formatDate(session.created_at)}
                    </div>
                    <div>
                      <strong>Expires:</strong> {formatDate(session.expires_at)}
                    </div>
                  </div>
                  
                  {session.device_info.user_agent && (
                    <details className="text-xs text-muted-foreground">
                      <summary className="cursor-pointer">User Agent</summary>
                      <div className="mt-1 break-all">{session.device_info.user_agent}</div>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}