import { db } from "@/lib/db";

export const DEFAULT_PERSONNEL = [
  {
    email: "liwei@epc-partner.cn",
    fullName: "Li Wei (李伟)",
    username: "@liwei_epc",
    jobTitle: "EPC Project Director (项目总监)",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    role: "FOREIGN_PARTNER" as const,
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
    role: "FOREIGN_PARTNER" as const,
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
    role: "LOCAL_MANAGER" as const,
    nativeLanguage: "ru",
    canCreateGroup: false,
    canAcceptDirectives: true,
    canSubmitReports: true,
  },
  {
    email: "anvar@sitesync.io",
    fullName: "Anvar Khudoyberdiev",
    username: "@anvar_admin",
    jobTitle: "Site Manager / System Admin",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    role: "SYSTEM_ADMIN" as const,
    nativeLanguage: "uz",
    canCreateGroup: true,
    canAcceptDirectives: true,
    canSubmitReports: true,
  },
];

/**
 * Ensures standard default personnel exist in PostgreSQL database on production deployments (Vercel).
 */
export async function ensureDefaultPersonnelSeeded() {
  try {
    const existingCount = await db.user.count({
      where: {
        email: {
          in: DEFAULT_PERSONNEL.map((p) => p.email),
        },
      },
    });

    if (existingCount < DEFAULT_PERSONNEL.length) {
      for (const p of DEFAULT_PERSONNEL) {
        try {
          await db.user.upsert({
            where: { email: p.email },
            update: {
              fullName: p.fullName,
              username: p.username,
              jobTitle: p.jobTitle,
              avatarUrl: p.avatarUrl,
              role: p.role,
              nativeLanguage: p.nativeLanguage,
            },
            create: p,
          });
        } catch {
          // ignore duplicate constraint
        }
      }

      // Ensure default group exists
      const group = await db.projectGroup.upsert({
        where: { code: "SYNC-WIND-88" },
        update: {},
        create: {
          name: "Dashtobod Wind Turbine EPC Team 🌬️",
          code: "SYNC-WIND-88",
          description: "110kV Wind Turbine Project - Zone B Construction & Installation Group",
        },
      });

      // Link personnel to group
      const allUsers = await db.user.findMany({
        where: { email: { in: DEFAULT_PERSONNEL.map((p) => p.email) } },
      });

      for (const u of allUsers) {
        try {
          await db.groupMember.upsert({
            where: {
              groupId_userId: {
                groupId: group.id,
                userId: u.id,
              },
            },
            update: {},
            create: {
              groupId: group.id,
              userId: u.id,
              roleInGroup: u.role === "SYSTEM_ADMIN" ? "OWNER" : "MEMBER",
            },
          });
        } catch {
          // ignore junction constraint
        }
      }
    }
  } catch (err: any) {
    console.warn("⚠️ ensureDefaultPersonnelSeeded Error:", err.message);
  }
}
