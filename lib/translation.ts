import OpenAI from "openai";

let openaiSingleton: OpenAI | null = null;
let activeProviderKey: string = "";

function getOpenAi(): { client: OpenAI; model: string } | null {
  const currentKey = `${process.env.DEEPSEEK_API_KEY}-${process.env.QWEN_API_KEY}-${process.env.GROQ_API_KEY}-${process.env.OPENAI_API_KEY}`;
  
  if (openaiSingleton && activeProviderKey === currentKey) {
    if (process.env.DEEPSEEK_API_KEY) return { client: openaiSingleton, model: "deepseek-chat" };
    if (process.env.QWEN_API_KEY) return { client: openaiSingleton, model: "qwen-plus" };
    if (process.env.GROQ_API_KEY) return { client: openaiSingleton, model: "llama-3.3-70b-versatile" };
    if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes("your-openai-key")) {
      return { client: openaiSingleton, model: "gpt-4o-mini" };
    }
  }

  activeProviderKey = currentKey;

  // 1. DeepSeek API (Top recommendation for Chinese translation & ultra-cheap)
  if (process.env.DEEPSEEK_API_KEY) {
    openaiSingleton = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com",
    });
    return { client: openaiSingleton, model: "deepseek-chat" };
  }

  // 2. Qwen (Alibaba DashScope OpenAI Compatible Mode)
  if (process.env.QWEN_API_KEY) {
    openaiSingleton = new OpenAI({
      apiKey: process.env.QWEN_API_KEY,
      baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    });
    return { client: openaiSingleton, model: "qwen-plus" };
  }

  // 3. Groq Cloud Free API
  if (process.env.GROQ_API_KEY) {
    openaiSingleton = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });
    return { client: openaiSingleton, model: "llama-3.3-70b-versatile" };
  }

  // 4. OpenAI API
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && !apiKey.includes("your-openai-key")) {
    openaiSingleton = new OpenAI({ apiKey });
    return { client: openaiSingleton, model: "gpt-4o-mini" };
  }

  return null;
}

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

// Lang Code Mappers
const GOOGLE_LANG_MAP: Record<string, string> = {
  uz: "uz",
  ru: "ru",
  en: "en",
  zh: "zh-CN",
};

const DEEPL_LANG_MAP: Record<string, string> = {
  en: "EN-US",
  zh: "ZH",
  ru: "RU",
};

const NLLB_LANG_MAP: Record<string, string> = {
  uz: "uzn_Latn",
  ru: "rus_Cyrl",
  en: "eng_Latn",
  zh: "zho_Hans",
};

/**
 * Tier 1: Self-Hosted NLLB Server Call
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
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${serverUrl}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.NLLB_API_KEY || "nllb_secret_key_123",
      },
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
  } catch (err: any) {
    console.warn("⚠️ Self-Hosted NLLB Server unavailable:", err.message);
  }
  return null;
}

/**
 * Tier 2: Hugging Face Inference API for NLLB-600M
 */
async function translateWithHuggingFaceApi(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string | null> {
  const hfToken = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;
  if (!hfToken) return null;

  try {
    const src = NLLB_LANG_MAP[sourceLang] || "eng_Latn";
    const tgt = NLLB_LANG_MAP[targetLang] || "eng_Latn";

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
          parameters: { src_lang: src, tgt_lang: tgt },
        }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.translation_text) {
        return data[0].translation_text;
      }
    }
  } catch (err: any) {
    console.warn("⚠️ Hugging Face NLLB Error:", err.message);
  }
  return null;
}

/**
 * Tier 3: DeepL Free API (EN, ZH, RU)
 */
async function translateWithDeepL(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string | null> {
  const deeplKey = process.env.DEEPL_API_KEY;
  if (!deeplKey) return null;

  const tgt = DEEPL_LANG_MAP[targetLang.toLowerCase()];
  if (!tgt) return null;

  try {
    const res = await fetch("https://api-free.deepl.com/v2/translate", {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${deeplKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: [text],
        target_lang: tgt,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.translations?.[0]?.text) {
        return data.translations[0].text;
      }
    }
  } catch (err: any) {
    console.warn("⚠️ DeepL Free API Error:", err.message);
  }
  return null;
}

/**
 * Tier 4: MyMemory Translation API (Free tier up to 10k words/day)
 */
async function translateWithMyMemory(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string | null> {
  try {
    const emailParam = process.env.MYMEMORY_EMAIL
      ? `&de=${encodeURIComponent(process.env.MYMEMORY_EMAIL)}`
      : "";
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text
    )}&langpair=${sourceLang}|${targetLang}${emailParam}`;

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.responseData?.translatedText && data.responseStatus === 200) {
        const trans = data.responseData.translatedText;
        if (trans && !trans.includes("MYMEMORY WARNING")) {
          return trans;
        }
      }
    }
  } catch (err: any) {
    console.warn("⚠️ MyMemory API Error:", err.message);
  }
  return null;
}

/**
 * Tier 5: 100% Free Google Translate Web Engine (GTX Client)
 */
async function translateWithGoogleFree(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string | null> {
  const src = GOOGLE_LANG_MAP[sourceLang.toLowerCase()] || sourceLang;
  const tgt = GOOGLE_LANG_MAP[targetLang.toLowerCase()] || targetLang;

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
        if (translatedParts) return translatedParts;
      }
    }
  } catch (err: any) {
    console.warn(`⚠️ Google GTX Engine Error (${src} -> ${tgt}):`, err.message);
  }
  return null;
}

/**
 * Tier 6: Lingva Open-Source Google Proxy Engine (Fallback Web API)
 */
async function translateWithLingva(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string | null> {
  const src = GOOGLE_LANG_MAP[sourceLang.toLowerCase()] || sourceLang;
  const tgt = GOOGLE_LANG_MAP[targetLang.toLowerCase()] || targetLang;

  try {
    const url = `https://lingva.ml/api/v1/${src}/${tgt}/${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data?.translation) {
        return data.translation;
      }
    }
  } catch (err: any) {
    console.warn(`⚠️ Lingva Proxy Engine Error (${src} -> ${tgt}):`, err.message);
  }
  return null;
}

