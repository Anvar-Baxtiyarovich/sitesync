'use client';

import React, { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function UserOnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [nativeLanguage, setNativeLanguage] = useState<'uz' | 'ru' | 'en' | 'zh'>('uz');

  // Agar foydalanuvchi allaqachon login bo'lgan bo'lsa, guruhlar sahifasiga yo'naltirish
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const lang = (session.user as any).nativeLanguage || 'uz';
      router.push(`/${lang}/groups`);
    }
  }, [status, session, router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('google', {
        callbackUrl: `/${nativeLanguage}/groups`,
      });
    } catch {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm font-medium">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-8">
        {/* Logo & Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-3xl mb-1">
            🏗️
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            SiteSync
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Qurilish obyektlari uchun ko'p tilli boshqaruv tizimi.<br />
            <span className="text-emerald-400">Google hisobingiz bilan kirish — 1 soniya.</span>
          </p>
        </div>

        {/* Language selector */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block text-center">
            🌐 Ona Tilingizni Tanlang
          </span>
          <div className="grid grid-cols-4 gap-2">
            {[
              { code: 'uz', label: '🇺🇿', name: "O'zbek" },
              { code: 'ru', label: '🇷🇺', name: 'Русский' },
              { code: 'en', label: '🇬🇧', name: 'English' },
              { code: 'zh', label: '🇨🇳', name: '中文' },
            ].map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setNativeLanguage(l.code as any)}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  nativeLanguage === l.code
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-500/10'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-xl">{l.label}</span>
                <span className="text-[10px]">{l.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-transparent px-3 text-xs text-slate-500 font-medium">
              tizimga kirish
            </span>
          </div>
        </div>

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full py-4 px-5 bg-white hover:bg-slate-50 active:bg-slate-100 rounded-2xl font-bold text-slate-800 text-sm shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              <span>Google bilan bog'lanilmoqda...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Google Akkaunti Bilan Kirish</span>
            </>
          )}
        </button>

        {/* Info badges */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          {[
            { icon: '🔒', label: 'Xavfsiz' },
            { icon: '⚡', label: 'Tez kirish' },
            { icon: '🆓', label: 'Bepul' },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1 p-2 bg-white/5 rounded-xl border border-white/5">
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] text-slate-500 font-medium">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-[11px] text-slate-600 leading-relaxed">
          Tizimga kirib, siz{' '}
          <span className="text-slate-400">SiteSync foydalanish shartlari</span> bilan rozi bo'lasiz.
          <br />
          Google hisobingiz ma'lumotlari xavfsiz saqlanadi.
        </p>
      </div>
    </div>
  );
}
