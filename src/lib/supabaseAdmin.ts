// Solo uso en server: cliente con service role

let adminClient: any = null;

export function getSupabaseAdmin() {
  if (adminClient) return adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
  if (!url || !serviceKey) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createClient } = require('@supabase/supabase-js');
    adminClient = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });
    return adminClient;
  } catch {
    return null;
  }
}


