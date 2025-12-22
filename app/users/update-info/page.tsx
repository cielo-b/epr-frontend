"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { authService, User } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import { AppShell } from "@/components/AppShell";

export default function UpdateInfoPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  useEffect(() => {
    const current = authService.getUser();
    if (!current) {
      router.push("/login");
      return;
    }
    setUser(current);
    loadProfile(current.id);
  }, [router]);

  const loadProfile = async (id: string) => {
    try {
      const res = await api.get(`/users/${id}`);
      setForm({
        firstName: res.data.firstName || "",
        lastName: res.data.lastName || "",
        email: res.data.email || "",
      });
    } catch (error) {
      addToast("Failed to load profile", "error");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await api.patch(`/users/${user.id}`, form);
      addToast("Profile updated");
      authService.setUser({
        ...(user as User),
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
      });
      router.push("/users/profile");
    } catch (error: any) {
      console.log(error)
      const message = error?.response?.data?.message || "Failed to update profile.";
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
      title="Update Info"
      subtitle="Edit your profile details"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">First Name</label>
                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Link href="/users/profile" className="btn btn-ghost">
                Cancel
              </Link>
              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </AppShell>
  );
}

