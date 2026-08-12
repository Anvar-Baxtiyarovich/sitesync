'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface GroupMembershipInfo {
  id: string;
  group: {
    id: string;
    name: string;
  };
}

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
  groupMemberships?: GroupMembershipInfo[];
}

interface AdminGroupItem {
  id: string;
  name: string;
  code: string;
  description: string | null;
  members: Array<{
    id: string;
    roleInGroup: string;
    user: {
      id: string;
      fullName: string;
      username: string;
      jobTitle: string;
    };
  }>;
}

export default function SuperAdminPanelPage({ params }: { params: { lang: string } }) {
  const activeLang = params?.lang || 'uz';
  const { data: session, status } = useSession();

  const [activeTab, setActiveTab] = useState<'USERS' | 'GROUPS' | 'CREATE_USER'>('USERS');
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [groups, setGroups] = useState<AdminGroupItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Group assignment modal state for a specific user
  const [selectedUserForGroupModal, setSelectedUserForGroupModal] = useState<AdminUserItem | null>(null);

  // Delete user confirmation state
  const [userToDelete, setUserToDelete] = useState<AdminUserItem | null>(null);

  // New User Onboarding Form State
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newRole, setNewRole] = useState<'LOCAL_MANAGER' | 'FOREIGN_PARTNER' | 'SYSTEM_ADMIN'>('LOCAL_MANAGER');
  const [newNativeLang, setNewNativeLang] = useState<'uz' | 'ru' | 'en' | 'zh'>('uz');
  const [isSubmittingNewUser, setIsSubmittingNewUser] = useState(false);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/v1/admin/users');
      const data = await res.json();
      if (res.ok && data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Fetch admin users error:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/v1/admin/groups');
      const data = await res.json();
      if (res.ok && data.groups) {
        setGroups(data.groups);
      }
    } catch (err) {
      console.error('Fetch admin groups error:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchGroups();
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
    } catch {
      setToastMessage({ text: '❌ Serverga bog\'lanishda xato.', isError: true });
    } finally {
      setSavingUserId(null);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/v1/admin/users?userId=${userId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setToastMessage({ text: '✅ Foydalanuvchi tizimdan o\'chirildi.' });
        setUserToDelete(null);
      }
    } catch {
      setToastMessage({ text: '❌ O\'chirishda xatolik yuz berdi.', isError: true });
    }
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingNewUser(true);
    try {
      const res = await fetch('/api/v1/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newFullName,
          email: newEmail,
          username: newUsername,
          jobTitle: newJobTitle,
          role: newRole,
          nativeLanguage: newNativeLang,
        }),
      });

      const data = await res.json();
      if (res.ok && data.user) {
        setToastMessage({ text: `✅ ${data.message}` });
        setNewFullName(''); setNewEmail(''); setNewUsername(''); setNewJobTitle('');
        fetchUsers();
        setActiveTab('USERS');
      } else {
        setToastMessage({ text: `❌ ${data.error || 'Xatolik'}`, isError: true });
      }
    } catch {
      setToastMessage({ text: '❌ Xatolik yuz berdi.', isError: true });
    } finally {
      setIsSubmittingNewUser(false);
    }
  };

  const handleToggleGroupMembership = async (userId: string, groupId: string, isCurrentlyMember: boolean) => {
    try {
      if (isCurrentlyMember) {
        await fetch(`/api/v1/admin/groups?userId=${userId}&groupId=${groupId}`, {
          method: 'DELETE',
        });
      } else {
        await fetch('/api/v1/admin/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, groupId }),
        });
      }
      fetchUsers();
      fetchGroups();
    } catch (err) {
      console.error('Group toggle error:', err);
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
          <p className="text-slate-400 text-sm font-bold">Super Admin Panel yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24">
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
                  Enterprise Control
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Odamlarni boshqarish, guruhlarga biriktirish/chiqarish va huquqlar markazi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('CREATE_USER')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
            >
              <span>👤+</span>
              <span>Yangi Xodim Qo'shish</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        {/* Toast Notification Banner */}
        {toastMessage && (
          <div
            className={`p-4 rounded-2xl border text-sm font-bold shadow-xl flex items-center justify-between ${
              toastMessage.isError
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-200'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
            }`}
          >
            <span>{toastMessage.text}</span>
            <button onClick={() => setToastMessage(null)} className="text-xs opacity-70 hover:opacity-100 uppercase">
              ✕
            </button>
          </div>
        )}

        {/* Dashboard Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Jami Foydalanuvchilar</span>
            <span className="text-3xl font-black text-white">{stats.total}</span>
          </div>

          <div className="bg-slate-900 border border-amber-500/30 p-5 rounded-3xl shadow-lg space-y-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">👑 Super Adminlar</span>
            <span className="text-3xl font-black text-amber-300">{stats.admins}</span>
          </div>

          <div className="bg-slate-900 border border-sky-500/30 p-5 rounded-3xl shadow-lg space-y-1">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">👷‍♂️ Mahalliy Boshliqlar</span>
            <span className="text-3xl font-black text-sky-300">{stats.managers}</span>
          </div>

          <div className="bg-slate-900 border border-emerald-500/30 p-5 rounded-3xl shadow-lg space-y-1">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">🇨🇳 Xorijiy Hamkorlar</span>
            <span className="text-3xl font-black text-emerald-300">{stats.partners}</span>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold gap-2">
          <button
            onClick={() => setActiveTab('USERS')}
            className={`flex-1 py-3 rounded-xl transition flex items-center justify-center gap-2 ${
              activeTab === 'USERS' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>👥</span><span>Foydalanuvchilar va Huquqlar</span>
          </button>

          <button
            onClick={() => setActiveTab('GROUPS')}
            className={`flex-1 py-3 rounded-xl transition flex items-center justify-center gap-2 ${
              activeTab === 'GROUPS' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📂</span><span>Loyiha Guruhlari ({groups.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('CREATE_USER')}
            className={`flex-1 py-3 rounded-xl transition flex items-center justify-center gap-2 ${
              activeTab === 'CREATE_USER' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>➕</span><span>Yangi Xodim Qo'shish</span>
          </button>
        </div>

        {/* ── TAB 1: USERS & PERMISSIONS ── */}
        {activeTab === 'USERS' && (
          <div className="space-y-4">
            {/* Search & Filter */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3 w-full md:w-96 bg-slate-950 border border-slate-800 p-3 px-4 rounded-2xl">
                <span className="text-slate-400 text-lg">🔍</span>
                <input
                  type="text"
                  placeholder="Ism, email yoki lavozim..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-slate-500"
                />
              </div>

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
                      roleFilter === tab.id ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* User Cards Grid */}
            <div className="grid grid-cols-1 gap-4">
              {filteredUsers.map((u) => {
                const isMe = u.email === session?.user?.email || u.email === 'xab8101@gmail.com';
                const isSaving = savingUserId === u.id;
                const userGroups = u.groupMemberships || [];

                return (
                  <div
                    key={u.id}
                    className={`bg-slate-900 border rounded-3xl p-5 md:p-6 shadow-xl transition flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 ${
                      isMe ? 'border-amber-500/50 ring-1 ring-amber-500/30' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Info */}
                    <div className="flex items-start gap-4 min-w-[280px]">
                      <img
                        src={u.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                        alt={u.fullName}
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-700 shadow-md shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-white text-base leading-tight">{u.fullName}</h3>
                          {isMe && (
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black px-2 py-0.5 rounded-full">
                              YOU (Super Admin)
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono text-slate-400">{u.email} • {u.username}</p>

                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          <span className="text-[11px] font-medium text-slate-400 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                            💼 {u.jobTitle || 'Specialist'}
                          </span>
                          <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                            {u.nativeLanguage.toUpperCase()}
                          </span>

                          <button
                            type="button"
                            onClick={() => setSelectedUserForGroupModal(u)}
                            className="text-[11px] font-bold bg-sky-600/20 text-sky-300 border border-sky-500/40 px-2.5 py-1 rounded-xl hover:bg-sky-600/30 transition flex items-center gap-1"
                          >
                            <span>📂</span>
                            <span>Guruhlar ({userGroups.length})</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Role & Actions */}
                    <div className="w-full lg:w-auto flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                      <div className="space-y-1 min-w-[170px]">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Roli</label>
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

                      {/* Permissions toggles */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleUpdateUser(u.id, { canCreateGroup: !u.canCreateGroup })}
                          className={`p-2.5 rounded-2xl border text-xs font-bold transition flex items-center justify-between gap-2 ${
                            u.canCreateGroup ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'
                          }`}
                        >
                          <span>🌐 Guruh</span>
                          <span>{u.canCreateGroup ? '✓' : '✕'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleUpdateUser(u.id, { canAcceptDirectives: !u.canAcceptDirectives })}
                          className={`p-2.5 rounded-2xl border text-xs font-bold transition flex items-center justify-between gap-2 ${
                            u.canAcceptDirectives ? 'bg-sky-600/20 border-sky-500/50 text-sky-300' : 'bg-slate-950 border-slate-800 text-slate-500'
                          }`}
                        >
                          <span>📩 Topshiriq</span>
                          <span>{u.canAcceptDirectives ? '✓' : '✕'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleUpdateUser(u.id, { canSubmitReports: !u.canSubmitReports })}
                          className={`p-2.5 rounded-2xl border text-xs font-bold transition flex items-center justify-between gap-2 ${
                            u.canSubmitReports ? 'bg-amber-600/20 border-amber-500/50 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-500'
                          }`}
                        >
                          <span>📋 Hisobot</span>
                          <span>{u.canSubmitReports ? '✓' : '✕'}</span>
                        </button>
                      </div>

                      {/* Delete button */}
                      {!isMe && (
                        <button
                          type="button"
                          onClick={() => setUserToDelete(u)}
                          className="p-2.5 bg-red-950/40 hover:bg-red-900/60 border border-red-700/50 text-red-300 rounded-2xl text-xs font-bold transition shrink-0"
                          title="Foydalanuvchini o'chirish"
                        >
                          🗑️ O'chirish
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 2: GROUPS MANAGEMENT ── */}
        {activeTab === 'GROUPS' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map((grp) => (
                <div key={grp.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-black text-white text-lg">{grp.name}</h3>
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-700/40 px-2 py-0.5 rounded-md">
                        Code: {grp.code}
                      </span>
                    </div>
                    <span className="text-xs font-bold bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700">
                      👥 {grp.members?.length || 0} ta a'zo
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    {grp.description || 'Loyiha guruhi'}
                  </p>

                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase text-slate-400 block tracking-wider">A'zolar Ro'yxati:</span>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {grp.members?.map((m) => (
                        <div key={m.id} className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-white">{m.user.fullName}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">{m.user.username} • {m.user.jobTitle}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleGroupMembership(m.user.id, grp.id, true)}
                            className="text-[10px] font-bold text-red-400 hover:bg-red-900/40 px-2 py-1 rounded-lg border border-red-800/40"
                          >
                            ✕ Chiqarish
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 3: CREATE NEW USER FORM ── */}
        {activeTab === 'CREATE_USER' && (
          <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span>👤+</span>
                <span>Yangi Xodimni Tizimga Kiritish</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Loyiha xodimini kiritishingiz bilan u darhol avtomatik tarjima bilan ishlay oladi.
              </p>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">To'liq Ismi *</label>
                <input
                  type="text"
                  required
                  placeholder="masalan: Alisher Qodirov"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full p-3.5 bg-slate-950 border border-slate-700 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Email Manzili *</label>
                <input
                  type="email"
                  required
                  placeholder="alisher@sitesync.io"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full p-3.5 bg-slate-950 border border-slate-700 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Username</label>
                  <input
                    type="text"
                    placeholder="@alisher_eng"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full p-3.5 bg-slate-950 border border-slate-700 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Lavozimi</label>
                  <input
                    type="text"
                    placeholder="Chief Engineer"
                    value={newJobTitle}
                    onChange={(e) => setNewJobTitle(e.target.value)}
                    className="w-full p-3.5 bg-slate-950 border border-slate-700 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Tizimdagi Roli</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full p-3.5 bg-slate-950 border border-slate-700 rounded-2xl text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="LOCAL_MANAGER">👷‍♂️ LOCAL_MANAGER</option>
                    <option value="FOREIGN_PARTNER">🇨🇳 FOREIGN_PARTNER</option>
                    <option value="SYSTEM_ADMIN">👑 SYSTEM_ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Ona Tili</label>
                  <select
                    value={newNativeLang}
                    onChange={(e) => setNewNativeLang(e.target.value as any)}
                    className="w-full p-3.5 bg-slate-950 border border-slate-700 rounded-2xl text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="uz">🇺🇿 O'zbek tili</option>
                    <option value="ru">🇷🇺 Rus tili</option>
                    <option value="en">🇬🇧 Ingliz tili</option>
                    <option value="zh">🇨🇳 Xitoy tili</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingNewUser}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-xl transition disabled:opacity-50"
              >
                {isSubmittingNewUser ? 'Kiritilmoqda...' : 'XODIMNI TIZIMGA QO\'SHISH 🚀'}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Modal: Assign User to Groups */}
      {selectedUserForGroupModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-white text-base">
                  📂 {selectedUserForGroupModal.fullName} uchun guruhlar
                </h3>
                <p className="text-xs text-slate-400 font-mono">{selectedUserForGroupModal.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForGroupModal(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 font-bold hover:bg-slate-700 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {groups.map((grp) => {
                const isMember = selectedUserForGroupModal.groupMemberships?.some((gm) => gm.group.id === grp.id);

                return (
                  <div key={grp.id} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-white block">{grp.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Code: {grp.code}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleGroupMembership(selectedUserForGroupModal.id, grp.id, Boolean(isMember))}
                      className={`px-3 py-1.5 rounded-xl font-bold transition ${
                        isMember
                          ? 'bg-red-950/60 text-red-300 border border-red-800/50 hover:bg-red-900'
                          : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow'
                      }`}
                    >
                      {isMember ? '✕ Chiqarish' : '+ Qo\'shish'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete User Confirmation */}
      {userToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center">
            <span className="text-4xl block">⚠️</span>
            <h3 className="font-black text-white text-lg">Foydalanuvchini o'chirishni tasdiqlaysizmi?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong className="text-white">{userToDelete.fullName}</strong> ({userToDelete.email}) tizimdan va barcha guruhlardan butunlay o'chiriladi.
            </p>

            <div className="flex gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={() => handleDeleteUser(userToDelete.id)}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
              >
                Ha, O'chirilsin!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
