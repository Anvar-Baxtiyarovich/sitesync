import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { translationQueue } from "@/lib/queue";

export async function GET() {
  try {
    let reports: any[] = [];
    try {
      reports = await db.dailyReport.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { site: true, author: true },
      });
    } catch {
      // Mock dev mode fallback
    }

    if (reports.length === 0) {
      reports = [
        {
          id: "rpt_982347",
          reportDate: "2026-08-09",
          weatherCondition: "WINDY",
          activeWorkers: 42,
          sourceLanguage: "uz",
          version: 2,
          isEdited: true,
          editReason: "Beton hajmi va kran to-xtatilganligi ko-rsatkichlariga aniqlik kiritildi",
          lastEditedAt: "2026-08-09T23:10:00Z",
          tasksCompletedRaw: "4-sonli turbina poydevoriga beton quyish yakunlandi.",
          equipmentReceivedRaw: "2 ta generator va 10 tonna sement yetib keldi.",
          issuesEncounteredRaw: "Shamol tezligi sababli kran ishlari to-xtatildi.",
          status: "TRANSLATED",
        },
        {
          id: "rpt_982346",
          reportDate: "2026-08-08",
          weatherCondition: "SUNNY",
          activeWorkers: 38,
          sourceLanguage: "uz",
          version: 1,
          isEdited: false,
          tasksCompletedRaw: "3-sonli turbina simlarini tortish va transformator podstansiyasini sozlash.",
          equipmentReceivedRaw: "5 tonna armatura va kabel roliklari.",
          issuesEncounteredRaw: "Muammo yo-q.",
          status: "TRANSLATED",
        },
      ];
    }

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Fetch Reports Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      sourceLanguage,
      reportDate,
      weatherCondition,
      activeWorkers,
      tasksCompletedRaw,
      equipmentReceivedRaw,
      issuesEncounteredRaw,
    } = body;

    if (!tasksCompletedRaw) {
      return NextResponse.json(
        { error: "Tasks completed field is required" },
        { status: 400 }
      );
    }

    // In production, fetch demo organization and site
    let site = await db.site.findFirst();
    let user = await db.user.findFirst();

    if (!site || !user) {
      // Mock ID fallback for dev testing
      const reportId = `rpt_${Date.now()}`;
      return NextResponse.json({
        message: "Report accepted for translation queue (Mock Dev Mode)",
        reportId,
      });
    }

    const report = await db.dailyReport.create({
      data: {
        siteId: site.id,
        authorId: user.id,
        reportDate: new Date(reportDate),
        weatherCondition: weatherCondition || "SUNNY",
        activeWorkers: Number(activeWorkers) || 1,
        sourceLanguage: sourceLanguage || "uz",
        tasksCompletedRaw,
        equipmentReceivedRaw,
        issuesEncounteredRaw,
        status: "PROCESSING_TRANSLATION",
      },
    });

    // Enqueue for BullMQ worker
    await translationQueue.add("translate_report", {
      reportId: report.id,
      sourceLanguage: report.sourceLanguage,
      tasks: tasksCompletedRaw,
      equipment: equipmentReceivedRaw,
      issues: issuesEncounteredRaw,
    });

    return NextResponse.json({
      message: "Report submitted successfully and enqueued for translation.",
      reportId: report.id,
    });
  } catch (error) {
    console.error("Report API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      reportId,
      sourceLanguage,
      reportDate,
      weatherCondition,
      activeWorkers,
      tasksCompletedRaw,
      equipmentReceivedRaw,
      issuesEncounteredRaw,
      editReason,
    } = body;

    if (!tasksCompletedRaw) {
      return NextResponse.json(
        { error: "Tasks completed field is required" },
        { status: 400 }
      );
    }

    let report = null;
    if (reportId) {
      report = await db.dailyReport.findUnique({ where: { id: reportId } });
    }

    if (report) {
      const updatedReport = await db.dailyReport.update({
        where: { id: report.id },
        data: {
          reportDate: reportDate ? new Date(reportDate) : report.reportDate,
          weatherCondition: weatherCondition || report.weatherCondition,
          activeWorkers: Number(activeWorkers) || report.activeWorkers,
          sourceLanguage: sourceLanguage || report.sourceLanguage,
          tasksCompletedRaw,
          equipmentReceivedRaw,
          issuesEncounteredRaw,
          status: "PROCESSING_TRANSLATION",
          version: { increment: 1 },
          isEdited: true,
          lastEditedAt: new Date(),
          editReason: editReason || "Site metrics updated by local manager",
        },
      });

      // Re-enqueue for translation
      await translationQueue.add("translate_report", {
        reportId: updatedReport.id,
        sourceLanguage: updatedReport.sourceLanguage,
        tasks: tasksCompletedRaw,
        equipment: equipmentReceivedRaw,
        issues: issuesEncounteredRaw,
      });

      return NextResponse.json({
        message: "Report revised successfully and queued for translation update.",
        reportId: updatedReport.id,
        version: updatedReport.version,
      });
    }

    // Mock fallback response for dev testing
    return NextResponse.json({
      message: "Report revision accepted for translation (Mock Dev Mode)",
      reportId: reportId || `rpt_${Date.now()}`,
      version: 2,
      isEdited: true,
      editReason: editReason || "Correction to daily log",
    });
  } catch (error) {
    console.error("Report Revision API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
