import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import MainNav from "@/components/main-nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Home Radar Frontend",
  description: "MVP frontend for Home Radar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <header className="app-header">
          <div className="app-shell">
            <div className="brand">Home Radar</div>
            <MainNav />
          </div>
        </header>
        <main className="app-shell page-content">{children}</main>
      </body>
    </html>
  );
}
