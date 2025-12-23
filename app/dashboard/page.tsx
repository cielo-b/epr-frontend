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
import { DashboardCharts } from "@/components/DashboardCharts";

import { ArrowRight } from "lucide-react";
import { DashboardStats } from "@/components/DashboardStats";
import { RecentProjects } from "@/components/RecentProjects";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);

  useEffect(() => {
    const currentUser = authService.getUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);
    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    try {
      const currentUser = authService.getUser();

      // Load Stats
      if (canOverseeAllProjects(currentUser?.role || "")) {
        const statsRes = await api.get("/reports/statistics/system");
        setStats(statsRes.data);
      }

      // Load Projects (for Recent Projects list)
      // This endpoint is generally available to roles that see the dashboard, 
      // but filtered by role on the backend.
      const projectsRes = await api.get("/projects");
      setRecentProjects(projectsRes.data);

    } catch (error) {
      console.error("Failed to load dashboard data:", error);
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-root)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-4 border-brand-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--text-secondary)] font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  const quickLinks = [
    canCreateUsers(user.role) && {
      label: "User Management",
      href: "/users",
      desc: "Create and manage system users",
      color: "bg-blue-500",
      action: "Manage Users"
    },
    {
      label: "Projects",
      href: "/projects",
      desc: "Track and manage ongoing projects",
      color: "bg-purple-500",
      action: "View Projects"
    },
    {
      label: "Reports",
      href: "/reports",
      desc: "View analytics and generate reports",
      color: "bg-emerald-500",
      action: "Go to Reports"
    },
  ].filter(Boolean) as { label: string; href: string; desc: string; color: string; action: string }[];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <AppShell
      title="Dashboard"
      subtitle={`${greeting()}, ${user.firstName}`}
      userName={`${user.firstName} ${user.lastName}`}
      onLogout={handleLogout}
    >
      <div className="max-w-[1600px] mx-auto space-y-8">

        {/* Top Stats Section */}
        {stats && <DashboardStats stats={stats} projects={recentProjects} />}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Main Content */}
          <div className="xl:col-span-2 space-y-8">

            {/* Charts Area */}
            {stats && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">Analytics Overview</h2>
                </div>
                <DashboardCharts stats={stats} />
              </section>
            )}

            {/* Recent Projects Table */}
            <section>
              <RecentProjects projects={recentProjects} />
            </section>
          </div>

          {/* Right Sidebar Area */}
          <div className="space-y-8">

            {/* Quick Actions */}
            <section className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                Quick Actions
              </h3>
              <div className="space-y-4">
                {quickLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="block group">
                    <div className="p-4 rounded-lg border border-[var(--border-subtle)] hover:border-brand-blue-300 dark:hover:border-brand-blue-700 hover:bg-[var(--bg-active)] transition-all flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-[var(--text-primary)] group-hover:text-brand-blue-600 dark:group-hover:text-brand-blue-400 transition-colors">
                          {link.label}
                        </h4>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                          {link.desc}
                        </p>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-[var(--bg-root)] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ArrowRight className="h-4 w-4 text-[var(--text-secondary)] group-hover:text-brand-blue-500" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Support Section */}
            <section className="bg-[var(--bg-active)] border border-[var(--border-subtle)] rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-brand-blue-100 dark:bg-brand-blue-900/40 flex items-center justify-center">
                  <svg className="h-5 w-5 text-brand-blue-600 dark:text-brand-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Need Assistance?</h3>
                  <p className="text-xs text-[var(--text-secondary)]">24/7 Support Team</p>
                </div>
              </div>

              <div className="space-y-3">
                <a href="mailto:irumvaregisdmc@gmail.com" className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-brand-blue-300 dark:hover:border-brand-blue-700 transition-colors group">
                  <div className="h-8 w-8 rounded-full bg-gray-50 dark:bg-gray-50 flex items-center justify-center group-hover:bg-brand-blue-50 dark:group-hover:bg-brand-blue-900/20 transition-colors">
                    <svg className="h-4 w-4 text-[var(--text-secondary)] group-hover:text-brand-blue-600 dark:group-hover:text-brand-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-[var(--text-secondary)] font-medium">Email Support</span>
                    <span className="text-sm font-semibold text-[var(--text-primary)] break-all">irumvaregisdmc@gmail.com</span>
                  </div>
                </a>

                <a href="tel:0790539402" className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-brand-blue-300 dark:hover:border-brand-blue-700 transition-colors group">
                  <div className="h-8 w-8 rounded-full bg-gray-50 dark:bg-gray-50 flex items-center justify-center group-hover:bg-brand-blue-50 dark:group-hover:bg-brand-blue-900/20 transition-colors">
                    <svg className="h-4 w-4 text-[var(--text-secondary)] group-hover:text-brand-blue-600 dark:group-hover:text-brand-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-[var(--text-secondary)] font-medium">Mobile Contact</span>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">0790539402</span>
                  </div>
                </a>
              </div>
            </section>

          </div>
        </div>
      </div>
    </AppShell>
  );
}
