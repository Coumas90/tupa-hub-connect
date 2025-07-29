// Centralized configuration for the application
export const config = {
  supabase: {
    url: "https://hmmaubkxfewzlypywqff.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtbWF1Ymt4ZmV3emx5cHl3cWZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4ODcwNjAsImV4cCI6MjA2ODQ2MzA2MH0.SahVxttR7FcNfYR7hEL4N-ouOrhydtvPVTkKs_o5jCg"
  },
  development: {
    enableTestingMode: import.meta.env.DEV
  },
  security: {
    productionMode: import.meta.env.PROD,
    blockDangerousOps: import.meta.env.PROD
  }
} as const;

// Testing Mode utilities (only available in development)
class TestingMode {
  private static isEnabled = false;
  
  static get enabled(): boolean {
    return config.development.enableTestingMode && this.isEnabled;
  }
  
  static enable(): void {
    // CRITICAL: Block in production
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

// Expose to window for console access
if (config.development.enableTestingMode) {
  (window as any).enableTestingMode = () => TestingMode.enable();
  (window as any).disableTestingMode = () => TestingMode.disable();
  (window as any).toggleTestingMode = () => TestingMode.toggle();
}

export { TestingMode };