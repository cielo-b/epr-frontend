"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const { addToast } = useToast();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const canSubmit = useMemo(() => {
        return email.trim().length > 3 && !loading;
    }, [email, loading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        setLoading(true);

        try {
            await api.post("/auth/forgot-password", { email });
            setSuccess(true);
            addToast("Password reset link sent to your email.", "success");
        } catch (err: any) {
            // Even on error we often want to show success to prevent enumeration, but for internal apps error is fine.
            // The backend returns success even if email not found, so this catch handles network errors.
            const message = err.response?.data?.message || "Something went wrong. Please try again.";
            addToast(message, "error");
        } finally {
            setLoading(false);
        }
    };

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
                        Recover Access
                    </h1>
                    <p className="text-lg text-brand-green-50 max-w-xl font-light leading-relaxed drop-shadow-md">
                        Lost your password? We'll help you get back to managing your church community.
                    </p>
                    <div className="pt-8 flex gap-3 text-xs font-bold tracking-widest uppercase opacity-60">
                        <span>Support</span>
                        <span>•</span>
                        <span>Security</span>
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
                        <h2 className="text-4xl font-extrabold text-gray-900 font-outfit">Forgot Password?</h2>
                        <p className="text-gray-500">Enter your email address to receive a password reset link.</p>
                    </div>

                    {!success ? (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-semibold text-gray-700">
                                        Email address
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="input-premium h-14 text-base"
                                        placeholder="name@epr.rw"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <button type="submit" disabled={!canSubmit} className="btn-epr w-full h-14 text-sm tracking-widest shadow-brand-green-900/10">
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                            </svg>
                                            SENDING LINK...
                                        </span>
                                    ) : "SEND RESET LINK"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.push("/login")}
                                    className="btn-ghost w-full h-12 text-sm"
                                >
                                    Back to Login
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="bg-brand-green-50 rounded-2xl p-8 text-center space-y-6 border border-brand-green-100">
                            <div className="mx-auto h-16 w-16 bg-brand-green-100 rounded-full flex items-center justify-center">
                                <svg className="h-8 w-8 text-brand-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Check your email</h3>
                                <p className="text-gray-600 text-sm">
                                    We've sent a password reset link to <strong>{email}</strong>.
                                </p>
                            </div>
                            <button
                                onClick={() => router.push("/login")}
                                className="btn-epr w-full"
                            >
                                Return to Login
                            </button>
                            <button
                                onClick={() => setSuccess(false)}
                                className="text-xs text-gray-500 hover:text-gray-700 underline"
                            >
                                Click here if you need to resend
                            </button>
                        </div>
                    )}

                    <div className="pt-8 border-t border-gray-100 text-center">
                        <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">
                            © {new Date().getFullYear()} Eglise Presbyterienne au Rwanda
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
