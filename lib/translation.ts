import OpenAI from "openai";

export interface TranslationInput {
  sourceLang: string; // "uz" or "ru"
  tasks: string;
  equipment?: string;
  issues?: string;
}

export interface TranslationOutput {
  en: {
    tasks: string;
    equipment: string;
    issues: string;
  };
  zh: {
    tasks: string;
    equipment: string;
    issues: string;
  };
}

export interface GroupMessageTranslations {
  uz: string;
  ru: string;
  en: string;
  zh: string;
}

const NLLB_SERVER_URL = process.env.NLLB_SERVER_URL || "http://localhost:8000";

/**
 * Call self-hosted NLLB FastAPI translation server
 */
async function callNllbServer(
  text: string,
  sourceLang: string,
  targetLangs: string[]
): Promise<Record<string, string> | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const res = await fetch(`${NLLB_SERVER_URL}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        source_lang: sourceLang,
        target_langs: targetLangs,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return data.translations || null;
    }
  } catch (err) {
    console.warn(`⚠️ NLLB Server unreachable (${NLLB_SERVER_URL}), falling back to alternative engine. Error:`, (err as any).message);
  }
  return null;
}

/**
 * Process Industrial Daily Site Reports (UZ/RU -> EN & ZH)
 */
export async function processIndustrialTranslation(
  input: TranslationInput
): Promise<TranslationOutput> {
  const targetLangs = ["en", "zh"];

  // 1. Attempt NLLB self-hosted translation first
  const tasksTrans = await callNllbServer(input.tasks, input.sourceLang, targetLangs);
  const equipTrans = input.equipment ? await callNllbServer(input.equipment, input.sourceLang, targetLangs) : null;
  const issueTrans = input.issues ? await callNllbServer(input.issues, input.sourceLang, targetLangs) : null;

  if (tasksTrans) {
    return {
      en: {
        tasks: tasksTrans.en || input.tasks,
        equipment: equipTrans?.en || (input.equipment ? input.equipment : "N/A"),
        issues: issueTrans?.en || (input.issues ? input.issues : "No issues reported"),
      },
      zh: {
        tasks: tasksTrans.zh || input.tasks,
        equipment: equipTrans?.zh || (input.equipment ? input.equipment : "无设备进场"),
        issues: issueTrans?.zh || (input.issues ? input.issues : "无异常"),
      },
    };
  }

  // 2. Fallback to OpenAI if configured
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && !apiKey.includes("your-openai-key")) {
    try {
      const openai = new OpenAI({ apiKey });
      const systemPrompt = `You are an expert industrial construction and civil engineering translator.
Translate the daily site logs from ${input.sourceLang.toUpperCase()} into English (en) and Simplified Chinese (zh-CN).
Output strictly valid JSON with exact keys "en" and "zh", each containing "tasks", "equipment", and "issues".`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: JSON.stringify({
              tasks: input.tasks,
              equipment: input.equipment || "",
              issues: input.issues || "",
            }),
          },
        ],
        temperature: 0.1,
      });

      const parsed = JSON.parse(response.choices[0].message.content || "{}");
      return parsed as TranslationOutput;
    } catch (err) {
      console.error("OpenAI Fallback Error:", err);
    }
  }

  // 3. Mock fallback for local dev mode when no translation engine is live
  return {
    en: {
      tasks: `[NLLB Mock EN] ${input.tasks}`,
      equipment: input.equipment ? `[NLLB Mock EN] ${input.equipment}` : "N/A",
      issues: input.issues ? `[NLLB Mock EN] ${input.issues}` : "No issues reported",
    },
    zh: {
      tasks: `[NLLB Mock 中文] ${input.tasks}`,
      equipment: input.equipment ? `[NLLB Mock 中文] ${input.equipment}` : "无设备进场",
      issues: input.issues ? `[NLLB Mock 中文] ${input.issues}` : "无异常",
    },
  };
}

/**
 * Smart Group Chat 4-Way Multi-lingual Translation (UZ, RU, EN, ZH)
 */
export async function translateGroupChatMessage(
  text: string,
  sourceLang: string
): Promise<GroupMessageTranslations> {
  const allLangs = ["uz", "ru", "en", "zh"];
  const targetLangs = allLangs.filter((l) => l !== sourceLang.toLowerCase());

  // 1. Attempt NLLB FastAPI translation
  const nllbResults = await callNllbServer(text, sourceLang, targetLangs);

  if (nllbResults) {
    return {
      uz: sourceLang === "uz" ? text : nllbResults.uz || text,
      ru: sourceLang === "ru" ? text : nllbResults.ru || text,
      en: sourceLang === "en" ? text : nllbResults.en || text,
      zh: sourceLang === "zh" ? text : nllbResults.zh || text,
    };
  }

  // 2. OpenAI Fallback
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && !apiKey.includes("your-openai-key")) {
    try {
      const openai = new OpenAI({ apiKey });
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are an industrial construction AI translator. Translate from ${sourceLang.toUpperCase()} simultaneously into Uzbek (uz), Russian (ru), English (en), and Simplified Chinese (zh). Return strict JSON with keys: "uz", "ru", "en", "zh".`,
          },
          { role: "user", content: text },
        ],
        temperature: 0.1,
      });

      const parsed = JSON.parse(response.choices[0].message.content || "{}");
      return {
        uz: parsed.uz || text,
        ru: parsed.ru || text,
        en: parsed.en || text,
        zh: parsed.zh || text,
      };
    } catch (err) {
      console.error("OpenAI Chat Translation Fallback Error:", err);
    }
  }

  // 3. Mock Dev Fallback
  return {
    uz: sourceLang === "uz" ? text : `[NLLB-UZ] ${text}`,
    ru: sourceLang === "ru" ? text : `[NLLB-RU] ${text}`,
    en: sourceLang === "en" ? text : `[NLLB-EN] ${text}`,
    zh: sourceLang === "zh" ? text : `[NLLB-ZH] ${text}`,
  };
}
