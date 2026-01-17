"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { authService } from "@/lib/auth";
import { NotificationBell } from "./NotificationBell";
import { NotificationPermissionBanner, NotificationToggle } from "./NotificationPermission";
import { Menu, X, ChevronRight, LogOut, User as UserIcon, Settings, Shield, LayoutDashboard, Users, Heart, DollarSign, Calendar, Award, MessageSquare, FileBarChart } from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
};

const navItems: NavItem[] = [
  {
    label: "EPR Dashboard",
    href: "/epr-dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />
  },
  {
    label: "Admin Dashboard",
    href: "/admin/dashboard",
    roles: ['SUPERADMIN'],
    icon: <Shield className="w-5 h-5" />
  },
  {
    label: "Presbyteries",
    href: "/presbyteries",
    icon: <LayoutDashboard className="w-5 h-5" />
  },
  {
    label: "Parishes",
    href: "/parishes",
    icon: <Settings className="w-5 h-5" />
  },
  {
    label: "Communities",
    href: "/communities",
    icon: <Users className="w-5 h-5" />
  },
  {
    label: "Members",
    href: "/members",
    icon: <Users className="w-5 h-5" />
  },
  {
    label: "Contributions",
    href: "/contributions",
    icon: <Heart className="w-5 h-5" />
  },
  {
    label: "Expenses",
    href: "/expenses",
    icon: <DollarSign className="w-5 h-5" />
  },
  {
    label: "Events",
    href: "/events",
    icon: <Calendar className="w-5 h-5" />
  },
  {
    label: "Clergy",
    href: "/clergy",
    icon: <UserIcon className="w-5 h-5" />
  },
  {
    label: "Sacraments",
    href: "/sacraments",
    icon: <Award className="w-5 h-5" />
  },
  {
    label: "Chat",
    href: "/chat",
    icon: <MessageSquare className="w-5 h-5" />
  },
  {
    label: "Reports",
    href: "/reports",
    icon: <FileBarChart className="w-5 h-5" />
  },
  {
    label: "Users",
    href: "/users",
    roles: ['SUPERADMIN', 'CHURCH_PRESIDENT', 'CHURCH_SECRETARY'],
    icon: <UserIcon className="w-5 h-5" />
  },
  {
    label: "Audit Vault",
    href: "/admin/audit-logs",
    roles: ['SUPERADMIN', 'SYNOD_ADMIN'],
    icon: <Shield className="w-5 h-5" />
  },
  {
    label: "Settings",
    href: "/settings",
    roles: ['SUPERADMIN', 'CHURCH_PRESIDENT', 'SYNOD_ADMIN'],
    icon: <Settings className="w-5 h-5" />
  },
];

export function AppShell({
  title,
  subtitle,
  userName: initialUserName,
  userRole: initialUserRole,
  avatarUrl: initialAvatarUrl,
  children,
  onLogout,
}: {
  title: string;
  subtitle?: string;
  userName?: string;
  userRole?: string;
  avatarUrl?: string;
  children: React.ReactNode;
  onLogout?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const currentUser = authService.getUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  const userName = initialUserName || (user ? `${user.firstName} ${user.lastName}` : "User");
  const userRole = initialUserRole || user?.role || "Member";
  const avatarUrl = initialAvatarUrl || user?.avatarUrl;

  const getAttachmentUrl = (path: string | undefined) => {
    if (!path) return "";
    if (path.startsWith('http')) return path;
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").replace(/\/api\/?$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  };

  const handleLogout = React.useCallback(() => {
    setProfileMenuOpen(false);
    authService.logout();
    onLogout?.();
    router.push("/login");
  }, [onLogout, router]);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="h-screen flex bg-[#f8fafb] text-gray-900 overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/60 backdrop-blur-sm md:hidden animate-in fade-in duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 flex flex-col shadow-2xl transition-all duration-500 ease-in-out md:translate-x-0 md:static md:shadow-none ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="h-20 border-b border-gray-50 flex items-center px-8 justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#0f5132] flex items-center justify-center shadow-lg shadow-[#0f5132]/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">EPR System</div>
              <div className="text-sm font-black text-gray-900 tracking-tight">MANAGEMENT</div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-6 overflow-y-auto px-4 custom-scrollbar">
          <div className="space-y-1">
            {navItems
              .filter(item => !item.roles || (userRole && item.roles.includes(userRole)))
              .map((item) => {
                const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-bold transition-all duration-300 ${active
                      ? "bg-[#0f5132] text-white shadow-xl shadow-[#0f5132]/20"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`${active ? "text-white" : "text-gray-400 group-hover:text-[#0f5132]"} transition-colors`}>
                        {item.icon}
                      </span>
                      {item.label}
                    </div>
                    {active && <ChevronRight className="w-4 h-4 text-white/50" />}
                  </Link>
                );
              })}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-50">
          <div className="bg-gray-50 rounded-3xl p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl overflow-hidden bg-white shadow-sm ring-2 ring-white">
              {avatarUrl ? (
                <img src={getAttachmentUrl(avatarUrl)} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center font-black text-[#0f5132] bg-[#0f5132]/10 uppercase">
                  {userName ? userName[0] : "U"}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-gray-900 truncate">{userName}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase truncate">{userRole}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-xl transition-all shadow-sm"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen w-full relative overflow-hidden">
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 sm:px-10 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-3 -ml-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-2xl transition-all"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-none">
                {title}
              </h1>
              {subtitle && (
                <p className="hidden sm:block text-xs font-bold text-gray-400 uppercase tracking-widest mt-1.5">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 relative" ref={menuRef}>
            <NotificationBell />
            <div className="h-8 w-px bg-gray-100 mx-2 hidden sm:block" />

            <button
              onClick={() => setProfileMenuOpen((o) => !o)}
              className="p-1 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100"
            >
              <div className="h-10 w-10 rounded-2xl overflow-hidden shadow-sm ring-2 ring-white">
                {avatarUrl ? (
                  <img src={getAttachmentUrl(avatarUrl)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center font-black text-[#0f5132] bg-[#0f5132]/10 uppercase">
                    {userName ? userName[0] : "U"}
                  </div>
                )}
              </div>
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 top-16 w-64 bg-white border border-gray-100 rounded-[2rem] shadow-2xl py-4 z-40 animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-4 ring-gray-900/5">
                <div className="px-6 py-4 border-b border-gray-50">
                  <p className="text-sm font-black text-gray-900">{userName}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{userRole}</p>
                </div>

                <div className="p-2">
                  <Link
                    href="/users/profile"
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-[#0f5132] transition-all"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <UserIcon className="w-4 h-4 opacity-50" />
                    Account Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-[#0f5132] transition-all"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4 opacity-50" />
                    System Settings
                  </Link>
                </div>

                <div className="px-4 py-2">
                  <NotificationToggle />
                </div>

                <div className="p-2 border-t border-gray-50">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 px-6 sm:px-10 py-10 overflow-y-auto custom-scrollbar">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      <NotificationPermissionBanner />
    </div>
  );
}
