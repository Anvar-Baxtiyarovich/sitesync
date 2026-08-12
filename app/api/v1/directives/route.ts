import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { translateGroupChatMessage } from "@/lib/translation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let directives: any[] = [];
    try {
      directives = await db.workDirective.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
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
          status: "IN_PROGRESS",
          category: "MECHANICAL",
          progressPercent: 65,
          targetDate: "2026-08-15",
          createdAt: "2026-08-09T22:00:00Z",
          acceptedAt: "2026-08-10T08:30:00Z",
          translationsJson: {
            uz: {
              title: "5-sonli shamol turbinasi rotorini o'rnatishni tezlashtirish",
              description: "Dam olish kunlari kuchli shamol kutilmoqda. Juma kuniga qadar 5-turbina rotorini yig'ishni birinchi o'ringa qo'ying.",
            },
            ru: {
              title: "Ускорить монтаж ротора ветротурбины №5",
              description: "В эти выходные ожидается сильный ветер. Приоритет: завершить сборку ротора для Турбины №5 до пятницы.",
            },
            en: {
              title: "Accelerate Wind Turbine #5 Rotor Installation",
              description: "High winds expected this weekend. Priority shift to complete rotor assembly for Turbine #5 before Friday.",
            },
            zh: {
              title: "加快5号风机转子安装",
              description: "预计本周末有强风。优先在周五前完成5号风机的转子组装。",
            },
          },
        },
        {
          id: "dir_102",
          titleRaw: "110kV Substation Earthing System Inspection",
          descriptionRaw: "Verify resistance values on sub-station grounding grid before transformer delivery.",
          priority: "CRITICAL",
          status: "PENDING_APPROVAL",
          category: "ELECTRICAL",
          progressPercent: 100,
          completionNotes: "Yerlashtirish qarshiligi 0.4 Om deb o'lchandi (Norma < 0.5 Om). Bayonnoma va rasm ilova qilindi.",
          completionProofUrl: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800",
          targetDate: "2026-08-12",
          createdAt: "2026-08-08T15:30:00Z",
          acceptedAt: "2026-08-08T16:00:00Z",
          translationsJson: {
            uz: {
              title: "110kV podstansiya yerlashtirish tizimini tekshirish",
              description: "Transformator kelishidan oldin podstansiya yerlashtirish qarshiligini tekshiring.",
            },
            ru: {
              title: "Проверка системы заземления подстанции 110 кВ",
              description: "Проверьте значения сопротивления заземляющей сетки подстанции до доставки трансформатора.",
            },
            en: {
              title: "110kV Substation Earthing System Inspection",
              description: "Verify resistance values on sub-station grounding grid before transformer delivery.",
            },
            zh: {
              title: "110kV变电站接地系统检验",
              description: "变压器到货前核实变电站接地网电阻值。",
            },
          },
        },
        {
          id: "dir_100",
          titleRaw: "Quality Assurance Check on Substation Concrete Curing",
          descriptionRaw: "Perform slump and moisture test on 110kV substation concrete foundation curing pads.",
          priority: "MEDIUM",
          status: "COMPLETED",
          category: "CIVIL",
          progressPercent: 100,
          approvedAt: "2026-08-10T11:00:00Z",
          targetDate: "2026-08-10",
          createdAt: "2026-08-08T10:00:00Z",
          acceptedAt: "2026-08-08T11:00:00Z",
          translationsJson: {
            uz: {
              title: "Podstansiya betoni parvarishini sifat nazoratidan o'tkazish",
              description: "110kV podstansiya poydevor betonida namlik va pishiqlik testlarini o'tkazing.",
            },
            ru: {
              title: "Контроль качества ухода за бетоном подстанции",
              description: "Проведите испытания на осадку конуса и влажность фундамента подстанции 110 кВ.",
            },
            en: {
              title: "Quality Assurance Check on Substation Concrete Curing",
              description: "Perform slump and moisture test on 110kV substation concrete foundation curing pads.",
            },
            zh: {
              title: "变电站混凝土养护质量抽检",
              description: "对110kV变电站混凝土基础养护垫层进行塌落度和湿度测试。",
            },
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
    const { titleRaw, descriptionRaw, priority, targetDate, category } = body;

    if (!titleRaw) {
      return NextResponse.json(
        { error: "Title is required for work directive" },
        { status: 400 }
      );
    }

    // Auto-translate title and description into UZ, RU, EN, ZH
    const translatedTitle = await translateGroupChatMessage(titleRaw, "zh");
    const translatedDesc = descriptionRaw
      ? await translateGroupChatMessage(descriptionRaw, "zh")
      : { uz: "", ru: "", en: "", zh: "" };

    const translationsJson = {
      uz: { title: translatedTitle.uz, description: translatedDesc.uz },
      ru: { title: translatedTitle.ru, description: translatedDesc.ru },
      en: { title: translatedTitle.en, description: translatedDesc.en },
      zh: { title: titleRaw, description: descriptionRaw || "" },
    };

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
          category: category || "GENERAL",
          status: "PENDING_ACCEPTANCE",
          progressPercent: 0,
          targetDate: targetDate ? new Date(targetDate) : null,
          translationsJson,
        },
      });

      return NextResponse.json({
        message: "Work directive created and sent with 4-way translation.",
        directive,
      });
    }

    // Mock response for dev mode
    const mockDirective = {
      id: `dir_${Date.now()}`,
      titleRaw,
      descriptionRaw,
      priority: priority || "HIGH",
      category: category || "GENERAL",
      status: "PENDING_ACCEPTANCE",
      progressPercent: 0,
      targetDate: targetDate || new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
      acceptedAt: null,
      translationsJson,
    };

    return NextResponse.json({
      message: "Work directive issued with multi-lingual translation (Dev Mode)",
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
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      const user = await db.user.findUnique({
        where: { email: session.user.email },
      });
      if (user && !user.canAcceptDirectives && user.role !== "SYSTEM_ADMIN") {
        return NextResponse.json(
          { error: "Sizga topshiriqlarni boshqarish huquqi berilmagan." },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const {
      directiveId,
      status,
      progressPercent,
      completionNotes,
      completionProofUrl,
      rejectionReason,
    } = body;

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
      const updatedData: any = {};
      if (status) updatedData.status = status;
      if (progressPercent !== undefined) updatedData.progressPercent = Number(progressPercent);
      if (completionNotes !== undefined) updatedData.completionNotes = completionNotes;
      if (completionProofUrl !== undefined) updatedData.completionProofUrl = completionProofUrl;
      if (rejectionReason !== undefined) updatedData.rejectionReason = rejectionReason;

      if (status === "ACCEPTED" && !directive.acceptedAt) {
        updatedData.acceptedAt = new Date();
      }
      if (status === "COMPLETED" && !directive.approvedAt) {
        updatedData.approvedAt = new Date();
        updatedData.progressPercent = 100;
      }

      const updated = await db.workDirective.update({
        where: { id: directiveId },
        data: updatedData,
      });

      return NextResponse.json({
        message: "Directive status & progress updated.",
        directive: updated,
      });
    }

    return NextResponse.json({
      message: "Directive status updated (Mock Dev Mode)",
      directiveId,
      status: status || "ACCEPTED",
      progressPercent: progressPercent !== undefined ? Number(progressPercent) : 50,
      completionNotes,
      completionProofUrl,
      rejectionReason,
    });
  } catch (error) {
    console.error("Update Directive Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
