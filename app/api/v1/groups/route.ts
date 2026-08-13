import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let groups = await db.projectGroup.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        members: {
          include: { user: true },
        },
      },
    });

    if (groups.length === 0) {
      // Seed default group into PostgreSQL DB
      const group = await db.projectGroup.create({
        data: {
          id: "grp_wind_01",
          name: "Dashtobod Wind Turbine EPC Team 🌬️",
          code: "SYNC-WIND-88",
          description: "Cross-lingual project workspace for Wind Plant Zone B construction.",
        },
      });

      const existingUsers = await db.user.findMany();
      for (const u of existingUsers) {
        try {
          await db.groupMember.create({
            data: {
              groupId: group.id,
              userId: u.id,
              roleInGroup: "MEMBER",
            },
          });
        } catch {
          // ignore duplicate
        }
      }

      groups = await db.projectGroup.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          members: {
            include: { user: true },
          },
        },
      });
    }

    return NextResponse.json({ groups });
  } catch (error) {
    console.error("Fetch Groups Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Ruxsat etilmadi. Seans mavjud emas." },
        { status: 401 }
      );
    }

    const currentUser = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (currentUser && !currentUser.canCreateGroup && currentUser.role !== "SYSTEM_ADMIN") {
      return NextResponse.json(
        { error: "Sizga yangi guruh yaratish huquqi berilmagan. Super Admin bilan bog'laning." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, description, code } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      );
    }

    const groupCode = code || `SYNC-${Math.floor(1000 + Math.random() * 9000)}`;

    const newGroup = await db.projectGroup.create({
      data: {
        name,
        description: description || "",
        code: groupCode,
      },
    });

    if (currentUser) {
      await db.groupMember.create({
        data: {
          groupId: newGroup.id,
          userId: currentUser.id,
          roleInGroup: "OWNER",
        },
      });
    }

    const groupWithMembers = await db.projectGroup.findUnique({
      where: { id: newGroup.id },
      include: {
        members: {
          include: { user: true },
        },
      },
    });

    return NextResponse.json({
      message: "Project group created successfully in PostgreSQL.",
      group: groupWithMembers || newGroup,
    });
  } catch (error) {
    console.error("Create Group Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
