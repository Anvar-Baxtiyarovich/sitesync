'use client';

import React, { useState, useEffect } from 'react';
import { generateReportPdf, ReportData } from '@/lib/generateReportPdf';

export const dynamic = 'force-dynamic';

interface ApiReport {
  id: string;
  reportDate: string;
  weatherCondition: string;
  activeWorkers: number;
  version: number;
  isEdited: boolean;
  editReason?: string;
  lastEditedAt?: string;
  tasksCompletedRaw: string;
  equipmentReceivedRaw?: string;
  issuesEncounteredRaw?: string;
  sourceLanguage: string;
  status: string;
  translationsJson?: {
    en?: { tasks?: string; equipment?: string; issues?: string };
    zh?: { tasks?: string; equipment?: string; issues?: string };
  };
  site?: { name?: string };
  author?: { fullName?: string };
}

const SITE_NAME = 'Dashtobod Wind Turbine Project - Zone B';
const MANAGER   = 'Anvar Khudoyberdiev (Site Manager)';

function toReportData(r: ApiReport, lang: 'zh' | 'en'): ReportData {
  const tr = r.translationsJson;
  return {
    date:          r.reportDate?.split('T')[0] || r.reportDate,
    site:          r.site?.name || SITE_NAME,
    manager:       r.author?.fullName || MANAGER,
    activeWorkers: r.activeWorkers,
    weather:       r.weatherCondition,
    version:       r.version,
    isEdited:      r.isEdited,
    lastEditedAt:  r.lastEditedAt ? new Date(r.lastEditedAt).toLocaleString() : undefined,
    editReason:    r.editReason,
    zh: {
      tasks:     tr?.zh?.tasks     || tr?.en?.tasks     || r.tasksCompletedRaw,
      equipment: tr?.zh?.equipment || tr?.en?.equipment || r.equipmentReceivedRaw || '—',
      issues:    tr?.zh?.issues    || tr?.en?.issues    || r.issuesEncounteredRaw || '—',
    },
    en: {
      tasks:     tr?.en?.tasks     || r.tasksCompletedRaw,
      equipment: tr?.en?.equipment || r.equipmentReceivedRaw || '—',
      issues:    tr?.en?.issues    || r.issuesEncounteredRaw || '—',
    },
  };
}

