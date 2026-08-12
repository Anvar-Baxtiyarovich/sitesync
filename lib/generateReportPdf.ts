import jsPDF from 'jspdf';

export interface ReportData {
  date: string;
  site: string;
  manager: string;
  activeWorkers: number;
  weather: string;
  version?: number;
  isEdited?: boolean;
  lastEditedAt?: string;
  editReason?: string;
  zh: {
    tasks: string;
    equipment: string;
    issues: string;
  };
  en: {
    tasks: string;
    equipment: string;
    issues: string;
  };
}

/**
 * Safely clean & format text for jsPDF rendering
 */
function cleanTextForPdf(text: string): string {
  if (!text) return '';
  return text
    .replace(/[‘’`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/–/g, '-')
    .replace(/—/g, '-');
}

export function generateReportPdf(reportData: ReportData, lang: 'zh' | 'en') {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  const isZh = lang === 'zh';
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Primary & Accent Colors
  const primaryColor: [number, number, number] = [5, 150, 105]; // Emerald-600
  const darkColor: [number, number, number] = [15, 23, 42]; // Slate-900
  const lightBg: [number, number, number] = [248, 250, 252]; // Slate-50
  const borderColor: [number, number, number] = [226, 232, 240]; // Slate-200
  const amberBg: [number, number, number] = [254, 243, 199]; // Amber-100
  const amberText: [number, number, number] = [146, 64, 14]; // Amber-800

  // --- Header Banner ---
  const headerHeight = reportData.isEdited ? 34 : 28;
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');

  // App Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('SiteSync', 14, 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(reportData.isEdited ? `Executive Site Report (REVISED v${reportData.version || 2})` : 'Executive Site Report', 14, 22);

  if (reportData.isEdited && reportData.editReason) {
    doc.setFontSize(8);
    doc.setTextColor(254, 243, 199);
    doc.text(`REVISION REASON: ${reportData.editReason}`, 14, 28);
  }

  // Date & Tag on top right
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`DATE: ${reportData.date}`, pageWidth - 14, 16, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleTimeString()}`, pageWidth - 14, 22, { align: 'right' });

  let y = headerHeight + 10;

  // --- Project Info Section ---
  doc.setDrawColor(...borderColor);
  doc.setFillColor(...lightBg);
  doc.roundedRect(14, y, pageWidth - 28, 24, 3, 3, 'FD');

  doc.setTextColor(...darkColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PROJECT OVERVIEW', 18, y + 8);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Site: ${reportData.site}`, 18, y + 14);
  doc.text(`Site Manager: ${reportData.manager}`, 18, y + 19);

  y += 30;

  // --- Key Metrics Section ---
  const boxWidth = (pageWidth - 28 - 8) / 3;
  
  // Metric 1: Active Workers
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, y, boxWidth, 18, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('ON-SITE STAFF', 18, y + 6);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text(`${reportData.activeWorkers} Workers`, 18, y + 14);

  // Metric 2: Weather
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14 + boxWidth + 4, y, boxWidth, 18, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('WEATHER CONDITION', 18 + boxWidth + 4, y + 6);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text(reportData.weather, 18 + boxWidth + 4, y + 14);

  // Metric 3: Status
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(14 + (boxWidth + 4) * 2, y, boxWidth, 18, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(4, 120, 87);
  doc.text('TRANSLATION STATUS', 18 + (boxWidth + 4) * 2, y + 6);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Synced (AI GPT-4o)', 18 + (boxWidth + 4) * 2, y + 14);

  y += 26;

  // --- Section Title ---
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text(isZh ? 'DAILY LOG REPORT (ENGLISH / TRANSLATED)' : 'DAILY LOG REPORT', 14, y);
  y += 6;

  // 1. Tasks Completed
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderColor);
  doc.roundedRect(14, y, pageWidth - 28, 26, 2, 2, 'FD');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('1. TASKS COMPLETED', 18, y + 7);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  const taskText = reportData.en.tasks + (isZh ? `\n(ZH: ${reportData.zh.tasks})` : '');
  const splitTasks = doc.splitTextToSize(taskText, pageWidth - 36);
  doc.text(splitTasks, 18, y + 13);

  y += 32;

  // 2. Equipment Received
  doc.setFillColor(...lightBg);
  doc.roundedRect(14, y, pageWidth - 28, 26, 2, 2, 'FD');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('2. EQUIPMENT & MATERIALS RECEIVED', 18, y + 7);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  const equipText = reportData.en.equipment + (isZh ? `\n(ZH: ${reportData.zh.equipment})` : '');
  const splitEquip = doc.splitTextToSize(equipText, pageWidth - 36);
  doc.text(splitEquip, 18, y + 13);

  y += 32;

  // 3. Issues & Delays (Amber Highlight)
  doc.setFillColor(...amberBg);
  doc.setDrawColor(251, 191, 36);
  doc.roundedRect(14, y, pageWidth - 28, 26, 2, 2, 'FD');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...amberText);
  doc.text('3. ISSUES & FIELD DELAYS', 18, y + 7);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 53, 15);
  const issueText = reportData.en.issues + (isZh ? `\n(ZH: ${reportData.zh.issues})` : '');
  const splitIssues = doc.splitTextToSize(issueText, pageWidth - 36);
  doc.text(splitIssues, 18, y + 13);

  y += 34;

  // --- Turbine Equipment Delivery Section ---
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text('TURBINE EQUIPMENT DELIVERY STATUS', 14, y);
  y += 5;

  const deliveries = [
    { item: 'Rotor Blades (Unit #1 - #3)', status: 'Delivered', color: [16, 185, 129] as [number, number, number] },
    { item: 'Main Transformer (110kV Substation)', status: 'In Transit', color: [245, 158, 11] as [number, number, number] },
    { item: 'Tower Sections (Batch 2)', status: 'Scheduled', color: [100, 116, 139] as [number, number, number] }
  ];

  deliveries.forEach((d) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, y, pageWidth - 28, 10, 1, 1, 'FD');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(d.item, 18, y + 6.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...d.color);
    doc.text(d.status, pageWidth - 18, y + 6.5, { align: 'right' });

    y += 13;
  });

  // --- Footer ---
  doc.setDrawColor(...borderColor);
  doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('SiteSync (ObyektSinxron) - Automated Cross-lingual Industrial Construction Management', 14, pageHeight - 9);
  doc.text('Page 1 of 1', pageWidth - 14, pageHeight - 9, { align: 'right' });

  // Save PDF file
  const fileName = `SiteSync_Report_${reportData.date}_${reportData.site.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(fileName);
}