/**
 * Multi-Tier Waterfall Translation Strategy for single text block
 */
export async function translateTextWaterfall(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  if (!text || !text.trim()) return "";
  const src = sourceLang.toLowerCase();
  const tgt = targetLang.toLowerCase();
  if (src === tgt) return text;

  // 1. Try Hugging Face NLLB API
  const hfResult = await translateWithHuggingFaceApi(text, src, tgt);
  if (hfResult) return hfResult;

  // 2. Try DeepL API (if key available)
  const deeplResult = await translateWithDeepL(text, src, tgt);
  if (deeplResult) return deeplResult;

  // 3. Try MyMemory API
  const myMemoryResult = await translateWithMyMemory(text, src, tgt);
  if (myMemoryResult) return myMemoryResult;

  // 4. Try Google GTX Web Engine
  const googleResult = await translateWithGoogleFree(text, src, tgt);
  if (googleResult) return googleResult;

  // 5. Try Lingva Proxy Engine
  const lingvaResult = await translateWithLingva(text, src, tgt);
  if (lingvaResult) return lingvaResult;

  // Fallback to original text if all tiers exhausted
  return text;
}

/**
 * Process Industrial Daily Site Reports (UZ/RU -> EN & ZH)
 * Priority Multi-Tier Cascade Order:
 * 1. Self-hosted NLLB Server
 * 2. OpenAI / Groq Cloud AI
 * 3. Multi-Tier Free Waterfall Cascade (HuggingFace -> DeepL -> MyMemory -> Google -> Lingva)
 */
export async function processIndustrialTranslation(
  input: TranslationInput
): Promise<TranslationOutput> {
  const sourceLang = input.sourceLang || "uz";

  // 1. Try Self-hosted NLLB Server
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

  // 2. Try Cloud AI (DeepSeek / Qwen / Groq / OpenAI)
  const openaiInstance = getOpenAi();
  if (openaiInstance) {
    try {
      const systemPrompt = `You are an expert industrial construction translator.
Translate daily site logs from ${sourceLang.toUpperCase()} into English (en) and Simplified Chinese (zh-CN).
Output strictly valid JSON with exact keys "en" and "zh", each containing "tasks", "equipment", and "issues".`;

      const response = await openaiInstance.client.chat.completions.create({
        model: openaiInstance.model,
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
      if (parsed.en?.tasks && parsed.zh?.tasks) {
        return parsed as TranslationOutput;
      }
    } catch (err: any) {
      console.warn(`⚠️ Cloud LLM (${openaiInstance.model}) API Error, falling back to Multi-Tier Free Engines:`, err.message);
    }
  }

  // 3. Multi-Tier Free Waterfall Cascade (Fast parallel execution for EN & ZH)
  const [tasksEn, tasksZh] = await Promise.all([
    translateTextWaterfall(input.tasks, sourceLang, "en"),
    translateTextWaterfall(input.tasks, sourceLang, "zh"),
  ]);

  const [equipEn, equipZh] = input.equipment
    ? await Promise.all([
        translateTextWaterfall(input.equipment, sourceLang, "en"),
        translateTextWaterfall(input.equipment, sourceLang, "zh"),
      ])
    : ["N/A", "无设备进场"];

  const [issueEn, issueZh] = input.issues
    ? await Promise.all([
        translateTextWaterfall(input.issues, sourceLang, "en"),
        translateTextWaterfall(input.issues, sourceLang, "zh"),
      ])
    : ["No issues reported", "无异常"];

  return {
    en: { tasks: tasksEn, equipment: equipEn, issues: issueEn },
    zh: { tasks: tasksZh, equipment: equipZh, issues: issueZh },
  };
}

/**
 * Smart Multi-Lingual Chat Message Translation (UZ, RU, EN, ZH)
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

  // 2. Try Cloud AI (DeepSeek / Qwen / Groq / OpenAI) if API Key present
  const openaiInstance = getOpenAi();
  if (openaiInstance) {
    try {
      const response = await openaiInstance.client.chat.completions.create({
        model: openaiInstance.model,
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
      if (parsed.uz && parsed.ru && parsed.en && parsed.zh) {
        return {
          uz: parsed.uz,
          ru: parsed.ru,
          en: parsed.en,
          zh: parsed.zh,
        };
      }
    } catch (err: any) {
      console.warn(`⚠️ Cloud LLM (${openaiInstance.model}) Chat Error, falling back to Multi-Tier Free Engines:`, err.message);
    }
  }

  // 3. Multi-Tier Free Waterfall Cascade (parallel translation across all 4 target languages)
  const targets = ["uz", "ru", "en", "zh"] as const;
  const results: Record<string, string> = { uz: text, ru: text, en: text, zh: text };

  await Promise.all(
    targets.map(async (t) => {
      if (t !== src) {
        results[t] = await translateTextWaterfall(text, src, t);
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
