// EXAMPLE CONFIGURATION FILE
// This file shows how to structure configuration for TUPÁ Hub
// DO NOT COMMIT REAL VALUES - Use for reference only

export const CONFIG_EXAMPLE = {
  // ===== PUBLIC CONFIGURATION (stored in config.ts) =====
  // These values are safe to include in the frontend bundle
  supabase: {
    url: "https://[YOUR-PROJECT-ID].supabase.co",
    anonKey: "eyJ0eXAi...[YOUR_SUPABASE_ANON_KEY]"
  },

  // ===== PRIVATE SECRETS (stored in Supabase Secrets) =====
  // These MUST be configured in Supabase Dashboard → Settings → Functions → Secrets
  // NEVER include real values in config.ts or any frontend file

  // Database access (Edge Functions only)
  SUPABASE_SERVICE_ROLE_KEY: "<SUPABASE_SECRET>",
  SUPABASE_DB_URL: "<SUPABASE_SECRET>",

  // External APIs
  OPENAI_API_KEY: "<SUPABASE_SECRET>",
  RESEND_API_KEY: "<SUPABASE_SECRET>",

  // Payment processing
  STRIPE_SECRET_KEY: "<SUPABASE_SECRET>",
  STRIPE_WEBHOOK_SECRET: "<SUPABASE_SECRET>",

  // Security
  JWT_SIGNING_KEY: "<SUPABASE_SECRET>",
  ENCRYPTION_KEY: "<SUPABASE_SECRET>"
} as const;

// ===== SECURITY NOTES =====
/*
1. PUBLIC values go in src/lib/config.ts - safe for frontend
2. PRIVATE secrets go in Supabase Secrets - accessible only in Edge Functions
3. Never use VITE_ variables - not supported in Lovable
4. All secrets are managed through Supabase Dashboard
5. Use lov-secret-form action to set secrets securely
*/

// ===== USAGE EXAMPLES =====
/*
// In frontend components:
import { config } from '@/lib/config';
const supabaseUrl = config.supabase.url;

// In Edge Functions:
const openaiKey = Deno.env.get("OPENAI_API_KEY");
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
*/