"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AppConfig {
    version: string;
    update_url: string;
    updated_at: string;
}

export default function AppVersionPage() {
    const supabase = createClient();
    const [config, setConfig] = useState<AppConfig | null>(null);
    const [version, setVersion] = useState("");
    const [updateUrl, setUpdateUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    const showToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        async function fetchConfig() {
            const { data, error } = await supabase
                .from("app_config")
                .select("version, update_url, updated_at")
                .eq("id", 1)
                .maybeSingle();

            if (!error && data) {
                setConfig(data as AppConfig);
                setVersion(data.version ?? "");
                setUpdateUrl(data.update_url ?? "");
            }
            setLoading(false);
        }
        fetchConfig();
    }, [supabase]);

    async function handleSave() {
        if (!version.trim()) {
            showToast("Versi tidak boleh kosong", "error");
            return;
        }
        if (updateUrl.trim() && !/^https?:\/\/.+/.test(updateUrl.trim())) {
            showToast("Link update harus diawali http:// atau https://", "error");
            return;
        }

        setSaving(true);
        const { error } = await supabase
            .from("app_config")
            .update({
                version: version.trim(),
                update_url: updateUrl.trim(),
                updated_at: new Date().toISOString(),
            })
            .eq("id", 1);

        setSaving(false);
        if (error) {
            showToast(`Gagal menyimpan: ${error.message}`, "error");
        } else {
            setConfig((prev) =>
                prev
                    ? { ...prev, version: version.trim(), update_url: updateUrl.trim(), updated_at: new Date().toISOString() }
                    : prev
            );
            showToast("Versi berhasil diperbarui! Semua user akan diminta update.");
        }
    }

    const fmtDate = (iso: string) =>
        new Intl.DateTimeFormat("id-ID", {
            dateStyle: "long",
            timeStyle: "short",
        }).format(new Date(iso));

    return (
        <div>
            {/* Toast */}
            {toast && (
                <div
                    className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${toast.type === "success"
                        ? "bg-green-500"
                        : "bg-red-500"
                        }`}
                >
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Versi Aplikasi</h1>
                <p className="text-gray-500 text-sm mt-1">
                    Kelola versi aplikasi dan link update untuk pengguna
                </p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="max-w-2xl space-y-6">
                    {/* Current Status Card */}
                    {config && (
                        <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-6 text-white shadow-lg">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-white/70 text-xs">Versi Aktif Saat Ini</p>
                                    <p className="text-2xl font-bold">{config.version}</p>
                                </div>
                            </div>
                            <div className="text-white/60 text-xs">
                                Terakhir diubah: {fmtDate(config.updated_at)}
                            </div>
                        </div>
                    )}

                    {/* Edit Form */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
                        <h2 className="text-base font-semibold text-gray-800">
                            Ubah Versi & Link Update
                        </h2>

                        {/* Version field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Versi Terbaru
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    value={version}
                                    onChange={(e) => setVersion(e.target.value)}
                                    placeholder="contoh: 1.2.0"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                Format semver: major.minor.patch (contoh: 2.0.0)
                            </p>
                        </div>

                        {/* Update URL field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Link Download / Update
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                </div>
                                <input
                                    type="url"
                                    value={updateUrl}
                                    onChange={(e) => setUpdateUrl(e.target.value)}
                                    placeholder="https://play.google.com/store/apps/..."
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                Link Play Store, App Store, atau APK langsung
                            </p>
                        </div>

                        {/* Save button */}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full py-3 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Simpan & Publish
                                </>
                            )}
                        </button>
                    </div>

                    {/* Info box */}
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                        <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm text-amber-800">
                            <p className="font-semibold mb-1">Cara kerja:</p>
                            <p>Saat kamu mengubah versi di sini menjadi lebih besar dari versi yang ada di aplikasi, semua pengguna akan mendapat popup <strong>Update Tersedia</strong> saat membuka aplikasi. Mereka akan diarahkan ke link yang kamu input.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
