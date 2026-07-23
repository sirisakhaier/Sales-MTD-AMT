import './globals.css';
import { Navbar } from '@/components/Navbar';
import React from 'react';

export const metadata = {
  title: 'Sales MTD Data Management System | Cloudflare Platform',
  description: 'Production-ready Sales MTD Data Management System built on Cloudflare Workers, Pages, D1, R2, and Access',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="glass-card border-t border-slate-800/80 py-6 mt-12 text-center text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              Sales MTD Data Management System &copy; {new Date().getFullYear()} Makro Internal
            </div>
            <div className="flex items-center space-x-4 text-slate-500 font-mono text-[11px]">
              <span>Cloudflare Pages</span>
              <span>•</span>
              <span>Cloudflare Workers</span>
              <span>•</span>
              <span>Cloudflare D1</span>
              <span>•</span>
              <span>Cloudflare R2</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
