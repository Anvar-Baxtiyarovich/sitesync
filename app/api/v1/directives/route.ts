import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let directives: any[] = [];
    try {
      directives = await db.workDirective.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { site: true },
      });
    } catch {
      // Mock fallback
    }

    if (directives.length === 0) {
      directives = [
        {
          id: "dir_101",
          titleRaw: "Accelerate Wind Turbine #5 Rotor Installation",
          descriptionRaw: "High winds expected this weekend. Priority shift to complete rotor assembly for Turbine #5 before Friday.",
          priority: "HIGH",
          status: "PENDING_ACCEPTANCE",
          targetDate: "2026-08-12",
          createdAt: "2026-08-09T22:00:00Z",
          acceptedAt: null,
          zh: {
            title: "加快5号风机转子安装",
            description: "预计本周末有强风。优先在周五前完成5号风机的转子组装。",
          },
          uz: {
            title: "5-sonli shamol turbinasi rotorini o-rnatishni tezlashtirish",
            description: "Dam olish kunlari kuchli shamol kutilmoqda. Juma kuniga qadar 5-turbina rotorini yig-ishni birinchi o-ringa qo-ying.",
          },
        },
        {
          id: "dir_100",
          titleRaw: "Quality Assurance Check on Substation Concrete Curing",
          descriptionRaw: "Perform slump and moisture test on 110kV substation concrete foundation curing pads.",
          priority: "MEDIUM",
          status: "ACCEPTED",
          targetDate: "2026-08-10",
          createdAt: "2026-08-08T15:30:00Z",
          acceptedAt: "2026-08-08T16:00:00Z",
          zh: {
            title: "变电站混凝土养护质量抽检",
            description: "对110kV变电站混凝土基础养护垫层进行塌落度和湿度测试。",
          },
          uz: {
            title: "Podstansiya betoni parvarishini sifat nazoratidan o-tkazish",
            description: "110kV podstansiya poydevor betonida namlik va pishiqlik testlarini o-tkazing.",
          },
        },
      ];
    }

    return NextResponse.json({ directives });
  } catch (error) {
    console.error("Fetch Directives Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { titleRaw, descriptionRaw, priority, targetDate } = body;

    if (!titleRaw) {
      return NextResponse.json(
        { error: "Title is required for work directive" },
        { status: 400 }
      );
    }

    let site = null;
    try {
      site = await db.site.findFirst();
    } catch {
      // Mock fallback
    }

    if (site) {
      const directive = await db.workDirective.create({
        data: {
          siteId: site.id,
          titleRaw,
          descriptionRaw: descriptionRaw || "",
          priority: priority || "MEDIUM",
          status: "PENDING_ACCEPTANCE",
          targetDate: targetDate ? new Date(targetDate) : null,
          translationsJson: {
            uz: {
              title: `[AI Tarjima] ${titleRaw}`,
              description: descriptionRaw ? `[AI Tarjima] ${descriptionRaw}` : "",
            },
            zh: {
              title: titleRaw,
              description: descriptionRaw || "",
            },
          },
        },
      });

      return NextResponse.json({
        message: "Work directive created and sent to local manager.",
        directive,
      });
    }

    // Mock response for dev mode
    const mockDirective = {
      id: `dir_${Date.now()}`,
      titleRaw,
      descriptionRaw,
      priority: priority || "HIGH",
      status: "PENDING_ACCEPTANCE",
      targetDate: targetDate || "2026-08-12",
      createdAt: new Date().toISOString(),
      acceptedAt: null,
      zh: { title: titleRaw, description: descriptionRaw },
      uz: {
        title: `[Topshiriq] ${titleRaw}`,
        description: descriptionRaw || "Tafsilotlar topshiriqda ko-rsatilgan.",
      },
    };

    return NextResponse.json({
      message: "Work directive issued (Dev Mock Mode)",
      directive: mockDirective,
    });
  } catch (error) {
    console.error("Create Directive Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { directiveId, status } = body;

    if (!directiveId) {
      return NextResponse.json(
        { error: "Directive ID is required" },
        { status: 400 }
      );
    }

    let directive = null;
    try {
      directive = await db.workDirective.findUnique({ where: { id: directiveId } });
    } catch {
      // Mock fallback
    }

    if (directive) {
      const updated = await db.workDirective.update({
        where: { id: directiveId },
        data: {
          status: status || "ACCEPTED",
          acceptedAt: status === "ACCEPTED" ? new Date() : directive.acceptedAt,
        },
      });

      return NextResponse.json({
        message: "Directive status updated successfully.",
        directive: updated,
      });
    }

    return NextResponse.json({
      message: "Directive status updated (Mock Dev Mode)",
      directiveId,
      status: status || "ACCEPTED",
      acceptedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Update Directive Status Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
