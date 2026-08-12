import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return await db.user.findUnique({
    where: { email: session.user.email },
  });
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      const firstUser = await db.user.findFirst({ orderBy: { createdAt: "asc" } });
      return NextResponse.json({ user: firstUser });
    }
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Fetch Profile Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { email, fullName, username, jobTitle, avatarUrl, nativeLanguage } = body;

    const userEmail = session?.user?.email || email;

    if (!userEmail || !fullName || !username) {
      return NextResponse.json(
        { error: "Email, Full Name, and Username are required" },
        { status: 400 }
      );
    }

    const cleanUsername = username.startsWith("@") ? username : `@${username}`;

    const user = await db.user.upsert({
      where: { email: userEmail },
      update: {
        fullName,
        username: cleanUsername,
        jobTitle: jobTitle || "Industrial Site Specialist",
        avatarUrl: avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        nativeLanguage: nativeLanguage || "uz",
      },
      create: {
        email: userEmail,
        fullName,
        username: cleanUsername,
        jobTitle: jobTitle || "Industrial Site Specialist",
        avatarUrl: avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        nativeLanguage: nativeLanguage || "uz",
      },
    });

    return NextResponse.json({
      message: "Profile saved successfully.",
      user,
    });
  } catch (error) {
    console.error("Save Profile Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
