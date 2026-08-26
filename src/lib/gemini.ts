import { InquiryData, Statement } from "../types";

export const CANDIDATE_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash-8b",
  "gemini-1.5-pro"
];

export function getClientGeminiApiKey(): string {
  if (typeof window !== "undefined") {
    const custom = localStorage.getItem("GEMINI_CUSTOM_API_KEY");
    if (custom && custom.trim()) return custom.trim();
  }
  // Try Vite environment variable if bundled
  const viteKey = (import.meta as any)?.env?.VITE_GEMINI_API_KEY;
  if (viteKey && viteKey.trim()) return viteKey.trim();

  return "";
}

const DEFAULT_SAFETY_SETTINGS = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_NONE" }
];

/**
 * Direct client-side OCR for single image with automatic model failover.
 */
export async function directClientGeminiOcr(
  imageBase64: string, 
  customPrompt?: string,
  userKey?: string
): Promise<string> {
  const apiKey = userKey || getClientGeminiApiKey();

  let cleanBase64 = imageBase64;
  let finalMimeType = "image/jpeg";

  if (imageBase64.includes(";base64,")) {
    const parts = imageBase64.split(";base64,");
    cleanBase64 = parts[1];
    const match = parts[0].match(/data:(.*?);/);
    if (match && match[1]) {
      finalMimeType = match[1];
    }
  }
  cleanBase64 = cleanBase64.replace(/[\r\n\s]/g, "");

  const prompt = customPrompt || `یہ پولیس کے کاغذ، ہاتھ سے لکھی درخواست، یا پنسل سے تحریر کردہ بیان کی تصویر ہے۔
تصویر میں موجود تمام اردو تحریر (خواہ وہ پنسل کی مدہم لکھائی ہو، بال پوائنٹ ہو یا قلم کی) کو انتہائی باریک بینی سے پڑھ کر مکمل اردو متن (Unicode Text) میں تحریر کریں۔ کوئی جملہ، نام، ولدیت یا فقرہ چھوڑے بغیر من و عن اصل تحریر اردو میں فراہم کریں۔`;

  for (const model of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: finalMimeType,
                  data: cleanBase64
                }
              },
              {
                text: prompt
              }
            ]
          }
        ],
        safetySettings: DEFAULT_SAFETY_SETTINGS,
        generationConfig: {
          temperature: 0.1
        }
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("\n") || "";
        if (text.trim()) {
          return text.trim();
        }
      }
    } catch (e) {
      console.warn(`Direct client OCR with ${model} error:`, e);
    }
  }

  throw new Error("تصویر سے تحریر حاصل نہیں ہو سکی۔ براہ کرم اپنی انٹرنیٹ یا API Key چیک کریں۔");
}

/**
 * 1-Click Multi-Page Auto-Scan & Compile Full Report (Client Fallback)
 */
export async function directClientAutoCompileReport(
  images: string[],
  metadata: Partial<InquiryData> = {},
  userKey?: string
): Promise<Partial<InquiryData>> {
  const apiKey = userKey || getClientGeminiApiKey();

  const parts: any[] = [];
  for (const img of images) {
    let cleanBase64 = img;
    let mimeType = "image/jpeg";
    if (img.includes(";base64,")) {
      const p = img.split(";base64,");
      cleanBase64 = p[1];
      const match = p[0].match(/data:(.*?);/);
      if (match && match[1]) mimeType = match[1];
    }
    cleanBase64 = cleanBase64.replace(/[\r\n\s]/g, "");
    if (cleanBase64) {
      parts.push({
        inlineData: {
          mimeType,
          data: cleanBase64
        }
      });
    }
  }

  const prompt = `You are an elite Punjab Police Inquiry Specialist and Legal Advisor (انکوائری افسر و قانونی تفتیشی مشیر).
Analyze all the provided images of this police file, handwritten application (درخواست سائل), statements of parties, witnesses, Roznamcha, stamp papers, or progress reports.
Extract all details and construct a complete official Police Inquiry Report with Conclusion in Urdu.

Return a valid JSON object matching this schema:
{
  "complainantName": "نام سائل مع ولدیت و پتہ",
  "complainantStatement": "سائل کا موقف یا تحریری درخواست کا مکمل متن",
  "statements": [
    {
      "id": "stmt_1",
      "personName": "نام فریق مع ولدیت و سکونت",
      "role": "Complainant | Complainant_Witness | Respondent | Respondent_Witness",
      "text": "بیان کا متن"
    }
  ],
  "stationName": "تھانہ",
  "districtName": "ضلع",
  "lawSections": "متعلقہ دفعات یا تنازعہ کا عنوان",
  "subjectTitle": "رپورٹ کا عنوان",
  "showProgressReport": false,
  "progressHeading": "پراگرس رپورٹ ہیڈنگ",
  "progressText": "پراگرس رپورٹ تفصیل",
  "factsAndFindings": [
    "1۔ دورانِ انکوائری سامنے آنے والے حقائق...",
    "2۔ فریقین کے مابین تنازعہ کی نوعیت...",
    "3۔ دستاویزات و شواہد کا جائزہ..."
  ],
  "inquiryConclusion": "دریافت فریقین، ملاحظہ ریکارڈ و بالمشافہ گفتگو سے پایا گیا ہے کہ [جامع قانونی نتیجہ انکوائری اور حتمی فیصلہ کن رائے تحریر کریں]"
}

Important Instructions:
1. Reconstruct all faint pencil handwriting and official notes.
2. In 'inquiryConclusion', summarize liability, truthfulness, and final recommendation. It MUST start with "دریافت فریقین، ملاحظہ ریکارڈ و بالمشافہ گفتگو سے پایا گیا ہے کہ ".
3. Return ONLY raw JSON.`;

  parts.push({ text: prompt });

  for (const model of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{ parts }],
        safetySettings: DEFAULT_SAFETY_SETTINGS,
        generationConfig: {
          temperature: 0.15,
          responseMimeType: "application/json"
        }
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("\n") || "";
        if (text.trim()) {
          const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
          return JSON.parse(clean);
        }
      }
    } catch (e) {
      console.warn(`Direct client auto compile with ${model} error:`, e);
    }
  }

  throw new Error("براہ کرم اپنی انٹرنیٹ یا Gemini API Key چیک کریں۔");
}
