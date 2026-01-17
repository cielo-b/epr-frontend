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
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl border border-gray-100 text-center">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-50 mb-6">
                        <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 font-outfit">Invalid Link</h2>
                    <p className="text-gray-500 mb-8">The link you followed is invalid or has expired. Please contact your administrator.</p>
                    <button onClick={() => router.push("/login")} className="btn-epr w-full h-12">
                        Return to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex w-full">
            {/* Visual Side - Image Background */}
            <div className="hidden lg:flex w-1/2 relative bg-brand-green-900">
                <Image
                    src="/img/auth-bg.png"
                    alt="EPR Main Church in Rwanda"
                    fill
                    className="object-cover"
                    priority
                    quality={90}
                />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-green-950 via-brand-green-950/70 to-transparent flex flex-col justify-end p-16 text-white space-y-6">
                    <div className="h-20 w-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 mb-4 shadow-2xl">
                        <Image
                            src="/img/logo.png"
                            alt="EPR Logo"
                            width={56}
                            height={56}
                            className="object-contain drop-shadow-md"
                        />
                    </div>
                    <h1 className="text-5xl font-extrabold font-outfit leading-tight drop-shadow-lg">
                        Secure Your Account
                    </h1>
                    <p className="text-lg text-brand-green-50 max-w-xl font-light leading-relaxed drop-shadow-md">
                        Set a strong password to protect your access to the EPR Church Management System.
                    </p>
                    <div className="pt-8 flex gap-3 text-xs font-bold tracking-widest uppercase opacity-60">
                        <span>Security</span>
                        <span>•</span>
                        <span>Privacy</span>
                        <span>•</span>
                        <span>Trust</span>
                    </div>
                </div>
            </div>

            {/* Form Side */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-8 lg:px-24">
                <div className="max-w-md w-full space-y-10">

                    {/* Mobile Logo Only */}
                    <div className="lg:hidden text-center mb-10">
                        <div className="inline-block h-20 w-20 bg-brand-green-50 rounded-2xl p-4 mb-4">
                            <Image src="/img/logo.png" alt="EPR Logo" width={60} height={60} className="w-full h-full object-contain" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-4xl font-extrabold text-gray-900 font-outfit">Set New Password</h2>
                        <p className="text-gray-500">Create a secure password for your account.</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label htmlFor="password" className="text-sm font-semibold text-gray-700">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="new-password"
                                        required
                                        className="input-premium h-14 pr-24 text-base"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((p) => !p)}
                                        className="absolute inset-y-0 right-2 px-4 text-xs font-bold tracking-wider text-gray-400 hover:text-brand-green-700 transition-colors uppercase"
                                    >
                                        {showPassword ? "Hide" : "Show"}
                                    </button>
                                </div>
                                {password && password.length < 6 && (
                                    <p className="text-xs text-red-500 font-medium mt-1">Must be at least 6 characters.</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                                    Confirm Password
                                </label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    required
                                    className={`input-premium h-14 text-base ${confirmPassword && password !== confirmPassword ? 'border-red-300 focus:ring-red-200' : ''}`}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                {confirmPassword && password !== confirmPassword && (
                                    <p className="text-xs text-red-500 font-medium mt-1">Passwords do not match.</p>
                                )}
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-xl border border-red-100 bg-red-50 p-4 flex gap-3 items-start">
                                <svg className="w-5 h-5 text-red-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <p className="text-sm text-red-800 font-medium">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !isValid}
                            className="btn-epr w-full h-14 text-sm tracking-widest shadow-brand-green-900/10"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                    </svg>
                                    SETTING PASSWORD...
                                </span>
                            ) : "CONFIRM NEW PASSWORD"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function SetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl border border-gray-100 space-y-8">
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
