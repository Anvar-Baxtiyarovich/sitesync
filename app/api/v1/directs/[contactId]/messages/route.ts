import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { translateGroupChatMessage } from "@/lib/translation";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { contactId: string } }
) {
  try {
    const contactId = params.contactId;
    const currentUser = await db.user.findFirst({ where: { email: "anvar@sitesync.io" } });

    if (!currentUser) {
      return NextResponse.json({ messages: [] });
    }

    const messages = await db.directMessage.findMany({
      where: {
        OR: [
          { senderId: currentUser.id, receiverId: contactId },
          { senderId: contactId, receiverId: currentUser.id },
        ],
      },
      orderBy: { createdAt: "asc" },
      include: { sender: true, receiver: true },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Fetch Direct Messages Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { contactId: string } }
) {
  try {
    const contactId = params.contactId;
    const body = await req.json();
    const {
      sourceLanguage,
      contentRaw,
      attachmentsJson,
      fileUrl,
      fileName,
      fileType,
      fileSize,
    } = body;

    const filesList = attachmentsJson || (fileUrl ? [{ url: fileUrl, name: fileName, type: fileType, size: fileSize }] : []);
    const messageText = contentRaw || (filesList.length > 0 ? `[${filesList.length} ta fayl biriktirildi]` : '');

    if (!messageText && filesList.length === 0) {
      return NextResponse.json(
        { error: "Message content or file attachment is required" },
        { status: 400 }
      );
    }

    const currentUser = await db.user.findFirst({ where: { email: "anvar@sitesync.io" } });
    if (!currentUser) {
      return NextResponse.json({ error: "Current user not found" }, { status: 404 });
    }

    const lang = sourceLanguage || currentUser.nativeLanguage || "uz";
    const translations = messageText ? await translateGroupChatMessage(messageText, lang) : { uz: '', ru: '', en: '', zh: '' };

    const directMsg = await db.directMessage.create({
      data: {
        senderId: currentUser.id,
        receiverId: contactId,
        sourceLanguage: lang,
        contentRaw: messageText,
        translationsJson: translations as any,
        attachmentsJson: filesList.length > 0 ? (filesList as any) : undefined,
        fileUrl: filesList[0]?.url,
        fileName: filesList[0]?.name,
        fileType: filesList[0]?.type,
        fileSize: filesList[0]?.size,
      },
      include: { sender: true, receiver: true },
    });

    return NextResponse.json({
      message: "Direct message sent and translated.",
      directMessage: directMsg,
    });
  } catch (error) {
    console.error("Send Direct Message Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
