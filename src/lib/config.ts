// Centralized configuration for the application
export const config = {
  supabase: {
    url: "https://hmmaubkxfewzlypywqff.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtbWF1Ymt4ZmV3emx5cHl3cWZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4ODcwNjAsImV4cCI6MjA2ODQ2MzA2MH0.SahVxttR7FcNfYR7hEL4N-ouOrhydtvPVTkKs_o5jCg"
  },
  development: {
    enableTestingMode: import.meta.env.DEV
  }
} as const;

// Testing Mode utilities (only available in development)
class TestingMode {
  private static isEnabled = false;
  
  static get enabled(): boolean {
    return config.development.enableTestingMode && this.isEnabled;
  }
  
  static enable(): void {
    if (!config.development.enableTestingMode) {
      console.warn('Testing Mode only available in development');
      return;
    }
    this.isEnabled = true;
    console.warn('🔓 TESTING MODE ENABLED - Admin guards bypassed');
  }
  
  static disable(): void {
    this.isEnabled = false;
    console.log('🔒 Testing Mode disabled');
  }
  
  static toggle(): void {
    this.enabled ? this.disable() : this.enable();
  }
}

// Expose to window for console access
if (config.development.enableTestingMode) {
  (window as any).enableTestingMode = () => TestingMode.enable();
  (window as any).disableTestingMode = () => TestingMode.disable();
  (window as any).toggleTestingMode = () => TestingMode.toggle();
}

export { TestingMode };