export default {
  supabase: {
    url: "https://hmmaubkxfewzlypywqff.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtbWF1Ymt4ZmV3emx5cHl3cWZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4ODcwNjAsImV4cCI6MjA2ODQ2MzA2MH0.SahVxttR7FcNfYR7hEL4N-ouOrhydtvPVTkKs_o5jCg"
  },
  development: {
    enableTestingMode: false
  },
  security: {
    productionMode: true,
    blockDangerousOps: true
  },
  features: {
    autoAssignOrgEnabled: false
  }
} as const;
