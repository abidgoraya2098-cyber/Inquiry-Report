import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// CORS headers middleware
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// Initialize Gemini API client safely
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY missing: ورسل (Vercel) یا سرور پر Gemini API Key موجود نہیں ہے۔ Vercel Dashboard -> Settings -> Environment Variables میں GEMINI_API_KEY شامل کریں۔");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// API Routes
app.post("/api/generate-inquiry", async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY missing: ورسل (Vercel) کی Settings -> Environment Variables میں GEMINI_API_KEY لازمی شامل کریں۔"
      });
    }

    const {
      senderDesignation,
      recipientDesignation,
      attention,
      reportNumber,
      reportDate,
      subjectTitle,
      referenceNumber,
      referenceDate,
      statements = [],
      observations,
      additionalNotes,
      lawSections,
      inquiryType,
      stationName,
      districtName,
      inquiryOfficer,
      
      // Fallback old fields for backwards compatibility
      complainantName,
      complainantStatement,
      respondentName,
      respondentStatement,
      evidenceDescription
    } = req.body;

    const client = getGeminiClient();

    // Map old fields to new statement structure if statements array is empty
    let processedStatements = [...statements];
    if (processedStatements.length === 0) {
      if (complainantStatement) {
        processedStatements.push({
          id: "comp_1",
          personName: complainantName || "درخواست گزار",
          role: "Complainant",
          text: complainantStatement
        });
      }
      if (respondentStatement) {
        processedStatements.push({
          id: "resp_1",
          personName: respondentName || "مخالف فریق",
          role: "Respondent",
          text: respondentStatement
        });
      }
      if (evidenceDescription) {
        processedStatements.push({
          id: "evid_1",
          personName: "ثبوت و شواہد",
          role: "Witness",
          text: `ثبوت و شواہد کا تذکرہ: ${evidenceDescription}`
        });
      }
    }

    if (processedStatements.length === 0 && !observations) {
      return res.status(400).json({ error: "انکوائری کے لیے بیانات یا مشاہدات کا ہونا لازمی ہے" });
    }

    const systemInstruction = `You are an expert Pakistani Police Legal Advisor and Inquiry Specialist (انکوائری افسر / قانونی تفتیشی مشیر). 
Your task is to analyze police inquiry statements and draft two critical sections of an official Police Inquiry Report (نتیجہ انکوائری) in professional Urdu:
1. Facts and Findings (دورانِ انکوائری ذیل امور سامنے آئے ہیں): This must be a structured list of logical, factual bullet points detailing exactly what transpired. Extract names, financial transaction details (e.g., amount of Rs. 30,00,000, 10,00,000, stamp papers, bank cheques, bank details like MCB branch), family or social relations, property details, and previous police involvement.
2. Inquiry Conclusion (نتیجہ انکوائری): A comprehensive formal administrative conclusion paragraph in formal police station (تھانہ) Urdu summarizing who is at fault, whether the complaint is genuine or false/baseless (من گھڑت / بے بنیاد), and direct legal recommendations (e.g. refer to relevant court, register FIR, file closure, compromise, etc.). It MUST start with: "دریافت فریقین، ملاحظہ ریکارڈ و بالمشافہ گفتگو سے پایا گیا ہے کہ ". Do NOT append "رپورٹ مرتب ہو کر برائے مناسب حکم ارسال خدمت ہے" at the end of inquiryConclusion, as it is added automatically once at the report footer.

Maintain the formal, authoritative Urdu police terminology:
- Use terms like "موقف اختیار کیا", "بیان کیا ہے کہ", "انکار کیا", "بالمشافہ گفتگو کروائی گئی", "گزارش ہے کہ سائل", "ساز باز", "ضمانتیں کنفرم", "تحفظات".
- Do not add any conversational English or modern commentary. Stick purely to the official template format.`;

    const formattedStatements = processedStatements
      .map((st, idx) => `${idx + 1}۔ نام و فریق: ${st.personName} (${st.role})\nبیان: ${st.text}`)
      .join("\n\n");

    const prompt = `براہ کرم درج ذیل بیانات اور انکوائری کے مشاہدات کا تفصیلی جائزہ لے کر ایک مربوط، منطقی اور مستند رپورٹ کے دو اہم حصے تیار کریں۔

رپورٹ کا سیاق و سباق (Metadata):
- منجانب (Sender): ${senderDesignation || "سینئر سپرنٹنڈنٹ آف پولیس"}
- بجانب (Recipient): ${recipientDesignation || "جناب ریجنل پولیس آفیسر صاحب"}
- عنوان (Subject/Title): ${subjectTitle || "درخواست عنوان بالا"}
- حوالہ (Reference): نمبر ${referenceNumber || "شکایت نمبر"} مورخہ ${referenceDate || "تاریخ"}
- تھانہ (Police Station): ${stationName || "تھانہ"}، ضلع (District): ${districtName || "ضلع"}
- متعلقہ دفعات (Law Sections): ${lawSections || "تفصیل درج نہیں"}
- انکوائری افسر (Inquiry Officer): ${inquiryOfficer || "تفتیشی افسر"}

قلمبند کردہ بیانات (Recorded Statements):
${formattedStatements || "کوئی بیانات قلمبند نہیں کیے گئے۔"}

انکوائری افسر کے مشاہدات اور موقع ملاحظہ (Observations & Spot Visit):
${observations || "موقع ملاحظہ کی تفاصیل کلام ریکارڈ کے مطابق ہیں۔"}

اہم گائیڈلائنز:
- factsAndFindings کے تمام نکات کو '1۔' ، '2۔' وغیرہ جیسے فقروں سے شروع کریں اور ہر نقطہ تفصیلی، بامعنی اور قانونی طور پر ٹھوس ہونا چاہیے۔
- نتیجہ انکوائری (inquiryConclusion) کا اختتام ہمیشہ روایتی اور سرکاری فقرے جیسے 'رپورٹ مرتب ہو کر برائے مناسب حکم ارسال خدمت ہے۔' پر ہونا چاہئیے۔`;

    const response = await client.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            factsAndFindings: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of detailed factual findings numbered 1., 2., etc."
            },
            inquiryConclusion: {
              type: Type.STRING,
              description: "Final formal police conclusion paragraph"
            }
          },
          required: ["factsAndFindings", "inquiryConclusion"]
        }
      }
    });

    const resultText = response.text || "{}";
    let jsonResult;
    try {
      jsonResult = JSON.parse(resultText);
    } catch (parseErr) {
      jsonResult = {
        factsAndFindings: [
          "1۔ دوران انکوائری بیانات قلمبند کیے گئے۔",
          "2۔ ریکارڈ و موقف کا جائزہ لیا گیا۔"
        ],
        inquiryConclusion: resultText
      };
    }

    return res.json(jsonResult);
  } catch (error: any) {
    console.error("Error generating inquiry report:", error);
    return res.status(500).json({ error: error.message || "انکوائری رپورٹ کی تیاری میں سرور ایرر پیش آیا" });
  }
});

