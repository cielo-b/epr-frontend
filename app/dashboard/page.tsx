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
import { useToast } from "@/components/ToastProvider";
import { QuickActionsPanel } from "@/components/QuickActionsPanel";
import { CommunicationHub } from "@/components/CommunicationHub";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { Activity, ArrowRight } from "lucide-react";
import { DashboardStats } from "@/components/DashboardStats";
import { RecentProjects } from "@/components/RecentProjects";
import { QuickActionModals } from "@/components/QuickActionModals";
import { MyTasks } from "@/components/MyTasks";
import { PersonalDashboardCharts } from "@/components/PersonalDashboardCharts";
import { Skeleton } from "@/components/Skeleton"; // Import Skeleton component

export default function DashboardPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [servers, setServers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [deploymentStats, setDeploymentStats] = useState({
    deployed: 0,
    healthy: 0,
    down: 0,
  });
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [activeModal, setActiveModal] = useState<"assign-dev" | "announcement" | "milestone" | "meeting" | "update-request" | "pulse" | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; projectId?: string; projectName?: string }>({
    isOpen: false
  });

  // Charts Skeleton
  const ChartsSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm p-6 h-[400px]">
        <div className="mb-6 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center justify-center h-[300px]">
          <Skeleton className="h-48 w-48 rounded-full" />
        </div>
      </div>
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm p-6 h-[400px]">
        <div className="mb-6 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-4 mt-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    // Initial sync check for user
    const currentUser = authService.getUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);
    // Initialize loading data
    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const currentUser = authService.getUser();
      const isDevOpsRole = ["DEVOPS", "BOSS", "SUPERADMIN", "PROJECT_MANAGER"].includes(currentUser?.role || "");

      // Execute promises in parallel and don't block one for another
      const promises = [];

      // Stats
      if (canOverseeAllProjects(currentUser?.role || "")) {
        promises.push(api.get("/reports/statistics/system").then(res => setStats(res.data)));
      } else {
        promises.push(api.get("/reports/statistics/personal").then(res => setStats(res.data)));
      }

      // Projects
      promises.push(api.get("/projects").then(res => {
        setRecentProjects(res.data);
        const deployed = res.data.filter((p: any) => p.isDeployed).length;
        const healthy = res.data.filter((p: any) => p.lastHealthCheckStatus === "UP").length;
        const down = res.data.filter((p: any) => p.lastHealthCheckStatus === "DOWN").length;
        setDeploymentStats({ deployed, healthy, down });
      }));

      // DevOps Data
      if (isDevOpsRole) {
        promises.push(api.get("/servers").then(res => setServers(res.data)));
        promises.push(api.get("/notifications").then(res => setNotifications(res.data.slice(0, 5))));
      }

      // Announcements
      promises.push(api.get("/announcements/recent?limit=5").then(res => res.data).then(data => {
        setAnnouncements(data.map((a: any) => ({
          id: a.id,
          projectId: a.projectId,
          projectName: a.project?.name || "Unknown Project",
          message: a.message,
          author: `${a.author?.firstName || ""} ${a.author?.lastName || ""}`,
          createdAt: a.createdAt,
          priority: a.priority
        })));
      }));

      // Activities
      promises.push(api.get("/activity/recent").then(res => setActivities(res.data)));

      // Wait for all to finish (or fail)
      await Promise.allSettled(promises);

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

  const copyToClipboard = async (text: string, label: string = "Text") => {
    try {
      await navigator.clipboard.writeText(text);
      addToast(`${label} copied to clipboard!`);
    } catch (error) {
      addToast("Failed to copy to clipboard", "error");
    }
  };

  // Quick Actions Handlers - Wired to actual APIs via Modals
  const handleAssignDeveloper = () => {
    setActiveModal("assign-dev");
  };

  const handleCreateProject = () => {
    router.push("/projects");
    addToast("Redirecting to project creation...");
  };

  const handleSendUpdateRequest = () => {
    setActiveModal("update-request");
  };

  const handleMarkMilestone = () => {
    setActiveModal("milestone");
  };

  const handleScheduleMeeting = () => {
    setActiveModal("meeting");
  };

  const handleCreateAnnouncement = () => {
    setActiveModal("announcement");
  };

  const handleActionSuccess = (msg: string) => {
    addToast(msg, "success");
    loadDashboardData(); // Refresh data
  };

  const confirmRequestUpdate = async () => {
    if (!confirmModal.projectId) return;
    try {
      await api.post(`/projects/${confirmModal.projectId}/request-update`);
      addToast(`Status update request sent for ${confirmModal.projectName}`);
      setConfirmModal({ isOpen: false });
    } catch (error: any) {
      addToast(error.response?.data?.message || "Failed to send update request", "error");
    }
  };

  const handleViewComments = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  if (!user) {
    return null; // Minimal fallback during initial auth check
  }

  const isDevOpsRole = ["DEVOPS", "BOSS", "SUPERADMIN", "PROJECT_MANAGER"].includes(user.role);
  const isPMRole = ["PROJECT_MANAGER", "SUPERADMIN"].includes(user.role);

  const quickLinks = [
    canCreateUsers(user.role) && {
      label: "User Management",
      href: "/users",
      desc: "Create and manage system users",
      color: "bg-brand-green-600",
      action: "Manage Users"
    },
    {
      label: "Projects",
      href: "/projects",
      desc: "Track and manage ongoing projects",
      color: "bg-brand-green-700",
      action: "View Projects"
    },
    isDevOpsRole && {
      label: "Deployments",
      href: "/projects/deployments",
      desc: "Monitor and manage deployments",
      color: "bg-brand-green-600",
      action: "View Deployments"
    },
    isDevOpsRole && {
      label: "Servers",
      href: "/servers",
      desc: "Manage infrastructure and servers",
      color: "bg-brand-green-800",
      action: "Manage Servers"
    },
    {
      label: "Reports",
      href: "/reports",
      desc: "View analytics and generate reports",
      color: "bg-brand-green-600",
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
      userRole={user.role}
      onLogout={handleLogout}
    >
      <div className="max-w-[1600px] mx-auto space-y-8">

        {/* Modals for Quick Actions */}
        <QuickActionModals
          type={activeModal}
          onClose={() => setActiveModal(null)}
          onSuccess={handleActionSuccess}
        />

        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          title="Request Status Update"
          message={`Are you sure you want to request status updates from all developers assigned to "${confirmModal.projectName}"?`}
          onConfirm={confirmRequestUpdate}
          onCancel={() => setConfirmModal({ isOpen: false })}
          confirmText="Send Request"
          type="info"
        />

        {/* Top Stats Section removed from here since it moved above Highlights */}

        {/* Quick Actions Panel - for PM, Superadmin, and Secretary */}
        {(isPMRole || user.role === "SECRETARY") && (
          <QuickActionsPanel
            onAssignDeveloper={handleAssignDeveloper}
            onCreateProject={handleCreateProject}
            onSendUpdateRequest={handleSendUpdateRequest}
            onScheduleMeeting={() => setActiveModal("meeting")}
            onAnnouncement={() => setActiveModal("announcement")} // Add this to QuickActionsPanel
            userRole={user.role}
          />
        )}

        {/* DevOps Stats - Only for DevOps roles */}
        {isDevOpsRole && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Deployments Card */}
            <div className="group relative bg-white border border-brand-green-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
              {loading ? (
                <div className="space-y-4">
                  <div className="flex justify-between"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-8 rounded-xl" /></div>
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              ) : (
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Deployments</h3>
                    <div className="p-2.5 bg-brand-green-50 rounded-xl text-brand-green-600 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 font-medium">Deployed</span>
                      <span className="text-2xl font-bold text-gray-900">{deploymentStats.deployed}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 font-medium">Healthy</span>
                      <span className="text-lg font-bold text-brand-green-600">{deploymentStats.healthy}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 font-medium">Down</span>
                      <span className={`text-lg font-bold ${deploymentStats.down > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {deploymentStats.down}
                      </span>
                    </div>
                  </div>
                  <Link href="/projects/deployments" className="block w-full text-center py-2.5 px-4 bg-brand-green-600 hover:bg-brand-green-700 text-white rounded-xl font-bold text-sm transition-all active:scale-[0.98] shadow-md shadow-brand-green-100">
                    View Deployments
                  </Link>
                </div>
              )}
            </div>

            {/* Servers Card */}
            <div className="group relative bg-white border border-brand-green-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
              {loading ? (
                <div className="space-y-4">
                  <div className="flex justify-between"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-8 rounded-xl" /></div>
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              ) : (
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Servers</h3>
                    <div className="p-2.5 bg-brand-green-50 rounded-xl text-brand-green-600 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 font-medium">Total Online</span>
                      <span className="text-2xl font-bold text-gray-900">{servers.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 font-medium">Active Nodes</span>
                      <span className="text-lg font-bold text-brand-green-600">{servers.filter((s: any) => s.status === 'ACTIVE').length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 font-medium">Maintenance</span>
                      <span className="text-lg font-bold text-gray-400">{servers.length - servers.filter((s: any) => s.status === 'ACTIVE').length}</span>
                    </div>
                  </div>
                  <Link href="/servers" className="block w-full text-center py-2.5 px-4 bg-brand-green-600 hover:bg-brand-green-700 text-white rounded-xl font-bold text-sm transition-all active:scale-[0.98] shadow-md shadow-brand-green-100">
                    Manage Infrastructure
                  </Link>
                </div>
              )}
            </div>

            {/* System Health Card */}
            <div className="group relative bg-white border border-brand-green-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
              {loading ? (
                <div className="space-y-4">
                  <div className="flex justify-between"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-8 rounded-xl" /></div>
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              ) : (
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">System Health</h3>
                    <div className={`p-2.5 rounded-xl text-white group-hover:scale-110 transition-transform ${deploymentStats.down > 0 ? 'bg-red-600' : 'bg-brand-green-600'}`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 font-medium">System Uptime</span>
                      <span className="text-2xl font-bold text-gray-900">
                        {deploymentStats.deployed > 0
                          ? `${((deploymentStats.healthy / deploymentStats.deployed) * 100).toFixed(1)}%`
                          : "100%"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 font-medium">Critical Issues</span>
                      <span className={`text-lg font-bold ${deploymentStats.down > 0 ? 'text-red-600' : 'text-brand-green-600'}`}>
                        {deploymentStats.down}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 font-medium">Environment</span>
                      <span className={`px-3 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${deploymentStats.down > 0 ? 'bg-red-50 text-red-700' : 'bg-brand-green-50 text-brand-green-700'}`}>
                        {deploymentStats.down > 0 ? 'DEGRADED' : 'OPTIMAL'}
                      </span>
                    </div>
                  </div>
                  <Link href="/projects/deployments" className={`block w-full text-center py-2.5 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98] shadow-md ${deploymentStats.down > 0 ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-100' : 'bg-brand-green-600 hover:bg-brand-green-700 text-white shadow-brand-green-100'}`}>
                    {deploymentStats.down > 0 ? 'Investigate Issues' : 'View System Details'}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Top Stats Section */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white border rounded-xl p-4 shadow-sm h-32 flex flex-col justify-between">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        ) : (
          stats && <DashboardStats stats={stats} projects={recentProjects} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column (Left 2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Developer Specific Tasks */}
            {user.role === "DEVELOPER" && (
              <MyTasks userId={user.id} />
            )}

            {/* Charts Area - Only for Overseers */}
            {(canOverseeAllProjects(user?.role || "") || loading) && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">Analytics Overview</h2>
                </div>
                {loading ? <ChartsSkeleton /> : (stats && <DashboardCharts stats={stats} />)}
              </section>
            )}

            {/* Communication Hub */}
            {loading ? (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm h-[500px] p-6 space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-10 w-32 rounded-lg" />
                </div>
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <CommunicationHub
                announcements={announcements}
                activities={activities}
                onCreateAnnouncement={(isPMRole || user?.role === "SECRETARY") ? handleCreateAnnouncement : undefined}
                onViewComments={handleViewComments}
              />
            )}

            {/* Recent Projects Table */}
            <section>
              {loading ? (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6">
                  <Skeleton className="h-6 w-48" />
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <RecentProjects projects={recentProjects} canCreate={canCreateProjects(user.role)} />
              )}
            </section>
          </div>

          {/* Sidebar Area (Right 1/3) */}
          <div className="space-y-8">
            {/* Developer Specific Highlights in Sidebar */}
            {user.role === "DEVELOPER" && (
              <div className="space-y-6">
                {stats?.tasksByStatus && (
                  <PersonalDashboardCharts tasksByStatus={stats.tasksByStatus} />
                )}

                <div className="bg-white border border-brand-green-100 rounded-xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Project Resources</h3>
                  <div className="space-y-3">
                    {recentProjects.filter(p => p.githubUrl || p.deployUrl).slice(0, 5).map(p => (
                      <div key={p.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="text-sm font-bold text-gray-900 mb-2 truncate">{p.name}</div>
                        <div className="flex flex-wrap gap-2">
                          {p.githubUrl && (
                            <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-600 hover:text-brand-green-600 hover:border-brand-green-300 transition-colors">
                              REPOSITORY
                            </a>
                          )}
                          {p.deployUrl && (
                            <a href={p.deployUrl} target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-600 hover:text-brand-green-600 hover:border-brand-green-300 transition-colors">
                              LIVE APP
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                    {recentProjects.filter(p => p.githubUrl || p.deployUrl).length === 0 && (
                      <p className="text-xs text-gray-500 italic">No resources linked to your projects yet.</p>
                    )}
                  </div>
                </div>

                <div className="bg-brand-green-600 rounded-xl p-6 text-white shadow-lg shadow-brand-green-200">
                  <h3 className="text-sm font-bold uppercase tracking-widest opacity-80 mb-1">Developer Action</h3>
                  <h4 className="text-xl font-black mb-4">Send Status Pulse</h4>
                  <p className="text-xs opacity-90 leading-relaxed mb-6">
                    Respond to update requests by pulsing your technical health assessment.
                  </p>
                  <button
                    onClick={() => setActiveModal("pulse")}
                    className="w-full py-3 bg-white text-brand-green-700 rounded-xl font-bold text-sm hover:bg-brand-green-50 transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
                  >
                    <Activity className="h-4 w-4" />
                    PULSE NOW
                  </button>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <section className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                Quick Actions
              </h3>
              <div className="space-y-4">
                {quickLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="block group">
                    <div className="p-4 rounded-lg border border-[var(--border-subtle)] hover:border-brand-green-300 hover:bg-brand-green-50 transition-all flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-[var(--text-primary)] group-hover:text-brand-green-700 transition-colors">
                          {link.label}
                        </h4>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                          {link.desc}
                        </p>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-[var(--bg-root)] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ArrowRight className="h-4 w-4 text-[var(--text-secondary)] group-hover:text-brand-green-600" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Quick Server Access - DevOps Only */}
            {isDevOpsRole && servers.filter((s: any) => s.status === 'ACTIVE' && s.username).length > 0 && (
              <section className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                  Quick Server Access
                </h3>
                <div className="space-y-3">
                  {servers.filter((s: any) => s.status === 'ACTIVE' && s.username).slice(0, 3).map((server: any) => (
                    <div key={server.id} className="flex items-center justify-between p-3 bg-[var(--bg-root)] rounded-lg hover:bg-[var(--bg-active)] transition">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-[var(--text-primary)] truncate">{server.name}</div>
                        <div className="text-xs text-[var(--text-secondary)] font-mono mt-0.5 truncate">
                          {server.username}@{server.ipAddress}:{server.port}
                        </div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(
                          `ssh ${server.username}@${server.ipAddress} -p ${server.port}`,
                          "SSH command"
                        )}
                        className="ml-3 px-3 py-1.5 text-xs bg-brand-green-600 text-white rounded-md hover:bg-brand-green-700 transition flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </button>
                    </div>
                  ))}
                </div>
                <Link href="/servers" className="mt-4 block text-center text-sm text-brand-green-600 hover:underline font-medium">
                  View All Servers →
                </Link>
              </section>
            )}

            {/* Recent Alerts - DevOps Only */}
            {isDevOpsRole && notifications.length > 0 && (
              <section className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                  Recent Alerts
                </h3>
                <div className="space-y-3">
                  {notifications.map((alert: any) => (
                    <div key={alert.id} className="flex gap-3 p-3 bg-[var(--bg-root)] rounded-lg">
                      <div className="flex-shrink-0 mt-0.5">
                        {alert.type === 'ERROR' && (
                          <svg className="w-5 h-5 text-brand-green-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        {alert.type === 'WARNING' && (
                          <svg className="w-5 h-5 text-brand-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        )}
                        {alert.type === 'SUCCESS' && (
                          <svg className="w-5 h-5 text-brand-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        {alert.type === 'INFO' && (
                          <svg className="w-5 h-5 text-brand-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-[var(--text-primary)] line-clamp-1">{alert.title}</div>
                        <div className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">{alert.message}</div>
                        <div className="text-xs text-[var(--text-tertiary)] mt-1">
                          {new Date(alert.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Support Section */}
            <section className="bg-[var(--bg-active)] border border-[var(--border-subtle)] rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-brand-green-100 flex items-center justify-center">
                  <svg className="h-5 w-5 text-brand-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Need Assistance?</h3>
                  <p className="text-xs text-[var(--text-secondary)]">24/7 Support Team</p>
                </div>
              </div>

              <div className="space-y-3">
                <a href="mailto:irumvaregisdmc@gmail.com" className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-brand-green-300 transition-colors group">
                  <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-brand-green-50 transition-colors">
                    <svg className="h-4 w-4 text-[var(--text-secondary)] group-hover:text-brand-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-[var(--text-secondary)] font-medium">Email Support</span>
                    <span className="text-sm font-semibold text-[var(--text-primary)] break-all">irumvaregisdmc@gmail.com</span>
                  </div>
                </a>

                <a href="tel:0790539402" className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-brand-green-300 transition-colors group">
                  <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-brand-green-50 transition-colors">
                    <svg className="h-4 w-4 text-[var(--text-secondary)] group-hover:text-brand-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
