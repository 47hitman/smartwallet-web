import { createClient } from "@supabase/supabase-js";

// Client ini HANYA dipakai di server (API routes).
// Service role key melewati semua RLS — jangan pernah expose ke browser.
export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY belum diisi di .env.local");
    }

    return createClient(url, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
