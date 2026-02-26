import { createClient } from "@/lib/supabase/server";
import { UserSidebar } from "@/components/UserSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_premium")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();

  return (
    <div className="flex min-h-screen bg-bg">
      <UserSidebar
        username={user?.user_metadata?.["username"]}
        email={user?.email}
        isPremium={profile?.is_premium ?? false}
      />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
