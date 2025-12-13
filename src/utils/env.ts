/**
 * Environment variable validation utility
 * Ensures all required environment variables are set
 */

export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Supabase
  if (!process.env.SUPABASE_URL) {
    errors.push("Missing SUPABASE_URL");
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    errors.push("Missing SUPABASE_SERVICE_ROLE_KEY");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  // LINE Bot (optional but recommended)
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
    console.warn("⚠️ LINE_CHANNEL_ACCESS_TOKEN not set - notifications will not work");
  }
  if (!process.env.LINE_CHANNEL_ID) {
    console.warn("⚠️ LINE_CHANNEL_ID not set - notifications will not work");
  }

  // Admin Auth
  if (!process.env.ADMIN_USER) {
    errors.push("Missing ADMIN_USER");
  }
  if (!process.env.ADMIN_PASS) {
    errors.push("Missing ADMIN_PASS");
  }
  if (!process.env.ADMIN_COOKIE_SECRET) {
    errors.push("Missing ADMIN_COOKIE_SECRET");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function logEnvironmentStatus() {
  const validation = validateEnvironment();
  
  if (!validation.valid) {
    console.error("❌ Environment validation failed:");
    validation.errors.forEach((err) => console.error(`   - ${err}`));
  } else {
    console.log("✅ All required environment variables are set");
  }

  return validation;
}
