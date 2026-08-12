'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface ReportItem {
  id: string;
  reportDate: string;
  weatherCondition: string;
  activeWorkers: number;
  tasksCompletedRaw: string;
  equipmentReceivedRaw?: string;
  issuesEncounteredRaw?: string;
  version: number;
  isEdited: boolean;
  editReason?: string;
  status: string;
}

interface DirectiveItem {
  id: string;
  titleRaw: string;
  descriptionRaw: string;
  priority: string;
  category?: string;
  status: 'PENDING_ACCEPTANCE' | 'ACCEPTED' | 'IN_PROGRESS' | 'PENDING_APPROVAL' | 'COMPLETED' | 'REJECTED';
  progressPercent?: number;
  targetDate?: string;
  createdAt: string;
  acceptedAt?: string | null;
  completionNotes?: string;
  completionProofUrl?: string;
  rejectionReason?: string;
  approvedAt?: string | null;
  translationsJson?: Record<string, { title?: string; description?: string }>;
  uz?: { title: string; description: string };
  zh?: { title: string; description: string };
}

const WEATHER_OPTIONS = [
  { key: 'SUNNY',       icon: '☀️', uz: 'Quyoshli',  ru: 'Солнечно'  },
  { key: 'CLOUDY',      icon: '⛅', uz: 'Bulutli',   ru: 'Облачно'   },
  { key: 'WINDY',       icon: '💨', uz: 'Shamolli',  ru: 'Ветрено'   },
  { key: 'RAINY',       icon: '🌧', uz: 'Yomg\'irli', ru: 'Дождливо' },
  { key: 'SNOWY',       icon: '❄️', uz: 'Qorli',     ru: 'Снежно'    },
  { key: 'EXTREME_HEAT',icon: '🌡', uz: 'Issiq',     ru: 'Жара'      },
];

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-500/20 text-red-300 border-red-500/40',
  HIGH:     'bg-amber-500/20 text-amber-300 border-amber-500/40',
  MEDIUM:   'bg-sky-500/20 text-sky-300 border-sky-500/40',
  LOW:      'bg-slate-600/40 text-slate-300 border-slate-600',
};

