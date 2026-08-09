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

export async function processIndustrialTranslation(
  input: TranslationInput
): Promise<TranslationOutput> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey.includes("your-openai-key")) {
    // Return mock translation for local dev environment
    return {
      en: {
        tasks: `[EN Translation] ${input.tasks}`,
        equipment: input.equipment ? `[EN Translation] ${input.equipment}` : "N/A",
        issues: input.issues ? `[EN Translation] ${input.issues}` : "No issues reported",
      },
      zh: {
        tasks: `[中文 翻译] ${input.tasks}`,
        equipment: input.equipment ? `[中文 翻译] ${input.equipment}` : "无设备进场",
        issues: input.issues ? `[中文 翻译] ${input.issues}` : "无异常",
      },
    };
  }

  const openai = new OpenAI({ apiKey });

  const systemPrompt = `You are an expert industrial construction and civil engineering translator.
Translate the daily site logs from the source language (${input.sourceLang.toUpperCase()}) simultaneously into English (en) and Simplified Chinese (zh-CN).
Maintain accurate technical engineering terminology (e.g., turbine components, concrete pouring, crane delays, electrical sub-stations).
Output strictly valid JSON with the exact keys "en" and "zh", each containing "tasks", "equipment", and "issues".`;

  const userPrompt = JSON.stringify({
    tasks: input.tasks,
    equipment: input.equipment || "",
    issues: input.issues || "",
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.1,
  });

  const rawJson = response.choices[0].message.content || "{}";
  const parsed = JSON.parse(rawJson);

  return parsed as TranslationOutput;
}
