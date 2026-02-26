"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";

interface Transaction {
    amount: string | number;
    type: string;
    category: string;
    date: string;
}

interface Props {
    transactions: Transaction[];
}

const COLORS = [
    "#6C63FF", "#FF6B9D", "#00D9A5", "#FFB347",
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
];

function fmt(n: number) {
    if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
    if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`;
    return `Rp ${n}`;
}

export function AnalyticsCharts({ transactions }: Props) {
    if (!transactions || transactions.length === 0) {
        return (
            <div className="card text-center py-16">
                <p className="text-4xl mb-3">📊</p>
                <p className="text-gray-500 text-sm">Belum ada data transaksi untuk ditampilkan.</p>
            </div>
        );
    }

    // Monthly income vs expense
    const monthlyMap: Record<string, { income: number; expense: number }> = {};
    transactions.forEach((tx) => {
        if (!tx.date) return;
        const d = new Date(tx.date);
        const label = d.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
        if (!monthlyMap[label]) monthlyMap[label] = { income: 0, expense: 0 };
        const amount = parseFloat(String(tx.amount)) || 0;
        if (tx.type === "Pemasukan") monthlyMap[label].income += amount;
        else monthlyMap[label].expense += amount;
    });
    const monthlyData = Object.entries(monthlyMap).map(([name, v]) => ({
        name,
        Pemasukan: v.income,
        Pengeluaran: v.expense,
    }));

    // Expense by category
    const catMap: Record<string, number> = {};
    transactions
        .filter((tx) => tx.type === "Pengeluaran")
        .forEach((tx) => {
            catMap[tx.category] =
                (catMap[tx.category] ?? 0) + (parseFloat(String(tx.amount)) || 0);
        });
    const catData = Object.entries(catMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // Total
    const totalIncome = transactions
        .filter((tx) => tx.type === "Pemasukan")
        .reduce((s, tx) => s + (parseFloat(String(tx.amount)) || 0), 0);
    const totalExpense = transactions
        .filter((tx) => tx.type === "Pengeluaran")
        .reduce((s, tx) => s + (parseFloat(String(tx.amount)) || 0), 0);

    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Total Pemasukan", value: fmt(totalIncome), color: "text-accent", bg: "bg-accent/10" },
                    { label: "Total Pengeluaran", value: fmt(totalExpense), color: "text-danger", bg: "bg-danger/10" },
                    {
                        label: "Saldo Bersih",
                        value: fmt(totalIncome - totalExpense),
                        color: totalIncome - totalExpense >= 0 ? "text-accent" : "text-danger",
                        bg: totalIncome - totalExpense >= 0 ? "bg-accent/10" : "bg-danger/10",
                    },
                ].map((s) => (
                    <div key={s.label} className={`card ${s.bg}`}>
                        <p className="text-sm text-gray-500 mb-1">{s.label}</p>
                        <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Bar chart - monthly */}
            <div className="card">
                <h2 className="font-semibold text-gray-800 mb-5">Pemasukan vs Pengeluaran per Bulan</h2>
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={monthlyData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                        <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: "#9ca3af" }} width={70} />
                        <Tooltip
                            formatter={(v: number) =>
                                new Intl.NumberFormat("id-ID", {
                                    style: "currency",
                                    currency: "IDR",
                                    maximumFractionDigits: 0,
                                }).format(v)
                            }
                            contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }}
                        />
                        <Legend />
                        <Bar dataKey="Pemasukan" fill="#00D9A5" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="Pengeluaran" fill="#FF6B6B" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Pie chart - expense categories */}
            {catData.length > 0 && (
                <div className="card">
                    <h2 className="font-semibold text-gray-800 mb-5">Pengeluaran per Kategori</h2>
                    <div className="flex flex-col lg:flex-row items-center gap-6">
                        <ResponsiveContainer width={260} height={240}>
                            <PieChart>
                                <Pie
                                    data={catData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {catData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(v: number) =>
                                        new Intl.NumberFormat("id-ID", {
                                            style: "currency",
                                            currency: "IDR",
                                            maximumFractionDigits: 0,
                                        }).format(v)
                                    }
                                    contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex-1 space-y-2 w-full">
                            {catData.map((c, i) => (
                                <div key={c.name} className="flex items-center gap-3">
                                    <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ background: COLORS[i % COLORS.length] }}
                                    />
                                    <span className="text-sm text-gray-600 flex-1 truncate">{c.name}</span>
                                    <span className="text-sm font-semibold text-gray-800">{fmt(c.value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
