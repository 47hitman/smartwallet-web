import { createClient } from "@/lib/supabase/server";

export default async function BudgetPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data: budgets } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user?.id ?? "")
        .order("created_at", { ascending: false });

    // Get current month spending per category
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data: txThisMonth } = await supabase
        .from("transactions")
        .select("category, amount")
        .eq("user_id", user?.id ?? "")
        .eq("type", "Pengeluaran")
        .gte("date", monthStart);

    const spendingByCategory: Record<string, number> = {};
    (txThisMonth ?? []).forEach((tx) => {
        spendingByCategory[tx.category] =
            (spendingByCategory[tx.category] ?? 0) + (parseFloat(tx.amount) || 0);
    });

    const fmt = (n: number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(n);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Anggaran</h1>
                <p className="text-gray-500 text-sm mt-1">
                    Pantau pengeluaran vs anggaran bulan ini
                </p>
            </div>

            {(!budgets || budgets.length === 0) ? (
                <div className="card text-center py-12">
                    <p className="text-4xl mb-3">💰</p>
                    <p className="text-gray-500 text-sm">
                        Belum ada anggaran yang dibuat. Tambahkan melalui aplikasi mobile.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {budgets.map((b) => {
                        const spent = spendingByCategory[b.category] ?? 0;
                        const limit = parseFloat(b.limit_amount) || 0;
                        const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
                        const over = spent > limit;

                        return (
                            <div key={b.id} className="card">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="font-semibold text-gray-800">{b.category}</p>
                                    <span
                                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${over ? "bg-danger/10 text-danger" : "bg-accent/10 text-accent"
                                            }`}
                                    >
                                        {over ? "⚠️ Melebihi" : "✅ Aman"}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-500 mb-2">
                                    <span>Terpakai: <span className="font-semibold text-gray-800">{fmt(spent)}</span></span>
                                    <span>Limit: <span className="font-semibold text-gray-800">{fmt(limit)}</span></span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2.5">
                                    <div
                                        className={`h-2.5 rounded-full transition-all duration-500 ${over ? "bg-danger" : pct > 75 ? "bg-warning" : "bg-accent"
                                            }`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1.5 text-right">{pct.toFixed(0)}%</p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
