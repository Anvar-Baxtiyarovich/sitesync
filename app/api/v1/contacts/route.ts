import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });
    if (user) return user;
  }
  return await db.user.findFirst({
    orderBy: { createdAt: "asc" },
  });
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ contacts: [] });
    }

    let contacts = await db.userContact.findMany({
      where: { userId: currentUser.id },
      include: { contact: true },
      orderBy: { createdAt: "desc" },
    });

    if (contacts.length === 0) {
      const otherUsers = await db.user.findMany({
        where: { id: { not: currentUser.id } },
      });

      for (const other of otherUsers) {
        try {
          await db.userContact.create({
            data: {
              userId: currentUser.id,
              contactId: other.id,
            },
          });
        } catch {
          // Ignore duplicate constraint if exists
        }
      }

      contacts = await db.userContact.findMany({
        where: { userId: currentUser.id },
        include: { contact: true },
        orderBy: { createdAt: "desc" },
      });
    }

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
