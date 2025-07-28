import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Settings, Shield, AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useSystemSettings, SystemSetting } from '@/hooks/useSystemSettings';
import { useToast } from '@/hooks/use-toast';

const SystemSettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});
  const { getAllSystemSettings, updateSystemSetting, checkSentryConfiguration } = useSystemSettings();
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getAllSystemSettings();
      setSettings(data);
      
      // Initialize edit values
      const initialValues: Record<string, string> = {};
      data.forEach(setting => {
        initialValues[setting.setting_key] = setting.setting_value;
      });
      setEditValues(initialValues);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load system settings"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSetting = async (key: string) => {
    setSaving(key);
    try {
      const success = await updateSystemSetting(key, editValues[key]);
      if (success) {
        await loadSettings(); // Reload to get updated values
        toast({
          title: "Success",
          description: `Setting "${key}" updated successfully`
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to update setting "${key}"`
        });
      }
    } catch (error) {
      console.error('Error saving setting:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Error updating setting "${key}"`
      });
    } finally {
      setSaving(null);
    }
  };

  const toggleSensitiveVisibility = (key: string) => {
    setShowSensitive(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getSettingStatus = (setting: SystemSetting) => {
    if (setting.setting_key === 'sentry_dsn') {
      if (setting.setting_value === '⚠️ Not configured yet') {
        return { status: 'warning', message: 'Not configured' };
      }
      return { status: 'success', message: 'Configured' };
    }
    
    if (setting.setting_type === 'boolean') {
      return { 
        status: setting.setting_value === 'true' ? 'success' : 'info', 
        message: setting.setting_value === 'true' ? 'Enabled' : 'Disabled' 
      };
    }
    
    return { status: 'info', message: 'Set' };
  };

  const renderSettingInput = (setting: SystemSetting) => {
    const isVisible = showSensitive[setting.setting_key] || !setting.is_sensitive;
    const displayValue = isVisible ? editValues[setting.setting_key] : '••••••••';

    if (setting.setting_type === 'boolean') {
      return (
        <div className="flex items-center space-x-2">
          <Switch
            id={setting.setting_key}
            checked={editValues[setting.setting_key] === 'true'}
            onCheckedChange={(checked) => 
              setEditValues(prev => ({ 
                ...prev, 
                [setting.setting_key]: checked.toString() 
              }))
            }
          />
          <Label htmlFor={setting.setting_key}>
            {editValues[setting.setting_key] === 'true' ? 'Enabled' : 'Disabled'}
          </Label>
        </div>
      );
    }

    return (
      <div className="relative">
        <Input
          type={setting.is_sensitive && !isVisible ? 'password' : 'text'}
          value={isVisible ? editValues[setting.setting_key] : '••••••••'}
          onChange={(e) => {
            if (isVisible) {
              setEditValues(prev => ({ 
                ...prev, 
                [setting.setting_key]: e.target.value 
              }));
            }
          }}
          className="pr-10"
          placeholder={setting.description}
          readOnly={setting.is_sensitive && !isVisible}
        />
        {setting.is_sensitive && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => toggleSensitiveVisibility(setting.setting_key)}
          >
            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h2 className="text-2xl font-bold">System Settings</h2>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          System settings control core application behavior. Changes require administrator privileges.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {settings.map((setting) => {
          const status = getSettingStatus(setting);
          const hasChanged = editValues[setting.setting_key] !== setting.setting_value;
          
          return (
            <Card key={setting.id} className={setting.is_sensitive ? 'border-orange-200' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{setting.setting_key}</CardTitle>
                    <Badge 
                      variant={status.status === 'success' ? 'default' : 
                              status.status === 'warning' ? 'destructive' : 'secondary'}
                      className="flex items-center gap-1"
                    >
                      {status.status === 'success' && <CheckCircle className="h-3 w-3" />}
                      {status.status === 'warning' && <AlertTriangle className="h-3 w-3" />}
                      {status.message}
                    </Badge>
                    {setting.is_sensitive && (
                      <Badge variant="outline" className="text-orange-600 border-orange-200">
                        Sensitive
                      </Badge>
                    )}
                  </div>
                </div>
                {setting.description && (
                  <CardDescription>{setting.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={setting.setting_key}>Value</Label>
                  {renderSettingInput(setting)}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Type: {setting.setting_type} | Updated: {new Date(setting.updated_at).toLocaleString()}
                  </div>
                  <Button
                    onClick={() => handleSaveSetting(setting.setting_key)}
                    disabled={!hasChanged || saving === setting.setting_key}
                    size="sm"
                  >
                    {saving === setting.setting_key ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default SystemSettingsPanel;