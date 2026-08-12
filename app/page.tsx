import Link from "next/link";

export const metadata = {
  title: "SiteSync — Bridge Language Barriers on Construction Sites",
  description:
    "AI-powered multilingual platform for industrial construction sites. Connects Uzbek site managers with Chinese, Russian and English-speaking investors in real time.",
};

const features = [
  {
    icon: "🌐",
    title: "4-Way AI Translation",
    desc: "Every message and report is instantly translated across UZ, RU, EN, ZH — powered by NLLB-600M.",
  },
  {
    icon: "📋",
    title: "Daily Site Reports",
    desc: "Local managers submit field reports that reach foreign investors in their native language within seconds.",
  },
  {
    icon: "💬",
    title: "Multilingual Chat",
    desc: "Group and direct chats where everyone reads in their own language — no translator needed.",
  },
  {
    icon: "📎",
    title: "Blueprint Sharing",
    desc: "Attach engineering blueprints, site photos and videos directly to messages.",
  },
  {
    icon: "📝",
    title: "Work Directives",
    desc: "Foreign partners issue work directives that arrive translated to local managers in real time.",
  },
  {
    icon: "📄",
    title: "PDF Export",
    desc: "One-click professional PDF reports for board meetings and audit records.",
  },
];

const roles = [
  {
    href: "/uz/field",
    flag: "🇺🇿",
    lang: "Uzbek / Russian",
    role: "Local Site Manager",
    desc: "Submit daily field reports, accept work directives and chat with the international team.",
    color: "from-sky-600 to-blue-700",
    badge: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    badgeText: "Maydon Hisoboti",
    cta: "Open Field View →",
    icon: "📲",
  },
  {
    href: "/zh/dashboard",
    flag: "🇨🇳",
    lang: "Chinese / English",
    role: "Foreign Partner",
    desc: "Monitor live field reports, issue work directives and export PDF summaries — all in your language.",
    color: "from-emerald-600 to-teal-700",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    badgeText: "Executive View",
    cta: "Open Dashboard →",
    icon: "📊",
  },
];

