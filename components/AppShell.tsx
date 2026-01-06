"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { authService } from "@/lib/auth";
import { NotificationBell } from "./NotificationBell";

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
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  const handleLogout = React.useCallback(() => {
    setMenuOpen(false);
    authService.logout();
    onLogout?.();
    router.push("/login");
  }, [onLogout, router]);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="h-screen flex bg-[var(--bg-body)] text-[var(--text-primary)]">
      <aside className="w-68 bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] flex flex-col shadow-sm sticky top-0 h-screen">
        <div className="h-16 border-b border-[var(--border-subtle)] flex items-center px-6 font-semibold text-[var(--text-primary)] tracking-tight">
          <div className="h-10 w-10 rounded-lg overflow-hidden bg-white mr-3 border border-brand-green-200 shadow-sm">
            <Image
              src="/img/logo.png"
              alt="RMSoft logo"
              width={40}
              height={40}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div className="leading-tight">
            <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">Management</div>
            <div className="text-sm text-[var(--text-primary)]">Information System</div>
          </div>
        </div>
        <nav className="flex-1 py-5">
          <ul className="space-y-1.5">
            {navItems
              .filter(item => !item.roles || (userRole && item.roles.includes(userRole)))
              .map((item) => {
                // More precise active state checking
                // For exact match or child routes, but not if a more specific route exists
                let active = false;
                if (pathname === item.href) {
                  active = true;
                } else if (pathname?.startsWith(`${item.href}/`)) {
                  // Check if there's a more specific route that matches
                  const moreSpecificRoute = navItems.find(
                    navItem => navItem.href !== item.href && pathname?.startsWith(navItem.href)
                  );
                  active = !moreSpecificRoute;
                }

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`mx-3 flex items-center rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors duration-150 ${active
                        ? "bg-brand-green-50 text-brand-green-700 border border-brand-green-200 shadow-inner shadow-brand-green-100"
                        : "text-[var(--text-secondary)] hover:bg-gray-50"
                        }`}
                    >
                      <span className="mr-3">
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

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] px-6 flex items-center justify-between sticky top-0 z-30 backdrop-blur-sm bg-[color-mix(in_srgb,var(--bg-surface) 85%,transparent)]">
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-[var(--text-secondary)]">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-3 pl-3 border-l border-[var(--border-subtle)] relative" ref={menuRef}>
            <NotificationBell />
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-3 rounded-full px-2 py-1 hover:bg-gray-100 transition"
            >
              <div className="text-right leading-tight hidden sm:block">
                <div className="text-sm font-semibold text-[var(--text-primary)]">{userName || "User"}</div>
                <div className="text-xs text-[var(--text-secondary)]">Profile</div>
              </div>
              <div className="h-10 w-10 rounded-full bg-brand-green-100 flex items-center justify-center text-brand-green-700 font-semibold shadow-inner shadow-brand-green-200/60 border border-brand-green-200">
                {userName ? userName[0]?.toUpperCase() : "U"}
              </div>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-12 w-56 bg-white border border-[var(--border-subtle)] rounded-lg shadow-lg py-2 z-40">
                <Link
                  href="/users/profile"
                  className="block px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-gray-50"
                  onClick={() => setMenuOpen(false)}
                >
                  View profile
                </Link>
                <Link
                  href="/users/update-info"
                  className="block px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-gray-50"
                  onClick={() => setMenuOpen(false)}
                >
                  Update info
                </Link>
                <Link
                  href="/users/change-password"
                  className="block px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-gray-50"
                  onClick={() => setMenuOpen(false)}
                >
                  Change password
                </Link>
                <div className="border-t border-[var(--border-subtle)] my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-brand-green-900 font-semibold hover:bg-brand-green-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 px-6 py-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

