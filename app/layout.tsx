import "@/app/globals.css";
import React from "react";

export const metadata = {
  title: "SiteSync (ObyektSinxron) - B2B Industrial Site Management",
  description: "Cross-lingual daily site reporting and executive dashboard for international construction projects.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
    </html>
  );
}