export default function FieldReportForm() {
  const { data: session } = useSession();
  const canAcceptDirectives =
    session?.user?.canAcceptDirectives !== false ||
    session?.user?.role === 'SYSTEM_ADMIN' ||
    session?.user?.email === 'xab8101@gmail.com';

  const [lang, setLang]                     = useState<'uz' | 'ru'>('uz');
  const [isEditMode, setIsEditMode]         = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [reportDate, setReportDate]         = useState(new Date().toISOString().split('T')[0]);
  const [weather, setWeather]               = useState('WINDY');
  const [workers, setWorkers]               = useState(42);
  const [tasks, setTasks]                   = useState('');
  const [equipment, setEquipment]           = useState('');
  const [issues, setIssues]                 = useState('');
  const [editReason, setEditReason]         = useState('');
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [submitMessage, setSubmitMessage]   = useState<string | null>(null);
  const [reportsList, setReportsList]       = useState<ReportItem[]>([]);
  const [directivesList, setDirectivesList] = useState<DirectiveItem[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/v1/reports');
      const data = await res.json();
      if (data.reports) setReportsList(data.reports);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const fetchDirectives = async () => {
    try {
      const res = await fetch('/api/v1/directives');
      const data = await res.json();
      if (data.directives) setDirectivesList(data.directives);
    } catch (err) {
      console.error('Error fetching directives:', err);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchDirectives();
  }, []);

  const handleAcceptDirective = async (directiveId: string, newStatus: string = 'ACCEPTED') => {
    if (!canAcceptDirectives) {
      alert("❌ Sizga topshiriqlarni qabul qilish huquqi berilmagan.");
      return;
    }
    try {
      const res = await fetch('/api/v1/directives', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directiveId, status: newStatus }),
      });
      if (res.ok) {
        setDirectivesList(prev =>
          prev.map(d => d.id === directiveId ? { ...d, status: newStatus as any, acceptedAt: new Date().toISOString() } : d)
        );
      }
    } catch (err) {
      console.error('Error updating directive:', err);
    }
  };

  const handleSelectForEdit = (rpt: ReportItem) => {
    setSelectedReportId(rpt.id);
    setIsEditMode(true);
    setReportDate(rpt.reportDate ? rpt.reportDate.split('T')[0] : new Date().toISOString().split('T')[0]);
    setWeather(rpt.weatherCondition || 'WINDY');
    setWorkers(rpt.activeWorkers || 42);
    setTasks(rpt.tasksCompletedRaw || '');
    setEquipment(rpt.equipmentReceivedRaw || '');
    setIssues(rpt.issuesEncounteredRaw || '');
    setEditReason(rpt.editReason || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);
    try {
      const method = isEditMode ? 'PUT' : 'POST';
      const res = await fetch('/api/v1/reports', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: selectedReportId,
          sourceLanguage: lang,
          reportDate,
          weatherCondition: weather,
          activeWorkers: workers,
          tasksCompletedRaw: tasks,
          equipmentReceivedRaw: equipment,
          issuesEncounteredRaw: issues,
          editReason: isEditMode ? editReason : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitMessage(
          isEditMode
            ? (lang === 'uz' ? '✅ Hisobot tahrirlandi (v2)! Investor xabardor qilindi.' : '✅ Отчет обновлен (v2)! Инвестор уведомлен.')
            : (lang === 'uz' ? '✅ Hisobot yuborildi! Tarjima jarayonda...' : '✅ Отчет отправлен! Перевод обрабатывается...')
        );
        if (!isEditMode) { setTasks(''); setEquipment(''); setIssues(''); setEditReason(''); }
        fetchReports();
      } else {
        setSubmitMessage(`❌ ${data.error || 'Server xatosi'}`);
      }
    } catch {
      setSubmitMessage(lang === 'uz' ? '❌ Tarmoq xatosi. Internetni tekshiring.' : '❌ Ошибка сети. Проверьте интернет.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount = directivesList.filter(d => d.status === 'PENDING_ACCEPTANCE').length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-32">

      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center font-black text-white text-base shadow">
            S
          </div>
          <div>
            <span className="text-base font-black text-white tracking-tight">SiteSync</span>
            <span className="block text-[11px] text-slate-400 -mt-0.5">
              {lang === 'uz' ? 'Maydon Hisoboti' : 'Полевой Отчет'}
            </span>
          </div>
        </div>

        {/* Lang switcher */}
        <div className="flex bg-slate-800 rounded-xl border border-slate-700 p-1 gap-1">
          {(['uz', 'ru'] as const).map(l => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                lang === l ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {l === 'uz' ? '🇺🇿 UZ' : '🇷🇺 RU'}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">

        {/* ── Directives Inbox ── */}
        {directivesList.length > 0 && (
          <section className="bg-sky-950/60 border border-sky-700/50 rounded-2xl overflow-hidden shadow-xl">
            <div className="flex justify-between items-center px-4 py-3 border-b border-sky-700/40">
              <div className="flex items-center gap-2">
                <span className="text-lg">📩</span>
                <span className="font-bold text-sm text-sky-100">
                  {lang === 'uz' ? 'Xorijiy Hamkor Topshiriqlari (Work Directives)' : 'Поручения инвестора'}
                </span>
              </div>
              {pendingCount > 0 && (
                <span className="text-xs font-black bg-red-500 text-white px-2.5 py-1 rounded-full animate-pulse">
                  {pendingCount} {lang === 'uz' ? 'yangi' : 'новых'}
                </span>
              )}
            </div>

            <div className="divide-y divide-sky-800/30">
              {directivesList.map(dir => {
                const progress = dir.progressPercent ?? (dir.status === 'COMPLETED' ? 100 : dir.status === 'ACCEPTED' ? 25 : 0);
                return (
                  <div key={dir.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${PRIORITY_COLORS[dir.priority] || PRIORITY_COLORS.MEDIUM}`}>
                            {dir.priority}
                          </span>
                          {dir.category && (
                            <span className="text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded">
                              🏷️ {dir.category}
                            </span>
                          )}
                          {dir.targetDate && (
                            <span className="text-xs text-slate-400">📅 {dir.targetDate}</span>
                          )}
                        </div>

                        <p className="font-bold text-base text-white leading-snug">
                          {dir.translationsJson?.[lang]?.title || dir.uz?.title || dir.titleRaw}
                        </p>
                      </div>

                      {/* Action buttons based on Directive Lifecycle Status */}
                      {dir.status === 'PENDING_ACCEPTANCE' ? (
                        <button
                          type="button"
                          onClick={() => handleAcceptDirective(dir.id, 'ACCEPTED')}
                          className="shrink-0 px-4 py-2 bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition"
                        >
                          ✅ {lang === 'uz' ? 'Qabul qilish' : 'Принять'}
                        </button>
                      ) : dir.status === 'PENDING_APPROVAL' ? (
                        <span className="shrink-0 text-xs font-bold text-amber-300 bg-amber-950/60 border border-amber-600/50 px-3 py-1.5 rounded-xl flex items-center gap-1">
                          🔍 {lang === 'uz' ? 'Tekshiruvda (100%)' : 'На проверке (100%)'}
                        </span>
                      ) : dir.status === 'COMPLETED' ? (
                        <span className="shrink-0 text-xs font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-600/50 px-3 py-1.5 rounded-xl flex items-center gap-1">
                          ✔ {lang === 'uz' ? 'Bajarildi & Tasdiqlandi' : 'Завершено и подтверждено'}
                        </span>
                      ) : dir.status === 'REJECTED' ? (
                        <span className="shrink-0 text-xs font-bold text-red-300 bg-red-950/60 border border-red-600/50 px-3 py-1.5 rounded-xl flex items-center gap-1">
                          ⚠️ {lang === 'uz' ? 'Qayta ishlashga' : 'На доработку'}
                        </span>
                      ) : (
                        <span className="shrink-0 text-xs font-bold text-sky-300 bg-sky-950/60 border border-sky-600/50 px-3 py-1.5 rounded-xl">
                          ⚙️ {lang === 'uz' ? 'Jarayonda' : 'В процессе'}
                        </span>
                      )}
                    </div>

                    {(dir.translationsJson?.[lang]?.description || dir.uz?.description || dir.descriptionRaw) && (
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                        {dir.translationsJson?.[lang]?.description || dir.uz?.description || dir.descriptionRaw}
                      </p>
                    )}

                    {/* Progress Bar & Interactive Updates */}
                    {dir.status !== 'PENDING_ACCEPTANCE' && (
                      <div className="space-y-2 pt-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-bold">
                            📊 {lang === 'uz' ? 'Bajarilish ko\'rsatkichi:' : 'Прогресс:'}
                          </span>
                          <span className="font-black text-sky-400">{progress}%</span>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                          <div
                            className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        {/* Quick Progress Buttons for Local Manager */}
                        {dir.status !== 'COMPLETED' && dir.status !== 'PENDING_APPROVAL' && (
                          <div className="flex gap-1.5 pt-1 overflow-x-auto">
                            {[25, 50, 75, 100].map(pct => (
                              <button
                                key={pct}
                                type="button"
                                onClick={() => handleAcceptDirective(dir.id, pct === 100 ? 'PENDING_APPROVAL' : 'IN_PROGRESS')}
                                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition ${
                                  progress === pct
                                    ? 'bg-sky-600 text-white border-sky-500'
                                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                                }`}
                              >
                                {pct === 100 ? (lang === 'uz' ? '🎯 100% (Topshirish)' : '🎯 100% (Сдать)') : `${pct}%`}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Proof Notes / Rejection Reason display */}
                        {dir.completionNotes && (
                          <div className="p-2.5 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-xs text-emerald-200">
                            📝 <strong>{lang === 'uz' ? 'Ishchi hisoboti:' : 'Отчет:'}</strong> {dir.completionNotes}
                          </div>
                        )}

                        {dir.rejectionReason && (
                          <div className="p-2.5 bg-red-950/40 border border-red-700/40 rounded-xl text-xs text-red-200">
                            ⚠️ <strong>{lang === 'uz' ? 'E\'tiroz:' : 'Замечание:'}</strong> {dir.rejectionReason}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Mode toggle ── */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-1.5 flex gap-1.5">
          <button
            type="button"
            onClick={() => { setIsEditMode(false); setSelectedReportId(null); }}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${
              !isEditMode ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            ➕ {lang === 'uz' ? 'Yangi Hisobot' : 'Новый отчет'}
          </button>
          <button
            type="button"
            onClick={() => setIsEditMode(true)}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${
              isEditMode ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            ✏️ {lang === 'uz' ? 'Tahrirlash' : 'Редактировать'}
          </button>
        </div>

        {/* ── Main Form ── */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Edit reason */}
          {isEditMode && (
            <div className="bg-amber-950/50 border border-amber-600/40 rounded-2xl p-4 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-300">
                ⚠️ {lang === 'uz' ? 'Tahrirlash sababi (Investorga ko\'rinadi) *' : 'Причина редактирования *'}
              </label>
              <input
                type="text"
                required={isEditMode}
                placeholder={lang === 'uz' ? 'Masalan: Beton hajmiga aniqlik kiritildi' : 'Например: Уточнен объем заливки'}
                value={editReason}
                onChange={e => setEditReason(e.target.value)}
                className="w-full p-3.5 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-500"
              />
            </div>
          )}

          {/* Date */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              📅 {lang === 'uz' ? 'Sana' : 'Дата'}
            </label>
            <input
              type="date"
              value={reportDate}
              onChange={e => setReportDate(e.target.value)}
              className="w-full p-3.5 bg-slate-900 border border-slate-600 rounded-xl text-white text-base font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Weather — 6 options, 3 columns, large touch targets */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              🌤 {lang === 'uz' ? 'Ob-havo Sharoiti' : 'Погодные условия'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {WEATHER_OPTIONS.map(w => (
                <button
                  key={w.key}
                  type="button"
                  onClick={() => setWeather(w.key)}
                  className={`py-3.5 rounded-xl border text-sm font-bold transition flex flex-col items-center gap-1 ${
                    weather === w.key
                      ? 'bg-sky-600/30 border-sky-500 text-sky-200 ring-2 ring-sky-500/40'
                      : 'bg-slate-900/60 border-slate-700 text-slate-400 active:bg-slate-700'
                  }`}
                >
                  <span className="text-xl">{w.icon}</span>
                  <span className="text-xs">{lang === 'uz' ? w.uz : w.ru}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Workers count — large touch targets */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              👷 {lang === 'uz' ? 'Faol Ishchilar Soni' : 'Количество рабочих'}
            </label>
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setWorkers(Math.max(1, workers - 1))}
                className="w-16 h-16 bg-slate-700 active:bg-slate-600 border border-slate-600 rounded-2xl text-3xl font-bold text-white shadow-lg transition"
              >
                −
              </button>
              <div className="flex-1 text-center">
                <span className="text-5xl font-black text-white">{workers}</span>
                <span className="block text-xs text-slate-400 mt-1">{lang === 'uz' ? 'kishi' : 'рабочих'}</span>
              </div>
              <button
                type="button"
                onClick={() => setWorkers(workers + 1)}
                className="w-16 h-16 bg-sky-700 active:bg-sky-600 border border-sky-600 rounded-2xl text-3xl font-bold text-white shadow-lg transition"
              >
                +
              </button>
            </div>
          </div>

          {/* Tasks */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              ✅ {lang === 'uz' ? 'Bugun Bajarilgan Ishlar *' : 'Выполненные работы *'}
            </label>
            <textarea
              required
              rows={4}
              placeholder={
                lang === 'uz'
                  ? 'Masalan: 4-turbina poydevori to\'liq betonlab bo\'lindi...'
                  : 'Например: Завершена заливка фундамента турбины №4...'
              }
              value={tasks}
              onChange={e => setTasks(e.target.value)}
              className="w-full p-3.5 bg-slate-900 border border-slate-600 rounded-xl text-white text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder-slate-500 resize-none"
            />
          </div>

          {/* Equipment */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              🚚 {lang === 'uz' ? 'Kelgan Texnika va Materiallar' : 'Полученная техника и материалы'}
            </label>
            <textarea
              rows={3}
              placeholder={
                lang === 'uz'
                  ? 'Masalan: 10 tonna sement, 2 ta kran...'
                  : 'Например: 10 тонн цемента, 2 крана...'
              }
              value={equipment}
              onChange={e => setEquipment(e.target.value)}
              className="w-full p-3.5 bg-slate-900 border border-slate-600 rounded-xl text-white text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder-slate-500 resize-none"
            />
          </div>

          {/* Issues */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400">
              ⚠️ {lang === 'uz' ? 'Muammolar va Kechikishlar' : 'Проблемы и задержки'}
            </label>
            <textarea
              rows={3}
              placeholder={
                lang === 'uz'
                  ? 'Masalan: Shamol tufayli kran ishlari to\'xtatildi...'
                  : 'Например: Из-за ветра краны остановлены...'
              }
              value={issues}
              onChange={e => setIssues(e.target.value)}
              className="w-full p-3.5 bg-slate-900 border border-amber-700/40 rounded-xl text-white text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-500 resize-none"
            />
          </div>

          {/* Submit message */}
          {submitMessage && (
            <div className={`p-4 rounded-2xl text-sm font-medium border ${
              submitMessage.startsWith('✅')
                ? 'bg-emerald-900/40 border-emerald-700/50 text-emerald-300'
                : 'bg-red-900/40 border-red-700/50 text-red-300'
            }`}>
              {submitMessage}
            </div>
          )}

          {/* Sticky Submit */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/95 backdrop-blur border-t border-slate-800 z-10">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 text-white font-black text-base rounded-2xl shadow-xl transition disabled:opacity-50 flex items-center justify-center gap-2 ${
                isEditMode
                  ? 'bg-amber-600 active:bg-amber-700'
                  : 'bg-sky-600 active:bg-sky-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {lang === 'uz' ? 'Yuborilmoqda...' : 'Отправка...'}
                </>
              ) : isEditMode ? (
                `✏️ ${lang === 'uz' ? 'TAHRIRLASHNI SAQLASH' : 'СОХРАНИТЬ ИЗМЕНЕНИЯ'}`
              ) : (
                `🚀 ${lang === 'uz' ? 'HISOBOTNI YUBORISH' : 'ОТПРАВИТЬ ОТЧЕТ'}`
              )}
            </button>
          </div>
        </form>

        {/* ── Reports History ── */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span>📋</span>
              <span>{lang === 'uz' ? 'Yuborilgan Hisobotlar' : 'Отправленные отчеты'}</span>
            </h2>
            <span className="text-xs text-slate-500 font-bold">{reportsList.length} ta</span>
          </div>

          {isLoadingReports ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-slate-800 rounded-2xl animate-pulse border border-slate-700" />
              ))}
            </div>
          ) : reportsList.length === 0 ? (
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center space-y-2">
              <span className="text-4xl block">📋</span>
              <p className="text-slate-400 text-sm">
                {lang === 'uz' ? 'Hali hisobot yuborilmagan' : 'Отчетов пока нет'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reportsList.map(rpt => (
                <div
                  key={rpt.id}
                  className={`p-4 rounded-2xl border transition ${
                    selectedReportId === rpt.id
                      ? 'bg-amber-950/50 border-amber-600/50 ring-2 ring-amber-500/30'
                      : 'bg-slate-800 border-slate-700 active:border-slate-600'
                  }`}
                >
                  <div className="flex justify-between items-start gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white">
                          📅 {rpt.reportDate?.split('T')[0] || rpt.reportDate}
                        </span>
                        {rpt.isEdited ? (
                          <span className="text-xs font-black bg-amber-700/40 text-amber-300 border border-amber-600/40 px-2 py-0.5 rounded-lg">
                            v{rpt.version} REVISED
                          </span>
                        ) : (
                          <span className="text-xs font-bold bg-slate-700/60 text-slate-400 border border-slate-600/40 px-2 py-0.5 rounded-lg">
                            v1
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        💨 {rpt.weatherCondition} · 👷 {rpt.activeWorkers} {lang === 'uz' ? 'ishchi' : 'рабочих'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectForEdit(rpt)}
                      className="shrink-0 px-4 py-2.5 bg-amber-600/80 active:bg-amber-600 text-white text-sm font-bold rounded-xl transition flex items-center gap-1.5"
                    >
                      ✏️ {lang === 'uz' ? 'Tahrir' : 'Изм.'}
                    </button>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 line-clamp-2">
                    {rpt.tasksCompletedRaw}
                  </p>

                  {rpt.isEdited && rpt.editReason && (
                    <p className="text-xs text-amber-400 mt-2 italic bg-amber-950/40 p-2 rounded-lg border border-amber-800/30">
                      ⚠️ {lang === 'uz' ? 'Sabab:' : 'Причина:'} {rpt.editReason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