// Extract key facts and analyze statements for consistency
app.post("/api/analyze-statement", async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY missing: ورسل (Vercel) کی Settings -> Environment Variables میں GEMINI_API_KEY لازمی شامل کریں۔"
      });
    }

    const { statement, context } = req.body;

    if (!statement) {
      return res.status(400).json({ error: "بیان فراہم کرنا لازمی ہے (Statement is required)" });
    }

    const client = getGeminiClient();

    const prompt = `درج ذیل پولیس بیان (police statement) یا درخواست کا باریک بینی سے جائزہ لیں اور اس میں سے اہم معلومات کا اخراج کریں۔

بیان (Statement):
"""
${statement}
"""

اضافی پس منظر (Context - optional):
${context || "کوئی پس منظر فراہم نہیں کیا گیا"}

براہ کرم درج ذیل معلومات کو واضح نکات (bullet points) کی صورت میں الگ کریں اور اردو میں فراہم کریں:
1۔ اہم دعوے اور الزامات (Key Allegations / Claims): سائل یا گواہ نے کیا الزامات عائد کیے ہیں؟
2۔ وقوعہ کی تاریخ، وقت اور جگہ (Date, Time, and Location of Incident): اگر بیان میں ذکر ہو۔
3۔ نامزد کردار / گواہان (Key Persons & Witnesses mentioned): بیان میں کن کن لوگوں کا تذکرہ ہے؟
4۔ تضادات اور مشکوک باتیں (Contradictions / Suspicious details): کیا بیان میں کوئی منطقی جھول، تضادات، یا مبالغہ آرائی محسوس ہوتی ہے؟
5۔ اہم سوالات (Crucial Questions to Ask): تفتیش کو آگے بڑھانے کے لیے اس فریق سے مزید کیا سوالات پوچھے جانے چاہئیں؟`;

    const response = await client.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert police investigator and legal analyst. Extract structured insights from raw Urdu statements to help an inquiry officer discover loopholes and plan next steps.",
        temperature: 0.2,
      }
    });

    res.json({ analysis: response.text });
  } catch (error: any) {
    console.error("Error analyzing statement:", error);
    res.status(500).json({ error: error.message || "An error occurred during statement analysis" });
  }
});

