import { createClient } from "@/lib/supabase/server";

export default async function AdminTransactionsPage() {
    const supabase = await createClient();

    const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false })
        .limit(100);

    const fmt = (n: number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(n);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Semua Transaksi</h1>
                <p className="text-gray-500 text-sm mt-1">
                    100 transaksi terbaru dari seluruh user
                </p>
            </div>

            <div className="card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                {["User ID", "Kategori", "Tipe", "Jumlah", "Catatan", "Tanggal"].map((h) => (
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
                            {(transactions ?? []).map((tx) => (
                                <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-5 py-3 text-xs font-mono text-gray-500 truncate max-w-[120px]">
                                        {tx.user_id?.slice(0, 8)}…
                                    </td>
                                    <td className="px-5 py-3 text-sm text-gray-700">{tx.category}</td>
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
                                    <td className={`px-5 py-3 text-sm font-semibold ${tx.type === "Pemasukan" ? "text-accent" : "text-danger"}`}>
                                        {tx.type === "Pemasukan" ? "+" : "-"}
                                        {fmt(parseFloat(tx.amount))}
                                    </td>
                                    <td className="px-5 py-3 text-sm text-gray-500 max-w-[160px] truncate">
                                        {tx.note || "-"}
                                    </td>
                                    <td className="px-5 py-3 text-sm text-gray-500">
                                        {tx.date
                                            ? new Date(tx.date).toLocaleDateString("id-ID", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })
                                            : "-"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {(!transactions || transactions.length === 0) && (
                        <p className="text-center text-gray-400 py-10">Belum ada transaksi</p>
                    )}
                </div>
            </div>
        </div>
    );
}
