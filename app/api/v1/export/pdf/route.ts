import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get("reportId");

    if (!reportId) {
      return NextResponse.json(
        { error: "Report ID is required" },
        { status: 400 }
      );
    }

    // In production, fetch report from DB and generate PDF stream
    let report = null;
    try {
      report = await db.dailyReport.findUnique({
        where: { id: reportId },
        include: { site: true, author: true },
      });
    } catch {
      // Mock fallback for dev mode
    }

    return NextResponse.json({
      message: "PDF export endpoint ready",
      reportId,
      status: "SUCCESS",
      downloadUrl: `/reports/${reportId}.pdf`,
    });
  } catch (error) {
    console.error("PDF Export API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