// AI Spelling and Grammar Correction endpoint using Gemini 3.6 Flash
app.post("/api/correct-spelling", async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY missing: ورسل (Vercel) کی Settings -> Environment Variables میں GEMINI_API_KEY لازمی شامل کریں۔"
      });
    }

    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "متن فراہم کرنا لازمی ہے (Text is required)" });
    }

    const client = getGeminiClient();
    const systemInstruction = `You are an expert Urdu proofreader, legal typist, and Punjab Police report formatter.
Your task is to correct any spelling mistakes (املا کی غلطیاں), typo issues, and grammar problems in the provided Urdu report text.
Keep all the layout fields, formal structure, margins, symbols, and names intact. Do not rewrite the facts or alter the legal meaning. 
Only correct spelling (e.g. ensure correct spelling of words like "بالمشافہ", "درخواست گزار", "الزام علیہ", "نتیجہ انکوائری").
Ensure there are no spelling mistakes in the output. Keep the output as raw Urdu text with zero commentary or extra English.`;

    const response = await client.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `براہ کرم درج ذیل رپورٹ کے متن کا جائزہ لیں اور اس میں موجود املا (Spelling) اور گرامر (Grammar) کی تمام غلطیوں کو درست کریں۔ رپورٹ کے باضابطہ پیٹرن، ناموں، اور دیگر قانونی الفاظ کو تبدیل نہ کریں۔ صرف املا اور گرامر کو سو فیصد درست کر کے فائنل متن واپس فراہم کریں:

"""
${text}
"""`,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1,
      }
    });

    res.json({ correctedText: response.text || "" });
  } catch (error: any) {
    console.error("Error correcting spelling:", error);
    res.status(500).json({ error: error.message || "املا کی تصحیح میں خرابی پیش آئی" });
  }
});

