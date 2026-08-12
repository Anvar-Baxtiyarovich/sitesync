'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname() || '/';
  const { data: session } = useSession();

  const isSuperAdmin = session?.user?.role === 'SYSTEM_ADMIN' || session?.user?.email === 'xab8101@gmail.com';

  // Extract language from pathname e.g. /uz/groups -> uz
  const langMatch = pathname.match(/^\/(uz|ru|en|zh)/);
  const currentLang = langMatch ? langMatch[1] : 'uz';

  const menuItems = [
    ...(isSuperAdmin
      ? [
          {
            href: `/${currentLang}/admin`,
            icon: '👑',
            label: {
              uz: 'Super Admin Panel',
              ru: 'Панель администратора',
              en: 'Super Admin Panel',
              zh: '超级管理员面板',
            },
            desc: 'Foydalanuvchilar va ularning huquqlarini boshqarish',
            highlightAdmin: true,
          },
        ]
      : []),
    {
      href: `/${currentLang}/contacts`,
      icon: '📇',
      label: {
        uz: 'Kontaktlarim & Shaxsiy Chat',
        ru: 'Мои контакты и личные чаты',
        en: 'My Contacts & Direct Chat',
        zh: '我的联系人与私聊',
      },
      desc: 'Hamkasblar bilan bog\'lanish va 1-on-1 suhbat',
    },
    {
      href: `/${currentLang}/groups`,
      icon: '👥',
      label: {
        uz: 'Loyiha Guruhlari',
        ru: 'Группы проектов',
        en: 'Project Groups',
        zh: '项目小组',
      },
      desc: 'Barcha guruhlar va ko-p tilli chat',
    },
    {
      href: `/${currentLang}/groups?create=true`,
      icon: '➕',
      label: {
        uz: 'Yangi Guruh Yaratish',
        ru: 'Создать новую группу',
        en: 'Create New Group',
        zh: '创建新小组',
      },
      desc: 'Yangi loyiha ishchi guruhini ochish',
      highlight: true,
    },
    {
      href: `/${currentLang}/dashboard`,
      icon: '📊',
      label: {
        uz: 'Executive Dashboard (Xorijiy Hamkor)',
        ru: 'Панель инвестора (Executive)',
        en: 'Executive Dashboard',
        zh: '高管仪表板',
      },
      desc: 'Hisobotlar va tarjima qilingan tahlillar',
    },
    {
      href: `/${currentLang}/field`,
      icon: '👷‍♂️',
      label: {
        uz: 'Field Log & Topshiriqlar Inbox (Mahalliy Boshliq)',
        ru: 'Форма отчетов и Поручения',
        en: 'Field Reporting & Inbox',
        zh: '现场日志与指令',
      },
      desc: 'Kunlik hisobot yuborish va topshiriqlar',
    },
    {
      href: `/${currentLang}/settings`,
      icon: '⚙️',
      label: {
        uz: 'Profilim & Sozlamalar',
        ru: 'Мой профиль и настройки',
        en: 'My Profile & Settings',
        zh: '我的个人资料与设置',
      },
      desc: 'Ism, username, lavozim va ona tilini sozlash',
    },
    {
      href: '/',
      icon: '🏠',
      label: {
        uz: 'Portal Bosh Sahifasi',
        ru: 'Главная страница портала',
        en: 'Portal Landing Home',
        zh: '门户首页',
      },
      desc: 'SiteSync bosh sahifasi',
    },
  ];

  return (
    <>
      <nav className="bg-slate-900 border-b border-slate-800 text-white px-4 md:px-8 py-3.5 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black text-xl shadow-md group-hover:scale-105 transition">
              S
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-2">
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

          {/* Right Header Actions & Burger Button */}
          <div className="flex items-center gap-3">
            {isSuperAdmin && (
              <Link
                href={`/${currentLang}/admin`}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 font-black text-xs rounded-xl shadow-md transition"
              >
                <span>👑</span>
                <span>Admin Panel</span>
              </Link>
            )}

            {/* Quick Create Group Button */}
            <Link
              href={`/${currentLang}/groups?create=true`}
              className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              <span>➕</span>
              <span>{
                currentLang === 'ru' ? 'Новая Группа' :
                currentLang === 'en' ? 'New Group' :
                currentLang === 'zh' ? '新建小组' :
                'Yangi Guruh'
              }</span>
            </Link>

            {/* Burger Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold transition flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Toggle Navigation Menu"
            >
              <span className="text-xl">{isMenuOpen ? '✕' : '☰'}</span>
              <span className="text-xs font-bold hidden md:inline">Menyu</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Slide-out Burger Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-40 flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border-l border-slate-800 h-full p-6 space-y-6 shadow-2xl overflow-y-auto flex flex-col justify-between">
            <div className="space-y-6">
              {/* Menu Header */}
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📁</span>
                  <h2 className="text-base font-black text-white">Boshqaruv Menyusi</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 font-bold hover:bg-slate-700 hover:text-white flex items-center justify-center transition"
                >
                  ✕
                </button>
              </div>

              {/* Navigation Items List */}
              <div className="space-y-2">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href.split('?')[0]));
                  return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`p-3.5 rounded-2xl border transition flex items-start gap-3.5 group ${
                      isActive
                        ? 'bg-emerald-600/20 border-emerald-500/50 ring-1 ring-emerald-500/30'
                        : item.highlight
                        ? 'bg-emerald-600/10 border-emerald-500/30 hover:bg-emerald-600/20 text-white'
                        : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600 text-slate-200'
                    }`}
                  >
                    <span className={`text-2xl p-1 rounded-xl border ${
                      isActive ? 'bg-emerald-900/60 border-emerald-700/50' : 'bg-slate-900 border-slate-800'
                    }`}>
                      {item.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className={`font-bold text-sm block transition ${
                        isActive ? 'text-emerald-300' : 'text-white group-hover:text-emerald-400'
                      }`}>
                        {item.label[currentLang as keyof typeof item.label] || item.label.uz}
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {item.desc}
                      </span>
                    </div>
                    {isActive && (
                      <span className="shrink-0 text-[10px] font-black text-emerald-400 bg-emerald-900/40 border border-emerald-700/40 px-2 py-0.5 rounded-lg self-center">
                        FAOL
                      </span>
                    )}
                  </Link>
                  );
                })}
              </div>
            </div>

            {/* Menu Footer Info */}
            <div className="border-t border-slate-800 pt-4 space-y-2">
              <div className="p-3 bg-slate-800/50 rounded-2xl border border-slate-700/50 text-[11px] text-slate-400 flex items-center justify-between">
                <span>⚡ AI Tarjima Engine</span>
                <span className="font-bold text-emerald-400">FAOL</span>
              </div>
              <p className="text-[10px] text-slate-500 text-center">
                SiteSync (ObyektSinxron) © 2026 - B2B Industrial Management
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
