import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function isSystemAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return false;
  
  const user = await db.user.findUnique({
    where: { email: session.user.email },
  });

  return user?.role === "SYSTEM_ADMIN" || session.user.email === "xab8101@gmail.com";
}

export async function GET() {
  try {
    const adminCheck = await isSystemAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { error: "Ruxsat etilmadi. Faqat Super Admin foydalana oladi." },
        { status: 403 }
      );
    }

    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        fullName: true,
        username: true,
        jobTitle: true,
        avatarUrl: true,
        role: true,
        canCreateGroup: true,
        canAcceptDirectives: true,
        canSubmitReports: true,
        nativeLanguage: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Admin Fetch Users Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const adminCheck = await isSystemAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { error: "Ruxsat etilmadi. Faqat Super Admin foydalana oladi." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { userId, role, jobTitle, canCreateGroup, canAcceptDirectives, canSubmitReports } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Foydalanuvchi ID ko'rsatilmadi" },
        { status: 400 }
      );
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        ...(role !== undefined ? { role } : {}),
        ...(jobTitle !== undefined ? { jobTitle } : {}),
        ...(canCreateGroup !== undefined ? { canCreateGroup: Boolean(canCreateGroup) } : {}),
        ...(canAcceptDirectives !== undefined ? { canAcceptDirectives: Boolean(canAcceptDirectives) } : {}),
        ...(canSubmitReports !== undefined ? { canSubmitReports: Boolean(canSubmitReports) } : {}),
      },
    });

    return NextResponse.json({
      message: `${updatedUser.fullName || updatedUser.email} uchun huquqlar va rol muvaffaqiyatli saqlandi.`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Admin Update User Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
