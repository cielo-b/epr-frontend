"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { authService } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";

export default function LoginPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return email.trim().length > 3 && password.trim().length >= 6 && !loading;
  }, [email, password, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setLoading(true);

    try {
      await authService.login(email, password);
      addToast("Logged in successfully.", "success");
      router.push("/dashboard");
    } catch (err: any) {
      const message = err.response?.data?.message || "Login failed. Please check your credentials.";
      addToast(message, "error");
      setError(Array.isArray(message) ? message.join(", ") : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-green-50 via-white to-brand-red-50 px-4">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg border border-[var(--border-subtle)]">
        <div className="text-center space-y-3">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-xl bg-white border border-brand-green-100 shadow-sm overflow-hidden">
            <Image
              src="/img/logo.png"
              alt="RMSoft logo"
              width={64}
              height={64}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">RMSoft MIS</h2>
          <p className="text-sm text-gray-600">Sign in to your account</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
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
              <p className="text-xs text-gray-500">Minimum 6 characters.</p>
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <button type="submit" disabled={!canSubmit} className="btn btn-primary w-full">
              {loading ? "Signing in..." : "Sign in"}
            </button>
            <p className="text-xs text-center text-gray-500">
              Need access? Contact an administrator to receive credentials.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
