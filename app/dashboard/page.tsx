"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService, User } from "@/lib/auth";
import {
  getRoleDisplayName,
  canCreateUsers,
  canCreateProjects,
  canOverseeAllProjects,
} from "@/lib/roles";
import Link from "next/link";
import api from "@/lib/api";
import { AppShell } from "@/components/AppShell";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const currentUser = authService.getUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);
    loadStats();
  }, [router]);

  const loadStats = async () => {
    try {
      const currentUser = authService.getUser();
      if (canOverseeAllProjects(currentUser?.role || "")) {
        const response = await api.get("/reports/statistics/system");
        setStats(response.data);
      }
    } catch (error) {
      console.error("Failed to load statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    router.push("/login");
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const statCards = stats
    ? [
        { label: "Total Users", value: stats.overview.totalUsers },
        { label: "Total Projects", value: stats.overview.totalProjects },
        { label: "Total Documents", value: stats.overview.totalDocuments },
        { label: "Total Reports", value: stats.overview.totalReports },
      ]
    : [];

  const quickLinks = [
    canCreateUsers(user.role) && {
      label: "User Management",
      href: "/users",
      desc: "Create and manage users",
    },
    { label: "Projects", href: "/projects", desc: "View and manage projects" },
    { label: "Reports", href: "/reports", desc: "View and create reports" },
  ].filter(Boolean) as { label: string; href: string; desc: string }[];

  return (
    <AppShell
      title="Dashboard"
      subtitle={`Welcome, ${user.firstName}`}
      userName={`${user.firstName} ${user.lastName}`}
      onLogout={handleLogout}
    >
      {statCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg shadow-lg shadow-black/20 p-4"
            >
              <div className="text-sm font-medium text-[var(--text-secondary)]">
                {card.label}
              </div>
              <div className="mt-2 text-3xl font-semibold text-[var(--text-primary)] drop-shadow-sm">
                {card.value}
              </div>
              <div className="mt-2 h-1 w-12 rounded-full bg-brand-green-300/70" />
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href} className="block">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg shadow-lg shadow-black/15 hover:shadow-xl hover:shadow-black/25 transition p-5">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                {link.label}
              </h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {link.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
