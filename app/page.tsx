import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-900 text-white">
      <div className="max-w-3xl text-center space-y-6">
        <div className="inline-block bg-sky-500/10 text-sky-400 px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide border border-sky-500/20">
          SiteSync (ObyektSinxron) MVP
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          Bridge Language Barriers in Industrial Construction Sites
        </h1>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto">
          Automated multi-lingual daily site logs connecting local site managers in Uzbekistan with foreign investors across China, Europe, and Asia.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8 max-w-lg mx-auto">
          <Link
            href="/uz/field"
            className="flex flex-col items-center justify-center p-6 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition shadow-lg"
          >
            <span className="text-2xl mb-2">📲</span>
            <span className="text-lg font-bold text-sky-400">Local Site Manager</span>
            <span className="text-xs text-slate-400 mt-1">Submit Daily Report (Uzbek / Russian)</span>
          </Link>

          <Link
            href="/zh/dashboard"
            className="flex flex-col items-center justify-center p-6 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition shadow-lg"
          >
            <span className="text-2xl mb-2">📊</span>
            <span className="text-lg font-bold text-emerald-400">Foreign Partner</span>
            <span className="text-xs text-slate-400 mt-1">Executive View (Chinese / English)</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
