import React, { useState, useRef } from "react";
import { 
  X, Upload, Camera, FileText, Sparkles, CheckCircle2, 
  RotateCw, Trash2, ArrowRight, ShieldCheck, Copy, AlertCircle, FileCheck
} from "lucide-react";
import { convertPdfToPageImages } from "../lib/pdfToImage";
import { InquiryData } from "../types";

export type TargetSection = 
  | "complainant_stance" 
  | "complainant_statement" 
  | "complainant_witness" 
  | "respondent_statement" 
  | "respondent_witness" 
  | "progress_report" 
  | "all";

interface TargetedOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyData: (target: TargetSection, extractedText: string, structuredData?: Partial<InquiryData>) => void;
  initialTarget?: TargetSection;
}

export default function TargetedOcrModal({
  isOpen,
  onClose,
  onApplyData,
  initialTarget = "all"
}: TargetedOcrModalProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "paste" | "presets">("upload");
  const [selectedTarget, setSelectedTarget] = useState<TargetSection>(initialTarget);
  
  // Image & PDF Upload State
  const [uploadedFiles, setUploadedFiles] = useState<{ id: string; name: string; base64: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Paste Text State
  const [pastedText, setPastedText] = useState("");

  // Camera State
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const targetLabels: Record<TargetSection, { label: string; desc: string; icon: string; badge?: string }> = {
    complainant_stance: {
      label: "موقف درخواست گزار",
      desc: "منتخب ہدف: درخواست کا متن اور سائل کا موقف فارم کے خانے \"موقف درخواست گزار\" میں درج کیا جائے گا۔",
      icon: "📝"
    },
    complainant_statement: {
      label: "بیان درخواست گزار",
      desc: "منتخب ہدف: سائل / مدعی کا باضابطہ بیان اسکین کر کے \"بیان سائل\" کے خانے میں درج کیا جائے گا۔",
      icon: "👤"
    },
    complainant_witness: {
      label: "تائیدی بیان درخواست گزار",
      desc: "منتخب ہدف: سائل کے گواہان کے بیانات اسکین کر کے \"تائیدی گواہ (درخواست گزار)\" میں درج کیے جائیں گے۔",
      icon: "👥"
    },
    respondent_statement: {
      label: "بیان الزام علیہ",
      desc: "منتخب ہدف: الزام علیہ / مخالف فریق کا بیان اسکین کر کے \"بیان الزام علیہ\" میں درج کیا جائے گا۔",
      icon: "⚖️"
    },
    respondent_witness: {
      label: "تائیدی بیان الزام علیہ",
      desc: "منتخب ہدف: الزام علیہ کے گواہان کے بیانات اسکین کر کے \"تائیدی گواہ (الزام علیہ)\" میں درج کیے جائیں گے۔",
      icon: "🤝"
    },
    progress_report: {
      label: "پراگرس رپورٹ",
      badge: "آپشنل",
      desc: "منتخب ہدف (آپشنل): تفتیشی / پراگرس رپورٹ اسکین کر کے تفتیش و مشاہدات میں اختیاری طور پر شامل کی جائے گی۔",
      icon: "📋"
    },
    all: {
      label: "تمام صفحات (All)",
      desc: "منتخب ہدف: تمام صفحات اور رپورٹس ملا کر مکمل فارم کو خانہ وار درست جگہ پر پر کیا جائے گا۔",
      icon: "✨"
    }
  };

  // OCR Processing Core
  const performOcr = async (images: string[]): Promise<string> => {
    const customKey = typeof window !== "undefined" ? localStorage.getItem("GEMINI_CUSTOM_API_KEY") || "" : "";
    const extractedTexts: string[] = [];

    for (let i = 0; i < images.length; i++) {
      setProcessStatus(`صفحہ ${i + 1} از ${images.length} اسکین کیا جا رہا ہے...`);
      const img = images[i];
      let cleanBase64 = img;
      let mimeType = "image/jpeg";

      if (img.includes(";base64,")) {
        const parts = img.split(";base64,");
        cleanBase64 = parts[1];
        const match = parts[0].match(/data:(.*?);/);
        if (match && match[1]) mimeType = match[1];
      }
      cleanBase64 = cleanBase64.replace(/[\r\n\s]/g, "");

      const prompt = `یہ پولیس ریکارڈ، درخواست، یا انکوائری رپورٹ کی تصویر ہے۔
براہ کرم اس میں موجود تمام اردو تحریر (کمپیوٹر ٹائپنگ، پنسل یا بال پوائنٹ کی لکھائی، ڈائری نمبر، افسران کے نوٹس، تاریخ، اور دستخط) کو انتہائی باریک بینی سے پڑھ کر صاف اردو متن (Unicode Text) میں لکھیں۔ کوئی فقرہ چھوڑے بغیر مکمل متن فراہم کریں۔`;

      let pageText = "";

      // 1. Try server endpoint
      try {
        const res = await fetch("/api/transcribe-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(customKey ? { "x-gemini-api-key": customKey } : {})
          },
          body: JSON.stringify({
            imageBase64: img,
            apiKey: customKey || undefined
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.text && data.text.trim()) {
            pageText = data.text.trim();
          }
        }
      } catch (err) {
        console.warn("Server OCR attempt notice:", err);
      }

      // 2. Direct Client REST API Fallback
      if (!pageText && customKey) {
        const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.0-flash-lite", "gemini-1.5-pro"];
        for (const model of models) {
          try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${customKey}`;
            const payload = {
              contents: [
                {
                  parts: [
                    { inlineData: { mimeType, data: cleanBase64 } },
                    { text: prompt }
                  ]
                }
              ],
              safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_NONE" }
              ],
              generationConfig: { temperature: 0.1 }
            };

            const directRes = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });

            if (directRes.ok) {
              const data = await directRes.json();
              const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("\n") || "";
              if (text.trim()) {
                pageText = text.trim();
                break;
              }
            }
          } catch (directErr) {
            console.warn(`Direct client OCR ${model} error:`, directErr);
          }
        }
      }

      if (pageText) {
        extractedTexts.push(pageText);
      }
    }

    return extractedTexts.join("\n\n---\n\n");
  };

  // Handle Scan & Apply
  const handleScanAndApply = async () => {
    if (activeTab === "upload") {
      if (uploadedFiles.length === 0) {
        setErrorMessage("برائے مہربانی پہلے کوئی تصویر یا پی ڈی ایف فائل منتخب کریں۔");
        return;
      }

      setIsProcessing(true);
      setErrorMessage(null);
      try {
        const fullText = await performOcr(uploadedFiles.map(f => f.base64));
        if (!fullText.trim()) {
          throw new Error("تصاویر سے تحریر حاصل نہیں ہو سکی۔ براہ کرم صاف تصویر اپلوڈ کریں یا API Key چیک کریں۔");
        }

        onApplyData(selectedTarget, fullText);
        onClose();
      } catch (err: any) {
        console.error("Targeted OCR Error:", err);
        setErrorMessage(err.message || "اسکیننگ میں خرابی پیش آئی۔");
      } finally {
        setIsProcessing(false);
        setProcessStatus("");
      }
    } else if (activeTab === "paste") {
      if (!pastedText.trim()) {
        setErrorMessage("برائے مہربانی پہلے متن پیسٹ کریں۔");
        return;
      }
      onApplyData(selectedTarget, pastedText.trim());
      onClose();
    }
  };

  // Handle File Input
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMessage(null);
    setIsProcessing(true);
    setProcessStatus("فائلیں لوڈ ہو رہی ہیں...");

    try {
      const newFileList: { id: string; name: string; base64: string }[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name.toLowerCase();

        if (fileName.endsWith(".pdf") || file.type === "application/pdf") {
          setProcessStatus(`پی ڈی ایف (${file.name}) کے صفحات تیار کیے جا رہے ہیں...`);
          const pageImages = await convertPdfToPageImages(file, 1.5);
          pageImages.forEach((img, idx) => {
            newFileList.push({
              id: `${file.name}_page_${idx + 1}_${Date.now()}`,
              name: `${file.name} (صفحہ ${idx + 1})`,
              base64: img
            });
          });
        } else if (file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|bmp)$/i.test(fileName)) {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          newFileList.push({
            id: `${file.name}_${Date.now()}`,
            name: file.name,
            base64
          });
        }
      }

      setUploadedFiles(prev => [...prev, ...newFileList]);
    } catch (err: any) {
      console.error("File load error:", err);
      setErrorMessage(`فائل لوڈ کرنے میں خرابی: ${err.message || "دوبارہ کوشش کریں۔"}`);
    } finally {
      setIsProcessing(false);
      setProcessStatus("");
      if (e.target) e.target.value = "";
    }
  };

  // Camera Handler
  const startCamera = async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.warn);
        }
      }, 200);
    } catch (camErr: any) {
      console.error("Camera error:", camErr);
      setErrorMessage("کیمرہ اوپن کرنے کی اجازت نہیں ملی۔ براہ کرم براؤزر میں کیمرہ پرمیشن چیک کریں۔");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 1920;
    canvas.height = videoRef.current.videoHeight || 1080;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setUploadedFiles(prev => [
        ...prev,
        {
          id: `photo_${Date.now()}`,
          name: `کیمرہ تصویر ${prev.length + 1}`,
          base64: dataUrl
        }
      ]);
    }
    stopCamera();
  };

  // Sample Presets
  const presets = [
    {
      title: "موقف درخواست گزار: درخواست برائے دھوکہ دہی و امانت میں خیانت (406 ت پ)",
      target: "complainant_stance" as TargetSection,
      content: `سائل نے بیان کیا کہ مسمی الزام علیہ نے مجھ سے بذریعہ ساز باز کاروبار میں شراکت داری کا جھانسہ دے کر مبلغ 25,00,000/- روپے وصول کیے۔ مقررہ مدت گزرنے کے بعد جب رقم کی واپسی کا تقاضا کیا گیا تو الزام علیہ ٹال مٹول سے کام لینے لگا اور بعد ازاں رقم واپس کرنے سے صاف انکاری ہو گیا اور سنگین نتائج کی دھمکیاں دیں۔ استدعا ہے کہ الزام علیہ کے خلاف قانونی کارروائی عمل میں لا کر سائل کو اس کی رقم واپس دلوائی جائے۔`
    },
    {
      title: "بیان درخواست گزار: باضابطہ بیان سائل بمعہ موقف تصدیق",
      target: "complainant_statement" as TargetSection,
      content: `میں مسمی / مسمات حلفاً بیان کرتا/کرتی ہوں کہ میں نے جو درخواست روبرو جناب پیش کی ہے اس کے تمام مندرجات سچ اور مبنی بر حقائق ہیں۔ الزام علیہ نے دانستہ طور پر بدنیتی کے ساتھ مجھ سے رقم ہڑپ کی ہے اور اب دینے سے انکاری ہے۔ میں اپنے بیان پر قائم ہوں اور الزام علیہ کے خلاف قانونی کارروائی کا متمنی ہوں۔`
    },
    {
      title: "بیان الزام علیہ: تردید الزامات و موقف بے گناہی",
      target: "respondent_statement" as TargetSection,
      content: `مسمی الزام علیہ نے روبرو ہو کر بیان کیا کہ سائل کی جانب سے لگائے گئے تمام الزامات من گھڑت، بے بنیاد اور خلافِ واقعہ ہیں۔ ہمارا آپس میں حساب کتاب زبانی طور پر طے پا چکا تھا اور میں نے کوئی ناجائز رقم وصول نہیں کی۔ سائل مجھے بلیک میل کر کے ناحق دباؤ ڈالنا چاہتا ہے۔ میں بالکل بے گناہ ہوں۔`
    },
    {
      title: "پراگرس رپورٹ (آپشنل): تفتیشی ضمنی و مشاہدہ موقع",
      target: "progress_report" as TargetSection,
      content: `تفتیشی رپورٹ و پراگرس: وقوعہ کی بابت فریقین اور گواہان کو طلب کر کے بیانات قلمبند کیے گئے۔ ریکارڈ کی جانچ پڑتال اور موقع کے شواہد سے معلوم ہوا کہ فریقین کے مابین دیوانی نوعیت کا لین دین کا تنازعہ ہے۔ فوجداری عنصر تاحال ثابت نہ ہو سکا ہے۔ تفتیش ضابطہ کے مطابق جاری ہے۔`
    },
    {
      title: "تمام صفحات: مکمل انکوائری رپورٹ نمونہ",
      target: "all" as TargetSection,
      content: `تحریر ہے کہ درخواست عنوان بالا موصول ہونے پر فریقین کو طلب کر کے دریافت عمل میں لائی گئی۔ سائل اور الزام علیہ کے مابین لین دین کی بابت تنازعہ پایا گیا۔ دریافت و ملاحظہ ریکارڈ سے تمام حالات و واقعات کو باقاعدہ قلمبند کر کے رپورٹ ہذا مرتب کی گئی ہے۔`
    }
  ];

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 font-sans animate-fadeIn no-print" dir="rtl">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* MODAL HEADER */}
        <div className="bg-[#0b1b2b] text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base font-naskh text-white">
                  خانہ وار الگ الگ AI سکینر (Targeted OCR Scanner)
                </h3>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                جس خانے کا ڈیٹا تبدیل کرنا چاہتے ہیں اس کی تصویر الگ اپلوڈ کریں - متن مکس نہیں ہوگا!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TOP TABS */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "upload"
                ? "border-emerald-600 text-emerald-800 bg-white shadow-2xs font-extrabold"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>تصویر / PDF اپلوڈ</span>
          </button>

          <button
            onClick={() => setActiveTab("paste")}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "paste"
                ? "border-emerald-600 text-emerald-800 bg-white shadow-2xs font-extrabold"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="w-4 h-4 text-amber-600" />
            <span>رپورٹ کا متن پیسٹ کریں</span>
          </button>

          <button
            onClick={() => setActiveTab("presets")}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "presets"
                ? "border-emerald-600 text-emerald-800 bg-white shadow-2xs font-extrabold"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>نمونہ رپورٹس (Presets)</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-right flex-1">
          
          {/* 1. TARGET SECTION SELECTOR */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <span className="text-emerald-700 font-mono">1.</span>
                <span>اپلوڈ یا سکیننگ کا ہدف (Target Section) منتخب کریں:</span>
              </span>
              <span className="text-[10px] text-slate-500 font-bold">
                (تصویر صرف متعلقہ خانے میں جائے گی)
              </span>
            </div>

            {/* Target Options Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {([
                "complainant_stance",
                "complainant_statement",
                "complainant_witness",
                "respondent_statement",
                "respondent_witness",
                "progress_report",
                "all"
              ] as TargetSection[]).map((key) => {
                const isSelected = selectedTarget === key;
                const info = targetLabels[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedTarget(key)}
                    className={`p-2.5 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 relative ${
                      isSelected
                        ? "bg-[#0b1b2b] text-amber-300 border-slate-900 shadow-md font-black ring-2 ring-emerald-500/50 scale-[1.02]"
                        : "bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 font-bold shadow-2xs"
                    }`}
                  >
                    {info.badge && (
                      <span className="absolute top-1 left-1 bg-amber-500 text-slate-950 text-[8px] font-black px-1.5 py-0.2 rounded-md shadow-2xs">
                        {info.badge}
                      </span>
                    )}
                    <span className="text-base">{info.icon}</span>
                    <span className="text-[11px] font-naskh tracking-tight">{info.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Target Selection Feedback Alert */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex items-center gap-2 text-[11px] text-emerald-900 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{targetLabels[selectedTarget].desc}</span>
            </div>
          </div>

          {/* ERROR MESSAGE BANNER */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: UPLOAD / CAMERA */}
          {activeTab === "upload" && (
            <div className="space-y-4">
              
              {/* ACTION BOXES: CAMERA & FILE UPLOAD */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* 1. Camera Box */}
                <button
                  type="button"
                  onClick={startCamera}
                  className="bg-emerald-50/50 hover:bg-emerald-50 border-2 border-emerald-400/80 hover:border-emerald-500 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer active:scale-98 shadow-xs group"
                >
                  <div className="p-3 bg-emerald-600 text-white rounded-full shadow-md group-hover:scale-105 transition-transform">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 font-naskh">کیمرے سے فوٹو لیں</h4>
                    <p className="text-[11px] text-emerald-800 font-medium">موبائل سے ڈائریکٹ فوٹو لیں</p>
                  </div>
                </button>

                {/* 2. File Upload Box */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-indigo-50/40 hover:bg-indigo-50/70 border-2 border-dashed border-indigo-400 hover:border-indigo-600 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer active:scale-98 shadow-xs group"
                >
                  <div className="p-3 bg-indigo-600 text-white rounded-full shadow-md group-hover:scale-105 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 font-naskh">تمام فائلوں کا انتخاب کریں (PDF یا تصاویر)</h4>
                    <p className="text-[11px] text-indigo-800 font-medium">پی ڈی ایف یا تصویر منتخب کریں (PDF, JPG, PNG)</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* UPLOADED FILES PREVIEW LIST */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>منتخب شدہ صفحات ({uploadedFiles.length}):</span>
                    <button
                      type="button"
                      onClick={() => setUploadedFiles([])}
                      className="text-rose-600 hover:text-rose-800 text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>تمام صاف کریں</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                    {uploadedFiles.map((file, idx) => (
                      <div key={file.id} className="relative group rounded-lg overflow-hidden border border-slate-300 bg-white shadow-2xs aspect-3/4">
                        <img src={file.base64} alt={file.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5 text-white">
                          <span className="text-[9px] font-mono font-bold bg-slate-900/80 px-1 py-0.5 rounded">
                            صفحہ {idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadedFiles(prev => prev.filter(f => f.id !== file.id));
                            }}
                            className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md self-end"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PASTE TEXT */}
          {activeTab === "paste" && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                رپورٹ یا درخواست کا متن یہاں پیسٹ کریں:
              </label>
              <textarea
                rows={8}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="درخواست یا رپورٹ کا متن یہاں پیسٹ کریں..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs leading-relaxed text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-600 text-right"
              />
            </div>
          )}

          {/* TAB 3: PRESETS */}
          {activeTab === "presets" && (
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-slate-700">
                تیار شدہ سرکاری نمونہ منتخب کریں (1-کلک پر فارم میں لوڈ ہو جائے گا):
              </p>
              <div className="space-y-2">
                {presets.map((preset, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      onApplyData(preset.target, preset.content);
                      onClose();
                    }}
                    className="p-3 bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-400 rounded-xl cursor-pointer transition-all shadow-2xs group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-emerald-900 font-naskh">
                        {preset.title}
                      </h4>
                      <span className="text-[10px] font-bold bg-slate-200 group-hover:bg-emerald-200 text-slate-800 px-2 py-0.5 rounded-full">
                        لوڈ کریں ↗
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed font-medium">
                      {preset.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-100 px-4 py-3 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            منسوخ کریں
          </button>

          <button
            type="button"
            disabled={isProcessing || (activeTab === "upload" && uploadedFiles.length === 0) || (activeTab === "paste" && !pastedText.trim())}
            onClick={handleScanAndApply}
            className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 shadow-sm cursor-pointer active:scale-95 ${
              isProcessing || (activeTab === "upload" && uploadedFiles.length === 0) || (activeTab === "paste" && !pastedText.trim())
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-[#0b1b2b] hover:bg-[#122e4d] text-amber-300 border border-slate-800 hover:border-amber-400"
            }`}
          >
            {isProcessing ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin text-amber-300" />
                <span>{processStatus || "اسکیننگ جاری ہے..."}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>تمام صفحات سکین اور آٹو فل کریں</span>
              </>
            )}
          </button>
        </div>

        {/* FULLSCREEN CAMERA OVERLAY */}
        {cameraActive && (
          <div className="fixed inset-0 z-[100000] bg-slate-950 flex flex-col justify-between text-white p-4" dir="rtl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-500/30">
                کیمرہ تصویر لیں
              </span>
              <button
                type="button"
                onClick={stopCamera}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative flex-1 flex items-center justify-center overflow-hidden my-3 rounded-2xl bg-black border border-slate-800">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-center pb-4">
              <button
                type="button"
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full bg-white border-4 border-emerald-500 shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-600"></div>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}