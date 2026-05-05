import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Supabase new key system (2024+): use sb_publishable_xxx as the main key.
// Since this is a personal app with no user auth and RLS disabled,
// one key is sufficient for all operations.
function makeClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Support both new key name and legacy fallbacks
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!key) throw new Error(
    "No Supabase key found. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local"
  );

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) _client = makeClient();
  return _client;
}

// Single client for all operations — fine for a personal app with no user auth
function makeProxy(): SupabaseClient {
  return new Proxy({} as SupabaseClient, {
    get(_, prop: string | symbol) {
      const client = getClient();
      const value = (client as unknown as Record<string | symbol, unknown>)[prop];
      return typeof value === "function" ? (value as Function).bind(client) : value;
    },
  });
}

export const supabaseAdmin = makeProxy();
export const supabase = supabaseAdmin; // same client, no auth distinction needed