const stats = [
  { value: "4", label: "Languages\nSupported" },
  { value: "<2s", label: "Translation\nSpeed" },
  { value: "600M", label: "NLLB AI\nParameters" },
  { value: "100%", label: "Self-Hosted\n& Private" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-900 text-white overflow-x-hidden">

      {/* ── Gradient Backdrop ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-sky-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">

        {/* ── Nav bar ── */}
        <nav className="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-600 flex items-center justify-center font-black text-white text-base shadow-lg">
              S
            </div>
            <span className="text-xl font-black tracking-tight">SiteSync</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-full">
              Dashtobod Technopark ✦ MVP
            </span>
            <Link href="/uz/field"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-sm rounded-xl transition backdrop-blur">
              Sign In
            </Link>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="max-w-5xl mx-auto px-6 pt-16 pb-20 text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 px-4 py-2 rounded-full text-sm font-semibold tracking-wide">
            <span className="w-2 h-2 bg-sky-400 rounded-full animate-pulse" />
            AI-Powered · Self-Hosted · Real-Time
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05]">
            Break Language Barriers
            <span className="block bg-gradient-to-r from-sky-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent mt-2">
              on Construction Sites
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            SiteSync connects local Uzbek site managers with Chinese, Russian, and
            English-speaking investors — with every word automatically translated by AI,
            in real time, in every chat and report.
          </p>

          {/* CTA Row */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link href="/uz/field"
              className="group flex items-center justify-center gap-3 px-8 py-4 bg-sky-600 hover:bg-sky-500 text-white font-black text-base rounded-2xl shadow-xl shadow-sky-900/40 transition">
              <span className="text-2xl">📲</span>
              <span>Field Manager View</span>
              <span className="group-hover:translate-x-1 transition">→</span>
            </Link>
            <Link href="/zh/dashboard"
              className="group flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base rounded-2xl shadow-xl shadow-emerald-900/40 transition">
              <span className="text-2xl">📊</span>
              <span>Partner Dashboard</span>
              <span className="group-hover:translate-x-1 transition">→</span>
            </Link>
          </div>
        </section>

        {/* ── Stats strip ── */}
        <div className="max-w-4xl mx-auto px-6 pb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <div key={i} className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl text-center backdrop-blur shadow">
                <div className="text-3xl font-black text-white mb-1">{s.value}</div>
                <div className="text-xs font-bold text-slate-400 whitespace-pre-line leading-relaxed">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Role cards ── */}
        <section className="max-w-5xl mx-auto px-6 pb-20 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black">Choose Your Role</h2>
            <p className="text-slate-400 text-sm">Two views, one platform — seamlessly connected.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roles.map((r, i) => (
              <Link key={i} href={r.href}
                className="group relative bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-3xl p-7 transition shadow-xl overflow-hidden flex flex-col gap-5">

                {/* Gradient top accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${r.color}`} />

                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{r.flag}</span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${r.badge}`}>{r.badgeText}</span>
                    </div>
                    <h3 className="text-2xl font-black text-white group-hover:text-sky-300 transition">{r.role}</h3>
                    <p className="text-xs font-bold text-slate-400">{r.lang}</p>
                  </div>
                  <span className="text-4xl">{r.icon}</span>
                </div>

                <p className="text-slate-300 text-sm leading-relaxed">{r.desc}</p>

                <div className={`flex items-center gap-2 text-sm font-black bg-gradient-to-r ${r.color} bg-clip-text text-transparent group-hover:gap-3 transition-all`}>
                  {r.cta}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section className="max-w-5xl mx-auto px-6 pb-24 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black">Everything You Need</h2>
            <p className="text-slate-400 text-sm">Built for construction sites where language is the biggest barrier.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div key={i}
                className="bg-slate-800/50 border border-slate-700/60 p-5 rounded-2xl hover:border-slate-600 hover:bg-slate-800 transition space-y-3 group shadow">
                <div className="w-12 h-12 bg-slate-900 border border-slate-700 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition shadow-inner">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm mb-1">{f.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Translation strip ── */}
        <section className="max-w-5xl mx-auto px-6 pb-24">
          <div className="bg-gradient-to-br from-slate-800 to-slate-800/80 border border-slate-700/60 rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-black">One Message, Four Languages</h2>
              <p className="text-slate-400 text-sm">Sent by a site manager in Uzbek — received in everyone's native language.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              {[
                { flag: "🇺🇿", lang: "Uzbek (Original)", text: "4-sonli turbina poydevoriga beton quyish yakunlandi.", color: "border-sky-500/40 bg-sky-900/20" },
                { flag: "🇨🇳", lang: "Chinese (AI)", text: "4号风机单元的基础混凝土浇筑已完成。", color: "border-emerald-500/40 bg-emerald-900/20" },
                { flag: "🇷🇺", lang: "Russian (AI)", text: "Заливка бетона фундамента 4-й турбины завершена.", color: "border-violet-500/40 bg-violet-900/20" },
                { flag: "🇬🇧", lang: "English (AI)", text: "Foundation concrete pour for turbine #4 is complete.", color: "border-amber-500/40 bg-amber-900/20" },
              ].map((t, i) => (
                <div key={i} className={`p-4 rounded-2xl border ${t.color} space-y-2`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{t.flag}</span>
                    <span className="text-xs font-bold text-slate-400">{t.lang}</span>
                  </div>
                  <p className="text-slate-200 text-xs leading-relaxed font-medium">"{t.text}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-slate-800 py-8 px-6 text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-600 flex items-center justify-center font-black text-white text-sm shadow">S</div>
            <span className="font-black text-white">SiteSync</span>
          </div>
          <p className="text-xs text-slate-500">
            Built for Dashtobod Technopark · Uzbekistan · {new Date().getFullYear()}
          </p>
          <p className="text-xs text-slate-600">
            Powered by NLLB-600M · Next.js · Prisma · BullMQ
          </p>
        </footer>
      </div>
    </main>
  );
}
