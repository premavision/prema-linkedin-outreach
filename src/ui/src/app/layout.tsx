import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Link from "next/link";
import { ScanFace } from "lucide-react";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Prema LinkedIn Outreach",
  description: "Automated LinkedIn outreach with human control",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-slate-100 text-slate-900 antialiased`}
      >
        <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-100">
          <nav className="border-b border-white/60 bg-white/90 backdrop-blur px-8 py-5 shadow-lg shadow-slate-200/60">
            <div className="mx-auto flex max-w-7xl items-center justify-between">
              <Link href="/" className="flex items-center gap-3 text-xl font-bold text-slate-900 hover:opacity-80">
                <ScanFace className="h-8 w-8 text-blue-600" />
                <span>Prema Outreach</span>
              </Link>
              <div className="flex gap-6 text-sm font-medium text-slate-600">
                <Link href="/" className="hover:text-blue-600 transition-colors">Dashboard</Link>
                <Link href="/export" className="hover:text-blue-600 transition-colors">Export</Link>
              </div>
            </div>
          </nav>
          <main className="mx-auto max-w-7xl px-6 py-10 lg:px-10 lg:py-14">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
