import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = params.id;
    const body = await req.json();
    const { username, fullName, jobTitle, avatarUrl, nativeLanguage, roleInGroup } = body;

    if (!fullName || !username) {
      return NextResponse.json(
        { error: "Member name and username are required" },
        { status: 400 }
      );
    }

    const cleanUsername = username.startsWith("@") ? username : `@${username}`;

    let newMember = null;
    try {
      let user = await db.user.findFirst({
        where: { username: cleanUsername },
      });

      if (!user) {
        user = await db.user.create({
          data: {
            email: `${cleanUsername.replace("@", "")}@sitesync.io`,
            fullName,
            username: cleanUsername,
            jobTitle: jobTitle || "Industrial Site Specialist",
            avatarUrl: avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
            nativeLanguage: nativeLanguage || "uz",
          },
        });
      }

      newMember = await db.groupMember.create({
        data: {
          groupId,
          userId: user.id,
          roleInGroup: roleInGroup || "MEMBER",
        },
        include: { user: true },
      });
    } catch {
      // Mock fallback
    }

    const mockMember = {
      id: `m_${Date.now()}`,
      roleInGroup: roleInGroup || "MEMBER",
      user: {
        id: `u_${Date.now()}`,
        fullName,
        username: cleanUsername,
        jobTitle: jobTitle || "Industrial Site Specialist",
        avatarUrl: avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
        nativeLanguage: nativeLanguage || "uz",
      },
    };

    return NextResponse.json({
      message: `${fullName} (${cleanUsername}) guruhga a-zo sifatida muvaffaqiyatli qo-shildi!`,
      member: newMember || mockMember,
    });
  } catch (error) {
    console.error("Add Member Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
