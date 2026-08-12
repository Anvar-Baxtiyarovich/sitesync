'use client';

import React, { useState } from 'react';
import { generateReportPdf, ReportData } from '@/lib/generateReportPdf';

export const dynamic = 'force-dynamic';

export default function ForeignPartnerDashboard() {
  const [lang, setLang]                           = useState<'zh' | 'en'>('zh');
  const [isExportingPdf, setIsExportingPdf]       = useState(false);
  const [selectedReportId, setSelectedReportId]   = useState('rpt_982347');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDirectiveModalOpen, setIsDirectiveModalOpen] = useState(false);

  const [directiveTitle, setDirectiveTitle]     = useState('');
  const [directiveDesc, setDirectiveDesc]       = useState('');
  const [directivePriority, setDirectivePriority] = useState('HIGH');
  const [directiveSubmitMsg, setDirectiveSubmitMsg] = useState<string | null>(null);

  const reportsList: ReportData[] = [
    {
      date: '2026-08-09',
      site: 'Dashtobod Wind Turbine Project - Zone B',
      manager: 'Anvar Khudoyberdiev (Site Manager)',
      activeWorkers: 42,
      weather: 'WINDY (24 km/h)',
      version: 2,
      isEdited: true,
      lastEditedAt: '2026-08-09 23:10',
      editReason: 'Corrected concrete pour volume metric & added crane operation suspension detail',
      zh: {
        tasks: '完成了4号风机单元的基础浇筑。（现场经理更新：重新核实了混凝土注入量）',
        equipment: '收到2台发电机组件和10吨水泥。',
        issues: '[高风险] 由于强风，吊车高空作业暂时暂停。',
      },
      en: {
        tasks: 'Completed foundation concrete pour for turbine unit #4. (Manager Note: Verified pour volume)',
        equipment: 'Received 2 generator components and 10 tons of cement.',
        issues: '[High Severity] Crane operations suspended due to high wind speeds.',
      },
    },
    {
      date: '2026-08-08',
      site: 'Dashtobod Wind Turbine Project - Zone B',
      manager: 'Anvar Khudoyberdiev (Site Manager)',
      activeWorkers: 38,
      weather: 'SUNNY (28°C)',
      version: 1,
      isEdited: false,
      zh: {
        tasks: '完成3号风机电气线路敷设，主变压器基础整平。',
        equipment: '收到5吨钢筋及高压电缆盘。',
        issues: '无异常延误，工程按计划推进。',
      },
      en: {
        tasks: 'Completed electrical wiring for turbine unit #3, leveled main transformer foundation.',
        equipment: 'Received 5 tons of rebar and high-voltage cable drums.',
        issues: 'No field delays. Operations running on schedule.',
      },
    },
    {
      date: '2026-08-07',
      site: 'Dashtobod Wind Turbine Project - Zone B',
      manager: 'Anvar Khudoyberdiev (Site Manager)',
      activeWorkers: 35,
      weather: 'CLEAR (26°C)',
      version: 1,
      isEdited: false,
      zh: {
        tasks: '1号和2号风机塔筒段开挖验收合格。',
        equipment: '收到第一批塔筒组件。',
        issues: '无异常。',
      },
      en: {
        tasks: 'Excavation inspection passed for tower sections of turbine #1 and #2.',
        equipment: 'Received first batch of tower section components.',
        issues: 'No issues reported.',
      },
    },
  ];

  const activeReport = reportsList.find(r => r.date === selectedReportId) || reportsList[0];

  const handleExportPdfForReport = (report: ReportData) => {
    setIsExportingPdf(true);
    try {
      generateReportPdf(report, lang);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert(lang === 'zh' ? '导出 PDF 时出错。' : 'Error generating PDF report.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleCreateDirective = async (e: React.FormEvent) => {
    e.preventDefault();
    setDirectiveSubmitMsg(null);
    try {
      const res = await fetch('/api/v1/directives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titleRaw: directiveTitle, descriptionRaw: directiveDesc, priority: directivePriority }),
      });
      if (res.ok) {
        setDirectiveSubmitMsg(
          lang === 'zh'
            ? '✅ 工作指令已下发！现场经理将收到实时翻译通知。'
            : '✅ Work directive issued! Sent to local manager inbox.'
        );
        setDirectiveTitle('');
        setDirectiveDesc('');
        setTimeout(() => setIsDirectiveModalOpen(false), 1500);
      }
    } catch {
      setDirectiveSubmitMsg('❌ Error sending directive.');
    }
  };

  const handleCopyWeChat = (report: ReportData) => {
    const text = `📌 【SiteSync 每日现场报告 / Site Daily Report ${report.isEdited ? `(v${report.version} REVISED)` : ''}】
🏢 项目: ${report.site}
📅 日期: ${report.date}
👤 现场经理: ${report.manager}
${report.isEdited ? `⚠️ 修改说明: ${report.editReason}` : ''}
🌤 天气: ${report.weather} | 👷 现场人数: ${report.activeWorkers}名

✅ ${lang === 'zh' ? '今日完成任务' : 'Tasks Completed'}:
${report[lang].tasks}

🚚 ${lang === 'zh' ? '设备/材料进场' : 'Equipment Received'}:
${report[lang].equipment}

⚠️ ${lang === 'zh' ? '现场问题/延误' : 'Issues & Delays'}:
${report[lang].issues}

🔗 PDF: https://app.sitesync.io/reports/rpt_${report.date.replace(/-/g, '')}.pdf`;

    navigator.clipboard.writeText(text);
    alert(lang === 'zh' ? '已复制微信摘要到剪贴板！' : 'WeChat Summary copied!');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 space-y-5">

      {/* ── Top Navbar ── */}
      <header className="bg-slate-800/80 border border-slate-700/60 px-5 py-4 rounded-2xl shadow-xl backdrop-blur flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-black text-white text-base shadow">
                S
              </div>
              <h1 className="text-xl font-black text-white">SiteSync</h1>
            </div>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full">
              Executive View
            </span>
            {activeReport.isEdited && (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                ⚠️ v{activeReport.version} REVISED
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">{activeReport.site}</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Lang toggle */}
          <div className="bg-slate-900/80 border border-slate-700 p-1 rounded-xl flex text-xs font-bold">
            <button
              onClick={() => setLang('zh')}
              className={`px-3 py-1.5 rounded-lg transition ${lang === 'zh' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              🇨🇳 中文
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1.5 rounded-lg transition ${lang === 'en' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              🇬🇧 English
            </button>
          </div>

          <button
            onClick={() => setIsDirectiveModalOpen(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2"
          >
            <span>📝</span>
            <span>{lang === 'zh' ? '下发工作指令' : 'Issue Directive'}</span>
          </button>

          <button
            onClick={() => handleExportPdfForReport(activeReport)}
            disabled={isExportingPdf}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2 disabled:opacity-50 border border-slate-600"
          >
            <span>📄</span>
            <span>{isExportingPdf ? (lang === 'zh' ? '生成中...' : 'Generating...') : (lang === 'zh' ? '导出 PDF' : 'Export PDF')}</span>
          </button>

          <button
            onClick={() => handleCopyWeChat(activeReport)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2"
          >
            <span>💬</span>
            <span>{lang === 'zh' ? '复制微信摘要' : 'Copy WeChat'}</span>
          </button>
        </div>
      </header>

      {/* ── Reports selector bar ── */}
      <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-2xl shadow space-y-3 backdrop-blur">
        <div className="flex justify-between items-center border-b border-slate-700/60 pb-2">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span>📚</span>
            <span>{lang === 'zh' ? '历史现场日报列表' : 'Historical Reports'}</span>
          </h2>
          <span className="text-xs font-bold text-slate-400">{reportsList.length} {lang === 'zh' ? '份报告' : 'reports'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {reportsList.map(rpt => (
            <button
              key={rpt.date}
              type="button"
              onClick={() => { setSelectedReportId(rpt.date); setIsDetailModalOpen(true); }}
              className={`p-3 rounded-xl border text-left transition flex justify-between items-center ${
                activeReport.date === rpt.date
                  ? 'bg-emerald-900/40 border-emerald-600/60 ring-2 ring-emerald-500/30'
                  : 'bg-slate-900/60 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">📅 {rpt.date}</span>
                  {rpt.isEdited ? (
                    <span className="text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                      v{rpt.version} R
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-slate-700/60 text-slate-400 px-1.5 py-0.5 rounded">v1</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate max-w-[180px] mt-0.5">{rpt[lang].tasks}</p>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700 shrink-0 ml-2">
                👁 {lang === 'zh' ? '查看' : 'View'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Revision banner ── */}
      {activeReport.isEdited && (
        <div className="bg-amber-950/60 border border-amber-600/50 p-4 rounded-2xl shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black text-amber-300 uppercase tracking-wide">
                  {lang === 'zh' ? `报告变更通知 (v${activeReport.version})` : `Report Revision Alert (v${activeReport.version})`}
                </h3>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
                  {activeReport.lastEditedAt}
                </span>
              </div>
              <p className="text-xs text-amber-200/80 font-medium mt-1">
                {lang === 'zh'
                  ? `现场经理修改了此报告。修改原因：${activeReport.editReason}`
                  : `Site Manager updated this report. Reason: "${activeReport.editReason}"`}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl whitespace-nowrap">
            {lang === 'zh' ? '已更新 AI 翻译' : 'AI Translation Updated'}
          </span>
        </div>
      )}

      {/* ── Metric cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: lang === 'zh' ? '现场总人数' : 'On-Site Staff',
            value: `${activeReport.activeWorkers}`,
            unit: lang === 'zh' ? '人' : 'workers',
            color: 'text-white',
            icon: '👷',
          },
          {
            label: lang === 'zh' ? '天气状况' : 'Weather',
            value: activeReport.weather,
            color: 'text-sky-300',
            icon: '🌤',
          },
          {
            label: lang === 'zh' ? '报告问题' : 'Open Risks',
            value: activeReport.isEdited ? '1 Alert' : '0 Alerts',
            color: activeReport.isEdited ? 'text-amber-400' : 'text-emerald-400',
            icon: '⚠️',
          },
          {
            label: lang === 'zh' ? '翻译状态' : 'Translation',
            value: lang === 'zh' ? '已同步' : 'Synced',
            color: 'text-emerald-400',
            icon: '⚡',
          },
        ].map((card, i) => (
          <div key={i} className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-2xl shadow backdrop-blur">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">{card.icon}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.label}</span>
            </div>
            <div className={`text-xl font-black ${card.color} truncate`}>
              {card.value}
              {'unit' in card && card.unit && (
                <span className="text-xs font-normal text-slate-400 ml-1">{card.unit}</span>
              )}
            </div>
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
                {lang === 'zh' ? `现场日报详情 (${activeReport.date})` : `Daily Log (${activeReport.date})`}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{activeReport.manager}</p>
            </div>
            <button
              onClick={() => handleExportPdfForReport(activeReport)}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <span>📄</span>
              <span>{lang === 'zh' ? '导出 PDF' : 'Export PDF'}</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                <span>✅</span>{lang === 'zh' ? '今日完成任务' : 'Tasks Completed Today'}
              </h3>
              <p className="text-slate-200 text-sm leading-relaxed">{activeReport[lang].tasks}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                <span>🚚</span>{lang === 'zh' ? '设备及材料进场' : 'Equipment & Materials'}
              </h3>
              <p className="text-slate-200 text-sm leading-relaxed">{activeReport[lang].equipment}</p>
            </div>

            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-700/40">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-2">
                <span>⚠️</span>{lang === 'zh' ? '异常与工程延误' : 'Issues & Field Delays'}
              </h3>
              <p className="text-amber-200/90 text-sm leading-relaxed">{activeReport[lang].issues}</p>
            </div>
          </div>
        </div>

        {/* Delivery tracker sidebar */}
        <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl shadow backdrop-blur space-y-4">
          <h2 className="text-base font-bold text-white border-b border-slate-700/60 pb-3">
            {lang === 'zh' ? '风机关键设备交付追踪' : 'Turbine Equipment Delivery'}
          </h2>

          <ul className="space-y-3">
            {[
              { name: lang === 'zh' ? '叶片 (Rotor Blades)' : 'Rotor Blades', sub: 'Unit #1 - #3', status: lang === 'zh' ? '已到场' : 'Delivered', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-600/30', rowBg: 'bg-emerald-950/30 border-emerald-800/30' },
              { name: lang === 'zh' ? '主变压器' : 'Main Transformer', sub: '110kV Substation', status: lang === 'zh' ? '运输中' : 'In Transit', color: 'bg-amber-500/20 text-amber-300 border-amber-600/30', rowBg: 'bg-amber-950/30 border-amber-800/30' },
              { name: lang === 'zh' ? '塔筒段' : 'Tower Sections', sub: 'Batch 2', status: lang === 'zh' ? '计划中' : 'Scheduled', color: 'bg-slate-700/60 text-slate-400 border-slate-600/30', rowBg: 'bg-slate-900/40 border-slate-700/30' },
            ].map((item, i) => (
              <li key={i} className={`flex justify-between items-center p-3 rounded-xl border ${item.rowBg}`}>
                <div>
                  <p className="font-bold text-sm text-slate-200">{item.name}</p>
                  <p className="text-xs text-slate-400">{item.sub}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border ${item.color}`}>
                  {item.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Detail Modal ── */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-700 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-white">
                    {lang === 'zh' ? '现场日报审查' : 'Report Inspection'}
                  </h3>
                  {activeReport.isEdited && (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-2 py-0.5 rounded">
                      v{activeReport.version} REVISED
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  📅 {activeReport.date} · 👤 {activeReport.manager} · 🌤 {activeReport.weather}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-700 text-slate-300 font-bold hover:bg-slate-600 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {activeReport.isEdited && (
              <div className="p-3 bg-amber-950/60 border border-amber-700/40 rounded-xl text-xs text-amber-200 font-medium">
                ⚠️ <strong>{lang === 'zh' ? '修改原因:' : 'Revision:'}</strong> {activeReport.editReason}
              </div>
            )}

            <div className="space-y-4 text-sm">
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-700/50">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">✅ {lang === 'zh' ? '完成任务' : 'Tasks'}</h4>
                <p className="text-slate-200 leading-relaxed">{activeReport[lang].tasks}</p>
              </div>
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-700/50">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">🚚 {lang === 'zh' ? '设备' : 'Equipment'}</h4>
                <p className="text-slate-200 leading-relaxed">{activeReport[lang].equipment}</p>
              </div>
              <div className="p-4 bg-amber-950/40 rounded-2xl border border-amber-700/40">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">⚠️ {lang === 'zh' ? '问题' : 'Issues'}</h4>
                <p className="text-amber-200/90 leading-relaxed">{activeReport[lang].issues}</p>
              </div>
            </div>

            <div className="flex justify-end items-center gap-3 border-t border-slate-700 pt-4">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-xl transition"
              >
                {lang === 'zh' ? '关闭' : 'Close'}
              </button>
              <button
                type="button"
                onClick={() => { handleExportPdfForReport(activeReport); setIsDetailModalOpen(false); }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2"
              >
                <span>📄</span>
                <span>{lang === 'zh' ? '确认并导出 PDF' : 'Approve & Export PDF'}</span>
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
                <span>📝</span>
                <span>{lang === 'zh' ? '下发现场工作指令' : 'Issue Field Directive'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsDirectiveModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-700 text-slate-300 font-bold hover:bg-slate-600 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDirective} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  {lang === 'zh' ? '指令标题 *' : 'Directive Title *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'zh' ? '例如: 加快5号风机转子安装' : 'e.g. Accelerate Rotor Assembly #5'}
                  value={directiveTitle}
                  onChange={e => setDirectiveTitle(e.target.value)}
                  className="w-full p-3.5 bg-slate-900 border border-slate-600 rounded-xl text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  {lang === 'zh' ? '具体要求与说明' : 'Instructions & Details'}
                </label>
                <textarea
                  rows={3}
                  placeholder={lang === 'zh' ? '例如: 预计周末大风，请在周五完成吊装。' : 'e.g. High winds expected. Finish lifting by Friday.'}
                  value={directiveDesc}
                  onChange={e => setDirectiveDesc(e.target.value)}
                  className="w-full p-3.5 bg-slate-900 border border-slate-600 rounded-xl text-white text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  {lang === 'zh' ? '优先级' : 'Priority Level'}
                </label>
                <select
                  value={directivePriority}
                  onChange={e => setDirectivePriority(e.target.value)}
                  className="w-full p-3.5 bg-slate-900 border border-slate-600 rounded-xl text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="MEDIUM">MEDIUM (普通)</option>
                  <option value="HIGH">HIGH (紧急 / 优先)</option>
                  <option value="CRITICAL">CRITICAL (特急 / 阻断)</option>
                </select>
              </div>

              {directiveSubmitMsg && (
                <div className={`p-3.5 rounded-xl text-sm font-bold border ${
                  directiveSubmitMsg.startsWith('✅')
                    ? 'bg-emerald-900/40 border-emerald-700/40 text-emerald-300'
                    : 'bg-red-900/40 border-red-700/40 text-red-300'
                }`}>
                  {directiveSubmitMsg}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-700 pt-4">
                <button
                  type="button"
                  onClick={() => setIsDirectiveModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-sm rounded-xl transition"
                >
                  {lang === 'zh' ? '取消' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm rounded-xl shadow-lg transition"
                >
                  {lang === 'zh' ? '立即下发指令 🚀' : 'Issue Directive 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
