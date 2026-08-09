'use client';

import React, { useState } from 'react';

export default function FieldReportForm() {
  const [lang, setLang] = useState<'uz' | 'ru'>('uz');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [weather, setWeather] = useState('WINDY');
  const [workers, setWorkers] = useState(42);
  const [tasks, setTasks] = useState('');
  const [equipment, setEquipment] = useState('');
  const [issues, setIssues] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const res = await fetch('/api/v1/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceLanguage: lang,
          reportDate,
          weatherCondition: weather,
          activeWorkers: workers,
          tasksCompletedRaw: tasks,
          equipmentReceivedRaw: equipment,
          issuesEncounteredRaw: issues,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitMessage(
          lang === 'uz'
            ? '✅ Hisobot muvaffaqiyatli yuborildi! Tarjima jarayonda...'
            : '✅ Отчет успешно отправлен! Перевод обрабатывается...'
        );
        setTasks('');
        setEquipment('');
        setIssues('');
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
    <div className="max-w-md mx-auto p-4 sm:p-6 bg-white min-h-screen shadow-md">
      <div className="flex justify-between items-center border-b pb-4 mb-4">
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

      <form onSubmit={handleSubmit} className="space-y-5">
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
          className="w-full py-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-lg transition disabled:opacity-50 text-base"
        >
          {isSubmitting
            ? lang === 'uz' ? 'Yuborilmoqda...' : 'Отправка...'
            : lang === 'uz' ? 'HISOBOTNI YUBORISH 🚀' : 'ОТПРАВИТЬ ОТЧЕТ 🚀'}
        </button>
      </form>
    </div>
  );
}
