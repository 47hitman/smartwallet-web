import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data: profile } = await supabase
        .from("profiles")
        .select("is_premium, created_at")
        .eq("user_id", user?.id ?? "")
        .maybeSingle();

    const { count: txCount } = await supabase
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user?.id ?? "");

    const username = user?.user_metadata?.["username"] ?? "Pengguna";
    const isPremium = profile?.is_premium ?? false;

    const joinDate = user?.created_at
        ? new Date(user.created_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        })
        : "-";

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Profil</h1>
            </div>

            <div className="max-w-lg space-y-5">
                {/* Avatar & identity */}
                <div className="card flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl text-white font-bold shadow-lg shadow-primary/30 flex-shrink-0">
                        {username[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-lg truncate">{username}</p>
                        <p className="text-gray-400 text-sm truncate">{user?.email}</p>
                        <div className="mt-2">
                            {isPremium ? (
                                <span className="badge-premium">✨ Akun Premium</span>
                            ) : (
                                <span className="badge-free">🔓 Akun Free</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: "Transaksi", value: txCount?.toString() ?? "0", icon: "🧾" },
                        {
                            label: "Member Sejak",
                            value: user?.created_at
                                ? new Date(user.created_at).toLocaleDateString("id-ID", {
                                    month: "short",
                                    year: "numeric",
                                })
                                : "-",
                            icon: "📅",
                        },
                        { label: "Status", value: isPremium ? "Premium" : "Free", icon: isPremium ? "✨" : "🔓" },
                    ].map((s) => (
                        <div key={s.label} className="card text-center py-4">
                            <p className="text-2xl mb-1">{s.icon}</p>
                            <p className="font-bold text-gray-900 text-sm">{s.value}</p>
                            <p className="text-gray-400 text-xs mt-0.5">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Info */}
                <div className="card space-y-3">
                    <h2 className="font-semibold text-gray-800">Informasi Akun</h2>
                    {[
                        { label: "User ID", value: user?.id ?? "-" },
                        { label: "Email", value: user?.email ?? "-" },
                        { label: "Username", value: username },
                        { label: "Bergabung", value: joinDate },
                    ].map((item) => (
                        <div key={item.label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                            <span className="text-sm text-gray-500">{item.label}</span>
                            <span className="text-sm font-medium text-gray-800 truncate max-w-[220px] text-right">
                                {item.value}
                            </span>
                        </div>
                    ))}
                </div>

                {!isPremium && (
                    <div className="rounded-2xl p-5 bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">⭐</span>
                            <div>
                                <p className="font-semibold text-gray-800">Upgrade ke Premium</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Dapatkan akses Split Bill dan fitur exclusive lainnya. Hubungi admin untuk mengaktifkan Premium.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