// Image transcript / OCR endpoint using Gemini 3.6 Flash
app.post("/api/transcribe-image", async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY missing: ورسل (Vercel) کی Settings -> Environment Variables میں GEMINI_API_KEY لازمی شامل کریں۔"
      });
    }

    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "تصویر کا ہونا لازمی ہے (Image data is required)" });
    }

    // Extract clean base64 data
    let cleanBase64 = imageBase64;
    let finalMimeType = mimeType || "image/jpeg";

    if (imageBase64.includes(";base64,")) {
      const parts = imageBase64.split(";base64,");
      cleanBase64 = parts[1];
      const match = parts[0].match(/data:(.*)/);
      if (match) {
        finalMimeType = match[1];
      }
    }

    const client = getGeminiClient();

    const response = await client.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: finalMimeType
          }
        },
        "یہ پولیس تھانہ یا تفتیش کے دوران پنسل یا قلم سے لکھی گئی درخواست، بیان یا کسی سرکاری کاغذ کی تصویر ہے۔ تصویر میں موجود ہاتھ کی لکھی ہوئی اردو تحریر کو انتہائی باریک بینی سے پڑھیں۔ پنسل سے لکھی گئی مدہم، ہلکی، یا مشکل (messy/faint handwritten) لکھائی کو بھی سیاق و سباق (police context) کے مطابق سمجھیں اور بغیر کسی غلطی کے مکمل طور پر درست اردو ٹیکسٹ (Unicode) میں تحریر کریں۔ تمام عدالتی اور پولیس اصطلاحات (جیسے مسمات، ولدیت، فریقین، الزام علیہ، سائل، تھانہ، تفتیشی، بیانات، دستخط وغیرہ) کو درست املا کے ساتھ پڑھیں۔ کسی قسم کا تبصرہ یا اضافی انگریزی جملے بالکل شامل نہ کریں، صرف اور صرف تصویر میں موجود اصل اردو تحریر فراہم کریں۔"
      ]
    });

    res.json({ text: response.text || "" });
  } catch (error: any) {
    console.error("Error transcribing image:", error);
    res.status(500).json({ error: error.message || "تصویر سے تحریر حاصل کرنے میں خرابی پیش آئی" });
  }
});

// User Sessions & Geolocation Tracking
const SESSIONS_FILE = process.env.VERCEL ? "/tmp/sessions.json" : path.join(process.cwd(), "sessions.json");

interface SessionLog {
  id: string;
  ip: string;
  userAgent: string;
  deviceType: "Mobile" | "PC" | "Tablet" | "Unknown";
  os: string;
  location?: {
    latitude?: number;
    longitude?: number;
    city?: string;
    country?: string;
    isp?: string;
  };
  loginTime: string;
  lastActiveTime: string;
  blocked: boolean;
  currentWork?: {
    complainantName?: string;
    reportNumber?: string;
    subjectTitle?: string;
    inquiryOfficer?: string;
    updatedAt: string;
  };
}

function loadSessions(): SessionLog[] {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = fs.readFileSync(SESSIONS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading sessions file:", err);
  }
  return [];
}

function saveSessions(sessions: SessionLog[]) {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing sessions file:", err);
  }
}

function parseUserAgent(ua: string) {
  let deviceType: "Mobile" | "PC" | "Tablet" | "Unknown" = "PC";
  let os = "Unknown OS";
  
  const lowerUA = ua.toLowerCase();
  if (lowerUA.includes("mobi") || lowerUA.includes("android") || lowerUA.includes("iphone") || lowerUA.includes("windows phone")) {
    deviceType = "Mobile";
  } else if (lowerUA.includes("ipad") || lowerUA.includes("tablet")) {
    deviceType = "Tablet";
  } else {
    deviceType = "PC";
  }

  if (lowerUA.includes("windows")) os = "Windows";
  else if (lowerUA.includes("macintosh") || lowerUA.includes("mac os")) os = "macOS";
  else if (lowerUA.includes("iphone") || lowerUA.includes("ipad")) os = "iOS";
  else if (lowerUA.includes("android")) os = "Android";
  else if (lowerUA.includes("linux")) os = "Linux";

  return { deviceType, os };
}

