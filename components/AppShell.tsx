"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { authService } from "@/lib/auth";
import { NotificationBell } from "./NotificationBell";
import { NotificationPermissionBanner, NotificationToggle } from "./NotificationPermission";
import { Menu, X } from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon?: React.ReactNode;
  roles?: string[];
};

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  {
    label: "Projects",
    href: "/projects",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    label: "Chat",
    href: "/chat",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    )
  },
  {
    label: "Deployments",
    href: "/projects/deployments",
    roles: ['DEVOPS', 'BOSS', 'SUPERADMIN', 'PROJECT_MANAGER'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    )
  },
  {
    label: "Reports",
    href: "/reports",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    label: "Users",
    href: "/users",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  },
  {
    label: "Servers",
    href: "/servers",
    roles: ['DEVOPS', 'BOSS', 'SUPERADMIN', 'PROJECT_MANAGER'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    )
  },
];

export function AppShell({
  title,
  subtitle,
  userName,
  userRole,
  children,
  onLogout,
}: {
  title: string;
  subtitle?: string;
  userName?: string;
  userRole?: string;
  children: React.ReactNode;
  onLogout?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

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

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="h-screen flex bg-[var(--bg-body)] text-[var(--text-primary)] overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] flex flex-col shadow-xl transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:shadow-none ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="h-16 border-b border-[var(--border-subtle)] flex items-center px-6 font-semibold text-[var(--text-primary)] tracking-tight justify-between">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-lg overflow-hidden bg-white mr-3 border border-brand-green-200 shadow-sm shrink-0">
              <Image
                src="/img/logo.png"
                alt="RMSoft logo"
                width={32}
                height={32}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div className="leading-tight">
              <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide">Management</div>
              <div className="text-sm text-[var(--text-primary)] whitespace-nowrap">Info System</div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-5 overflow-y-auto custom-scrollbar">
          <ul className="space-y-1 px-3">
            {navItems
              .filter(item => !item.roles || (userRole && item.roles.includes(userRole)))
              .map((item) => {
                let active = false;
                if (pathname === item.href) {
                  active = true;
                } else if (pathname?.startsWith(`${item.href}/`)) {
                  const moreSpecificRoute = navItems.find(
                    navItem => navItem.href !== item.href && pathname?.startsWith(navItem.href)
                  );
                  active = !moreSpecificRoute;
                }

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${active
                        ? "bg-brand-green-50 text-brand-green-700 shadow-sm ring-1 ring-brand-green-200"
                        : "text-[var(--text-secondary)] hover:bg-gray-50 hover:text-gray-900"
                        }`}
                    >
                      <span className={`mr-3 ${active ? "text-brand-green-600" : "text-gray-400 group-hover:text-gray-500"}`}>
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen w-full relative">
        <header className="h-16 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md bg-white/80 supports-[backdrop-filter]:bg-white/60">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="hidden sm:block text-sm text-[var(--text-secondary)] truncate">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 pl-3 relative" ref={menuRef}>
            <NotificationBell />
            <div className="h-8 w-px bg-gray-200 mx-1 hidden sm:block" />
            <button
              onClick={() => setProfileMenuOpen((o) => !o)}
              className="flex items-center gap-3 rounded-full py-1 hover:bg-gray-50 transition-all pl-1 pr-2 border border-transparent hover:border-gray-200"
            >
              <div className="text-right leading-tight hidden lg:block">
                <div className="text-sm font-semibold text-[var(--text-primary)]">{userName || "User"}</div>
                <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide">{userRole || "Member"}</div>
              </div>
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-green-100 to-brand-green-200 flex items-center justify-center text-brand-green-800 font-bold shadow-sm ring-2 ring-white">
                {userName ? userName[0]?.toUpperCase() : "U"}
              </div>
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 top-14 w-60 bg-white border border-[var(--border-subtle)] rounded-xl shadow-xl py-2 z-40 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                <div className="px-4 py-3 border-b border-gray-100 lg:hidden">
                  <p className="text-sm font-semibold text-gray-900">{userName || "User"}</p>
                  <p className="text-xs text-gray-500">{userRole || "Member"}</p>
                </div>

                <div className="py-1">
                  <Link
                    href="/users/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-green-700"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    View Profile
                  </Link>
                  <Link
                    href="/users/update-info"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-green-700"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    Update Info
                  </Link>
                  <Link
                    href="/users/change-password"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-green-700"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    Change Password
                  </Link>
                </div>

                <div className="border-t border-[var(--border-subtle)] my-1" />

                <div className="px-4 py-2">
                  <NotificationToggle />
                </div>

                <div className="border-t border-[var(--border-subtle)] my-1" />

                <div className="py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 font-medium hover:bg-red-50 flex items-center gap-2"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 py-6 overflow-y-auto custom-scrollbar bg-[var(--bg-body)]">
          <div className="mx-auto max-w-7xl animate-in fade-in duration-300">
            {children}
          </div>
        </main>
      </div>

      {/* Notification Permission Banner */}
      <NotificationPermissionBanner />
    </div>
  );
}

