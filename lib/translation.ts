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

// Google Translate Lang Code Mapper
const GOOGLE_LANG_MAP: Record<string, string> = {
  uz: "uz",
  ru: "ru",
  en: "en",
  zh: "zh-CN",
};

/**
 * 100% Free Google Translate Web Engine (No API key or credit card needed)
 */
async function translateWithGoogleFree(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  if (!text || !text.trim()) return "";
  const src = GOOGLE_LANG_MAP[sourceLang.toLowerCase()] || sourceLang;
  const tgt = GOOGLE_LANG_MAP[targetLang.toLowerCase()] || targetLang;

  if (src === tgt) return text;

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${src}&tl=${tgt}&dt=t&q=${encodeURIComponent(
      text
    )}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translatedParts = data[0]
          .map((part: any) => (Array.isArray(part) ? part[0] : ""))
          .join("");
        return translatedParts || text;
      }
    }
  } catch (err) {
    console.warn(`⚠️ Google Free Translate error (${src} -> ${tgt}):`, (err as any).message);
  }
  return text;
}

/**
 * Optional: Hugging Face Free Inference API Call for NLLB-600M
 */
async function translateWithHuggingFaceApi(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string | null> {
  const hfToken = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;
  if (!hfToken) return null;

  try {
    const res = await fetch(
      "https://api-inference.huggingface.co/models/facebook/nllb-200-distilled-600M",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: text,
          parameters: {
            src_lang: sourceLang === "uz" ? "uzn_Latn" : sourceLang === "ru" ? "rus_Cyrl" : "eng_Latn",
            tgt_lang: targetLang === "zh" ? "zho_Hans" : targetLang === "ru" ? "rus_Cyrl" : targetLang === "uz" ? "uzn_Latn" : "eng_Latn",
          },
        }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.translation_text) {
        return data[0].translation_text;
      }
    }
  } catch (err) {
    console.warn("⚠️ Hugging Face API error:", (err as any).message);
  }
  return null;
}

/**
 * Optional: Self-Hosted NLLB Server Call
 */
async function callNllbServer(
  text: string,
  sourceLang: string,
  targetLangs: string[]
): Promise<Record<string, string> | null> {
  const serverUrl = process.env.NLLB_SERVER_URL;
  if (!serverUrl) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${serverUrl}/translate`, {
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
  } catch {
    // Server not available
  }
  return null;
}

/**
 * Process Industrial Daily Site Reports (UZ/RU -> EN & ZH)
 * Priority order:
 * 1. Self-hosted NLLB Server (if URL set)
 * 2. OpenAI GPT-4o-mini (if API key set)
 * 3. 100% Free Google Translate Engine (Default zero-cost solution on Vercel)
 */
export async function processIndustrialTranslation(
  input: TranslationInput
): Promise<TranslationOutput> {
  const sourceLang = input.sourceLang || "uz";

  // 1. Try NLLB Server if configured
  if (process.env.NLLB_SERVER_URL) {
    const tasksTrans = await callNllbServer(input.tasks, sourceLang, ["en", "zh"]);
    if (tasksTrans) {
      const equipTrans = input.equipment ? await callNllbServer(input.equipment, sourceLang, ["en", "zh"]) : null;
      const issueTrans = input.issues ? await callNllbServer(input.issues, sourceLang, ["en", "zh"]) : null;
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
  }

  // 2. Try OpenAI if API Key present
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && !apiKey.includes("your-openai-key")) {
    try {
      const openai = new OpenAI({ apiKey });
      const systemPrompt = `You are an expert industrial construction translator.
Translate the daily site logs from ${sourceLang.toUpperCase()} into English (en) and Simplified Chinese (zh-CN).
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
      console.warn("OpenAI Error, falling back to Free Google Translate:", (err as any).message);
    }
  }

  // 3. 100% Free Google Translate Engine (Default for Vercel deployment with $0 budget)
  const [tasksEn, tasksZh] = await Promise.all([
    translateWithGoogleFree(input.tasks, sourceLang, "en"),
    translateWithGoogleFree(input.tasks, sourceLang, "zh"),
  ]);

  const [equipEn, equipZh] = input.equipment
    ? await Promise.all([
        translateWithGoogleFree(input.equipment, sourceLang, "en"),
        translateWithGoogleFree(input.equipment, sourceLang, "zh"),
      ])
    : ["N/A", "无设备进场"];

  const [issueEn, issueZh] = input.issues
    ? await Promise.all([
        translateWithGoogleFree(input.issues, sourceLang, "en"),
        translateWithGoogleFree(input.issues, sourceLang, "zh"),
      ])
    : ["No issues reported", "无异常"];

  return {
    en: {
      tasks: tasksEn,
      equipment: equipEn,
      issues: issueEn,
    },
    zh: {
      tasks: tasksZh,
      equipment: equipZh,
      issues: issueZh,
    },
  };
}

/**
 * Smart Multi-Lingual Chat Message Translation (UZ, RU, EN, ZH)
 * Priority order:
 * 1. Self-hosted NLLB Server (if URL set)
 * 2. OpenAI (if API key set)
 * 3. 100% Free Google Translate Engine (Default for Vercel deployment)
 */
export async function translateGroupChatMessage(
  text: string,
  sourceLang: string
): Promise<GroupMessageTranslations> {
  const src = sourceLang.toLowerCase();

  // 1. Try NLLB Server if configured
  if (process.env.NLLB_SERVER_URL) {
    const targetLangs = ["uz", "ru", "en", "zh"].filter((l) => l !== src);
    const nllbRes = await callNllbServer(text, src, targetLangs);
    if (nllbRes) {
      return {
        uz: src === "uz" ? text : nllbRes.uz || text,
        ru: src === "ru" ? text : nllbRes.ru || text,
        en: src === "en" ? text : nllbRes.en || text,
        zh: src === "zh" ? text : nllbRes.zh || text,
      };
    }
  }

  // 2. Try OpenAI if API Key present
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
            content: `Translate message from ${src.toUpperCase()} into Uzbek (uz), Russian (ru), English (en), and Simplified Chinese (zh). Return strict JSON with keys: "uz", "ru", "en", "zh".`,
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
      console.warn("OpenAI Chat Error, falling back to Free Engine:", (err as any).message);
    }
  }

  // 3. 100% Free Google Translate Engine (Fast parallel translations)
  const targets = ["uz", "ru", "en", "zh"] as const;
  const results: Record<string, string> = { uz: text, ru: text, en: text, zh: text };

  await Promise.all(
    targets.map(async (t) => {
      if (t !== src) {
        results[t] = await translateWithGoogleFree(text, src, t);
      }
    })
  );

  return {
    uz: results.uz,
    ru: results.ru,
    en: results.en,
    zh: results.zh,
  };
}
