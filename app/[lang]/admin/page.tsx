'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface AdminUserItem {
  id: string;
  email: string;
  fullName: string;
  username: string;
  jobTitle: string | null;
  avatarUrl: string | null;
  role: 'SYSTEM_ADMIN' | 'LOCAL_MANAGER' | 'FOREIGN_PARTNER';
  canCreateGroup: boolean;
  canAcceptDirectives: boolean;
  canSubmitReports: boolean;
  nativeLanguage: string;
  createdAt: string;
}

export default function SuperAdminPanelPage({ params }: { params: { lang: string } }) {
  const activeLang = params?.lang || 'uz';
  const { data: session, status } = useSession();

  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/v1/admin/users');
      const data = await res.json();
      if (res.ok && data.users) {
        setUsers(data.users);
      } else {
        setToastMessage({ text: `❌ ${data.error || 'Foydalanuvchilarni yuklashda xatolik'}`, isError: true });
      }
    } catch (err) {
      console.error('Fetch admin users error:', err);
      setToastMessage({ text: '❌ Tarmoq xatosi yuz berdi.', isError: true });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateUser = async (
    userId: string,
    updates: {
      role?: string;
      jobTitle?: string;
      canCreateGroup?: boolean;
      canAcceptDirectives?: boolean;
      canSubmitReports?: boolean;
    }
  ) => {
    setSavingUserId(userId);
    try {
      const res = await fetch('/api/v1/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...updates }),
      });

      const data = await res.json();
      if (res.ok && data.user) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, ...data.user } : u))
        );
        setToastMessage({ text: `✅ ${data.message}` });
      } else {
        setToastMessage({ text: `❌ ${data.error || 'Saqlashda xatolik'}`, isError: true });
      }
    } catch (err) {
      setToastMessage({ text: '❌ Serverga bog-lanishda xatosi.', isError: true });
    } finally {
      setSavingUserId(null);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.jobTitle || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === 'SYSTEM_ADMIN').length,
    managers: users.filter((u) => u.role === 'LOCAL_MANAGER').length,
    partners: users.filter((u) => u.role === 'FOREIGN_PARTNER').length,
  };

  if (status === 'loading' || isLoadingUsers) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm font-bold">Admin Panel yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Admin Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 px-6 sticky top-0 z-30 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/${activeLang}/groups`}
              className="w-10 h-10 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center font-bold text-white transition shadow-md"
            >
              ←
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>👑</span> Super Admin Panel
                </h1>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  Full Control Mode
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Barcha foydalanuvchilar rollari, guruh yaratish va Xitoylik sheriklar topshiriqlarini boshqarish markazi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold">
              <span className="text-emerald-400">● Logged in as:</span>
              <span className="text-white font-mono">{session?.user?.email || 'xab8101@gmail.com'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        {/* Toast Notification Banner */}
        {toastMessage && (
          <div
            className={`p-4 rounded-2xl border text-sm font-bold shadow-xl animate-in fade-in zoom-in duration-200 flex items-center justify-between ${
              toastMessage.isError
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-200'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
            }`}
          >
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-xs opacity-70 hover:opacity-100 uppercase"
            >
              ✕
            </button>
          </div>
        )}

        {/* Dashboard Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Jami Foydalanuvchilar
            </span>
            <span className="text-3xl font-black text-white">{stats.total}</span>
          </div>

          <div className="bg-slate-900 border border-amber-500/30 p-5 rounded-3xl shadow-lg space-y-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              👑 Super Adminlar
            </span>
            <span className="text-3xl font-black text-amber-300">{stats.admins}</span>
          </div>

          <div className="bg-slate-900 border border-sky-500/30 p-5 rounded-3xl shadow-lg space-y-1">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">
              👷‍♂️ Mahalliy Boshliqlar
            </span>
            <span className="text-3xl font-black text-sky-300">{stats.managers}</span>
          </div>

          <div className="bg-slate-900 border border-emerald-500/30 p-5 rounded-3xl shadow-lg space-y-1">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
              🇨🇳 Xorijiy Hamkorlar
            </span>
            <span className="text-3xl font-black text-emerald-300">{stats.partners}</span>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-full md:w-96 bg-slate-950 border border-slate-800 p-3 px-4 rounded-2xl">
            <span className="text-slate-400 text-lg">🔍</span>
            <input
              type="text"
              placeholder="Foydalanuvchini qidirish (ism, email, @username)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-slate-500"
            />
          </div>

          {/* Role Filter Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold overflow-x-auto w-full md:w-auto">
            {[
              { id: 'ALL', label: 'Barchasi' },
              { id: 'SYSTEM_ADMIN', label: '👑 Admin' },
              { id: 'LOCAL_MANAGER', label: '👷‍♂️ Manager' },
              { id: 'FOREIGN_PARTNER', label: '🇨🇳 Hamkor' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id)}
                className={`px-4 py-2 rounded-xl transition whitespace-nowrap ${
                  roleFilter === tab.id
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Users List Grid / Table */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span>👥</span> Foydalanuvchilar Ro-yxati ({filteredUsers.length})
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Huquqlarni o-zgartirish bo-yicha o-zgarishlar avtomatik saqlanadi
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredUsers.map((u) => {
              const isMe = u.email === session?.user?.email || u.email === 'xab8101@gmail.com';
              const isSaving = savingUserId === u.id;

              return (
                <div
                  key={u.id}
                  className={`bg-slate-900 border rounded-3xl p-5 md:p-6 shadow-xl transition flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 ${
                    isMe
                      ? 'border-amber-500/50 bg-slate-900/90 ring-1 ring-amber-500/30'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* User Profile Info */}
                  <div className="flex items-start gap-4 min-w-[280px]">
                    <div className="relative">
                      <img
                        src={u.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                        alt={u.fullName}
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-700 shadow-md"
                      />
                      {u.role === 'SYSTEM_ADMIN' && (
                        <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-950 p-1 rounded-full text-xs shadow-md" title="Super Admin">
                          👑
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-white text-base leading-tight">
                          {u.fullName || 'Ismsiz Foydalanuvchi'}
                        </h3>
                        {isMe && (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black px-2 py-0.5 rounded-full">
                            YOU (Super Admin)
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-mono text-slate-400">
                        {u.email} • {u.username || '@user'}
                      </p>

                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[11px] font-medium text-slate-400 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                          💼 {u.jobTitle || 'Industrial Specialist'}
                        </span>
                        <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                          {u.nativeLanguage.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Role Selector & Permission Toggles */}
                  <div className="w-full lg:w-auto flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                    {/* Role Selector */}
                    <div className="space-y-1 min-w-[170px]">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Tizimdagi Roli (Role)
                      </label>
                      <select
                        value={u.role}
                        disabled={isSaving}
                        onChange={(e) => handleUpdateUser(u.id, { role: e.target.value })}
                        className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer disabled:opacity-50"
                      >
                        <option value="SYSTEM_ADMIN">👑 SYSTEM_ADMIN</option>
                        <option value="LOCAL_MANAGER">👷‍♂️ LOCAL_MANAGER</option>
                        <option value="FOREIGN_PARTNER">🇨🇳 FOREIGN_PARTNER</option>
                      </select>
                    </div>

                    {/* Permissions Toggle Controls Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full sm:w-auto">
                      {/* Permission 1: Group Creation */}
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleUpdateUser(u.id, { canCreateGroup: !u.canCreateGroup })}
                        className={`p-2.5 px-3 rounded-2xl border text-xs font-bold transition flex items-center justify-between gap-3 ${
                          u.canCreateGroup
                            ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300 shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-800'
                        }`}
                      >
                        <div className="text-left">
                          <span className="block text-[11px] font-bold">🌐 Guruh Yaratish</span>
                          <span className="text-[9px] opacity-70 block font-normal">
                            {u.canCreateGroup ? 'Ruxsat berilgan' : 'Taqiqlangan'}
                          </span>
                        </div>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${
                          u.canCreateGroup ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-600'
                        }`}>
                          {u.canCreateGroup ? '✓' : '✕'}
                        </span>
                      </button>

                      {/* Permission 2: Accept Chinese Directives */}
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleUpdateUser(u.id, { canAcceptDirectives: !u.canAcceptDirectives })}
                        className={`p-2.5 px-3 rounded-2xl border text-xs font-bold transition flex items-center justify-between gap-3 ${
                          u.canAcceptDirectives
                            ? 'bg-sky-600/20 border-sky-500/50 text-sky-300 shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-800'
                        }`}
                      >
                        <div className="text-left">
                          <span className="block text-[11px] font-bold">📩 Topshiriq Qabul qilish</span>
                          <span className="text-[9px] opacity-70 block font-normal">
                            {u.canAcceptDirectives ? 'Ruxsat berilgan' : 'Taqiqlangan'}
                          </span>
                        </div>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${
                          u.canAcceptDirectives ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-600'
                        }`}>
                          {u.canAcceptDirectives ? '✓' : '✕'}
                        </span>
                      </button>

                      {/* Permission 3: Submit Reports */}
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleUpdateUser(u.id, { canSubmitReports: !u.canSubmitReports })}
                        className={`p-2.5 px-3 rounded-2xl border text-xs font-bold transition flex items-center justify-between gap-3 ${
                          u.canSubmitReports
                            ? 'bg-amber-600/20 border-amber-500/50 text-amber-300 shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-800'
                        }`}
                      >
                        <div className="text-left">
                          <span className="block text-[11px] font-bold">📋 Hisobot Topshirish</span>
                          <span className="text-[9px] opacity-70 block font-normal">
                            {u.canSubmitReports ? 'Ruxsat berilgan' : 'Taqiqlangan'}
                          </span>
                        </div>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${
                          u.canSubmitReports ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-600'
                        }`}>
                          {u.canSubmitReports ? '✓' : '✕'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredUsers.length === 0 && (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
              <span className="text-4xl block">🔍</span>
              <h3 className="text-base font-bold text-white">Hech qanday foydalanuvchi topilmadi</h3>
              <p className="text-xs text-slate-400">
                Qidiruv so'zini yoki rol bo'yicha filterni o'zgartirib ko'ring.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
