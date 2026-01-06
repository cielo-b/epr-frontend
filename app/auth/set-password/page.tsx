"use client";

import { useState, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import api from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { Skeleton } from "@/components/Skeleton";

function SetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const { addToast } = useToast();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isValid = useMemo(() => {
        return password.length >= 6 && password === confirmPassword;
    }, [password, confirmPassword]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            setError("Invalid or missing token.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await api.post("/auth/set-password", { token, newPassword: password });
            addToast("Password set successfully. You can now login.", "success");
            router.push("/login");
        } catch (error: any) {
            const message = error?.response?.data?.message || "Failed to set password.";
            setError(Array.isArray(message) ? message.join(", ") : message);
            addToast(message, "error");
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-green-50 via-white to-brand-red-50 px-4">
                <div className="max-w-md w-full p-10 bg-white rounded-xl shadow-lg border border-[var(--border-subtle)] text-center">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-50 mb-4">
                        <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h2>
                    <p className="text-sm text-gray-600 mb-6">The link you followed is invalid or has expired.</p>
                    <button onClick={() => router.push("/login")} className="btn btn-primary w-full">
                        Return to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-green-50 via-white to-brand-red-50 px-4">
            <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg border border-[var(--border-subtle)]">
                <div className="text-center space-y-3">
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-xl bg-white border border-brand-green-100 shadow-sm overflow-hidden">
                        <Image
                            src="/img/logo.png"
                            alt="RMSoft logo"
                            width={50}
                            height={50}
                            className="h-full w-full object-contain"
                            priority
                        />
                    </div>
                    <h2 className="text-2xl font-extrabold text-gray-900">Set New Password</h2>
                    <p className="text-sm text-gray-600">Secure your account with a strong password.</p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium text-gray-700">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    required
                                    className="input pr-24"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((p) => !p)}
                                    className="absolute inset-y-0 right-2 px-3 text-xs font-medium text-brand-green-700 hover:text-brand-green-900"
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                            {password && password.length < 6 && (
                                <p className="text-xs text-red-500">Must be at least 6 characters.</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
                                required
                                className={`input ${confirmPassword && password !== confirmPassword ? 'border-red-300 focus:ring-red-200' : ''}`}
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            {confirmPassword && password !== confirmPassword && (
                                <p className="text-xs text-red-500">Passwords do not match.</p>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex items-start gap-2">
                            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading || !isValid}
                            className="btn btn-primary w-full shadow-lg shadow-brand-green-600/20"
                        >
                            {loading ? "Setting Password..." : "Set Password"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function SetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-green-50 via-white to-brand-red-50 px-4">
                <div className="max-w-md w-full p-10 bg-white rounded-xl shadow-lg border border-[var(--border-subtle)] space-y-8">
                    <div className="flex flex-col items-center gap-4">
                        <Skeleton className="h-20 w-20 rounded-xl" />
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </div>
            </div>
        }>
            <SetPasswordContent />
        </Suspense>
    );
}
