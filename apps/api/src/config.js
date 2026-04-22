import { DEFAULT_TIMEZONE } from '@ragingester/shared';

export const config = {
  port: Number(process.env.PORT || 4000),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  devUserId: process.env.DEV_USER_ID || 'dev-user-1',
  defaultTimezone: process.env.DEFAULT_TIMEZONE || DEFAULT_TIMEZONE,
  schedulerPollMs: Number(process.env.SCHEDULER_POLL_MS || 15000),
  runTimeoutMs: Number(process.env.RUN_TIMEOUT_MS || 30000),
  runMaxRetries: Number(process.env.RUN_MAX_RETRIES || 1)
};

export function hasSupabaseConfig() {
  return Boolean(config.supabaseUrl && (config.supabaseServiceRoleKey || config.supabaseAnonKey));
}