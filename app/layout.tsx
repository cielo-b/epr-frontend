import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";
import { NotificationsProvider } from "@/lib/notifications-context";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EPR Church Management System",
  description: "Official Management System for Eglise Presbyterienne au Rwanda",
  icons: {
    icon: '/img/logo.png',
    shortcut: '/img/logo.png',
    apple: '/img/logo.png',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/img/logo.png',
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={plexSans.className}>
        <ToastProvider>
          <NotificationsProvider>
            {children}
          </NotificationsProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
