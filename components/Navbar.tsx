'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function Navbar() {
  const [isChatSubmenuOpen, setIsChatSubmenuOpen] = useState(false);
  const pathname = usePathname() || '/';
  const { data: session } = useSession();

  const isSuperAdmin = session?.user?.role === 'SYSTEM_ADMIN' || session?.user?.email === 'xab8101@gmail.com';

  // Extract language from pathname e.g. /uz/groups -> uz
  const langMatch = pathname.match(/^\/(uz|ru|en|zh)/);
  const currentLang = langMatch ? langMatch[1] : 'uz';

  const isFieldActive = pathname.includes('/field');
  const isDashboardActive = pathname.includes('/dashboard');
  const isChatActive = pathname.includes('/groups') || pathname.includes('/contacts');
  const isSettingsActive = pathname.includes('/settings');
  const isAdminActive = pathname.includes('/admin');

  return (
    <>
      {/* ── Top Header Bar ── */}
      <nav className="bg-slate-900/90 border-b border-slate-800 text-white px-4 md:px-8 py-3 sticky top-0 z-40 shadow-lg backdrop-blur">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black text-lg shadow-md group-hover:scale-105 transition">
              S
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                SiteSync
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  v2.0
                </span>
              </span>
              <span className="text-[10px] text-slate-400 block -mt-1 font-medium">
                Cross-Lingual Industrial Site OS
              </span>
            </div>
          </Link>

          {/* Top Right Quick Actions */}
          <div className="flex items-center gap-3">
            {isSuperAdmin && (
              <Link
                href={`/${currentLang}/admin`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 font-bold text-xs rounded-xl shadow-md transition"
              >
                <span>👑</span>
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}

            {/* Quick Create Group Button */}
            <Link
              href={`/${currentLang}/groups?create=true`}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              <span>➕</span>
              <span className="hidden sm:inline">
                {currentLang === 'ru' ? 'Новая Группа' : currentLang === 'en' ? 'New Group' : currentLang === 'zh' ? '新建小组' : 'Yangi Guruh'}
              </span>
            </Link>

            {/* Settings Link icon */}
            <Link
              href={`/${currentLang}/settings`}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
              title="Settings"
            >
              ⚙️
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Chat Sub-menu Pop-up Drawer (When Chat Tab is Pressed) ── */}
      {isChatSubmenuOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-end justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">💬</span>
                <h3 className="font-black text-white text-base">Chat Bo-limlari</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsChatSubmenuOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 font-bold hover:bg-slate-700 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5">
              <Link
                href={`/${currentLang}/groups`}
                onClick={() => setIsChatSubmenuOpen(false)}
                className="p-3.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-2xl flex items-center justify-between group transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl p-2 bg-slate-900 rounded-xl border border-slate-700">👥</span>
                  <div>
                    <span className="font-bold text-sm text-white block group-hover:text-emerald-400 transition">
                      Loyiha Guruhlari (Group Chat)
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Barcha ko-p tilli jamoaviy chatlar
                    </span>
                  </div>
                </div>
                <span className="text-slate-400 text-sm">→</span>
              </Link>

              <Link
                href={`/${currentLang}/contacts`}
                onClick={() => setIsChatSubmenuOpen(false)}
                className="p-3.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-2xl flex items-center justify-between group transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl p-2 bg-slate-900 rounded-xl border border-slate-700">📇</span>
                  <div>
                    <span className="font-bold text-sm text-white block group-hover:text-emerald-400 transition">
                      Kontaktlar & Direct Chat (1-on-1)
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Hamkasblar bilan shaxsiy suhbat
                    </span>
                  </div>
                </div>
                <span className="text-slate-400 text-sm">→</span>
              </Link>

              <Link
                href={`/${currentLang}/groups?create=true`}
                onClick={() => setIsChatSubmenuOpen(false)}
                className="p-3.5 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-700/50 rounded-2xl flex items-center justify-between group transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl p-2 bg-emerald-900/60 rounded-xl border border-emerald-700">➕</span>
                  <div>
                    <span className="font-bold text-sm text-emerald-300 block">
                      Yangi Guruh Yaratish
                    </span>
                    <span className="text-[11px] text-emerald-400/80 block">
                      Yangi loyiha ishchi guruhini ochish
                    </span>
                  </div>
                </div>
                <span className="text-emerald-400 text-sm">→</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Fixed Bottom Mobile Dock / Navigation Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 p-2 shadow-2xl">
        <div className="max-w-md mx-auto grid grid-cols-5 gap-1 text-center">

          {/* 1. Field Log */}
          <Link
            href={`/${currentLang}/field`}
            className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition ${
              isFieldActive
                ? 'bg-sky-600/20 text-sky-400 border border-sky-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span className="text-xl">👷‍♂️</span>
            <span className="text-[10px] font-bold mt-0.5 truncate w-full">Maydon</span>
          </Link>

          {/* 2. Chat (Opens Submenu) */}
          <button
            type="button"
            onClick={() => setIsChatSubmenuOpen(!isChatSubmenuOpen)}
            className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition relative ${
              isChatActive || isChatSubmenuOpen
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span className="text-xl">💬</span>
            <span className="text-[10px] font-bold mt-0.5 truncate w-full">Chatlar</span>
            {(isChatActive || isChatSubmenuOpen) && (
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full absolute top-1.5 right-3" />
            )}
          </button>

          {/* 3. Executive Dashboard */}
          <Link
            href={`/${currentLang}/dashboard`}
            className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition ${
              isDashboardActive
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span className="text-xl">📊</span>
            <span className="text-[10px] font-bold mt-0.5 truncate w-full">Dashboard</span>
          </Link>

          {/* 4. Settings */}
          <Link
            href={`/${currentLang}/settings`}
            className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition ${
              isSettingsActive
                ? 'bg-amber-600/20 text-amber-400 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span className="text-xl">⚙️</span>
            <span className="text-[10px] font-bold mt-0.5 truncate w-full">Sozlama</span>
          </Link>

          {/* 5. Admin / Home Portal */}
          {isSuperAdmin ? (
            <Link
              href={`/${currentLang}/admin`}
              className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition ${
                isAdminActive
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span className="text-xl">👑</span>
              <span className="text-[10px] font-bold mt-0.5 truncate w-full">Admin</span>
            </Link>
          ) : (
            <Link
              href="/"
              className="py-2 px-1 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition"
            >
              <span className="text-xl">🏠</span>
              <span className="text-[10px] font-bold mt-0.5 truncate w-full">Bosh</span>
            </Link>
          )}

        </div>
      </div>
    </>
  );
}
