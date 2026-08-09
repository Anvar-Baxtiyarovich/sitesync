'use client';

import React, { useState } from 'react';

export default function ForeignPartnerDashboard() {
  const [lang, setLang] = useState<'zh' | 'en'>('zh');

  // Sample translated state
  const reportData = {
    date: '2026-08-09',
    site: 'Dashtobod Wind Turbine Project - Zone B',
    manager: 'Anvar Khudoyberdiev (Site Manager)',
    activeWorkers: 42,
    weather: 'WINDY (24 km/h)',
    zh: {
      tasks: '完成了4号风机单元的基础浇筑。',
      equipment: '收到2台发电机组件和10吨水泥。',
      issues: '[高风险] 由于强风，吊车高空作业暂时暂停。',
    },
    en: {
      tasks: 'Completed foundation concrete pour for turbine unit #4.',
      equipment: 'Received 2 generator components and 10 tons of cement.',
      issues: '[High Severity] Crane operations suspended due to high wind speeds.',
    },
  };

  const handleCopyWeChat = () => {
    const text = `📌 【SiteSync 每日现场报告 / Site Daily Report】
🏢 项目: ${reportData.site}
📅 日期: ${reportData.date}
👤 现场经理: ${reportData.manager}

🌤 天气: ${reportData.weather} | 👷 现场人数: ${reportData.activeWorkers}名

✅ ${lang === 'zh' ? '今日完成任务' : 'Tasks Completed'}:
${reportData[lang].tasks}

🚚 ${lang === 'zh' ? '设备/材料进场' : 'Equipment Received'}:
${reportData[lang].equipment}

⚠️ ${lang === 'zh' ? '现场问题/延误' : 'Issues & Delays'}:
${reportData[lang].issues}

🔗 PDF: https://app.sitesync.io/reports/rpt_982347.pdf`;

    navigator.clipboard.writeText(text);
    alert(lang === 'zh' ? '已复制微信摘要到剪贴板！' : 'WeChat Summary copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      {/* Top Navbar */}
      <header className="bg-white border-b px-6 py-4 rounded-2xl shadow-sm mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900">SiteSync</h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              Executive View
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {reportData.site}
          </p>
        </div>

        {/* Language & Actions */}
        <div className="flex items-center gap-3">
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
            onClick={handleCopyWeChat}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2"
          >
            <span>💬</span>
            <span>{lang === 'zh' ? '复制微信摘要' : 'Copy WeChat Summary'}</span>
          </button>
        </div>
      </header>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {lang === 'zh' ? '现场总人数' : 'Active On-Site Staff'}
          </span>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {reportData.activeWorkers} <span className="text-xs font-normal text-slate-500">{lang === 'zh' ? '人' : 'workers'}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {lang === 'zh' ? '天气状况' : 'Weather Condition'}
          </span>
          <div className="text-xl font-bold text-slate-800 mt-2 flex items-center gap-2">
            <span>💨</span> {reportData.weather}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {lang === 'zh' ? '报告问题' : 'Open Risk / Issues'}
          </span>
          <div className="text-xl font-bold text-amber-600 mt-2 flex items-center gap-2">
            <span>⚠️</span> 1 {lang === 'zh' ? '个风险警报' : 'High Alert'}
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
            <h2 className="text-lg font-bold text-slate-900">
              {lang === 'zh' ? '今日现场日报 (已翻译)' : 'Translated Daily Log'}
            </h2>
            <span className="text-xs font-medium text-slate-500">
              {reportData.date} | {reportData.manager}
            </span>
          </div>

          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
                <span>✅</span> {lang === 'zh' ? '今日完成任务' : 'Tasks Completed Today'}
              </h3>
              <p className="text-slate-800 font-medium text-sm leading-relaxed">
                {reportData[lang].tasks}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
                <span>🚚</span> {lang === 'zh' ? '设备及材料进场' : 'Equipment & Materials Received'}
              </h3>
              <p className="text-slate-800 font-medium text-sm leading-relaxed">
                {reportData[lang].equipment}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-2 flex items-center gap-2">
                <span>⚠️</span> {lang === 'zh' ? '异常与工程延误' : 'Issues & Field Delays'}
              </h3>
              <p className="text-amber-950 font-medium text-sm leading-relaxed">
                {reportData[lang].issues}
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
    </div>
  );
}