export default function ForeignPartnerDashboard() {
  const [lang, setLang]                           = useState<'zh' | 'en'>('zh');
  const [isExportingPdf, setIsExportingPdf]       = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDirectiveModalOpen, setIsDirectiveModalOpen] = useState(false);
  const [apiReports, setApiReports]               = useState<ApiReport[]>([]);
  const [selectedIndex, setSelectedIndex]         = useState(0);
  const [isLoading, setIsLoading]                 = useState(true);

  const [directiveTitle, setDirectiveTitle]         = useState('');
  const [directiveDesc, setDirectiveDesc]           = useState('');
  const [directivePriority, setDirectivePriority]   = useState('HIGH');
  const [directiveCategory, setDirectiveCategory]   = useState('CIVIL');
  const [directiveSubmitMsg, setDirectiveSubmitMsg] = useState<string | null>(null);

  // ── Fetch real reports from API ──
  const fetchReports = async () => {
    try {
      const res = await fetch('/api/v1/reports');
      const data = await res.json();
      if (data.reports && data.reports.length > 0) {
        setApiReports(data.reports);
      }
    } catch (err) {
      console.error('Fetch reports error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // 30 soniyada bir yangilanadi
    const poll = setInterval(fetchReports, 30000);
    return () => clearInterval(poll);
  }, []);

  const activeApiReport = apiReports[selectedIndex] || null;
  const activeReport    = activeApiReport ? toReportData(activeApiReport, lang) : null;

  const handleExportPdf = (report: ReportData) => {
    setIsExportingPdf(true);
    try { generateReportPdf(report, lang); }
    catch (err) { alert(lang === 'zh' ? '导出 PDF 时出错。' : 'Error generating PDF.'); }
    finally { setIsExportingPdf(false); }
  };

  const handleCreateDirective = async (e: React.FormEvent) => {
    e.preventDefault();
    setDirectiveSubmitMsg(null);
    try {
      const res = await fetch('/api/v1/directives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleRaw: directiveTitle,
          descriptionRaw: directiveDesc,
          priority: directivePriority,
          category: directiveCategory,
        }),
      });
      if (res.ok) {
        setDirectiveSubmitMsg(lang === 'zh' ? '✅ 工作指令已下发！' : '✅ Directive issued successfully!');
        setDirectiveTitle(''); setDirectiveDesc('');
        setTimeout(() => setIsDirectiveModalOpen(false), 1500);
      }
    } catch { setDirectiveSubmitMsg('❌ Error.'); }
  };

  const handleCopyWeChat = (report: ReportData) => {
    const text = `📌 【SiteSync 每日现场报告】
📅 ${report.date} | 👷 ${report.activeWorkers}名 | 🌤 ${report.weather}
${report.isEdited ? `⚠️ v${report.version} REVISED: ${report.editReason}` : ''}

✅ ${report[lang].tasks}
🚚 ${report[lang].equipment}
⚠️ ${report[lang].issues}`;
    navigator.clipboard.writeText(text);
    alert(lang === 'zh' ? '已复制！' : 'Copied!');
  };

  // ── Skeleton loader ──
  const Skeleton = ({ className }: { className?: string }) => (
    <div className={`bg-slate-700/50 rounded-xl animate-pulse ${className}`} />
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 space-y-5">

      {/* ── Header ── */}
      <header className="bg-slate-800/80 border border-slate-700/60 px-5 py-4 rounded-2xl shadow-xl backdrop-blur flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-black text-white shadow">S</div>
              <h1 className="text-xl font-black text-white">SiteSync</h1>
            </div>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full">
              Executive View
            </span>
            {activeReport?.isEdited && (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black px-2.5 py-1 rounded-full">
                ⚠️ v{activeReport.version} REVISED
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">{SITE_NAME}</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-slate-900/80 border border-slate-700 p-1 rounded-xl flex text-xs font-bold">
            {(['zh', 'en'] as const).map(l => (
              <button key={l} onClick={() => setLang(l)}
                className={`px-3 py-1.5 rounded-lg transition ${lang === l ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                {l === 'zh' ? '🇨🇳 中文' : '🇬🇧 English'}
              </button>
            ))}
          </div>

          <button onClick={() => setIsDirectiveModalOpen(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2">
            <span>📝</span><span>{lang === 'zh' ? '下发工作指令' : 'Issue Directive'}</span>
          </button>

          <a href="/api/v1/export/excel" download
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 border border-emerald-600 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2">
            <span>📊</span><span>{lang === 'zh' ? '导出 Excel' : 'Export Excel'}</span>
          </a>

          {activeReport && (
            <button onClick={() => handleExportPdf(activeReport)} disabled={isExportingPdf}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2 disabled:opacity-50">
              <span>📄</span><span>{isExportingPdf ? '...' : (lang === 'zh' ? '导出 PDF' : 'Export PDF')}</span>
            </button>
          )}

          {activeReport && (
            <button onClick={() => handleCopyWeChat(activeReport)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2">
              <span>💬</span><span>{lang === 'zh' ? '复制微信' : 'Copy WeChat'}</span>
            </button>
          )}
        </div>
      </header>

      {/* ── Reports list ── */}
      <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-2xl shadow backdrop-blur space-y-3">
        <div className="flex justify-between items-center border-b border-slate-700/60 pb-2">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span>📚</span>
            <span>{lang === 'zh' ? '历史现场日报' : 'Historical Reports'}</span>
          </h2>
          <div className="flex items-center gap-2">
            {isLoading ? (
              <Skeleton className="w-16 h-4" />
            ) : (
              <span className="text-xs font-bold text-slate-400">{apiReports.length} {lang === 'zh' ? '份' : 'reports'}</span>
            )}
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Live" />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : apiReports.length === 0 ? (
          <div className="py-8 text-center">
            <span className="text-4xl block mb-2">📋</span>
            <p className="text-slate-400 text-sm">{lang === 'zh' ? '暂无报告' : 'No reports yet'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {apiReports.map((rpt, i) => {
              const rd = toReportData(rpt, lang);
              return (
                <button key={rpt.id} type="button"
                  onClick={() => { setSelectedIndex(i); setIsDetailModalOpen(true); }}
                  className={`p-3 rounded-xl border text-left transition flex justify-between items-center ${
                    selectedIndex === i
                      ? 'bg-emerald-900/40 border-emerald-600/60 ring-2 ring-emerald-500/30'
                      : 'bg-slate-900/60 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                  }`}>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">📅 {rd.date}</span>
                      {rpt.isEdited
                        ? <span className="text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">v{rpt.version} R</span>
                        : <span className="text-[10px] font-bold bg-slate-700/60 text-slate-400 px-1.5 py-0.5 rounded">v1</span>}
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{rd[lang].tasks.slice(0, 60)}...</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700 shrink-0 ml-2">
                    👁
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Revision banner ── */}
      {activeReport?.isEdited && (
        <div className="bg-amber-950/60 border border-amber-600/50 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="text-sm font-black text-amber-300">
                {lang === 'zh' ? `报告变更通知 (v${activeReport.version})` : `Revision Alert (v${activeReport.version})`}
              </h3>
              <p className="text-xs text-amber-200/80 mt-1">
                {lang === 'zh' ? `修改原因：${activeReport.editReason}` : `Reason: "${activeReport.editReason}"`}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl whitespace-nowrap">
            {lang === 'zh' ? 'AI 翻译已更新' : 'AI Translation Updated'}
          </span>
        </div>
      )}

      {/* ── Metrics ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: lang === 'zh' ? '现场人数' : 'On-Site', value: isLoading ? '—' : String(activeReport?.activeWorkers ?? '—'), unit: lang === 'zh' ? '人' : 'workers', icon: '👷', color: 'text-white' },
          { label: lang === 'zh' ? '天气' : 'Weather', value: isLoading ? '—' : (activeReport?.weather ?? '—'), icon: '🌤', color: 'text-sky-300' },
          { label: lang === 'zh' ? '报告问题' : 'Open Risks', value: isLoading ? '—' : (activeReport?.isEdited ? '1 Alert' : '0 Alerts'), icon: '⚠️', color: activeReport?.isEdited ? 'text-amber-400' : 'text-emerald-400' },
          { label: lang === 'zh' ? '翻译引擎' : 'Translation', value: lang === 'zh' ? '已同步' : 'Live', icon: '⚡', color: 'text-emerald-400' },
        ].map((c, i) => (
          <div key={i} className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-2xl shadow backdrop-blur">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">{c.icon}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{c.label}</span>
            </div>
            {isLoading ? <Skeleton className="h-7 w-3/4" /> : (
              <div className={`text-xl font-black ${c.color} truncate`}>
                {c.value}
                {'unit' in c && c.unit && <span className="text-xs font-normal text-slate-400 ml-1">{c.unit}</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Main content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Daily log */}
        <div className="lg:col-span-2 bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl shadow backdrop-blur space-y-5">
          <div className="flex justify-between items-center border-b border-slate-700/60 pb-4">
            <div>
              <h2 className="text-base font-bold text-white">
                {lang === 'zh'
                  ? `现场日报 (${activeReport?.date ?? '—'})`
                  : `Daily Log (${activeReport?.date ?? '—'})`}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{MANAGER}</p>
            </div>
            {activeReport && (
              <button onClick={() => handleExportPdf(activeReport)}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5">
                📄 {lang === 'zh' ? '导出 PDF' : 'Export'}
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[80, 60, 80].map((h, i) => <Skeleton key={i} className={`h-${h === 80 ? '24' : '16'} w-full`} />)}
            </div>
          ) : !activeReport ? (
            <div className="py-12 text-center space-y-2">
              <span className="text-4xl block">📋</span>
              <p className="text-slate-400">{lang === 'zh' ? '暂无报告数据' : 'No report data'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/50">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">✅ {lang === 'zh' ? '完成任务' : 'Tasks Completed'}</h3>
                <p className="text-slate-200 text-sm leading-relaxed">{activeReport[lang].tasks}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/50">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">🚚 {lang === 'zh' ? '设备材料' : 'Equipment'}</h3>
                <p className="text-slate-200 text-sm leading-relaxed">{activeReport[lang].equipment}</p>
              </div>
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-700/40">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">⚠️ {lang === 'zh' ? '现场问题' : 'Issues'}</h3>
                <p className="text-amber-200/90 text-sm leading-relaxed">{activeReport[lang].issues}</p>
              </div>
            </div>
          )}
        </div>

        {/* Delivery tracker sidebar */}
        <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl shadow backdrop-blur space-y-4">
          <h2 className="text-base font-bold text-white border-b border-slate-700/60 pb-3">
            {lang === 'zh' ? '风机设备交付追踪' : 'Equipment Delivery'}
          </h2>
          <ul className="space-y-3">
            {[
              { name: lang === 'zh' ? '叶片' : 'Rotor Blades', sub: 'Unit #1–#3', status: lang === 'zh' ? '已到场' : 'Delivered', row: 'bg-emerald-950/30 border-emerald-800/30', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-600/30' },
              { name: lang === 'zh' ? '主变压器' : 'Main Transformer', sub: '110kV', status: lang === 'zh' ? '运输中' : 'In Transit', row: 'bg-amber-950/30 border-amber-800/30', badge: 'bg-amber-500/20 text-amber-300 border-amber-600/30' },
              { name: lang === 'zh' ? '塔筒段' : 'Tower Sections', sub: 'Batch 2', status: lang === 'zh' ? '计划中' : 'Scheduled', row: 'bg-slate-900/40 border-slate-700/30', badge: 'bg-slate-700/60 text-slate-400 border-slate-600/30' },
            ].map((item, i) => (
              <li key={i} className={`flex justify-between items-center p-3 rounded-xl border ${item.row}`}>
                <div>
                  <p className="font-bold text-sm text-slate-200">{item.name}</p>
                  <p className="text-xs text-slate-400">{item.sub}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border ${item.badge}`}>{item.status}</span>
              </li>
            ))}
          </ul>

          {/* Live indicator */}
          <div className="mt-4 pt-4 border-t border-slate-700/60">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">{lang === 'zh' ? '数据实时更新' : 'Auto-refresh'}</span>
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {lang === 'zh' ? '每30秒' : 'Every 30s'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Detail Modal ── */}
      {isDetailModalOpen && activeReport && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-700 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-white">{lang === 'zh' ? '日报审查' : 'Report Inspection'}</h3>
                  {activeReport.isEdited && (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-2 py-0.5 rounded">v{activeReport.version} REVISED</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">📅 {activeReport.date} · 👷 {activeReport.activeWorkers} · 🌤 {activeReport.weather}</p>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 flex items-center justify-center font-bold">✕</button>
            </div>
            {activeReport.isEdited && (
              <div className="p-3 bg-amber-950/60 border border-amber-700/40 rounded-xl text-xs text-amber-200">
                ⚠️ <strong>{lang === 'zh' ? '修改原因:' : 'Revision:'}</strong> {activeReport.editReason}
              </div>
            )}
            <div className="space-y-4 text-sm">
              {[
                { icon: '✅', label: lang === 'zh' ? '完成任务' : 'Tasks', text: activeReport[lang].tasks, cls: 'bg-slate-900/60 border-slate-700/50', labelCls: 'text-slate-400' },
                { icon: '🚚', label: lang === 'zh' ? '设备' : 'Equipment', text: activeReport[lang].equipment, cls: 'bg-slate-900/60 border-slate-700/50', labelCls: 'text-slate-400' },
                { icon: '⚠️', label: lang === 'zh' ? '问题' : 'Issues', text: activeReport[lang].issues, cls: 'bg-amber-950/40 border-amber-700/40', labelCls: 'text-amber-400' },
              ].map((s, i) => (
                <div key={i} className={`p-4 rounded-2xl border ${s.cls}`}>
                  <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${s.labelCls}`}>{s.icon} {s.label}</h4>
                  <p className="text-slate-200 leading-relaxed">{s.text}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-700 pt-4">
              <button onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-xl transition">
                {lang === 'zh' ? '关闭' : 'Close'}
              </button>
              <button onClick={() => { handleExportPdf(activeReport); setIsDetailModalOpen(false); }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2">
                📄 {lang === 'zh' ? '确认并导出' : 'Approve & Export'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Directive Modal ── */}
      {isDirectiveModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                📝 {lang === 'zh' ? '下发工作指令' : 'Issue Directive'}
              </h3>
              <button onClick={() => setIsDirectiveModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 flex items-center justify-center font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateDirective} className="space-y-4">
              {[
                { label: lang === 'zh' ? '指令标题 *' : 'Title *', value: directiveTitle, onChange: (v: string) => setDirectiveTitle(v), placeholder: lang === 'zh' ? '例如: 加快5号风机安装' : 'e.g. Accelerate Turbine #5 Assembly', type: 'input' },
                { label: lang === 'zh' ? '具体说明' : 'Instructions', value: directiveDesc, onChange: (v: string) => setDirectiveDesc(v), placeholder: lang === 'zh' ? '例如: 请在周五完成吊装作业' : 'e.g. Finish lifting ops by Friday', type: 'textarea' },
              ].map((f, i) => (
                <div key={i}>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">{f.label}</label>
                  {f.type === 'textarea'
                    ? <textarea rows={3} placeholder={f.placeholder} value={f.value} onChange={e => f.onChange(e.target.value)}
                        className="w-full p-3.5 bg-slate-900 border border-slate-600 rounded-xl text-white text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-500 resize-none" />
                    : <input required type="text" placeholder={f.placeholder} value={f.value} onChange={e => f.onChange(e.target.value)}
                        className="w-full p-3.5 bg-slate-900 border border-slate-600 rounded-xl text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-500" />}
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">{lang === 'zh' ? '优先级' : 'Priority'}</label>
                  <select value={directivePriority} onChange={e => setDirectivePriority(e.target.value)}
                    className="w-full p-3.5 bg-slate-900 border border-slate-600 rounded-xl text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                    <option value="MEDIUM">MEDIUM (普通)</option>
                    <option value="HIGH">HIGH (紧急)</option>
                    <option value="CRITICAL">CRITICAL (特急)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">{lang === 'zh' ? '工程类别' : 'Category'}</label>
                  <select value={directiveCategory} onChange={e => setDirectiveCategory(e.target.value)}
                    className="w-full p-3.5 bg-slate-900 border border-slate-600 rounded-xl text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                    <option value="CIVIL">CIVIL (土建施工)</option>
                    <option value="ELECTRICAL">ELECTRICAL (电气工程)</option>
                    <option value="MECHANICAL">MECHANICAL (机械安装)</option>
                    <option value="SAFETY">SAFETY (安全检查)</option>
                    <option value="EQUIPMENT">EQUIPMENT (设备调拨)</option>
                  </select>
                </div>
              </div>
              {directiveSubmitMsg && (
                <div className={`p-3.5 rounded-xl text-sm font-bold border ${directiveSubmitMsg.startsWith('✅') ? 'bg-emerald-900/40 border-emerald-700/40 text-emerald-300' : 'bg-red-900/40 border-red-700/40 text-red-300'}`}>
                  {directiveSubmitMsg}
                </div>
              )}
              <div className="flex justify-end gap-3 border-t border-slate-700 pt-4">
                <button type="button" onClick={() => setIsDirectiveModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-sm rounded-xl transition">
                  {lang === 'zh' ? '取消' : 'Cancel'}
                </button>
                <button type="submit"
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm rounded-xl shadow-lg transition">
                  {lang === 'zh' ? '立即下发 🚀' : 'Issue 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
