import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { translateGroupChatMessage } from "@/lib/translation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";

export const dynamic = "force-dynamic";

async function ensureGroupAndUserExist(
  groupId: string,
  authorName: string,
  authorJob: string,
  authorAvatar: string,
  lang: string,
  sessionUserEmail?: string | null
) {
  // 1. Ensure Project Group exists in PostgreSQL DB
  await db.projectGroup.upsert({
    where: { id: groupId },
    update: {},
    create: {
      id: groupId,
      name: "Dashtobod Wind Turbine EPC Team 🌬️",
      code: "SYNC-WIND-88",
      description: "Cross-lingual project workspace for Wind Plant Zone B construction.",
    },
  });

  let user = null;
  if (sessionUserEmail) {
    user = await db.user.findUnique({ where: { email: sessionUserEmail } });
  }

  if (!user && authorName) {
    user = await db.user.findFirst({
      where: {
        OR: [
          { fullName: authorName },
          { username: `@${authorName.toLowerCase().replace(/[^a-z0-9]/g, "_")}` },
        ],
      },
    });
  }

  if (!user) {
    user = await db.user.findFirst({ orderBy: { createdAt: "asc" } });
  }

  if (!user) {
    const email = `specialist_${Date.now()}@sitesync.io`;
    user = await db.user.create({
      data: {
        email,
        fullName: authorName || "Site Specialist",
        username: `@user_${Date.now().toString().slice(-4)}`,
        jobTitle: authorJob || "Team Member",
        avatarUrl: authorAvatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        nativeLanguage: lang || "uz",
      },
    });
  }

  // 3. Ensure User is a member of the group
  try {
    await db.groupMember.upsert({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
      update: {},
      create: {
        groupId,
        userId: user.id,
        roleInGroup: "MEMBER",
      },
    });
  } catch {
    // Junction constraint ignored if already exists
  }

  return user;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = params.id;
    
    // Ensure default group and sample messages exist in DB if empty
    let messages = await db.groupMessage.findMany({
      where: { groupId },
      orderBy: { createdAt: "asc" },
      include: { author: true },
    });

    if (messages.length === 0) {
      // Seed default conversation directly into PostgreSQL DB
      const userZh = await ensureGroupAndUserExist(groupId, "Li Wei (李伟)", "EPC Project Director", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150", "zh");
      const userUz = await ensureGroupAndUserExist(groupId, "Anvar Khudoyberdiev", "Site Manager", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", "uz");
      const userEn = await ensureGroupAndUserExist(groupId, "Sarah Jenkins", "QA/QC Lead Engineer", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", "en");

      await db.groupMessage.createMany({
        data: [
          {
            groupId,
            authorId: userZh.id,
            sourceLanguage: "zh",
            contentRaw: "大家好！4号风机的基础混凝土浇筑今天完成了吗？",
            translationsJson: {
              zh: "大家好！4号风机的基础混凝土浇筑今天完成了吗？",
              en: "Hello everyone! Did we finish the foundation concrete pour for turbine #4 today?",
              uz: "Barchaga salom! Bugun 4-turbina poydevoriga beton quyish yakunlandimi?",
              ru: "Всем привет! Завершили ли сегодня заливку бетона под фундамент турбины №4?",
            },
          },
          {
            groupId,
            authorId: userUz.id,
            sourceLanguage: "uz",
            contentRaw: "Ha, 4-turbina poydevori soat 18:00 da to-liq betonlab bo-lindi! 10 tonna sement ishlatildi.",
            translationsJson: {
              uz: "Ha, 4-turbina poydevori soat 18:00 da to-liq betonlab bo-lindi! 10 tonna sement ishlatildi.",
              en: "Yes, the foundation for turbine #4 was fully poured by 18:00! 10 tons of cement used.",
              zh: "是的，4号风机基础在18:00前已完成浇筑！共使用了10吨水泥。",
              ru: "Да, фундамент турбины №4 был полностью залит к 18:00! Использовано 10 тонн цемента.",
            },
          },
          {
            groupId,
            authorId: userEn.id,
            sourceLanguage: "en",
            contentRaw: "Great progress! What about the high wind delay reported earlier on the crane?",
            translationsJson: {
              en: "Great progress! What about the high wind delay reported earlier on the crane?",
              zh: "太棒了！之前报告的起重机因强风暂停作业的情况怎么样了？",
              uz: "Ajoyib natija! Kran shamol sababli to-xtatilganligi haqida avvalroq berilgan ogohlantirish bo-yicha ahvol qanday?",
              ru: "Отличный прогресс! А что насчет задержки крана из-за сильного ветра, о которой сообщалось ранее?",
            },
          },
        ],
      });

      // Refetch seeded messages from DB
      messages = await db.groupMessage.findMany({
        where: { groupId },
        orderBy: { createdAt: "asc" },
        include: { author: true },
      });
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Fetch Group Messages Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Ruxsat etilmadi. Seans mavjud emas." },
        { status: 401 }
      );
    }

    const groupId = params.id;
    const body = await req.json();
    const {
      authorName,
      authorJob,
      authorAvatar,
      sourceLanguage,
      contentRaw,
      fileUrl,
      fileName,
      fileType,
      fileSize,
      attachmentsJson,
    } = body;

    const filesList = attachmentsJson || (fileUrl ? [{ url: fileUrl, name: fileName, type: fileType, size: fileSize }] : []);
    const messageText = contentRaw || (filesList.length > 0 ? `[${filesList.length} ta fayl biriktirildi]` : '');

    if (!messageText && filesList.length === 0) {
      return NextResponse.json(
        { error: "Message content or file attachment is required" },
        { status: 400 }
      );
    }

    const lang = sourceLanguage || "uz";
    const translations = messageText ? await translateGroupChatMessage(messageText, lang) : { uz: '', ru: '', en: '', zh: '' };

    // Guarantee DB Group & User exist in PostgreSQL
    const authorUser = await ensureGroupAndUserExist(
      groupId,
      authorName || "Site Manager",
      authorJob || "Field Specialist",
      authorAvatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      lang,
      session?.user?.email
    );

    // Persist message strictly into PostgreSQL Database
    const savedMsg = await db.groupMessage.create({
      data: {
        groupId,
        authorId: authorUser.id,
        sourceLanguage: lang,
        contentRaw: messageText,
        translationsJson: translations as any,
        attachmentsJson: filesList.length > 0 ? (filesList as any) : undefined,
        fileUrl: filesList[0]?.url,
        fileName: filesList[0]?.name,
        fileType: filesList[0]?.type,
        fileSize: filesList[0]?.size,
      },
      include: { author: true },
    });

    // Trigger Pusher WebSocket Event
    await pusherServer.trigger(`group-${groupId}`, "new-message", savedMsg);

    return NextResponse.json({
      message: "Message saved to PostgreSQL and auto-translated for all group members.",
      groupMessage: savedMsg,
    });
  } catch (error) {
    console.error("Send Group Message Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
