import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { translationQueue } from "@/lib/queue";

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
