import "@/app/globals.css";
import React from "react";
import Navbar from "@/components/Navbar";
import AuthProvider from "@/components/AuthProvider";
import type { Viewport } from "next";

export const metadata = {
  title: "SiteSync (ObyektSinxron) - B2B Industrial Site Management",
  description: "Cross-lingual daily site reporting and executive dashboard for international construction projects.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SiteSync",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?w=192" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased flex flex-col selection:bg-emerald-500 selection:text-white">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
