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
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Projects", href: "/projects" },
  { label: "Reports", href: "/reports" },
  { label: "Users", href: "/users" },
];

export function AppShell({
  title,
  subtitle,
  userName,
  children,
  onLogout,
}: {
  title: string;
  subtitle?: string;
  userName?: string;
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
            {navItems.map((item) => {
              const active =
                pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`mx-3 flex items-center rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors duration-150 ${active
                      ? "bg-brand-green-50 text-brand-green-700 border border-brand-green-200 shadow-inner shadow-brand-green-100"
                      : "text-[var(--text-secondary)] hover:bg-gray-50"
                      }`}
                  >
                    <span
                      className={`mr-3 inline-block h-2 w-2 rounded-full ${active ? "bg-brand-green-600" : "bg-gray-300"
                        }`}
                    />
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
                  className="w-full text-left px-4 py-2 text-sm text-brand-red-700 hover:bg-brand-red-50"
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

