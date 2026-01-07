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
  isActive?: boolean;
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

  const getAttachmentUrl = (path: string | undefined) => {
    if (!path) return "";
    if (path.startsWith('http')) return path;
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").replace(/\/api\/?$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/users/profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile(res.data);
      authService.setUser(res.data);
      addToast("Profile image updated successfully");
    } catch (error) {
      addToast("Failed to upload profile image", "error");
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
      userName={`${profile.firstName} ${profile.lastName}`}
      userRole={profile.role}
      avatarUrl={profile.avatarUrl}
    >
      <main className="max-w-3xl mx-auto space-y-6 pb-12">
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

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
          <div className="h-32 bg-gradient-to-r from-brand-green-600 to-blue-600"></div>
          <div className="px-6 pb-6">
            <div className="relative -mt-16 mb-6 inline-block">
              {profile.avatarUrl ? (
                <img
                  src={getAttachmentUrl(profile.avatarUrl)}
                  alt="Profile"
                  className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-lg bg-gray-100"
                />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-brand-green-100 flex items-center justify-center border-4 border-white shadow-lg">
                  <span className="text-4xl font-bold text-brand-green-600">
                    {profile.firstName[0]}{profile.lastName[0]}
                  </span>
                </div>
              )}
              <label className="absolute bottom-2 right-2 p-2 bg-white rounded-xl shadow-md cursor-pointer hover:bg-gray-50 transition-colors border border-gray-100">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleUploadAvatar}
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Full Name</h3>
                  <p className="mt-1 text-xl font-bold text-gray-900">{profile.firstName} {profile.lastName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Email Address</h3>
                  <p className="mt-1 text-lg text-gray-800">{profile.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Account Role</h3>
                  <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-brand-green-100 text-brand-green-800">
                    {profile.role}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Account Status</h3>
                  <div className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${profile.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {profile.isActive ? "Active" : "Inactive"}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Account History</h3>
                  <div className="mt-2 space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Created On:</span>
                      <span className="font-medium">{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Updated:</span>
                      <span className="font-medium">{profile.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : "—"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}

