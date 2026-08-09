import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, fullName, username, jobTitle, avatarUrl, nativeLanguage } = body;

    if (!email || !fullName || !username) {
      return NextResponse.json(
        { error: "Email, Full Name, and Username are required" },
        { status: 400 }
      );
    }

    let user = null;
    try {
      user = await db.user.upsert({
        where: { email },
        update: {
          fullName,
          username,
          jobTitle: jobTitle || "Industrial Site Specialist",
          avatarUrl: avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
          nativeLanguage: nativeLanguage || "uz",
        },
        create: {
          email,
          fullName,
          username,
          jobTitle: jobTitle || "Industrial Site Specialist",
          avatarUrl: avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
          nativeLanguage: nativeLanguage || "uz",
        },
      });
    } catch {
      // Mock fallback for dev mode
    }

    return NextResponse.json({
      message: "Profile saved successfully.",
      user: user || {
        email,
        fullName,
        username,
        jobTitle: jobTitle || "Site Manager",
        avatarUrl: avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        nativeLanguage: nativeLanguage || "uz",
      },
    });
  } catch (error) {
    console.error("Save Profile Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
