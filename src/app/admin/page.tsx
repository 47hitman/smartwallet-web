import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getStats() {
    const supabase = await createClient();

    const [usersResult, transactionsResult, premiumResult] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("transactions").select("id", { count: "exact", head: true }),
        supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("is_premium", true),
    ]);

    const totalIncome = await supabase
        .from("transactions")
        .select("amount")
        .eq("type", "Pemasukan");

    const totalExpense = await supabase
        .from("transactions")
        .select("amount")
        .eq("type", "Pengeluaran");

    const income = (totalIncome.data ?? []).reduce(
        (s, t) => s + (parseFloat(t.amount) || 0),
        0
    );
    const expense = (totalExpense.data ?? []).reduce(
        (s, t) => s + (parseFloat(t.amount) || 0),
        0
    );

    return {
        totalUsers: usersResult.count ?? 0,
        totalTransactions: transactionsResult.count ?? 0,
        premiumUsers: premiumResult.count ?? 0,
        income,
        expense,
    };
}

function StatCard({
    label,
    value,
    sub,
    gradient,
    icon,
}: {
    label: string;
    value: string;
    sub?: string;
    gradient: string;
    icon: React.ReactNode;
}) {
    return (
        <div className={`rounded-2xl p-6 text-white ${gradient} shadow-lg`}>
            <div className="flex items-start justify-between mb-4">
                <p className="text-white/80 text-sm font-medium">{label}</p>
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    {icon}
                </div>
            </div>
            <p className="text-3xl font-bold">{value}</p>
            {sub && <p className="text-white/70 text-xs mt-1">{sub}</p>}
        </div>
    );
}

export default async function AdminDashboard() {
    const stats = await getStats();

    const fmt = (n: number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(n);

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
                <p className="text-gray-500 text-sm mt-1">
                    Selamat datang di panel admin SmartWallet
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <StatCard
                    label="Total User"
                    value={stats.totalUsers.toString()}
                    sub={`${stats.premiumUsers} premium`}
                    gradient="bg-gradient-to-br from-primary to-secondary"
                    icon={
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    }
                />
                <StatCard
                    label="User Premium"
                    value={stats.premiumUsers.toString()}
                    sub={`${stats.totalUsers - stats.premiumUsers} free`}
                    gradient="bg-gradient-to-br from-yellow-400 to-orange-500"
                    icon={
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                    }
                />
                <StatCard
                    label="Total Transaksi"
                    value={stats.totalTransactions.toString()}
                    gradient="bg-gradient-to-br from-accent to-teal-500"
                    icon={
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    }
                />
                <StatCard
                    label="Total Pemasukan"
                    value={fmt(stats.income)}
                    gradient="bg-gradient-to-br from-indigo-500 to-purple-600"
                    icon={
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    }
                />
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="card">
                    <h2 className="font-semibold text-gray-800 mb-4">Ringkasan Keuangan</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-sm text-gray-600">Total Pemasukan</span>
                            <span className="font-semibold text-accent">{fmt(stats.income)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-sm text-gray-600">Total Pengeluaran</span>
                            <span className="font-semibold text-danger">{fmt(stats.expense)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm font-medium text-gray-700">Saldo Bersih</span>
                            <span className={`font-bold text-lg ${stats.income - stats.expense >= 0 ? "text-accent" : "text-danger"}`}>
                                {fmt(stats.income - stats.expense)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h2 className="font-semibold text-gray-800 mb-4">Statistik User</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-sm text-gray-600">Total User</span>
                            <span className="font-semibold text-gray-900">{stats.totalUsers}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-sm text-gray-600">User Premium</span>
                            <span className="badge-premium">✨ {stats.premiumUsers}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-gray-600">User Free</span>
                            <span className="badge-free">🔓 {stats.totalUsers - stats.premiumUsers}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
