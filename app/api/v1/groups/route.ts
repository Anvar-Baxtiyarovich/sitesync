import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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

      // Seed default members
      const usersData = [
        { email: "anvar@sitesync.io", fullName: "Anvar Khudoyberdiev", username: "@anvar_mgr", jobTitle: "Site Manager (Obyekt Boshlig'i)", nativeLanguage: "uz", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", roleInGroup: "OWNER" },
        { email: "liwei@sitesync.io", fullName: "Li Wei (李伟)", username: "@liwei_epc", jobTitle: "EPC Project Director (项目总监)", nativeLanguage: "zh", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150", roleInGroup: "MEMBER" },
        { email: "sarah@sitesync.io", fullName: "Sarah Jenkins", username: "@sarah_qa", jobTitle: "QA/QC Lead Engineer", nativeLanguage: "en", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", roleInGroup: "MEMBER" },
        { email: "dmitry@sitesync.io", fullName: "Dmitry Ivanov", username: "@dmitry_civ", jobTitle: "Chief Civil Engineer", nativeLanguage: "ru", avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150", roleInGroup: "MEMBER" },
      ];

      for (const u of usersData) {
        const user = await db.user.upsert({
          where: { email: u.email },
          update: {},
          create: {
            email: u.email,
            fullName: u.fullName,
            username: u.username,
            jobTitle: u.jobTitle,
            nativeLanguage: u.nativeLanguage,
            avatarUrl: u.avatarUrl,
          },
        });

        await db.groupMember.create({
          data: {
            groupId: group.id,
            userId: user.id,
            roleInGroup: u.roleInGroup as any,
          },
        });
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
      include: {
        members: {
          include: { user: true },
        },
      },
    });

    return NextResponse.json({
      message: "Project group created successfully in PostgreSQL.",
      group: newGroup,
    });
  } catch (error) {
    console.error("Create Group Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
