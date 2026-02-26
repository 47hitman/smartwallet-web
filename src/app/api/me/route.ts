import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const adminEmail = process.env.ADMIN_EMAIL;
    const isAdmin = user?.email === adminEmail;

    return NextResponse.json({ isAdmin, email: user?.email });
}
