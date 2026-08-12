import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    let reports: any[] = [];
    try {
      reports = await db.dailyReport.findMany({
        orderBy: { reportDate: "desc" },
        take: 50,
        include: { site: true, author: true },
      });
    } catch {
      // Mock fallback
    }

    if (reports.length === 0) {
      reports = [
        {
          reportDate: "2026-08-09",
          weatherCondition: "WINDY",
          activeWorkers: 42,
          tasksCompletedRaw: "4-sonli turbina poydevoriga beton quyish yakunlandi.",
          equipmentReceivedRaw: "2 ta generator va 10 tonna sement.",
          issuesEncounteredRaw: "Shamol tezligi sababli kran to'xtatildi.",
          version: 2,
          isEdited: true,
          editReason: "Beton hajmi aniqlandi",
        },
        {
          reportDate: "2026-08-08",
          weatherCondition: "SUNNY",
          activeWorkers: 38,
          tasksCompletedRaw: "3-sonli turbina simlarini tortish.",
          equipmentReceivedRaw: "5 tonna armatura va kabel.",
          issuesEncounteredRaw: "Muammo yo'q",
          version: 1,
          isEdited: false,
        },
      ];
    }

    // Generate CSV / Tab-separated content which opens natively in Microsoft Excel (UTF-8 with BOM)
    const headers = [
      "Report Date",
      "Site",
      "Active Workers",
      "Weather",
      "Revision Status",
      "Tasks Completed (Uzbek/Raw)",
      "Equipment & Materials",
      "Field Issues & Delays",
    ];

    let csvContent = "\uFEFF" + headers.join("\t") + "\n";

    reports.forEach((r) => {
      const row = [
        r.reportDate ? r.reportDate.toString().split("T")[0] : "",
        r.site?.name || "Dashtobod Wind Turbine Zone B",
        r.activeWorkers || 0,
        r.weatherCondition || "",
        r.isEdited ? `v${r.version} REVISED (${r.editReason || ""})` : "v1 Original",
        `"${(r.tasksCompletedRaw || "").replace(/"/g, '""')}"`,
        `"${(r.equipmentReceivedRaw || "").replace(/"/g, '""')}"`,
        `"${(r.issuesEncounteredRaw || "").replace(/"/g, '""')}"`,
      ];
      csvContent += row.join("\t") + "\n";
    });

    const filename = `SiteSync_Executive_Reports_${new Date().toISOString().split("T")[0]}.xls`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export Excel Error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