// Session Register Endpoint
app.post("/api/session/register", async (req, res) => {
  try {
    const { sessionId, currentWork } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    // Get client IP address
    let ip = (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "127.0.0.1").split(",")[0].trim();
    if (ip === "::1" || ip === "::ffff:127.0.0.1") {
      ip = "127.0.0.1";
    }

    const ua = req.headers["user-agent"] || "";
    const { deviceType, os } = parseUserAgent(ua);

    const sessions = loadSessions();
    let session = sessions.find(s => s.id === sessionId);

    // Also check if this IP is blocked (exclude local/container loopback IPs)
    const isLocalIp = !ip || ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1" || ip === "localhost";
    const ipBlocked = !isLocalIp && sessions.some(s => s.ip === ip && s.blocked);

    const nowStr = new Date().toISOString();

    if (!session) {
      session = {
        id: sessionId,
        ip,
        userAgent: ua,
        deviceType,
        os,
        loginTime: nowStr,
        lastActiveTime: nowStr,
        blocked: ipBlocked, // auto-block if this IP is already blocked
      };
      sessions.push(session);
    } else {
      session.lastActiveTime = nowStr;
      session.ip = ip;
      session.userAgent = ua;
      session.deviceType = deviceType;
      session.os = os;
      if (ipBlocked) {
        session.blocked = true;
      }
    }

    // Update current work if provided
    if (currentWork) {
      session.currentWork = {
        complainantName: currentWork.complainantName,
        reportNumber: currentWork.reportNumber,
        subjectTitle: currentWork.subjectTitle,
        inquiryOfficer: currentWork.inquiryOfficer,
        updatedAt: nowStr,
      };
    }

    saveSessions(sessions);

    res.json({
      success: true,
      blocked: session.blocked,
      sessionId: session.id,
      ip: session.ip,
      location: session.location
    });
  } catch (error: any) {
    console.error("Error registering session:", error);
    res.status(500).json({ error: error.message });
  }
});

// Admin Get Sessions Endpoint
app.get("/api/admin/sessions", (req, res) => {
  try {
    const sessions = loadSessions();
    res.json(sessions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Block/Unblock Endpoint
app.post("/api/admin/block", (req, res) => {
  try {
    const { targetSessionId, blocked } = req.body;
    if (!targetSessionId) {
      return res.status(400).json({ error: "Target Session ID is required" });
    }

    const sessions = loadSessions();
    const session = sessions.find(s => s.id === targetSessionId);
    
    if (session) {
      session.blocked = !!blocked;
      
      // Also block/unblock other sessions with the same IP address for robustness
      const targetIp = session.ip;
      if (targetIp && targetIp !== "127.0.0.1") {
        sessions.forEach(s => {
          if (s.ip === targetIp) {
            s.blocked = !!blocked;
          }
        });
      }
      
      saveSessions(sessions);
      return res.json({ success: true, message: `Session ${targetSessionId} (and matching IPs) blocked status set to ${blocked}` });
    }

    res.status(404).json({ error: "Session not found" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Setup Vite Dev Server / Static files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    
    // Serve index.html with NO CACHE headers to allow instant updates
    app.get("/", (req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(path.join(distPath, "index.html"));
    });

    app.get("/index.html", (req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(path.join(distPath, "index.html"));
    });

    // Serve manifest.webmanifest with NO CACHE headers so PWA icons update instantly
    app.get(["/manifest.json", "/manifest.webmanifest"], (req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      
      const pwaManifest = path.join(distPath, "manifest.webmanifest");
      const legacyManifest = path.join(distPath, "manifest.json");
      
      if (fs.existsSync(pwaManifest)) {
        res.sendFile(pwaManifest);
      } else {
        res.sendFile(legacyManifest);
      }
    });

    // Default static server for rest of the files with hashing
    app.use(express.static(distPath, {
      maxAge: "30d",
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html") || filePath.endsWith("manifest.json") || filePath.endsWith("manifest.webmanifest") || filePath.endsWith("sw.js") || filePath.includes("workbox-") || filePath.endsWith(".png")) {
          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        } else {
          // Cache-busted bundles can be cached
          res.setHeader("Cache-Control", "public, max-age=2592000");
        }
      }
    }));

    app.get("*", (req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
