import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RMSoft MIS - Management Information System",
  description: "Comprehensive project management system for RMSoft",
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
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
