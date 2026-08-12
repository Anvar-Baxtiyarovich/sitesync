'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function UserSettingsPage({ params }: { params: { lang: string } }) {
  const activeLang = params?.lang || 'uz';
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [nativeLanguage, setNativeLanguage] = useState<'uz' | 'ru' | 'en' | 'zh'>('uz');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [email, setEmail] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const presetAvatars = [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  ];

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/auth/profile');
      const data = await res.json();
      if (res.ok && data.user) {
        setFullName(data.user.fullName || session?.user?.name || '');
        setUsername(data.user.username || `@${(data.user.email || 'user').split('@')[0]}`);
        setJobTitle(data.user.jobTitle || 'Industrial Site Manager');
        setNativeLanguage(data.user.nativeLanguage || activeLang || 'uz');
        setAvatarUrl(data.user.avatarUrl || session?.user?.image || presetAvatars[0]);
        setEmail(data.user.email || session?.user?.email || '');
      } else {
        // Fallback to session values
        setFullName(session?.user?.name || '');
        setEmail(session?.user?.email || '');
        setAvatarUrl(session?.user?.image || presetAvatars[0]);
        setUsername(`@${(session?.user?.email || 'user').split('@')[0]}`);
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [session]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim()) return;

    setIsSaving(true);
    setToastMessage(null);

    const cleanUsername = username.startsWith('@') ? username : `@${username}`;

    try {
      const res = await fetch('/api/v1/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          fullName,
          username: cleanUsername,
          jobTitle,
          avatarUrl,
          nativeLanguage,
        }),
      });

      const data = await res.json();
      if (res.ok && data.user) {
        setToastMessage({ text: '✅ Profildagi o\'zgarishlar muvaffaqiyatli saqlandi!' });
        await updateSession();
        
        if (nativeLanguage !== activeLang) {
          router.push(`/${nativeLanguage}/settings`);
        }
      } else {
        setToastMessage({ text: `❌ ${data.error || 'Saqlashda xatolik yuz berdi'}`, isError: true });
      }
    } catch (err) {
      setToastMessage({ text: '❌ Server bilan bog\'lanishda xatolik yuz berdi.', isError: true });
    } finally {
      setIsSaving(false);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm font-medium">Sozlamalar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setToastMessage({ text: '❌ Rasm hajmi 5MB dan oshmasligi kerak.', isError: true });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatarUrl(event.target.result as string);
        setToastMessage({ text: '✅ Qurilmadagi rasm tanlandi! Profilni saqlang.' });
        setTimeout(() => setToastMessage(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Hidden Device File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageFileUpload}
        className="hidden"
      />

      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 px-6 sticky top-0 z-30 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/${activeLang}/groups`}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center font-bold text-white transition shadow-sm"
            >
              ←
            </Link>
            <div>
              <h1 className="text-xl font-black text-white flex items-center gap-2">
                <span>⚙️</span> Profil & Sozlamalar
              </h1>
              <p className="text-xs text-slate-400">
                Shaxsiy ma'lumotlaringiz, lavozim va interfeys tilingizni moslashtiring
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/onboarding' })}
            className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <span>🚪</span>
            <span>Chiqish (Sign Out)</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 space-y-6">
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

        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Avatar & Basic Info Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-3 flex items-center gap-2">
              <span>🖼️</span> Avatar va Profil Rasmi
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <img
                  src={avatarUrl || presetAvatars[0]}
                  alt="Profile Avatar"
                  className="w-24 h-24 rounded-3xl object-cover border-2 border-emerald-500 shadow-xl group-hover:opacity-80 transition"
                />
                <div className="absolute inset-0 bg-slate-950/60 rounded-3xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition">
                  <span>📷 O-zgartirish</span>
                </div>
              </div>

              <div className="space-y-3 flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  {/* Upload from Device Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-lg transition flex items-center gap-2"
                  >
                    <span>📁</span>
                    <span>Qurilmadan Rasm Tanlash</span>
                  </button>

                  <span className="text-xs font-bold text-slate-400">yoki tayyor avatarlar:</span>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  {presetAvatars.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition ${
                        avatarUrl === url ? 'border-emerald-500 scale-110 shadow-lg' : 'border-slate-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Yoki rasm URL manzilini kiriting (https://...)"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full p-3 border border-slate-700 rounded-2xl bg-slate-950 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Personal Details Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-3 flex items-center gap-2">
              <span>👤</span> Shaxsiy Ma'lumotlar
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  To'liq Ism va Familiya *
                </label>
                <input
                  type="text"
                  required
                  placeholder="masalan: Anvar Khudoyberdiev"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-3.5 border border-slate-700 rounded-2xl bg-slate-950 text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Foydalanuvchi Nomi (Username) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="masalan: @anvar_mgr"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-3.5 border border-slate-700 rounded-2xl bg-slate-950 text-white font-mono font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Obyektdagi Lavozimingiz (Job Title)
                </label>
                <input
                  type="text"
                  placeholder="masalan: Site Manager (Obyekt Boshlig'i)"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full p-3.5 border border-slate-700 rounded-2xl bg-slate-950 text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Elektron Pochta (Google Email)
                </label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full p-3.5 border border-slate-800 rounded-2xl bg-slate-950/50 text-slate-400 font-mono cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Interface Language & Regional Settings */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-3 flex items-center gap-2">
              <span>🌐</span> Ona Tili va Interfeys Tili
            </h2>

            <p className="text-xs text-slate-400 leading-relaxed">
              SiteSync AI avtomatik ravishda barcha chatlar, topshiriqlar va hisobotlarni siz tanlagan shu ona tiliga tarjima qilib beradi:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {[
                { code: 'uz', flag: '🇺🇿', label: "O'zbekcha" },
                { code: 'ru', flag: '🇷🇺', label: 'Русский' },
                { code: 'en', flag: '🇬🇧', label: 'English' },
                { code: 'zh', flag: '🇨🇳', label: '中文 (Simplified)' },
              ].map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setNativeLanguage(item.code as any)}
                  className={`p-4 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
                    nativeLanguage === item.code
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="text-2xl">{item.flag}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-2xl shadow-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>💾</span>
              <span>{isSaving ? 'Saqlanmoqda...' : 'O\'zgarishlarni Saqlash'}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
