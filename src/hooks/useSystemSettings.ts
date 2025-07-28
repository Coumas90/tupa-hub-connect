import { supabase } from '@/integrations/supabase/client';

export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type: string;
  description?: string;
  is_sensitive: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Hook to manage system settings
 */
export function useSystemSettings() {
  
  const getSystemSetting = async (key: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.rpc('get_system_setting', {
        p_setting_key: key
      });
      
      if (error) {
        console.error('Error fetching system setting:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getSystemSetting:', error);
      return null;
    }
  };

  const updateSystemSetting = async (key: string, value: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('update_system_setting', {
        p_setting_key: key,
        p_setting_value: value
      });
      
      if (error) {
        console.error('Error updating system setting:', error);
        return false;
      }
      
      return data;
    } catch (error) {
      console.error('Error in updateSystemSetting:', error);
      return false;
    }
  };

  const getAllSystemSettings = async (): Promise<SystemSetting[]> => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('setting_key');
      
      if (error) {
        console.error('Error fetching system settings:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getAllSystemSettings:', error);
      return [];
    }
  };

  const checkSentryConfiguration = async (): Promise<boolean> => {
    const sentryDsn = await getSystemSetting('sentry_dsn');
    return sentryDsn !== null && 
           sentryDsn !== '⚠️ Not configured yet' && 
           !sentryDsn.includes('YOUR_SENTRY_DSN');
  };

  return {
    getSystemSetting,
    updateSystemSetting,
    getAllSystemSettings,
    checkSentryConfiguration
  };
}