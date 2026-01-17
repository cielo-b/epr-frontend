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
            Serving the Community <br /> through Faith.
          </h1>
          <p className="text-lg text-brand-green-50 max-w-xl font-light leading-relaxed drop-shadow-md">
            The official digital platform for the Eglise Presbyterienne au Rwanda. Streamlining church administration, enabling our mission.
          </p>
          <div className="pt-8 flex gap-3 text-xs font-bold tracking-widest uppercase opacity-60">
            <span>Est. 1907</span>
            <span>•</span>
            <span>Kigali, Rwanda</span>
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
            <h2 className="text-2xl font-bold text-brand-green-900">EPR Management System</h2>
          </div>

          <div className="space-y-3">
            <h2 className="text-4xl font-extrabold text-gray-900 font-outfit">Welcome back</h2>
            <p className="text-gray-500">Please enter your credentials to access your dashboard.</p>
          </div>

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
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <a href="#" className="text-xs font-bold text-brand-green-600 hover:text-brand-green-800">Forgot password?</a>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
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

            <button type="submit" disabled={!canSubmit} className="btn-epr w-full h-14 text-sm tracking-widest shadow-brand-green-900/10">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  AUTHENTICATING...
                </span>
              ) : "SIGN IN TO DASHBOARD"}
            </button>
          </form>

          <div className="pt-8 border-t border-gray-100 text-center space-y-2">
            <p className="text-xs text-gray-500 font-medium">
              Having trouble accessing your account?
            </p>
            <a href="mailto:secretariat@epr.rw" className="text-sm font-bold text-brand-green-700 hover:underline">
              Contact General Secretariat
            </a>
          </div>

          <div className="text-center pt-10">
            <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">
              © {new Date().getFullYear()} Eglise Presbyterienne au Rwanda
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
