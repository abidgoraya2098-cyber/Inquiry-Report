import React, { useState, useRef, useEffect } from "react";
import { 
  X, Upload, Camera, Sparkles, CheckCircle2, 
  Trash2, AlertCircle, FileText, Zap, RefreshCw, FileCheck, Layers, ClipboardPaste
} from "lucide-react";
import { processFileToImageUrls, extractClipboardImages } from "../lib/pdfToImage";
import { directClientAutoCompileReport } from "../lib/gemini";
import { InquiryData } from "../types";
import { POLICE_LOGO_BASE64 } from "../assets/logoBase64";

interface AutoScanReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportGenerated: (inquiryData: Partial<InquiryData>) => void;
}

export default function AutoScanReportModal({
  isOpen,
  onClose,
  onReportGenerated
}: AutoScanReportModalProps) {
  const [images, setImages] = useState<{ id: string; name: string; base64: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleStartAutoScanAndCompile = async () => {
    if (images.length === 0) {
      setErrorMessage("براہ کرم کم از کم ایک تصویر یا پی ڈی ایف کا صفحہ شامل کریں۔");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setCurrentStage(1);
    setProgressPercent(15);
    setStatusMessage("صفحات کا باریک بینی سے تصویری جائزہ لیا جا رہا ہے...");

    try {
      const customKey = typeof window !== "undefined" ? localStorage.getItem("GEMINI_CUSTOM_API_KEY") || "" : "";
      
      // Step 2: Call Server Auto-Compile API
      setCurrentStage(2);
      setProgressPercent(40);
      setStatusMessage("اے آئی ویژن ماڈل سے بیانات، موقف اور حقائق مدون ہو رہے ہیں...");

      let reportData: any = null;

      try {
        const res = await fetch("/api/auto-compile-report", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(customKey ? { "x-gemini-api-key": customKey } : {})
          },
          body: JSON.stringify({
            images: images.map(img => img.base64),
            apiKey: customKey || undefined
          })
        });

        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            reportData = json.data;
          }
        }
      } catch (serverErr) {
        console.warn("Server auto-compile error, trying client fallback:", serverErr);
      }

      // Step 3: Client Fallback if server returned no data
      if (!reportData) {
        setCurrentStage(3);
        setProgressPercent(65);
        setStatusMessage("کلائنٹ سائیڈ بیک اپ سے انکوائری رپورٹ تیار کی جا رہی ہے...");
        
        reportData = await directClientAutoCompileReport(
          images.map(img => img.base64),
          {},
          customKey
        );
      }

      if (!reportData || !reportData.complainantStatement && !reportData.inquiryConclusion) {
        throw new Error("دستاویز سے تفتیشی ڈیٹا حاصل نہیں ہو سکا۔ برائے مہربانی صاف تصویر منتخب کریں۔");
      }

      // Step 4: Finalizing & Applying
      setCurrentStage(4);
      setProgressPercent(90);
      setStatusMessage("نتیجہ انکوائری اور باضابطہ رپورٹ کو حتمی شکل دی جا رہی ہے...");

      setTimeout(() => {
        setProgressPercent(100);
        setCurrentStage(5);
        setStatusMessage("مکمل! انکوائری رپورٹ تیار ہو چکی ہے۔");

        setTimeout(() => {
          setIsProcessing(false);
          onReportGenerated(reportData);
          onClose();
        }, 600);
      }, 500);

    } catch (err: any) {
      console.error("Auto scan and compile error:", err);
      setIsProcessing(false);
      setErrorMessage(err.message || "رپورٹ کی خودکار تیاری میں خرابی پیش آئی۔");
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 font-sans animate-fadeIn no-print" dir="rtl">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-[#0f172a] text-white px-5 py-4 flex justify-between items-center shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 border-2 border-amber-400 p-0.5 shadow-md flex items-center justify-center shrink-0">
              <img 
                src={POLICE_LOGO_BASE64} 
                alt="پنجاب پولیس لوگو" 
                className="w-full h-full rounded-full object-contain"
              />
            </div>
            <div className="text-right">
              <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-1.5 font-naskh">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>فوری مکمل AI سکینر اور 1 منٹ میں تیار رپورٹ</span>
              </h3>
              <p className="text-[10px] sm:text-[11px] text-amber-200/90 font-medium">
                تصاویر، پی ڈی ایف یا سکرین شاٹ دیں، مکمل انکوائری رپورٹ بمعہ نتیجہ چند سیکنڈز میں حاصل کریں
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            disabled={isProcessing}
            className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-slate-800">
          
          {/* Instructions banner */}
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 flex items-start gap-2.5 text-right">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-950 leading-relaxed font-medium">
              <p className="font-bold text-amber-900">سپر فاسٹ آٹو پروسیسنگ (All-In-One Scan):</p>
              <p className="text-[11px] text-slate-700 mt-0.5">
                ہاتھ سے لکھی درخواست، بیانات فریقین، گواہان، سٹامپ پیپر یا روزنامچہ کے تمام صفحات اپلوڈ کریں یا <span className="font-bold text-slate-900 bg-amber-200/70 px-1 rounded">Ctrl + V</span> سے اسکرین شاٹ پیسٹ کریں۔ اے آئی چند سیکنڈز میں تمام بیانات، حقائق اور حتمی <b>نتیجہ انکوائری</b> خود مرتب کر دے گا۔
              </p>
            </div>
          </div>

          {/* Camera View */}
          {cameraActive && (
            <div className="bg-slate-900 rounded-2xl p-3 text-center space-y-3">
              <video ref={videoRef} autoPlay playsInline className="w-full max-h-64 rounded-xl object-contain bg-black" />
              <div className="flex justify-center gap-3">
                <button
                  onClick={capturePhoto}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>تصویر محفوظ کریں</span>
                </button>
                <button
                  onClick={stopCamera}
                  className="bg-slate-700 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer hover:bg-slate-600"
                >
                  بند کریں
                </button>
              </div>
            </div>
          )}

          {/* Drag & Drop Upload Zone */}
          {!cameraActive && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                isDragOver 
                  ? "border-amber-500 bg-amber-50/50 scale-[1.01]" 
                  : "border-slate-300 hover:border-slate-400 bg-slate-50/60"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                multiple 
                accept="image/*,application/pdf,.pdf" 
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFiles(e.target.files);
                  }
                }}
              />

              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center shadow-md">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 font-naskh">
                  تصاویر / پی ڈی ایف فائل یہاں ڈریگ کریں یا کلک کر کے منتخب کریں
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  سپورٹ شدہ فارمیٹس: JPG, PNG, PDF, WebP, BMP، اسکرین شاٹس یا کیمرہ فوٹوز
                </p>

                <div className="flex items-center gap-2 pt-2 flex-wrap justify-center">
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-1 rounded-lg font-bold flex items-center gap-1">
                    <ClipboardPaste className="w-3 h-3 text-slate-800" />
                    Ctrl+V سے سکرین شاٹ پیسٹ کریں
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startCamera();
                    }}
                    className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-[10px] px-3 py-1 rounded-lg font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <Camera className="w-3 h-3 text-amber-600" />
                    <span>کیمرہ استعمال کریں</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Uploaded Pages Thumbnails Grid */}
          {images.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-900" />
                  <span>فراہم کردہ صفحات ({images.length})</span>
                </span>
                <button
                  type="button"
                  onClick={() => setImages([])}
                  disabled={isProcessing}
                  className="text-rose-600 hover:text-rose-700 text-[11px] flex items-center gap-0.5 cursor-pointer font-sans"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>تمام صاف کریں</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1">
                {images.map((img, idx) => (
                  <div key={img.id} className="relative group border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs h-24 flex items-center justify-center p-1">
                    <img src={img.base64} alt={img.name} className="max-h-full max-w-full object-contain" />
                    <span className="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                      صفحہ {idx + 1}
                    </span>
                    {!isProcessing && (
                      <button
                        type="button"
                        onClick={() => setImages(prev => prev.filter(item => item.id !== img.id))}
                        className="absolute top-1 left-1 bg-rose-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-700 shadow-md cursor-pointer"
                        title="حذف کریں"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress Animation during OCR & Compilation */}
          {isProcessing && (
            <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3 text-center shadow-lg border border-slate-800 animate-fadeIn">
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
                <span className="font-extrabold text-sm text-amber-300 font-naskh">
                  خودکار تفتیشی رپورٹ مرتب کی جا رہی ہے...
                </span>
              </div>

              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <p className="text-xs text-slate-300 font-medium">
                {statusMessage}
              </p>

              <div className="grid grid-cols-4 gap-1 text-[9px] text-slate-400 pt-1 border-t border-slate-800">
                <span className={currentStage >= 1 ? "text-amber-400 font-bold" : ""}>1. امیج OCR</span>
                <span className={currentStage >= 2 ? "text-amber-400 font-bold" : ""}>2. بیانات تفریق</span>
                <span className={currentStage >= 3 ? "text-amber-400 font-bold" : ""}>3. اہم حقائق</span>
                <span className={currentStage >= 4 ? "text-amber-400 font-bold" : ""}>4. نتیجہ انکوائری</span>
              </div>
            </div>
          )}

          {/* Error message */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex justify-between items-center shrink-0">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            disabled={isProcessing}
            className="text-xs text-slate-600 hover:text-slate-900 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            منسوخ کریں
          </button>

          <button
            type="button"
            onClick={handleStartAutoScanAndCompile}
            disabled={isProcessing || images.length === 0}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer ${
              isProcessing || images.length === 0
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] hover:from-[#1e293b] hover:to-[#0f172a] text-white active:scale-95 border border-slate-800"
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                <span>رپورٹ تیار ہو رہی ہے...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-400" />
                <span>⚡ فوری سکین کریں اور 1 منٹ میں رپورٹ تیار کریں</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
