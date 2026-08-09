import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, fullName, googleId, avatarUrl, nativeLanguage } = body;

    if (!email || !fullName) {
      return NextResponse.json(
        { error: "Google email and full name are required" },
        { status: 400 }
      );
    }

    const cleanUsername = `@${email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    const generatedGoogleId = googleId || `google_${Date.now()}`;

    // Upsert Google user into PostgreSQL database
    const user = await db.user.upsert({
      where: { email },
      update: {
        fullName,
        googleId: generatedGoogleId,
        authProvider: "GOOGLE",
        avatarUrl: avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      },
      create: {
        email,
        fullName,
        username: cleanUsername,
        googleId: generatedGoogleId,
        authProvider: "GOOGLE",
        jobTitle: "Site Engineer",
        nativeLanguage: nativeLanguage || "uz",
        avatarUrl: avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      },
    });

    return NextResponse.json({
      message: "Google OAuth registration successful.",
      user,
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    return NextResponse.json(
      { error: "Internal server error during Google Sign-In" },
      { status: 500 }
    );
  }
}
