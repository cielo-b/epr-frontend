"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { authService, User } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import { AppShell } from "@/components/AppShell";

type UserDetails = User & {
  createdAt?: string;
  updatedAt?: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);

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
      setProfile(res.data);
    } catch (error) {
      addToast("Failed to load profile", "error");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <AppShell
      title="My Profile"
      subtitle="View your account details"
      userName={`${user.firstName} ${user.lastName}`}
    >
      <main className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Link href="/dashboard" className="text-brand-green-600 hover:text-brand-green-800 text-sm">
            ← Back to Dashboard
          </Link>
          <div className="flex gap-2">
            <Link href="/users/update-info" className="btn btn-primary btn-sm">
              Edit Info
            </Link>
            <Link href="/users/change-password" className="btn btn-secondary btn-sm">
              Change Password
            </Link>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          <div>
            <div className="text-xs uppercase text-gray-500">Name</div>
            <div className="text-lg font-semibold text-gray-900">
              {profile.firstName} {profile.lastName}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase text-gray-500">Email</div>
            <div className="text-base text-gray-800">{profile.email}</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs uppercase text-gray-500">Role</div>
              <div className="badge badge-info mt-1">{profile.role}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-gray-500">Status</div>
              <div className="badge mt-1">{profile.isActive ? "Active" : "Inactive"}</div>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            <div>Created: {profile.createdAt ? new Date(profile.createdAt).toLocaleString() : "—"}</div>
            <div>Updated: {profile.updatedAt ? new Date(profile.updatedAt).toLocaleString() : "—"}</div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}

