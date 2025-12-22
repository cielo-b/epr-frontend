"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { authService, User } from "@/lib/auth";
import { UserRole, canCreateUsers, getRoleDisplayName } from "@/lib/roles";
import { useToast } from "@/components/ToastProvider";

type CreateUserPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
};

export default function NewUserPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateUserPayload>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: UserRole.DEVELOPER,
    isActive: true,
  });

  useEffect(() => {
    const user = authService.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    if (!canCreateUsers(user.role)) {
      router.push("/dashboard");
      return;
    }
    setCurrentUser(user);
  }, [router]);

  const roleOptions = useMemo(
    () => Object.values(UserRole).filter((r) => r !== UserRole.SUPERADMIN),
    []
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/users", form);
      addToast("User created successfully.");
      router.push("/users");
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to create user. Please try again.";
      addToast(Array.isArray(message) ? message.join(", ") : message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/users" className="text-brand-green-600 hover:text-brand-green-800">
              ← Back to Users
            </Link>
            <span className="text-sm text-gray-700">
              {currentUser.firstName} {currentUser.lastName}
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Create New User
            </h2>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-green-500 focus:ring-brand-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-green-500 focus:ring-brand-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-green-500 focus:ring-brand-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Temporary Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-green-500 focus:ring-brand-green-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Share this with the user so they can log in. They should change it after login.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-green-500 focus:ring-brand-green-500"
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {getRoleDisplayName(role)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center space-x-2 mt-6">
                  <input
                    id="isActive"
                    name="isActive"
                    type="checkbox"
                    checked={form.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 text-brand-green-600 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    Active
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Link
                  href="/users"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

