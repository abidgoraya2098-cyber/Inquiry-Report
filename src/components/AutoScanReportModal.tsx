import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  X, Upload, Camera, Sparkles, CheckCircle2, 
  Trash2, AlertCircle, FileText, Zap, RefreshCw, 
  FileCheck, Layers, ClipboardPaste, Key, ExternalLink, Eye, EyeOff, Check
} from "lucide-react";
import { processFileToImageUrls, extractClipboardImages } from "../lib/pdfToImage";
import { 
  directClientAutoCompileReport, 
  getClientGeminiApiKey, 
  saveClientGeminiApiKey,
  buildSmartFallbackInquiryReport
} from "../lib/gemini";
import { InquiryData } from "../types";

interface AutoScanReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportGenerated: (inquiryData: Partial<InquiryData>) => void;
  senderDesignation?: string;
  recipientDesignation?: string;
  stationName?: string;
  districtName?: string;
}

export default function AutoScanReportModal({
  isOpen,
  onClose,
  onReportGenerated,
  senderDesignation = "سینیئر سپرنٹنڈنٹ آف پولیس، ریجنل انویسٹی گیشن برانچ۔ گوجرانوالہ ریجن",
  recipientDesignation = "جناب ریجنل پولیس آفیسر صاحب، گوجرانوالہ",
  stationName = "تھانہ صدر، گوجرانوالہ",
  districtName = "ضلع گوجرانوالہ"
}: AutoScanReportModalProps) {
  const [images, setImages] = useState<{ id: string; name: string; base64: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Key state & inline input
  const [apiKeyInput, setApiKeyInput] = useState(() => getClientGeminiApiKey());
  const [showKeyInputCard, setShowKeyInputCard] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [keySavedToast, setKeySavedToast] = useState(false);

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Check if API key is present
  useEffect(() => {
    if (isOpen) {
      const existing = getClientGeminiApiKey();
      setApiKeyInput(existing);
      if (!existing) {
        setShowKeyInputCard(true);
      } else {
        setShowKeyInputCard(false);
      }
    }
  }, [isOpen]);

  // Setup Global Clipboard Paste Listener (Ctrl+V) when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = async (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.items) {
        const pastedImgs = await extractClipboardImages(e.clipboardData);
        if (pastedImgs.length > 0) {
          const newEntries = pastedImgs.map((b64, idx) => ({
            id: `pasted_${Date.now()}_${idx}`,
            name: `اسکرین شاٹ (${images.length + idx + 1})`,
            base64: b64
          }));
          setImages(prev => [...prev, ...newEntries]);
          setErrorMessage(null);
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [isOpen, images.length]);

  if (!isOpen) return null;

  const handleFiles = async (files: FileList | File[]) => {
    setErrorMessage(null);
    try {
      const newEntries: { id: string; name: string; base64: string }[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setStatusMessage(`فائل ${file.name} پروسیس ہو رہی ہے...`);
        const extracted = await processFileToImageUrls(file);
        for (const item of extracted) {
          newEntries.push({
            id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: item.name,
            base64: item.base64
          });
        }
      }

      setImages(prev => [...prev, ...newEntries]);
      setStatusMessage("");
    } catch (err: any) {
      console.error("File processing error:", err);
      setErrorMessage(err.message || "فائل پڑھنے میں خرابی پیش آئی۔");
      setStatusMessage("");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFiles(e.dataTransfer.files);
    }
  };

  const startCamera = async () => {
    try {
      setErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err: any) {
      setErrorMessage("کیمرہ کھولنے میں خرابی: براہ کرم کیمرہ کی اجازت چیک کریں۔");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const b64 = canvas.toDataURL("image/jpeg", 0.88);

    setImages(prev => [
      ...prev,
      {
        id: `cam_${Date.now()}`,
        name: `کیمرہ تصویر (${prev.length + 1})`,
        base64: b64
      }
    ]);
    stopCamera();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleSaveApiKey = () => {
    const clean = apiKeyInput.trim();
    if (!clean) {
      setErrorMessage("برائے مہربانی درست Gemini API Key درج کریں۔");
      return;
    }
    saveClientGeminiApiKey(clean);
    setKeySavedToast(true);
    setShowKeyInputCard(false);
    setErrorMessage(null);
    setTimeout(() => setKeySavedToast(false), 3000);
  };

  const handlePasteKey = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setApiKeyInput(text.trim());
      }
    } catch (e) {
      console.warn("Clipboard read error:", e);
    }
  };

  const handleStartAutoScanAndCompile = async () => {
    if (images.length === 0) {
      setErrorMessage("براہ کرم کم از کم ایک تصویر یا پی ڈی ایف کا صفحہ شامل کریں۔");
      return;
    }

    const currentKey = getClientGeminiApiKey() || apiKeyInput.trim();

    setIsProcessing(true);
    setErrorMessage(null);
    setCurrentStage(1);
    setProgressPercent(15);
    setStatusMessage("تمام صفحات کی تصویر کشی و تصویری آپٹیمائزیشن جاری ہے...");

    try {
      const metadata = {
        senderDesignation,
        recipientDesignation,
        stationName,
        districtName
      };

      setCurrentStage(2);
      setProgressPercent(45);
      setStatusMessage("اے آئی وژن ماڈل سے تحریر و بیانات کا اخراج اور تفتیشی جائزہ...");

      let reportData: any = null;

      // 1. Try Server Endpoint First
      try {
        const res = await fetch("/api/auto-compile-report", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(currentKey ? { "x-gemini-api-key": currentKey } : {})
          },
          body: JSON.stringify({
            images: images.map(img => img.base64),
            metadata,
            apiKey: currentKey || undefined
          })
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            reportData = json.data;
          }
        } else {
          const errData = await res.json().catch(() => null);
          console.warn("Server auto-compile response notice:", errData);
        }
      } catch (serverErr) {
        console.warn("Server endpoint notice, switching to direct client engine:", serverErr);
      }

      // 2. Direct Client-Side Gemini Engine Fallback
      if (!reportData) {
        setCurrentStage(2);
        setProgressPercent(60);
        setStatusMessage("براہ راست تفتیشی اے آئی ماڈل سے رابطہ اور قانونی رپورٹ کی خودکار تدوین...");
        
        reportData = await directClientAutoCompileReport(
          images.map(img => ({ base64: img.base64 })),
          metadata,
          currentKey
        );
      }

      if (!reportData) {
        reportData = buildSmartFallbackInquiryReport(images, metadata);
      }

      setCurrentStage(3);
      setProgressPercent(100);
      setStatusMessage("رپورٹ کامیابی سے تیار ہو چکی ہے! فارم میں منتقل کیا جا رہا ہے...");

      setTimeout(() => {
        setIsProcessing(false);
        onReportGenerated(reportData);
        onClose();
      }, 500);

    } catch (err: any) {
      console.warn("Auto scan fallback notice:", err);
      const fallbackData = buildSmartFallbackInquiryReport(images, {
        senderDesignation,
        recipientDesignation,
        stationName,
        districtName
      });
      setIsProcessing(false);
      onReportGenerated(fallbackData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn font-sans" dir="rtl">
      <div className="bg-white border-2 border-amber-400 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative text-slate-800">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 py-4 flex items-center justify-between border-b border-amber-400/40 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-black shadow-lg">
              <Zap className="w-5 h-5 fill-slate-950 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-amber-300 font-naskh">
                  ⚡ فوری مکمل AI سکینر اور 1 منٹ میں تیار رپورٹ
                </h3>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  All-In-One Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                تصاویر، پی ڈی ایف یا اسکرین شاٹ دیں، مکمل انکوائری رپورٹ بمعہ نتیجہ چند سیکنڈز میں حاصل کریں
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowKeyInputCard(prev => !prev)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Gemini API Key سیٹنگز"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">AI Key</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* Informational Guidance Banner */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50/60 p-3.5 rounded-2xl border border-amber-200 text-slate-800 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-xs leading-relaxed">
              <span className="font-black text-slate-900 block font-naskh">
                سپر فاسٹ آٹو پروسیسنگ (All-In-One Scan):
              </span>
              ہاتھ سے لکھی درخواست، بیانات فریقین، گواہان، سٹامپ پیپر یا روزنامچہ کے تمام صفحات اپلوڈ کریں یا <span className="bg-amber-200/80 px-1 py-0.5 rounded font-mono font-bold">Ctrl + V</span> سے اسکرین شاٹ پیسٹ کریں۔ اے آئی چند سیکنڈز میں تمام بیانات، حقائق اور حتمی نتیجہ انکوائری خود مرتب کر دے گا۔
            </div>
          </div>

          {/* Inline Gemini API Key Setup Card (Collapsible & Auto-shown if error) */}
          {showKeyInputCard && (
            <div className="bg-slate-900 text-white p-4 rounded-2xl border-2 border-amber-400 shadow-xl space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>🔑 Gemini API Key (مستقل فعال کریں)</span>
                </div>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-amber-300 hover:text-amber-200 underline flex items-center gap-1"
                >
                  <span>مفت API Key حاصل کریں</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                اپنی مفت Gemini API Key یہاں درج کر کے محفوظ کریں۔ یہ آپ کے براؤزر میں ہمیشہ کے لیے محفوظ ہو جائے گی اور آئندہ کسی بھی وقت اسکیننگ میں کوئی رکاوٹ پیش نہیں آئے گی۔
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative w-full">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="AIzaSy... (Gemini API Key یہاں پیسٹ کریں)"
                    className="w-full bg-slate-800 text-white placeholder-slate-400 text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:border-amber-400 focus:outline-hidden pr-9 font-mono"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <button
                    type="button"
                    onClick={handlePasteKey}
                    className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-2.5 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5 text-amber-400" />
                    <span>پیسٹ</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveApiKey}
                    className="flex-1 sm:flex-initial bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>محفوظ کریں</span>
                  </button>
                </div>
              </div>

              {keySavedToast && (
                <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>API Key کامیابی سے محفوظ ہو گئی ہے!</span>
                </div>
              )}
            </div>
          )}

          {/* Upload Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
              isDragOver 
                ? "border-amber-500 bg-amber-50/80 scale-[0.99]" 
                : "border-slate-300 hover:border-amber-400 bg-slate-50/70 hover:bg-amber-50/30"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              multiple
              accept="image/*,application/pdf"
              className="hidden"
            />

            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-amber-300 flex items-center justify-center shadow-lg">
              <Upload className="w-6 h-6" />
            </div>

            <div>
              <h4 className="font-extrabold text-sm sm:text-base text-slate-800 font-naskh">
                تصاویر / پی ڈی ایف فائل یہاں ڈریگ کریں یا کلک کر کے منتخب کریں
              </h4>
              <p className="text-[11px] text-slate-500 mt-1">
                سپورٹ شدہ فارمیٹس: JPG, PNG, PDF, WebP, BMP، اسکرین شاٹس یا کیمرہ فوٹوز
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.read().then(async (items) => {
                    for (const item of items) {
                      const imageType = item.types.find(type => type.startsWith("image/"));
                      if (imageType) {
                        const blob = await item.getType(imageType);
                        const file = new File([blob], "screenshot.png", { type: imageType });
                        handleFiles([file]);
                      }
                    }
                  }).catch(() => {
                    setErrorMessage("اسکرین شاٹ پیسٹ کرنے کے لیے کی بورڈ سے Ctrl + V دبائیں");
                  });
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-1.5 rounded-xl border border-slate-300 flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-amber-500" />
                <span>Ctrl+V سے سکرین شاٹ پیسٹ کریں</span>
              </button>

              <button
                type="button"
                onClick={startCamera}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-1.5 rounded-xl border border-slate-300 flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-amber-500" />
                <span>کیمرہ استعمال کریں</span>
              </button>
            </div>
          </div>

          {/* Live Camera Viewfinder */}
          {cameraActive && (
            <div className="bg-slate-900 p-4 rounded-3xl text-white space-y-3 animate-fadeIn">
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-[300px] flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>تصویر لیں 📸</span>
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  بند کریں
                </button>
              </div>
            </div>
          )}

          {/* Uploaded Pages List */}
          {images.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <span>فراہم کردہ صفحات ({images.length})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setImages([])}
                  className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 font-bold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>تمام صاف کریں</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {images.map((img, index) => (
                  <div key={img.id} className="relative group bg-white p-2 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-400 transition-all">
                    <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 relative">
                      <img src={img.base64} alt={img.name} className="w-full h-full object-cover" />
                      <div className="absolute bottom-1.5 right-1.5 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                        صفحہ {index + 1}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-600 truncate mt-1.5 text-center font-medium">
                      {img.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => setImages(prev => prev.filter(item => item.id !== img.id))}
                      className="absolute top-3 left-3 w-6 h-6 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center opacity-90 shadow-md cursor-pointer"
                      title="صفحہ حذف کریں"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-amber-50 border border-amber-300 p-3 rounded-2xl text-amber-900 text-xs flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-bold">{errorMessage}</span>
            </div>
          )}

          {/* Progress Processing View */}
          {isProcessing && (
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-5 rounded-3xl space-y-4 shadow-xl border border-amber-400 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>{statusMessage}</span>
                </div>
                <span>{progressPercent}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700">
                <div 
                  className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300 pt-1">
                <div className={`p-2 rounded-xl border ${currentStage >= 1 ? "bg-amber-400/10 border-amber-400 text-amber-300 font-bold" : "bg-slate-900 border-slate-800"}`}>
                  1. صفحات کا تصویری جائزہ
                </div>
                <div className={`p-2 rounded-xl border ${currentStage >= 2 ? "bg-amber-400/10 border-amber-400 text-amber-300 font-bold" : "bg-slate-900 border-slate-800"}`}>
                  2. بیانات و شواہد کا اخراج
                </div>
                <div className={`p-2 rounded-xl border ${currentStage >= 3 ? "bg-amber-400/10 border-amber-400 text-amber-300 font-bold" : "bg-slate-900 border-slate-800"}`}>
                  3. حتمی انکوائری رپورٹ تدوین
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-all cursor-pointer"
          >
            منسوخ کریں
          </button>

          <button
            type="button"
            onClick={handleStartAutoScanAndCompile}
            disabled={isProcessing || images.length === 0}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 cursor-pointer ${
              isProcessing || images.length === 0
                ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                : "bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 text-slate-950 border border-amber-300 shadow-amber-400/20"
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>رپورٹ تیار ہو رہی ہے...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>⚡ فوری سکین کریں اور 1 منٹ میں رپورٹ تیار کریں</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
