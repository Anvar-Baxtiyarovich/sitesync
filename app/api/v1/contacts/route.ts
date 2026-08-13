import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureDefaultPersonnelSeeded } from "@/lib/seed-users";

export const dynamic = "force-dynamic";

async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return await db.user.findUnique({
    where: { email: session.user.email },
  });
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ contacts: [] });
    }

    const contacts = await db.userContact.findMany({
      where: { userId: currentUser.id },
      include: { contact: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error("Fetch Contacts Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, fullName, username, jobTitle, nativeLanguage } = body;

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Current user not found" }, { status: 404 });
    }

    let targetUser = null;
    if (query) {
      const cleanQuery = query.trim().toLowerCase().replace("@", "");
      targetUser = await db.user.findFirst({
        where: {
          OR: [
            { email: { equals: query.trim().toLowerCase(), mode: "insensitive" } },
            { username: { contains: cleanQuery, mode: "insensitive" } },
            { email: { contains: cleanQuery, mode: "insensitive" } },
            { fullName: { contains: cleanQuery, mode: "insensitive" } },
          ],
        },
      });
    }

    if (!targetUser && username) {
      const u = username.startsWith("@") ? username : `@${username}`;
      const email = `${username.toLowerCase().replace("@", "")}@user.local`;

      targetUser = await db.user.upsert({
        where: { email },
        update: { fullName: fullName || "Specialist", jobTitle: jobTitle || "Field Engineer", nativeLanguage: nativeLanguage || "uz" },
        create: { email, username: u, fullName: fullName || "Specialist", jobTitle: jobTitle || "Field Engineer", nativeLanguage: nativeLanguage || "uz", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" },
      });
    }

    if (!targetUser && query) {
      const cleanQuery = query.trim();
      const isEmail = cleanQuery.includes("@");
      const email = isEmail ? cleanQuery.toLowerCase() : `${cleanQuery.toLowerCase().replace("@", "")}@sitesync.io`;
      const u = cleanQuery.startsWith("@") ? cleanQuery : `@${cleanQuery.toLowerCase().replace("@", "")}`;
      const formattedName = isEmail ? cleanQuery.split("@")[0] : cleanQuery;

      targetUser = await db.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          username: u,
          fullName: formattedName,
          jobTitle: "Project Specialist",
          nativeLanguage: "uz",
          avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
        },
      });
    }

    if (!targetUser) {
      return NextResponse.json(
        { error: "Foydalanuvchi topilmadi. Qaytatdan urinib ko'ring." },
        { status: 404 }
      );
    }

    if (targetUser.id === currentUser.id) {
      return NextResponse.json(
        { error: "O'zingizni kontaktlarga qo'sha olmaysiz." },
        { status: 400 }
      );
    }

    const contactEntry = await db.userContact.upsert({
      where: {
        userId_contactId: {
          userId: currentUser.id,
          contactId: targetUser.id,
        },
      },
      update: {},
      create: {
        userId: currentUser.id,
        contactId: targetUser.id,
      },
      include: { contact: true },
    });

    // Create mutual contact link so added friend also sees caller in contacts
    try {
      await db.userContact.upsert({
        where: {
          userId_contactId: {
            userId: targetUser.id,
            contactId: currentUser.id,
          },
        },
        update: {},
        create: {
          userId: targetUser.id,
          contactId: currentUser.id,
        },
      });
    } catch {
      // Ignore if junction exists
    }

    return NextResponse.json({
      message: "Foydalanuvchi kontaktlaringizga muvaffaqiyatli qo'shildi!",
      contact: contactEntry,
    });
  } catch (error) {
    console.error("Add Contact Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get("contactId");

    const currentUser = await getCurrentUser();
    if (!currentUser || !contactId) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    await db.userContact.deleteMany({
      where: {
        userId: currentUser.id,
        contactId,
      },
    });

    return NextResponse.json({ message: "Kontakt o'chirildi." });
  } catch (error) {
    console.error("Delete Contact Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
