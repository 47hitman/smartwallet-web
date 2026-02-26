import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Pastikan pemanggil adalah admin
async function verifyAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    if (user.email !== process.env.ADMIN_EMAIL) return null;
    return user;
}

// PATCH /api/admin/users/[id] — update profile user
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await verifyAdmin();
    if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { is_premium, username, email } = body;

    let adminSupabase;
    try {
        adminSupabase = createAdminClient();
    } catch (e) {
        const msg = e instanceof Error ? e.message : "Admin client gagal dibuat";
        console.error("[PATCH user] createAdminClient error:", msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }

    const { error, count } = await adminSupabase
        .from("profiles")
        .update({ is_premium, username, email }, { count: "exact" })
        .eq("user_id", id);

    if (error || count === 0) {
        return NextResponse.json(
            { error: error?.message ?? "Gagal update" },
            { status: 500 }
        );
    }

    return NextResponse.json({ success: true });
}

// DELETE /api/admin/users/[id] — hapus user dari auth.users (profiles ikut terhapus via CASCADE)
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await verifyAdmin();
    if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    let adminSupabase;
    try {
        adminSupabase = createAdminClient();
    } catch (e) {
        const msg = e instanceof Error ? e.message : "Admin client gagal dibuat";
        console.error("[DELETE user] createAdminClient error:", msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }

    // Hapus semua data user dari tabel-tabel terkait terlebih dahulu
    // agar tidak melanggar foreign key constraint di Supabase
    const tables = ["transactions", "budgets", "categories", "friends", "profiles"];
    for (const table of tables) {
        const { error: delErr } = await adminSupabase
            .from(table)
            .delete()
            .eq("user_id", id);
        if (delErr) {
            // Abaikan error "tidak ada row" (tabel mungkin kosong untuk user ini)
            console.warn(`[DELETE user] cleanup ${table}:`, delErr.message);
        }
    }

    // Baru hapus dari auth.users
    const { error } = await adminSupabase.auth.admin.deleteUser(id);

    if (error) {
        console.error("[DELETE user] auth.admin.deleteUser error:", error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }

    return NextResponse.json({ success: true });
}
