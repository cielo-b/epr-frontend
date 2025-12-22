"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { authService, User } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import { AppShell } from "@/components/AppShell";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const current = authService.getUser();
    if (!current) {
      router.push("/login");
      return;
    }
    setUser(current);
    setLoading(false);
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.newPassword || form.newPassword.length < 8) {
      addToast("Password must be at least 8 characters", "error");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      addToast("Passwords do not match", "error");
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/users/${user.id}`, { password: form.newPassword });
      addToast("Password updated");
      setForm({ newPassword: "", confirmPassword: "" });
      router.push("/users/profile");
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to update password.";
      addToast(Array.isArray(message) ? message.join(", ") : message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <AppShell
      title="Change Password"
      subtitle="Update your password"
      userName={`${user.firstName} ${user.lastName}`}
    >
      <main className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Link href="/users/profile" className="text-brand-green-600 hover:text-brand-green-800 text-sm">
            ← Back to Profile
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">New Password</label>
              <input
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                className="input"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 8 characters.</p>
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <Link href="/users/profile" className="btn btn-ghost">
                Cancel
              </Link>
              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving ? "Saving..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </AppShell>
  );
}

