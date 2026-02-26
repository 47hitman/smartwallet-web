import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user?.id ?? "")
        .order("date", { ascending: false })
        .limit(5);

    const { data: allTx } = await supabase
        .from("transactions")
        .select("amount, type")
        .eq("user_id", user?.id ?? "");

    let income = 0;
    let expense = 0;
    (allTx ?? []).forEach((t) => {
        const amount = parseFloat(t.amount) || 0;
        if (t.type === "Pemasukan") income += amount;
        else expense += amount;
    });
    const balance = income - expense;

    const fmt = (n: number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(n);

    const username = user?.user_metadata?.["username"] ?? "Pengguna";

    const hour = new Date().getHours();
    const greeting =
        hour < 12 ? "Selamat Pagi 🌅" :
            hour < 15 ? "Selamat Siang ☀️" :
                hour < 18 ? "Selamat Sore 🌇" :
                    "Selamat Malam 🌙";

    return (
        <div>
            {/* Greeting */}
            <div className="mb-6">
                <p className="text-gray-500 text-sm">{greeting}</p>
                <h1 className="text-2xl font-bold text-gray-900">{username}</h1>
            </div>

            {/* Balance Card */}
            <div className="relative rounded-2xl p-6 mb-6 overflow-hidden bg-gradient-to-br from-primary to-secondary shadow-xl shadow-primary/30">
                <div className="absolute top-[-40px] right-[-40px] w-32 h-32 rounded-full bg-white/10" />
                <div className="absolute bottom-[-30px] left-[-20px] w-24 h-24 rounded-full bg-white/5" />
                <div className="relative">
                    <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span className="text-white/70 text-sm">Total Saldo</span>
                    </div>
                    <p className="text-white text-4xl font-bold mb-4">{fmt(balance)}</p>
                    <div className="flex gap-4">
                        <div>
                            <p className="text-white/60 text-xs">Pemasukan</p>
                            <p className="text-white font-semibold text-sm">{fmt(income)}</p>
                        </div>
                        <div className="w-px bg-white/20" />
                        <div>
                            <p className="text-white/60 text-xs">Pengeluaran</p>
                            <p className="text-white font-semibold text-sm">{fmt(expense)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="card">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <span className="text-sm text-gray-500">Pemasukan</span>
                    </div>
                    <p className="text-xl font-bold text-accent">{fmt(income)}</p>
                </div>
                <div className="card">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-danger/10 flex items-center justify-center">
                            <svg className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                            </svg>
                        </div>
                        <span className="text-sm text-gray-500">Pengeluaran</span>
                    </div>
                    <p className="text-xl font-bold text-danger">{fmt(expense)}</p>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-gray-800">Transaksi Terakhir</h2>
                    <Link href="/dashboard/history" className="text-sm text-primary font-medium hover:underline">
                        Lihat semua
                    </Link>
                </div>
                {(!transactions || transactions.length === 0) ? (
                    <p className="text-gray-400 text-sm text-center py-6">Belum ada transaksi</p>
                ) : (
                    <div className="space-y-3">
                        {transactions.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${tx.type === "Pemasukan" ? "bg-accent/10" : "bg-danger/10"
                                        }`}>
                                        {tx.type === "Pemasukan" ? "💰" : "💸"}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{tx.category}</p>
                                        <p className="text-xs text-gray-400">{tx.note ?? "-"}</p>
                                    </div>
                                </div>
                                <p className={`text-sm font-bold ${tx.type === "Pemasukan" ? "text-accent" : "text-danger"}`}>
                                    {tx.type === "Pemasukan" ? "+" : "-"}{fmt(parseFloat(tx.amount))}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
