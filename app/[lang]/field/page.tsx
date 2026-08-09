'use client';

import React, { useState, useEffect } from 'react';

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
  status: 'PENDING_ACCEPTANCE' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED';
  targetDate?: string;
  createdAt: string;
  acceptedAt?: string | null;
  uz?: { title: string; description: string };
}

export default function FieldReportForm() {
  const [lang, setLang] = useState<'uz' | 'ru'>('uz');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [weather, setWeather] = useState('WINDY');
  const [workers, setWorkers] = useState(42);
  const [tasks, setTasks] = useState('');
  const [equipment, setEquipment] = useState('');
  const [issues, setIssues] = useState('');
  const [editReason, setEditReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const [reportsList, setReportsList] = useState<ReportItem[]>([]);
  const [directivesList, setDirectivesList] = useState<DirectiveItem[]>([]);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/v1/reports');
      const data = await res.json();
      if (data.reports) {
        setReportsList(data.reports);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    }
  };

  const fetchDirectives = async () => {
    try {
      const res = await fetch('/api/v1/directives');
      const data = await res.json();
      if (data.directives) {
        setDirectivesList(data.directives);
      }
    } catch (err) {
      console.error('Error fetching directives:', err);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchDirectives();
  }, []);

  const handleAcceptDirective = async (directiveId: string, newStatus: string = 'ACCEPTED') => {
    try {
      const res = await fetch('/api/v1/directives', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directiveId, status: newStatus }),
      });
      if (res.ok) {
        setDirectivesList((prev) =>
          prev.map((d) =>
            d.id === directiveId
              ? { ...d, status: newStatus as any, acceptedAt: new Date().toISOString() }
              : d
          )
        );
      }
    } catch (err) {
      console.error('Error updating directive status:', err);
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
      const endpoint = '/api/v1/reports';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
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
            ? (lang === 'uz'
                ? '✅ Hisobot muvaffaqiyatli tahrirlandi (v2)! Investorga tahrir haqida bildirishnoma yuborildi.'
                : '✅ Отчет успешно обновлен (v2)! Инвестору отправлено уведомление.')
            : (lang === 'uz'
                ? '✅ Hisobot muvaffaqiyatli yuborildi! Tarjima jarayonda...'
                : '✅ Отчет успешно отправлен! Перевод обрабатывается...')
        );
        if (!isEditMode) {
          setTasks('');
          setEquipment('');
          setIssues('');
          setEditReason('');
        }
        fetchReports();
      } else {
        setSubmitMessage(`❌ Xatolik: ${data.error || 'Server error'}`);
      }
    } catch (err) {
      setSubmitMessage('❌ Tarmoq xatosi bo-ldi. Internetni tekshiring.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6 bg-white min-h-screen shadow-md space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">SiteSync 👷‍♂️</h1>
          <p className="text-xs text-slate-500">Dashtobod Wind Plant - Zone B</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg border text-xs font-semibold">
          <button
            type="button"
            onClick={() => setLang('uz')}
            className={`px-3 py-1 rounded-md transition ${
              lang === 'uz' ? 'bg-sky-600 text-white' : 'text-slate-600'
            }`}
          >
            UZB
          </button>
          <button
            type="button"
            onClick={() => setLang('ru')}
            className={`px-3 py-1 rounded-md transition ${
              lang === 'ru' ? 'bg-sky-600 text-white' : 'text-slate-600'
            }`}
          >
            RUS
          </button>
        </div>
      </div>

      {/* Incoming Work Directives from Foreign Partner */}
      <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-4 space-y-3">
        <div className="flex justify-between items-center border-b border-sky-200 pb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-sky-900 flex items-center gap-2">
            <span>📩</span>
            <span>{lang === 'uz' ? 'Xorijiy Hamkor Topshiriqlari' : 'Поручения инвестора (Directives)'}</span>
          </h2>
          <span className="text-[10px] font-bold bg-sky-200 text-sky-900 px-2 py-0.5 rounded-full">
            {directivesList.filter((d) => d.status === 'PENDING_ACCEPTANCE').length} {lang === 'uz' ? 'yangi' : 'новых'}
          </span>
        </div>

        <div className="space-y-2">
          {directivesList.map((dir) => (
            <div key={dir.id} className="p-3 bg-white rounded-xl border border-sky-100 shadow-sm space-y-2 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-slate-900 block">
                    {dir.uz?.title || dir.titleRaw}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    📅 {dir.targetDate || 'Shoshilinch'} | Priority: <strong className="text-amber-600">{dir.priority}</strong>
                  </span>
                </div>

                {dir.status === 'PENDING_ACCEPTANCE' ? (
                  <button
                    type="button"
                    onClick={() => handleAcceptDirective(dir.id, 'ACCEPTED')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow transition flex items-center gap-1"
                  >
                    <span>✅</span>
                    <span>{lang === 'uz' ? 'Qabul qilish' : 'Принять'}</span>
                  </button>
                ) : (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-lg flex items-center gap-1">
                    <span>✔️</span> {lang === 'uz' ? 'Qabul qilingan' : 'Принято'}
                  </span>
                )}
              </div>

              <p className="text-slate-600 leading-relaxed text-[11px]">
                {dir.uz?.description || dir.descriptionRaw}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Mode Switch: New vs Edit */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 flex items-center justify-between text-xs">
        <span className="font-bold text-amber-900">
          {lang === 'uz' ? 'Forma Rejimi:' : 'Режим:'}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => {
              setIsEditMode(false);
              setSelectedReportId(null);
            }}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              !isEditMode ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:bg-amber-100'
            }`}
          >
            {lang === 'uz' ? '➕ Yangi Hisobot' : '➕ Новый отчет'}
          </button>
          <button
            type="button"
            onClick={() => setIsEditMode(true)}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              isEditMode ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:bg-amber-100'
            }`}
          >
            {lang === 'uz' ? '✏️ Tahrirlash' : '✏️ Редактировать'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {isEditMode && (
          <div className="p-3 bg-amber-100/70 border border-amber-300 rounded-xl">
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-1">
              {lang === 'uz' ? 'Tahrirlash Sababi (Investorga ko-rinadi) *' : 'Причина редактирования *'}
            </label>
            <input
              type="text"
              required={isEditMode}
              placeholder={
                lang === 'uz'
                  ? 'Masalan: Beton hajmi ko-rsatkichiga aniqlik kiritildi'
                  : 'Например: Уточнен объем заливки бетона'
              }
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              className="w-full p-2.5 border rounded-lg bg-white text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            {lang === 'uz' ? 'Sana' : 'Дата'}
          </label>
          <input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className="w-full p-3 border rounded-xl bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            {lang === 'uz' ? 'Ob-havo Sharoiti' : 'Погодные условия'}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['SUNNY', 'WINDY', 'RAINY'].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWeather(w)}
                className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 ${
                  weather === w
                    ? 'bg-sky-50 border-sky-600 text-sky-700 ring-1 ring-sky-600'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                {w === 'SUNNY' && '☀️ Quyoshli'}
                {w === 'WINDY' && '💨 Shamolli'}
                {w === 'RAINY' && '🌧 Yag-irli'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            {lang === 'uz' ? 'Faol Ishchilar Soni' : 'Количество рабочих'}
          </label>
          <div className="flex items-center justify-between p-2 border rounded-xl bg-slate-50">
            <button
              type="button"
              onClick={() => setWorkers(Math.max(1, workers - 1))}
              className="w-12 h-12 bg-white border shadow-sm rounded-lg text-xl font-bold text-slate-700 active:bg-slate-100"
            >
              -
            </button>
            <span className="text-2xl font-black text-slate-800">{workers}</span>
            <button
              type="button"
              onClick={() => setWorkers(workers + 1)}
              className="w-12 h-12 bg-white border shadow-sm rounded-lg text-xl font-bold text-slate-700 active:bg-slate-100"
            >
              +
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            {lang === 'uz' ? 'Bugun Bajarilgan Ishlar *' : 'Выполненные работы *'}
          </label>
          <textarea
            required
            rows={3}
            placeholder={
              lang === 'uz'
                ? 'Masalan: 4-sonli turbina poydevoriga beton quyish yakunlandi...'
                : 'Например: Завершена заливка бетона под фундамент турбины №4...'
            }
            value={tasks}
            onChange={(e) => setTasks(e.target.value)}
            className="w-full p-3 border rounded-xl bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            {lang === 'uz' ? 'Kelgan Texnika va Materiallar' : 'Полученная техника и материалы'}
          </label>
          <textarea
            rows={2}
            placeholder={
              lang === 'uz'
                ? 'Masalan: 2 ta kran yetib keldi, 10 tonna sement...'
                : 'Например: Прибыли 2 крана, 10 тонн цемента...'
            }
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            className="w-full p-3 border rounded-xl bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            {lang === 'uz' ? 'Muammolar va Ushlanib Qolishlar' : 'Проблемы и задержки'}
          </label>
          <textarea
            rows={2}
            placeholder={
              lang === 'uz'
                ? 'Masalan: Shamol tezligi sababli kran ishlari to-xtatildi...'
                : 'Например: Из-за сильного ветра работы с краном приостановлены...'
            }
            value={issues}
            onChange={(e) => setIssues(e.target.value)}
            className="w-full p-3 border rounded-xl bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {submitMessage && (
          <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-medium">
            {submitMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-4 text-white font-bold rounded-xl shadow-lg transition disabled:opacity-50 text-base ${
            isEditMode ? 'bg-amber-600 hover:bg-amber-700' : 'bg-sky-600 hover:bg-sky-700'
          }`}
        >
          {isSubmitting
            ? (lang === 'uz' ? 'Yuborilmoqda...' : 'Отправка...')
            : isEditMode
            ? (lang === 'uz' ? 'TAHRIRLANIShNI SAQLASH (v2) ✏️' : 'СОХРАНИТЬ РЕДАКТИРОВАНИЕ ✏️')
            : (lang === 'uz' ? 'HISOBOTNI YUBORISH 🚀' : 'ОТПРАВИТЬ ОТЧЕТ 🚀')}
        </button>
      </form>

      {/* Submitted Reports Feed List */}
      <div className="border-t pt-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <span>📋</span>
            <span>{lang === 'uz' ? 'Yuborilgan Hisobotlar Ro-yxati' : 'Список отправленных отчетов'}</span>
          </h2>
          <span className="text-xs text-slate-400 font-bold">{reportsList.length} {lang === 'uz' ? 'ta' : 'шт.'}</span>
        </div>

        <div className="space-y-3">
          {reportsList.map((rpt) => (
            <div
              key={rpt.id}
              className={`p-4 rounded-xl border transition ${
                selectedReportId === rpt.id
                  ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">📅 {rpt.reportDate}</span>
                    {rpt.isEdited ? (
                      <span className="text-[10px] font-black bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                        v{rpt.version} REVISED
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                        v1 SUBMITTED
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    💨 {rpt.weatherCondition} | 👷 {rpt.activeWorkers} {lang === 'uz' ? 'ishchi' : 'рабочих'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectForEdit(rpt)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1"
                >
                  <span>✏️</span>
                  <span>{lang === 'uz' ? 'Tahrirlash' : 'Изменить'}</span>
                </button>
              </div>

              <p className="text-xs text-slate-700 font-medium line-clamp-2 bg-white p-2 rounded-lg border border-slate-100">
                {rpt.tasksCompletedRaw}
              </p>

              {rpt.isEdited && rpt.editReason && (
                <p className="text-[11px] text-amber-800 font-semibold mt-2 italic bg-amber-100/60 p-1.5 rounded">
                  ⚠️ {lang === 'uz' ? 'Tahrirlash sababi:' : 'Причина edit:'} {rpt.editReason}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
