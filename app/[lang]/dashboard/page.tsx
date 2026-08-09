'use client';

import React, { useState } from 'react';
import { generateReportPdf, ReportData } from '@/lib/generateReportPdf';

export const dynamic = 'force-dynamic';

export default function ForeignPartnerDashboard() {
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState('rpt_982347');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDirectiveModalOpen, setIsDirectiveModalOpen] = useState(false);

  // New Work Directive Form State
  const [directiveTitle, setDirectiveTitle] = useState('');
  const [directiveDesc, setDirectiveDesc] = useState('');
  const [directivePriority, setDirectivePriority] = useState('HIGH');
  const [directiveSubmitMsg, setDirectiveSubmitMsg] = useState<string | null>(null);

  // List of reports available for foreign partner inspection
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

  // Currently active report
  const activeReport = reportsList.find((r) => r.date === selectedReportId) || reportsList[0];

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
        body: JSON.stringify({
          titleRaw: directiveTitle,
          descriptionRaw: directiveDesc,
          priority: directivePriority,
        }),
      });
      if (res.ok) {
        setDirectiveSubmitMsg(
          lang === 'zh'
            ? '✅ 工作指令已下发！现场经理将收到实时翻译通知。'
            : '✅ Work directive issued successfully! Sent to local manager inbox.'
        );
        setDirectiveTitle('');
        setDirectiveDesc('');
        setTimeout(() => setIsDirectiveModalOpen(false), 1500);
      }
    } catch (err) {
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
    alert(lang === 'zh' ? '已复制微信摘要到剪贴板！' : 'WeChat Summary copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 space-y-6">
      {/* Top Navbar */}
      <header className="bg-white border-b px-6 py-4 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900">SiteSync</h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              Executive View
            </span>
            {activeReport.isEdited && (
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span>⚠️</span> v{activeReport.version} REVISED
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {activeReport.site}
          </p>
        </div>

        {/* Language & Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-slate-100 p-1 rounded-xl border flex text-xs font-bold">
            <button
              onClick={() => setLang('zh')}
              className={`px-3 py-1.5 rounded-lg transition ${
                lang === 'zh' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600'
              }`}
            >
              🇨🇳 中文 (ZH)
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1.5 rounded-lg transition ${
                lang === 'en' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600'
              }`}
            >
              🇬🇧 English (EN)
            </button>
          </div>

          <button
            onClick={() => setIsDirectiveModalOpen(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2"
          >
            <span>📝</span>
            <span>{lang === 'zh' ? '下发工作指令' : 'Issue Work Directive'}</span>
          </button>

          <button
            onClick={() => handleExportPdfForReport(activeReport)}
            disabled={isExportingPdf}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 disabled:opacity-50"
          >
            <span>📄</span>
            <span>
              {isExportingPdf
                ? (lang === 'zh' ? '生成中...' : 'Generating...')
                : (lang === 'zh' ? '导出当前报告 PDF' : 'Export Current Report PDF')}
            </span>
          </button>

          <button
            onClick={() => handleCopyWeChat(activeReport)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2"
          >
            <span>💬</span>
            <span>{lang === 'zh' ? '复制微信摘要' : 'Copy WeChat Summary'}</span>
          </button>
        </div>
      </header>

      {/* Reports Feed Selector Bar for Foreign Partner */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-3">
        <div className="flex justify-between items-center border-b pb-2">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span>📚</span>
            <span>{lang === 'zh' ? '历史现场日报列表 (点击查看详情)' : 'Historical Reports Directory (Click to Inspect)'}</span>
          </h2>
          <span className="text-xs font-bold text-slate-500">{reportsList.length} {lang === 'zh' ? '份报告' : 'reports'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {reportsList.map((rpt) => (
            <button
              key={rpt.date}
              type="button"
              onClick={() => {
                setSelectedReportId(rpt.date);
                setIsDetailModalOpen(true);
              }}
              className={`p-3 rounded-xl border text-left transition flex justify-between items-center ${
                activeReport.date === rpt.date
                  ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">📅 {rpt.date}</span>
                  {rpt.isEdited ? (
                    <span className="text-[10px] font-black bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded">
                      v{rpt.version} REVISED
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded">
                      v1
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 truncate max-w-[200px] mt-0.5">
                  {rpt[lang].tasks}
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-white px-2 py-1 rounded-lg border border-slate-200">
                👁 {lang === 'zh' ? '查看' : 'Inspect'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Revision Notification Alert Banner for Foreign Partner */}
      {activeReport.isEdited && (
        <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-pulse">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-amber-900 uppercase tracking-wide">
                  {lang === 'zh' ? `报告变更通知 (版本 v${activeReport.version})` : `Report Revision Alert (Version v${activeReport.version})`}
                </h3>
                <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded">
                  {activeReport.lastEditedAt}
                </span>
              </div>
              <p className="text-xs text-amber-800 font-medium mt-1">
                {lang === 'zh'
                  ? `现场经理修改了此报告。修改原因：${activeReport.editReason}`
                  : `Site Manager updated this report after initial submission. Reason: "${activeReport.editReason}"`}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold bg-amber-200 text-amber-900 px-3 py-1.5 rounded-xl border border-amber-300 whitespace-nowrap">
            {lang === 'zh' ? '已更新 AI 翻译' : 'Updated AI Translation'}
          </span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {lang === 'zh' ? '现场总人数' : 'Active On-Site Staff'}
          </span>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {activeReport.activeWorkers} <span className="text-xs font-normal text-slate-500">{lang === 'zh' ? '人' : 'workers'}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {lang === 'zh' ? '天气状况' : 'Weather Condition'}
          </span>
          <div className="text-xl font-bold text-slate-800 mt-2 flex items-center gap-2">
            <span>💨</span> {activeReport.weather}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {lang === 'zh' ? '报告问题' : 'Open Risk / Issues'}
          </span>
          <div className="text-xl font-bold text-amber-600 mt-2 flex items-center gap-2">
            <span>⚠️</span> {activeReport.isEdited ? '1 Alert' : '0 Alerts'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {lang === 'zh' ? '自动翻译状态' : 'Translation Engine'}
          </span>
          <div className="text-xl font-bold text-emerald-600 mt-2 flex items-center gap-2">
            <span>⚡</span> {lang === 'zh' ? '已实时同步' : 'Synced (AI GPT-4o)'}
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Log Feed */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {lang === 'zh' ? `现场日报详情 (${activeReport.date})` : `Daily Log Details (${activeReport.date})`}
              </h2>
              <p className="text-xs text-slate-500">
                {activeReport.manager}
              </p>
            </div>

            <button
              onClick={() => handleExportPdfForReport(activeReport)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2"
            >
              <span>📄</span>
              <span>{lang === 'zh' ? '导出此报告 PDF' : 'Export This PDF'}</span>
            </button>
          </div>

          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
                <span>✅</span> {lang === 'zh' ? '今日完成任务' : 'Tasks Completed Today'}
              </h3>
              <p className="text-slate-800 font-medium text-sm leading-relaxed">
                {activeReport[lang].tasks}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
                <span>🚚</span> {lang === 'zh' ? '设备及材料进场' : 'Equipment & Materials Received'}
              </h3>
              <p className="text-slate-800 font-medium text-sm leading-relaxed">
                {activeReport[lang].equipment}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-2 flex items-center gap-2">
                <span>⚠️</span> {lang === 'zh' ? '异常与工程延误' : 'Issues & Field Delays'}
              </h3>
              <p className="text-amber-950 font-medium text-sm leading-relaxed">
                {activeReport[lang].issues}
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar: Delivery Tracker */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b pb-3">
            {lang === 'zh' ? '风机关键设备交付追踪' : 'Turbine Equipment Delivery'}
          </h2>

          <ul className="space-y-3 text-sm">
            <li className="flex justify-between items-center p-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <div>
                <p className="font-bold text-slate-800">{lang === 'zh' ? '叶片 (Rotor Blades)' : 'Rotor Blades'}</p>
                <p className="text-xs text-slate-500">Unit #1 - #3</p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-200 px-2 py-1 rounded-md">
                {lang === 'zh' ? '已到场' : 'Delivered'}
              </span>
            </li>

            <li className="flex justify-between items-center p-3 rounded-xl bg-amber-50 border border-amber-100">
              <div>
                <p className="font-bold text-slate-800">{lang === 'zh' ? '主变压器 (Main Transformer)' : 'Main Transformer'}</p>
                <p className="text-xs text-slate-500">110kV Substation</p>
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-200 px-2 py-1 rounded-md">
                {lang === 'zh' ? '运输中' : 'In Transit'}
              </span>
            </li>

            <li className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <p className="font-bold text-slate-800">{lang === 'zh' ? '塔筒段 (Tower Sections)' : 'Tower Sections'}</p>
                <p className="text-xs text-slate-500">Batch 2</p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-1 rounded-md">
                {lang === 'zh' ? '计划中' : 'Scheduled'}
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Detailed Modal View for Foreign Partner Inspection */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900">
                    {lang === 'zh' ? '现场日报审查 (AI 实时翻译)' : 'Report Detailed Inspection'}
                  </h3>
                  {activeReport.isEdited && (
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-2 py-0.5 rounded">
                      v{activeReport.version} REVISED
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  📅 {activeReport.date} | 👤 {activeReport.manager} | 🌤 {activeReport.weather}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {activeReport.isEdited && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
                ⚠️ <strong>{lang === 'zh' ? '修改原因:' : 'Revision Reason:'}</strong> {activeReport.editReason}
              </div>
            )}

            <div className="space-y-4 text-sm">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  ✅ {lang === 'zh' ? '完成任务' : 'Tasks Completed'}
                </h4>
                <p className="text-slate-900 font-semibold">{activeReport[lang].tasks}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  🚚 {lang === 'zh' ? '设备及材料' : 'Equipment Received'}
                </h4>
                <p className="text-slate-900 font-semibold">{activeReport[lang].equipment}</p>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-1">
                  ⚠️ {lang === 'zh' ? '现场问题' : 'Issues & Delays'}
                </h4>
                <p className="text-amber-950 font-semibold">{activeReport[lang].issues}</p>
              </div>
            </div>

            {/* Action buttons inside Modal: Approve & Export PDF */}
            <div className="flex justify-end items-center gap-3 border-t pt-4">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                {lang === 'zh' ? '关闭' : 'Close'}
              </button>

              <button
                type="button"
                onClick={() => {
                  handleExportPdfForReport(activeReport);
                  setIsDetailModalOpen(false);
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2"
              >
                <span>📄</span>
                <span>{lang === 'zh' ? '确认无误并导出 PDF 报告' : 'Approve & Export PDF Report'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Issuing New Work Directive to Local Manager */}
      {isDirectiveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>📝</span>
                <span>{lang === 'zh' ? '下发现场工作指令' : 'Issue Field Work Directive'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsDirectiveModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDirective} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                  {lang === 'zh' ? '指令标题 *' : 'Directive Title *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    lang === 'zh'
                      ? '例如: 加快5号风机转子安装组装'
                      : 'e.g. Accelerate Rotor Assembly for Turbine #5'
                  }
                  value={directiveTitle}
                  onChange={(e) => setDirectiveTitle(e.target.value)}
                  className="w-full p-3 border rounded-xl bg-slate-50 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                  {lang === 'zh' ? '具体要求与说明' : 'Task Instructions & Details'}
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    lang === 'zh'
                      ? '例如: 预计周末大风，请优先在周五之前完成吊装作业。'
                      : 'e.g. High winds expected. Priority shift to finish lifting operations before Friday.'
                  }
                  value={directiveDesc}
                  onChange={(e) => setDirectiveDesc(e.target.value)}
                  className="w-full p-3 border rounded-xl bg-slate-50 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                  {lang === 'zh' ? '优先级 (Priority)' : 'Priority Level'}
                </label>
                <select
                  value={directivePriority}
                  onChange={(e) => setDirectivePriority(e.target.value)}
                  className="w-full p-3 border rounded-xl bg-slate-50 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="MEDIUM">MEDIUM (普通)</option>
                  <option value="HIGH">HIGH (紧急 / 优先)</option>
                  <option value="CRITICAL">CRITICAL (特急 / 阻断)</option>
                </select>
              </div>

              {directiveSubmitMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-xl">
                  {directiveSubmitMsg}
                </div>
              )}

              <div className="flex justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsDirectiveModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  {lang === 'zh' ? '取消' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition"
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
