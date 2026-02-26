"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface UserProfile {
    id: string;
    user_id: string;
    is_premium: boolean;
    created_at: string;
    email: string | null;
    username: string | null;
}

export default function AdminUsersPage() {
    const supabase = createClient();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [editUser, setEditUser] = useState<UserProfile | null>(null);
    const [editUsername, setEditUsername] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    const showToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        const { data: profiles, error } = await supabase
            .from("profiles")
            .select("id, user_id, is_premium, created_at, email, username")
            .order("created_at", { ascending: false });

        if (error || !profiles) {
            showToast("Gagal memuat data user", "error");
            setLoading(false);
            return;
        }

        setUsers(profiles as UserProfile[]);
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    async function togglePremium(user: UserProfile) {
        setTogglingId(user.user_id);

        const res = await fetch(`/api/admin/users/${user.user_id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                is_premium: !user.is_premium,
                username: user.username,
                email: user.email,
            }),
        });
        const json = await res.json();

        setTogglingId(null);
        if (!res.ok) {
            showToast(`Gagal mengubah status premium: ${json.error ?? res.statusText}`, "error");
        } else {
            showToast(`User berhasil ${!user.is_premium ? "diaktifkan" : "dinonaktifkan"} premium`);
            setUsers((prev) =>
                prev.map((u) =>
                    u.user_id === user.user_id ? { ...u, is_premium: !u.is_premium } : u
                )
            );
        }
    }

    async function handleDelete(user: UserProfile) {
        const displayName = user.username ?? user.email ?? user.user_id;
        if (!confirm(`Hapus user "${displayName}"? Tindakan ini tidak bisa dibatalkan.`)) return;
        setDeletingId(user.user_id);

        const res = await fetch(`/api/admin/users/${user.user_id}`, { method: "DELETE" });
        const json = await res.json();

        setDeletingId(null);
        if (!res.ok) {
            showToast(`Gagal menghapus user: ${json.error ?? res.statusText}`, "error");
        } else {
            showToast("User berhasil dihapus");
            setUsers((prev) => prev.filter((u) => u.user_id !== user.user_id));
        }
    }

    async function handleSaveEdit() {
        if (!editUser) return;
        setSaving(true);

        const res = await fetch(`/api/admin/users/${editUser.user_id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                is_premium: editUser.is_premium,
                username: editUsername.trim() || null,
                email: editEmail.trim() || null,
            }),
        });
        const json = await res.json();

        setSaving(false);
        if (!res.ok) {
            showToast(`Gagal menyimpan: ${json.error ?? res.statusText}`, "error");
        } else {
            showToast("Perubahan berhasil disimpan");
            setUsers((prev) =>
                prev.map((u) =>
                    u.user_id === editUser.user_id
                        ? {
                            ...u,
                            is_premium: editUser.is_premium,
                            username: editUsername.trim() || null,
                            email: editEmail.trim() || null,
                        }
                        : u
                )
            );
            setEditUser(null);
        }
    }

    function openEdit(user: UserProfile) {
        setEditUser(user);
        setEditUsername(user.username ?? "");
        setEditEmail(user.email ?? "");
    }

    const filtered = users.filter((u) => {
        const q = search.toLowerCase();
        return (
            u.user_id.toLowerCase().includes(q) ||
            (u.email ?? "").toLowerCase().includes(q) ||
            (u.username ?? "").toLowerCase().includes(q)
        );
    });

    return (
        <div>
            {/* Toast */}
            {toast && (
                <div
                    className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${toast.type === "success" ? "bg-accent" : "bg-danger"
                        }`}
                >
                    {toast.type === "success" ? "✅" : "❌"} {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manajemen User</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {users.length} user terdaftar
                    </p>
                </div>
                <button
                    onClick={fetchUsers}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-5">
                <svg
                    className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    placeholder="Cari berdasarkan nama, email, atau User ID..."
                    className="input-field pl-11"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="card p-0 overflow-hidden">
                {loading ? (
                    <div className="p-10 text-center text-gray-400">
                        <svg className="animate-spin h-8 w-8 mx-auto text-primary mb-3" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Memuat data...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-10 text-center text-gray-400">Tidak ada user ditemukan</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">
                                        Pengguna
                                    </th>
                                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">
                                        Email
                                    </th>
                                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">
                                        Status
                                    </th>
                                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">
                                        Bergabung
                                    </th>
                                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map((user) => (
                                    <tr key={user.user_id} className="hover:bg-gray-50/50 transition-colors">
                                        {/* Pengguna */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-xs font-bold text-primary">
                                                        {(user.username ?? user.email ?? "?")[0].toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800">
                                                        {user.username ?? (
                                                            <span className="text-gray-400 italic font-normal">Tanpa nama</span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs font-mono text-gray-400 truncate max-w-[140px]" title={user.user_id}>
                                                        {user.user_id.slice(0, 8)}…
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Email */}
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-600">
                                                {user.email ?? (
                                                    <span className="text-gray-300 italic">—</span>
                                                )}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            {user.is_premium ? (
                                                <span className="badge-premium">✨ Premium</span>
                                            ) : (
                                                <span className="badge-free">🔓 Free</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(user.created_at).toLocaleDateString("id-ID", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Toggle Premium */}
                                                <button
                                                    onClick={() => togglePremium(user)}
                                                    disabled={togglingId === user.user_id}
                                                    title={user.is_premium ? "Nonaktifkan Premium" : "Aktifkan Premium"}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${user.is_premium
                                                        ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                                                        : "bg-primary/10 text-primary hover:bg-primary/20"
                                                        } disabled:opacity-50`}
                                                >
                                                    {togglingId === user.user_id ? (
                                                        <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                                        </svg>
                                                    )}
                                                    {user.is_premium ? "Non-Premium" : "Set Premium"}
                                                </button>

                                                {/* Edit */}
                                                <button
                                                    onClick={() => openEdit(user)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-all"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>

                                                {/* Delete */}
                                                <button
                                                    onClick={() => handleDelete(user)}
                                                    disabled={deletingId === user.user_id}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10 transition-all disabled:opacity-50"
                                                    title="Hapus"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editUser && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900">Edit User</h2>
                            <button
                                onClick={() => setEditUser(null)}
                                className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* User ID (read-only) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">User ID</label>
                                <input
                                    type="text"
                                    className="input-field bg-gray-50 text-gray-500 font-mono text-xs"
                                    value={editUser.user_id}
                                    readOnly
                                />
                            </div>

                            {/* Username */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Masukkan username..."
                                    value={editUsername}
                                    onChange={(e) => setEditUsername(e.target.value)}
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Email
                                    <span className="ml-2 text-xs font-normal text-gray-400">(hanya untuk data lokal)</span>
                                </label>
                                <input
                                    type="email"
                                    className="input-field"
                                    placeholder="email@example.com"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                />
                            </div>

                            {/* Status Premium */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status Akun</label>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setEditUser({ ...editUser, is_premium: true })}
                                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${editUser.is_premium
                                            ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                                            : "border-gray-200 text-gray-400 hover:border-yellow-300"
                                            }`}
                                    >
                                        ✨ Premium
                                    </button>
                                    <button
                                        onClick={() => setEditUser({ ...editUser, is_premium: false })}
                                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${!editUser.is_premium
                                            ? "border-primary bg-primary/5 text-primary"
                                            : "border-gray-200 text-gray-400 hover:border-primary/30"
                                            }`}
                                    >
                                        🔓 Free
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setEditUser(null)}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={saving}
                                className="flex-1 btn-primary py-2.5"
                            >
                                {saving ? "Menyimpan..." : "Simpan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
