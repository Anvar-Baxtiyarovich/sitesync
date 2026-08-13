import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
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

    if (currentUser?.role !== "SYSTEM_ADMIN") {
      return NextResponse.json(
        { error: "Ruxsat etilmadi. Faqat Super Admin foydalana oladi." },
        { status: 403 }
      );
    }
    // 1. Clean up junk / mock test users that don't match our real personnel emails
    const realEmails = [
      "xab8101@gmail.com",
      "liwei@epc-partner.cn",
      "sarah@qa-engineer.com",
      "dmitry@civil-eng.ru",
      "anvar@sitesync.io",
    ];

    try {
      // Remove contacts & memberships for non-real emails
      const junkUsers = await db.user.findMany({
        where: { email: { notIn: realEmails } },
      });

      for (const j of junkUsers) {
        await db.userContact.deleteMany({
          where: { OR: [{ userId: j.id }, { contactId: j.id }] },
        });
        await db.groupMember.deleteMany({ where: { userId: j.id } });
        await db.user.delete({ where: { id: j.id } });
      }
    } catch {
      // Ignored if DB table not connected
    }

    // 2. Upsert real professional personnel
    const seedUsers: Array<{
      email: string;
      fullName: string;
      username: string;
      jobTitle: string;
      avatarUrl: string;
      role: 'SYSTEM_ADMIN' | 'LOCAL_MANAGER' | 'FOREIGN_PARTNER';
      nativeLanguage: string;
      canCreateGroup: boolean;
      canAcceptDirectives: boolean;
      canSubmitReports: boolean;
    }> = [
      {
        email: "xab8101@gmail.com",
        fullName: "Anvar Khudoyberdiev",
        username: "@anvar_admin",
        jobTitle: "Super System Admin / Site Manager",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        role: "SYSTEM_ADMIN",
        nativeLanguage: "uz",
        canCreateGroup: true,
        canAcceptDirectives: true,
        canSubmitReports: true,
      },
      {
        email: "liwei@epc-partner.cn",
        fullName: "Li Wei (李伟)",
        username: "@liwei_epc",
        jobTitle: "EPC Project Director (项目总监)",
        avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
        role: "FOREIGN_PARTNER",
        nativeLanguage: "zh",
        canCreateGroup: true,
        canAcceptDirectives: true,
        canSubmitReports: false,
      },
      {
        email: "sarah@qa-engineer.com",
        fullName: "Sarah Jenkins",
        username: "@sarah_qa",
        jobTitle: "QA/QC Lead Engineer",
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
        role: "FOREIGN_PARTNER",
        nativeLanguage: "en",
        canCreateGroup: false,
        canAcceptDirectives: true,
        canSubmitReports: false,
      },
      {
        email: "dmitry@civil-eng.ru",
        fullName: "Dmitry Ivanov",
        username: "@dmitry_civil",
        jobTitle: "Chief Civil Engineer",
        avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
        role: "LOCAL_MANAGER",
        nativeLanguage: "ru",
        canCreateGroup: false,
        canAcceptDirectives: true,
        canSubmitReports: true,
      },
    ];

    const dbUsers = [];
    for (const u of seedUsers) {
      try {
        const dbUser = await db.user.upsert({
          where: { email: u.email },
          update: u,
          create: u,
        });
        dbUsers.push(dbUser);
      } catch (err) {
        console.warn(`Seed user error (${u.email}):`, (err as any).message);
      }
    }

    // 3. Upsert clean project groups
    let windGroup = null;
    try {
      windGroup = await db.projectGroup.upsert({
        where: { code: "SYNC-WIND-88" },
        update: {
          name: "Dashtobod Wind Turbine EPC Team 🌬️",
          description: "110kV Wind Turbine Project - Zone B Construction & Installation Group",
        },
        create: {
          name: "Dashtobod Wind Turbine EPC Team 🌬️",
          code: "SYNC-WIND-88",
          description: "110kV Wind Turbine Project - Zone B Construction & Installation Group",
        },
      });

      // Add all 4 real personnel to wind group
      if (windGroup && dbUsers.length > 0) {
        for (const u of dbUsers) {
          try {
            await db.groupMember.upsert({
              where: {
                groupId_userId: {
                  groupId: windGroup.id,
                  userId: u.id,
                },
              },
              update: {},
              create: {
                groupId: windGroup.id,
                userId: u.id,
                roleInGroup: u.role === "SYSTEM_ADMIN" ? "OWNER" : "MEMBER",
              },
            });
          } catch {
            // Member exists
          }
        }
      }
    } catch {
      // Group creation fallback
    }

    return NextResponse.json({
      message: "Baza tozalandi va 4 ta haqiqiy professional xodim kiritildi!",
      usersCount: dbUsers.length,
      group: windGroup?.name || "Dashtobod Wind Turbine EPC Team",
    });
  } catch (error) {
    console.error("Database Seed Error:", error);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
