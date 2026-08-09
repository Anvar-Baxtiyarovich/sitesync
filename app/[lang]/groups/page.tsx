'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface GroupMemberUser {
  id: string;
  fullName: string;
  username: string;
  jobTitle: string;
  avatarUrl: string;
  nativeLanguage: string;
}

interface GroupMemberItem {
  id: string;
  roleInGroup: string;
  user: GroupMemberUser;
}

interface ProjectGroupItem {
  id: string;
  name: string;
  code: string;
  description: string;
  members: GroupMemberItem[];
}

export default function ProjectGroupsHubPage({ params }: { params: { lang: string } }) {
  const currentLang = params?.lang || 'uz';
  const searchParams = useSearchParams();
  const shouldAutoCreate = searchParams?.get('create') === 'true';

  const [groups, setGroups] = useState<ProjectGroupItem[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(shouldAutoCreate);
  const [isJoinCodeModalOpen, setIsJoinCodeModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/v1/groups');
      const data = await res.json();
      if (data.groups) {
        setGroups(data.groups);
      }
    } catch (err) {
      console.error('Fetch groups error:', err);
    }
  };

  useEffect(() => {
    fetchGroups();
    if (shouldAutoCreate) {
      setIsCreateModalOpen(true);
    }
  }, [shouldAutoCreate]);

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;

    setMsg(null);
    const targetGroup = groups.find(
      (g) => g.code.toLowerCase() === joinCodeInput.trim().toLowerCase()
    );

    if (targetGroup) {
      setMsg(`✅ Guruh topildi! "${targetGroup.name}" guruhiga yo'naltirilasiz...`);
      setTimeout(() => {
        window.location.href = `/${currentLang}/groups/${targetGroup.id}`;
      }, 1000);
    } else {
      setMsg(`❌ "${joinCodeInput}" kodi bo'yicha guruh topilmadi.`);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      const res = await fetch('/api/v1/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroupName,
          description: newGroupDesc,
        }),
      });
      if (res.ok) {
        setMsg('✅ Loyiha guruh muvaffaqiyatli yaratildi!');
        setNewGroupName('');
        setNewGroupDesc('');
        fetchGroups();
        setTimeout(() => setIsCreateModalOpen(false), 1200);
      }
    } catch {
      setMsg('❌ Xatolik yuz berdi.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 space-y-6">
      {/* Top Header */}
      <header className="bg-slate-800/80 border border-slate-700 p-6 rounded-3xl backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white">Loyiha Guruhlari (Project Groups) 🌐</h1>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full">
              Real-time AI Cross-Lingual
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Har bir odam guruhda o-z tilida yozadi va barcha javoblar avtomatik tarjima qilinadi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/${currentLang}/contacts`}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl border border-slate-600 transition flex items-center gap-1.5"
          >
            <span>📇</span>
            <span>Kontaktlarim</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsJoinCodeModalOpen(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-600 transition flex items-center gap-1.5"
          >
            <span>🔑</span>
            <span>Guruh Kodi Bilan Qo-shilish</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
          >
            <span>➕</span>
            <span>Yangi Guruh Yaratish</span>
          </button>
        </div>
      </header>


      {/* Main Groups Directory */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Siz A-zo Bo-lgan Guruhlar ({groups.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-slate-800 border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-5 hover:border-slate-600 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      {group.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {group.description || 'Xalqaro ko-p tilli obyekt loyiha guruhi.'}
                    </p>
                  </div>
                  <span className="bg-slate-700 text-slate-300 font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg border border-slate-600">
                    KOD: {group.code}
                  </span>
                </div>

                {/* Group Members List */}
                <div className="space-y-2 border-t border-slate-700/60 pt-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Guruh A-zolari ({group.members?.length || 0} kishi):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.members?.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-700/50"
                      >
                        <img
                          src={m.user.avatarUrl}
                          alt={m.user.fullName}
                          className="w-8 h-8 rounded-full border border-slate-600 object-cover"
                        />
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-xs text-white truncate">
                              {m.user.fullName}
                            </span>
                            <span className="text-[10px] font-bold bg-slate-700 text-emerald-400 px-1 rounded">
                              {m.user.nativeLanguage.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {m.user.jobTitle}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700/60 flex justify-between items-center">
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <span>⚡</span> AI Avtomatik 4 Tilli Tarjima Faol
                </span>
                <Link
                  href={`/${currentLang}/groups/${group.id}`}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
                >
                  <span>💬</span>
                  <span>Guruh Chatiga Kirish</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Create New Group */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-700 text-slate-100">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="text-lg font-black text-white">Yangi Loyiha Guruhini Yaratish</h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-700 text-slate-300 font-bold hover:bg-slate-600 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Guruh Nomi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="masalan: Dashtobod Wind Turbine EPC Team 🌬️"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full p-3 border border-slate-600 rounded-xl bg-slate-900 text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Guruh Tavsifi
                </label>
                <textarea
                  rows={3}
                  placeholder="masalan: Shamol stansiyasi loyihasi muhandislari va investorlar chat guruhi."
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full p-3 border border-slate-600 rounded-xl bg-slate-900 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {msg && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold rounded-xl">
                  {msg}
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-700 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-xl"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition"
                >
                  Guruhni Yaratish 🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Join Group by Code */}
      {isJoinCodeModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-700 text-slate-100">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>🔑</span>
                <span>Guruh Kodi Bilan Qo-shilish</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsJoinCodeModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-700 text-slate-300 font-bold hover:bg-slate-600 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleJoinByCode} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Guruh Kodi (Group Code) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="masalan: SYNC-WIND-88"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  className="w-full p-3 border border-slate-600 rounded-xl bg-slate-900 text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center tracking-widest text-base"
                />
              </div>

              {msg && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold rounded-xl text-center">
                  {msg}
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-700 pt-4">
                <button
                  type="button"
                  onClick={() => setIsJoinCodeModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-xl"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition"
                >
                  Guruhga Kirish 🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

