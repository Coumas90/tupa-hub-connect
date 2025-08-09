import devConfig from './config.dev';
import stagingConfig from './config.staging';
import prodConfig from './config.prod';

export type AppConfig = typeof devConfig;

const ENV = (process.env.NODE_ENV || import.meta.env.MODE || 'development').toLowerCase();

const CONFIG_MAP: Record<string, AppConfig> = {
  development: devConfig,
  dev: devConfig,
  staging: stagingConfig,
  production: prodConfig,
  prod: prodConfig,
};

export const config: AppConfig = CONFIG_MAP[ENV] ?? devConfig;

class TestingMode {
  private static isEnabled = false;

  static get enabled(): boolean {
    return config.development.enableTestingMode && this.isEnabled;
  }

  static enable(): void {
    if (config.security.productionMode) {
      console.error('🚫 SECURITY VIOLATION: Testing mode cannot be enabled in production!');
      console.error('This could compromise security. Contact system administrator.');
      return;
    }

    if (!config.development.enableTestingMode) {
      console.warn('Testing Mode only available in development');
      return;
    }

    this.isEnabled = true;
    console.warn('🔓 TESTING MODE ENABLED - Admin guards bypassed');
    console.warn('⚠️  WARNING: This is for development only. Never use in production.');
  }

  static disable(): void {
    this.isEnabled = false;
    console.log('🔒 Testing Mode disabled');
  }

  static toggle(): void {
    this.enabled ? this.disable() : this.enable();
  }

  static validateSafety(): boolean {
    if (config.security.productionMode && this.isEnabled) {
      console.error('🚨 CRITICAL SECURITY ISSUE: Testing mode is active in production!');
      return false;
    }
    return true;
  }
}

if (
  config.development.enableTestingMode &&
  ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
) {
  (window as any).enableTestingMode = () => TestingMode.enable();
  (window as any).disableTestingMode = () => TestingMode.disable();
  (window as any).toggleTestingMode = () => TestingMode.toggle();
}

export { TestingMode };
