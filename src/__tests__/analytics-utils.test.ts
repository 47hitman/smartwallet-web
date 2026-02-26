import "@testing-library/jest-dom";
import {
    fmt,
    buildMonthlyData,
    buildCategoryData,
    totalIncome,
    totalExpense,
    validateLoginInput,
    Transaction,
} from "@/lib/analytics-utils";

// ─── fmt ────────────────────────────────────────────────────────────────────

describe("fmt()", () => {
    it("formats values below 1.000 as plain Rp", () => {
        expect(fmt(0)).toBe("Rp 0");
        expect(fmt(500)).toBe("Rp 500");
        expect(fmt(999)).toBe("Rp 999");
    });

    it("formats thousand range as 'rb'", () => {
        expect(fmt(1_000)).toBe("Rp 1rb");
        expect(fmt(50_000)).toBe("Rp 50rb");
        expect(fmt(999_999)).toBe("Rp 1000rb");
    });

    it("formats million range as 'jt'", () => {
        expect(fmt(1_000_000)).toBe("Rp 1.0jt");
        expect(fmt(2_500_000)).toBe("Rp 2.5jt");
        expect(fmt(10_000_000)).toBe("Rp 10.0jt");
    });
});

// ─── totalIncome / totalExpense ──────────────────────────────────────────────

const mockTransactions: Transaction[] = [
    { amount: "100000", type: "Pemasukan", category: "Gaji", date: "2026-01-01" },
    { amount: "50000", type: "Pengeluaran", category: "Makan", date: "2026-01-05" },
    { amount: "200000", type: "Pemasukan", category: "Freelance", date: "2026-01-15" },
    { amount: "30000", type: "Pengeluaran", category: "Transport", date: "2026-01-20" },
    { amount: "20000", type: "Pengeluaran", category: "Makan", date: "2026-02-03" },
];

describe("totalIncome()", () => {
    it("returns 0 on empty list", () => {
        expect(totalIncome([])).toBe(0);
    });

    it("sums only Pemasukan transactions", () => {
        expect(totalIncome(mockTransactions)).toBe(300_000);
    });

    it("handles numeric amount values", () => {
        const txs: Transaction[] = [
            { amount: 150000, type: "Pemasukan", category: "X", date: "2026-01-01" },
        ];
        expect(totalIncome(txs)).toBe(150_000);
    });
});

describe("totalExpense()", () => {
    it("returns 0 on empty list", () => {
        expect(totalExpense([])).toBe(0);
    });

    it("sums only Pengeluaran transactions", () => {
        expect(totalExpense(mockTransactions)).toBe(100_000);
    });
});

// ─── buildCategoryData ───────────────────────────────────────────────────────

describe("buildCategoryData()", () => {
    it("returns empty array on empty list", () => {
        expect(buildCategoryData([])).toEqual([]);
    });

    it("ignores Pemasukan transactions", () => {
        const txs: Transaction[] = [
            { amount: "100000", type: "Pemasukan", category: "Gaji", date: "2026-01-01" },
        ];
        expect(buildCategoryData(txs)).toEqual([]);
    });

    it("aggregates same category across transactions", () => {
        const result = buildCategoryData(mockTransactions);
        const makan = result.find((r) => r.name === "Makan");
        expect(makan?.value).toBe(70_000); // 50k + 20k
    });

    it("sorts descending by value", () => {
        const result = buildCategoryData(mockTransactions);
        for (let i = 1; i < result.length; i++) {
            expect(result[i - 1].value).toBeGreaterThanOrEqual(result[i].value);
        }
    });

    it("creates separate entries per category", () => {
        const result = buildCategoryData(mockTransactions);
        const names = result.map((r) => r.name);
        expect(names).toContain("Makan");
        expect(names).toContain("Transport");
    });
});

// ─── buildMonthlyData ────────────────────────────────────────────────────────

describe("buildMonthlyData()", () => {
    it("returns empty array on empty list", () => {
        expect(buildMonthlyData([])).toEqual([]);
    });

    it("skips transactions with missing date", () => {
        const txs: Transaction[] = [
            { amount: "100", type: "Pemasukan", category: "X", date: "" },
        ];
        expect(buildMonthlyData(txs)).toEqual([]);
    });

    it("groups transactions by month correctly", () => {
        const result = buildMonthlyData(mockTransactions);
        // Jan and Feb should be different entries
        expect(result.length).toBe(2);
    });

    it("correctly sums income and expense per month", () => {
        const result = buildMonthlyData(mockTransactions);
        const jan = result.find((r) => r.Pemasukan === 300_000);
        expect(jan).toBeDefined();
        expect(jan!.Pengeluaran).toBe(80_000); // 50k + 30k
    });
});

// ─── validateLoginInput ──────────────────────────────────────────────────────

describe("validateLoginInput()", () => {
    it("returns null for valid input", () => {
        expect(validateLoginInput("user@example.com", "password123")).toBeNull();
    });

    it("rejects empty email", () => {
        expect(validateLoginInput("", "password123")).toBe("Email tidak boleh kosong.");
    });

    it("rejects whitespace-only email", () => {
        expect(validateLoginInput("   ", "password123")).toBe("Email tidak boleh kosong.");
    });

    it("rejects invalid email format", () => {
        expect(validateLoginInput("notanemail", "password123")).toBe("Format email tidak valid.");
        expect(validateLoginInput("@missing.com", "password123")).toBe("Format email tidak valid.");
        expect(validateLoginInput("missing@", "password123")).toBe("Format email tidak valid.");
    });

    it("rejects empty password", () => {
        expect(validateLoginInput("user@example.com", "")).toBe("Password tidak boleh kosong.");
    });

    it("rejects password shorter than 6 chars", () => {
        expect(validateLoginInput("user@example.com", "abc")).toBe("Password minimal 6 karakter.");
    });

    it("accepts password with exactly 6 chars", () => {
        expect(validateLoginInput("user@example.com", "abcdef")).toBeNull();
    });
});
