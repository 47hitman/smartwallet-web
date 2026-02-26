export interface Transaction {
    amount: string | number;
    type: string;
    category: string;
    date: string;
}

export interface MonthlyEntry {
    name: string;
    Pemasukan: number;
    Pengeluaran: number;
}

export interface CategoryEntry {
    name: string;
    value: number;
}

/** Format number to short Rupiah string */
export function fmt(n: number): string {
    if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
    if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`;
    return `Rp ${n}`;
}

/** Aggregate transactions by month */
export function buildMonthlyData(transactions: Transaction[]): MonthlyEntry[] {
    const map: Record<string, { income: number; expense: number }> = {};
    transactions.forEach((tx) => {
        if (!tx.date) return;
        const d = new Date(tx.date);
        const label = d.toLocaleDateString("id-ID", {
            month: "short",
            year: "numeric",
        });
        if (!map[label]) map[label] = { income: 0, expense: 0 };
        const amount = parseFloat(String(tx.amount)) || 0;
        if (tx.type === "Pemasukan") map[label].income += amount;
        else map[label].expense += amount;
    });
    return Object.entries(map).map(([name, v]) => ({
        name,
        Pemasukan: v.income,
        Pengeluaran: v.expense,
    }));
}

/** Aggregate expense by category, sorted descending */
export function buildCategoryData(transactions: Transaction[]): CategoryEntry[] {
    const map: Record<string, number> = {};
    transactions
        .filter((tx) => tx.type === "Pengeluaran")
        .forEach((tx) => {
            map[tx.category] = (map[tx.category] ?? 0) + (parseFloat(String(tx.amount)) || 0);
        });
    return Object.entries(map)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
}

/** Sum total income */
export function totalIncome(transactions: Transaction[]): number {
    return transactions
        .filter((tx) => tx.type === "Pemasukan")
        .reduce((s, tx) => s + (parseFloat(String(tx.amount)) || 0), 0);
}

/** Sum total expense */
export function totalExpense(transactions: Transaction[]): number {
    return transactions
        .filter((tx) => tx.type === "Pengeluaran")
        .reduce((s, tx) => s + (parseFloat(String(tx.amount)) || 0), 0);
}

/** Validate login input — returns error message or null */
export function validateLoginInput(email: string, password: string): string | null {
    if (!email.trim()) return "Email tidak boleh kosong.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Format email tidak valid.";
    if (!password) return "Password tidak boleh kosong.";
    if (password.length < 6) return "Password minimal 6 karakter.";
    return null;
}
