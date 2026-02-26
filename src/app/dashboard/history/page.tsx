import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user?.id ?? "")
        .order("date", { ascending: false });

    const fmt = (n: number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(n);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Riwayat Transaksi</h1>
                <p className="text-gray-500 text-sm mt-1">
                    {(transactions ?? []).length} transaksi tercatat
                </p>
            </div>

            <div className="card p-0 overflow-hidden">
                {(!transactions || transactions.length === 0) ? (
                    <p className="text-center text-gray-400 py-12 text-sm">Belum ada transaksi</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    {["Tanggal", "Kategori", "Tipe", "Jumlah", "Catatan"].map((h) => (
                                        <th
                                            key={h}
                                            className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3"
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-3 text-sm text-gray-500">
                                            {tx.date
                                                ? new Date(tx.date).toLocaleDateString("id-ID", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                })
                                                : "-"}
                                        </td>
                                        <td className="px-5 py-3 text-sm text-gray-700 font-medium">
                                            {tx.category}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span
                                                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tx.type === "Pemasukan"
                                                        ? "bg-accent/10 text-accent"
                                                        : "bg-danger/10 text-danger"
                                                    }`}
                                            >
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td
                                            className={`px-5 py-3 text-sm font-bold ${tx.type === "Pemasukan" ? "text-accent" : "text-danger"
                                                }`}
                                        >
                                            {tx.type === "Pemasukan" ? "+" : "-"}
                                            {fmt(parseFloat(tx.amount))}
                                        </td>
                                        <td className="px-5 py-3 text-sm text-gray-400 max-w-[180px] truncate">
                                            {tx.note || "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
