import React, { useState, useRef, useEffect } from "react";
import { 
  Camera, Upload, RefreshCw, FileText, X, Trash2, 
  RotateCw, Sparkles, Sliders, Wand2, Grid, Zap, ZapOff, 
  FlipHorizontal, Sun, Contrast, Eye, FileCheck, Key
} from "lucide-react";
import { convertPdfToSingleStackedImage, optimizeImageForOcr } from "../lib/pdfToImage";

interface StatementImageScannerProps {
  onTextScanned: (text: string) => void;
  placeholder?: string;
  label?: string;
}

type FilterMode = "magic" | "pencil" | "bw" | "grayscale" | "original";

async function directClientGeminiOcr(imageBase64: string, apiKey: string): Promise<string> {
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

  const prompt = `یہ پولیس کے کاغذ، ہاتھ سے لکھی درخواست، یا پنسل سے تحریر کردہ بیان کی تصویر ہے۔
تصویر میں موجود تمام اردو تحریر (خواہ وہ پنسل کی مدہم لکھائی ہو، بال پوائنٹ ہو یا قلم کی) کو انتہائی باریک بینی سے پڑھ کر مکمل اردو متن (Unicode Text) میں تحریر کریں۔ کوئی جملہ، نام، ولدیت یا فقرہ چھوڑے بغیر من و عن اصل تحریر اردو میں فراہم کریں۔`;

  const systemInstruction = `You are an elite, specialized Urdu Handwriting and Document OCR system for Punjab Police, Pakistan.
You specialize in deciphering very faint, light, messy pencil handwriting (پنسل کی ہلکی، مدہم اور کچی لکھائی), fountain pen scripts, handwritten applications (درخواست سائل), police diaries (روزنامچہ), statements of parties (بیانات فریقین), stamp papers (سٹامپ پیپر), witness statements, and official police files.
Key Instructions:
1. Carefully analyze every faint pencil stroke, ink word, name, address, father's name, CNIC, and detail. Reconstruct complete coherent sentences in proper Urdu.
2. Maintain exact Urdu orthography and spellings for all legal and police terminology (جیسے: مسمی، مسمات، ولدیت، سکونت، سائل، الزام علیہ، وقوعہ، برآمدگی، گواہ، تھانہ، وغیرہ).
3. Do NOT omit any names, dates, amounts, or statements.
4. Output ONLY the raw extracted Urdu text with zero English commentary, markdown backticks or extra metadata.`;

  const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.0-flash-lite", "gemini-1.5-pro"];
  let lastError: any = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: finalMimeType,
                  data: cleanBase64
                }
              },
              {
                text: prompt
              }
            ]
          }
        ],
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
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
      } else {
        const errText = await res.text();
        console.warn(`Direct client OCR with ${model} failed (${res.status}):`, errText);
      }
    } catch (e: any) {
      console.warn(`Direct client OCR error with ${model}:`, e);
      lastError = e;
    }
  }

  throw lastError || new Error("براہ کرم اپنی انٹرنیٹ یا Gemini API Key چیک کریں۔");
}

const StatementImageScanner = React.memo(function StatementImageScanner({ 
  onTextScanned, 
  label = "اے آئی اسکینر (درخواست، پنسل تحریر یا ہارڈ کاپی اسکین کریں):"
}: StatementImageScannerProps) {
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConvertingPdf, setIsConvertingPdf] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [scannedSuccess, setScannedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showInlineKeyInput, setShowInlineKeyInput] = useState(false);
  const [inlineKeyValue, setInlineKeyValue] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("GEMINI_CUSTOM_API_KEY") || "" : ""));
  
  // Camera Controls
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorchSupport, setHasTorchSupport] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  // Filter Controls
  const [filterMode, setFilterMode] = useState<FilterMode>("magic");
  const [rotation, setRotation] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(0);
  const [showFineTune, setShowFineTune] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize camera lifecycle
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    
    const initCamera = async () => {
      try {
        setErrorMessage(null);
        let stream: MediaStream | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: { ideal: facingMode },
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            },
            audio: false
          });
        } catch (err1) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode },
            audio: false
          });
        }
        activeStream = stream;
        streamRef.current = stream;

        const track = stream.getVideoTracks()[0];
        if (track) {
          const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
          setHasTorchSupport(!!capabilities.torch);
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.setAttribute("autoplay", "true");
          videoRef.current.setAttribute("muted", "true");
          await videoRef.current.play();
        }
      } catch (err: any) {
        setCameraActive(false);
        if (cameraInputRef.current) {
          cameraInputRef.current.click();
        } else {
          setErrorMessage("کیمرہ شروع نہیں ہو سکا۔ برائے مہربانی نیچے دیا گیا فائل اپلوڈ بٹن استعمال کریں۔");
        }
      }
    };

    if (cameraActive) {
      initCamera();
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [cameraActive, facingMode]);

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        const nextState = !torchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextState } as any]
        });
        setTorchOn(nextState);
      } catch (e) {
        console.warn("Torch toggle notice", e);
      }
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => (prev === "environment" ? "user" : "environment"));
  };

  const renderDocumentFilter = (
    img: HTMLImageElement,
    mode: FilterMode,
    rot: number,
    bright: number,
    cont: number
  ): string => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return img.src;

    const origW = img.naturalWidth || img.width;
    const origH = img.naturalHeight || img.height;

    const isRotated = rot === 90 || rot === 270;
    canvas.width = isRotated ? origH : origW;
    canvas.height = isRotated ? origW : origH;

    ctx.save();
    if (rot === 90) {
      ctx.translate(canvas.width, 0);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(img, 0, 0);
    } else if (rot === 180) {
      ctx.translate(canvas.width, canvas.height);
      ctx.rotate((180 * Math.PI) / 180);
      ctx.drawImage(img, 0, 0);
    } else if (rot === 270) {
      ctx.translate(0, canvas.height);
      ctx.rotate((270 * Math.PI) / 180);
      ctx.drawImage(img, 0, 0);
    } else {
      ctx.drawImage(img, 0, 0);
    }
    ctx.restore();

    if (mode === "original" && bright === 0 && cont === 0) {
      return canvas.toDataURL("image/jpeg", 0.85);
    }

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    const factor = (259 * (cont + 255)) / (255 * (259 - cont));

    for (let i = 0; i < d.length; i += 4) {
      let r = d[i];
      let g = d[i + 1];
      let b = d[i + 2];

      if (bright !== 0) {
        r = Math.min(255, Math.max(0, r + bright));
        g = Math.min(255, Math.max(0, g + bright));
        b = Math.min(255, Math.max(0, b + bright));
      }

      if (cont !== 0) {
        r = Math.min(255, Math.max(0, factor * (r - 128) + 128));
        g = Math.min(255, Math.max(0, factor * (g - 128) + 128));
        b = Math.min(255, Math.max(0, factor * (b - 128) + 128));
      }

      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      if (mode === "magic") {
        if (gray > 150) {
          const boost = (gray - 150) * 1.8;
          d[i] = Math.min(255, r + boost);
          d[i + 1] = Math.min(255, g + boost);
          d[i + 2] = Math.min(255, b + boost);
        } else {
          d[i] = Math.max(0, r * 0.5);
          d[i + 1] = Math.max(0, g * 0.5);
          d[i + 2] = Math.max(0, b * 0.5);
        }
      } else if (mode === "pencil") {
        // Specifically designed for faint/light pencil handwriting
        if (gray > 225) {
          d[i] = 255;
          d[i + 1] = 255;
          d[i + 2] = 255;
        } else if (gray > 40) {
          const normalized = (gray - 40) / 185;
          const darkened = Math.pow(normalized, 2.2) * 210;
          d[i] = Math.max(0, Math.min(255, darkened));
          d[i + 1] = Math.max(0, Math.min(255, darkened));
          d[i + 2] = Math.max(0, Math.min(255, darkened));
        } else {
          d[i] = 0;
          d[i + 1] = 0;
          d[i + 2] = 0;
        }
      } else if (mode === "bw") {
        const val = gray > 145 ? 255 : 0;
        d[i] = val;
        d[i + 1] = val;
        d[i + 2] = val;
      } else if (mode === "grayscale") {
        d[i] = gray;
        d[i + 1] = gray;
        d[i + 2] = gray;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.88);
  };

  useEffect(() => {
    if (!rawImage) {
      setProcessedImage(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = rawImage;
    img.onload = () => {
      const processed = renderDocumentFilter(
        img,
        filterMode,
        rotation,
        brightness,
        contrast
      );
      setProcessedImage(processed);
    };
  }, [rawImage, filterMode, rotation, brightness, contrast]);

  const handleTranscribe = async (directImage?: string) => {
    let imageToProcess = directImage || processedImage || rawImage;
    if (!imageToProcess) {
      setErrorMessage("پہلے تصویر کھینچیں یا فائل اپ لوڈ کریں۔");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setShowInlineKeyInput(false);

    try {
      // Compress and optimize image to crisp Full HD preserving razor-sharp pencil lines
      imageToProcess = await optimizeImageForOcr(imageToProcess, 1600, 0.82, filterMode === "pencil");

      const customKey = typeof window !== "undefined" ? localStorage.getItem("GEMINI_CUSTOM_API_KEY") || "" : "";
      let extractedUrduText = "";

      // LAYER 1: Attempt via Server Backend
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (customKey) {
          headers["x-gemini-api-key"] = customKey;
        }

        const response = await fetch("/api/transcribe-image", {
          method: "POST",
          headers,
          body: JSON.stringify({
            imageBase64: imageToProcess,
            apiKey: customKey || undefined
          })
        });

        if (response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            if (data.text && data.text.trim()) {
              extractedUrduText = data.text.trim();
            }
          }
        } else {
          console.warn(`Server OCR returned status ${response.status}, attempting direct client fallback...`);
        }
      } catch (serverErr) {
        console.warn("Server transcribe attempt notice:", serverErr);
      }

      // LAYER 2: Direct Client-Side Gemini REST API Fallback
      if (!extractedUrduText && customKey) {
        try {
          extractedUrduText = await directClientGeminiOcr(imageToProcess, customKey);
        } catch (clientOcrErr: any) {
          console.warn("Direct client OCR notice:", clientOcrErr);
        }
      }

      if (extractedUrduText) {
        onTextScanned(extractedUrduText);
        setScannedSuccess(true);
      } else if (!customKey) {
        setShowInlineKeyInput(true);
        setErrorMessage("تصویر اسکین کرنے کے لیے Gemini API Key درکار ہے۔ برائے مہربانی نیچے درج کریں۔");
      } else {
        setErrorMessage("تصویر میں کوئی واضح تحریر نہیں مل سکی۔ براہ کرم صاف تصویر کھینچیں یا پنسل فلٹر استعمال کریں۔");
      }
    } catch (error: any) {
      console.error("OCR Error:", error);
      setErrorMessage(`تحریر حاصل کرنے میں خرابی: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = e.target;
    const file = fileInput.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setScannedSuccess(false);

    const resetInput = () => {
      fileInput.value = "";
    };

    try {
      const MAX_SIZE_MB = 25;
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setErrorMessage(`فائل کا سائز زیادہ ہے (${(file.size / (1024 * 1024)).toFixed(1)} MB)۔ ${MAX_SIZE_MB}MB سے کم فائل منتخب کریں۔`);
        resetInput();
        return;
      }

      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();

      if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
        try {
          setIsConvertingPdf(true);
          const stackedImage = await convertPdfToSingleStackedImage(file);
          const optimizedPdfImg = await optimizeImageForOcr(stackedImage, 1280, 0.80);
          setRawImage(optimizedPdfImg);
          setFilterMode("magic");
          setRotation(0);
          setBrightness(0);
          setContrast(0);
          handleTranscribe(optimizedPdfImg);
        } catch (pdfErr: any) {
          console.error("PDF Error:", pdfErr);
          setErrorMessage(`پی ڈی ایف فائل پڑھنے میں خرابی: ${pdfErr?.message || "فائل درست نہیں ہے۔"}`);
        } finally {
          setIsConvertingPdf(false);
          resetInput();
        }
        return;
      }

      const isImage = fileType.startsWith("image/") || 
                      /\.(jpg|jpeg|png|webp|bmp|gif|heic|svg)$/i.test(fileName);

      if (isImage) {
        const reader = new FileReader();

        reader.onload = async () => {
          try {
            if (typeof reader.result === "string") {
              const optimized = await optimizeImageForOcr(reader.result, 1280, 0.80);
              setRawImage(optimized);
              setFilterMode("magic");
              setRotation(0);
              setBrightness(0);
              setContrast(0);
              handleTranscribe(optimized);
            }
          } catch (imgOptErr: any) {
            console.error("Image Error:", imgOptErr);
            setErrorMessage(`تصویر پروسیس کرنے میں خرابی: ${imgOptErr?.message || "تصویر درست نہیں ہے۔"}`);
          } finally {
            resetInput();
          }
        };

        reader.readAsDataURL(file);
        return;
      }

      setErrorMessage(`صرف تصاویر (JPG, PNG) یا PDF فائل منتخب کریں۔`);
      resetInput();

    } catch (globalErr: any) {
      console.error("Upload Error:", globalErr);
      setErrorMessage(`اپ لوڈنگ میں خرابی: ${globalErr?.message || "دوبارہ کوشش کریں۔"}`);
      resetInput();
    }
  };

  const startCamera = () => {
    setErrorMessage(null);
    setCameraActive(true);
  };

  const stopCamera = () => {
    setCameraActive(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(60);
    }

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 1920;
    canvas.height = videoRef.current.videoHeight || 1080;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
      const optimizedPhoto = await optimizeImageForOcr(dataUrl, 1280, 0.80);
      
      setRawImage(optimizedPhoto);
      setFilterMode("magic");
      setRotation(0);
      setBrightness(0);
      setContrast(0);
      setCameraActive(false);
      handleTranscribe(optimizedPhoto);
    }
  };

  const clearAll = () => {
    setRawImage(null);
    setProcessedImage(null);
    setScannedSuccess(false);
    setErrorMessage(null);
    setFilterMode("magic");
    setRotation(0);
    setBrightness(0);
    setContrast(0);
  };

  return (
    <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3 space-y-2.5 text-right w-full text-slate-900 shadow-xs font-sans">
      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*,application/pdf,.pdf" 
        onChange={handleFileChange} 
        className="hidden" 
      />
      <input 
        ref={cameraInputRef}
        type="file" 
        accept="image/*" 
        capture="environment"
        onChange={handleFileChange} 
        className="hidden" 
      />

      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <div className="flex items-center gap-1.5">
          <Wand2 className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
          <span className="text-[11px] font-extrabold text-slate-800">{label}</span>
        </div>
        {rawImage && (
          <button
            type="button"
            onClick={clearAll}
            className="text-[10px] text-rose-700 font-bold hover:text-rose-800 flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 transition-all cursor-pointer"
          >
            <Trash2 className="w-2.5 h-2.5" />
            <span>نئی اسکین</span>
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-300 text-rose-800 text-[11px] font-bold p-2.5 rounded-lg text-center flex flex-col items-center justify-center gap-1.5 shadow-xs">
          <span>⚠️ {errorMessage}</span>
          {!showInlineKeyInput && !localStorage.getItem("GEMINI_CUSTOM_API_KEY") && (
            <button
              type="button"
              onClick={() => setShowInlineKeyInput(true)}
              className="text-[10px] text-indigo-700 underline font-bold hover:text-indigo-900 cursor-pointer"
            >
              یہاں کلک کر کے Gemini API Key درج کریں
            </button>
          )}
        </div>
      )}

      {showInlineKeyInput && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 space-y-2 text-right shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
            <Key className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Google Gemini API Key درج کریں (ایک بار):</span>
          </div>
          <p className="text-[10px] text-amber-800 leading-tight">
            یہ Key آپ کے موبائل/براؤزر میں محفوظ رہے گی اور تمام دستاویزات فوری اسکین ہوں گی۔
          </p>
          <div className="flex gap-1.5">
            <input
              type="password"
              value={inlineKeyValue}
              onChange={(e) => setInlineKeyValue(e.target.value)}
              placeholder="AIzaSy..."
              className="flex-1 bg-white border border-amber-300 rounded-lg p-2 text-xs font-mono text-left focus:ring-1 focus:ring-amber-500"
              dir="ltr"
            />
            <button
              type="button"
              onClick={() => {
                const k = inlineKeyValue.trim();
                if (k) {
                  localStorage.setItem("GEMINI_CUSTOM_API_KEY", k);
                  setShowInlineKeyInput(false);
                  setErrorMessage(null);
                  handleTranscribe();
                } else {
                  alert("براہ کرم درست API Key درج کریں۔");
                }
              }}
              className="bg-[#0f172a] hover:bg-[#1e293b] text-white px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 cursor-pointer active:scale-95 shadow-xs"
            >
              محفوظ اور اسکین
            </button>
          </div>
        </div>
      )}

      {cameraActive && (
        <div className="fixed inset-0 z-[99999] bg-slate-950 flex flex-col justify-between text-white select-none overflow-hidden h-[100dvh]" dir="rtl">
          <div className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 flex items-center justify-between z-20">
            <span className="text-xs font-black text-amber-300 bg-amber-950/90 px-3 py-1 rounded-full border border-amber-500/40">
              لائیو کیمرہ ایچ ڈی اسکین
            </span>

            <div className="flex items-center gap-2">
              {hasTorchSupport && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`p-2 rounded-full transition-all border ${
                    torchOn 
                      ? "bg-amber-500 text-slate-950 border-amber-400" 
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                  }`}
                  title="ٹارچ / فلیش"
                >
                  {torchOn ? <Zap className="w-4 h-4 fill-slate-950" /> : <ZapOff className="w-4 h-4" />}
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowGrid(!showGrid)}
                className={`p-2 rounded-full transition-all border ${
                  showGrid 
                    ? "bg-emerald-800 text-emerald-200 border-emerald-600" 
                    : "bg-slate-800 text-slate-300 border-slate-700"
                }`}
                title="گرڈ لائنز"
              >
                <Grid className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={switchCamera}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-full border border-slate-700 transition-all"
                title="کیمرہ تبدیل کریں"
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>

              <button 
                type="button"
                onClick={stopCamera}
                className="bg-rose-950 hover:bg-rose-900 text-rose-200 p-2 rounded-full border border-rose-800 transition-colors"
                title="بند کریں"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="relative flex-1 w-full bg-slate-950 flex items-center justify-center overflow-hidden">
            <video 
              ref={videoRef} 
              className="w-full h-full object-cover" 
              playsInline 
              autoPlay
              muted
            />

            {showGrid && (
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-25">
                <div className="border border-white/25"></div>
                <div className="border border-white/25"></div>
                <div className="border border-white/25"></div>
                <div className="border border-white/25"></div>
                <div className="border border-white/25"></div>
                <div className="border border-white/25"></div>
                <div className="border border-white/25"></div>
                <div className="border border-white/25"></div>
                <div className="border border-white/25"></div>
              </div>
            )}

            <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none px-4 z-10">
              <span className="bg-slate-900/85 backdrop-blur-md text-amber-300 border border-amber-500/40 text-[11px] font-black px-3.5 py-1.5 rounded-full shadow-lg">
                کاغذ یا تحریر کو سامنے رکھ کر فوٹو بنائیں
              </span>
            </div>
          </div>

          <div className="bg-slate-950/95 backdrop-blur-md py-4 px-6 flex items-center justify-between z-20 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                if (fileInputRef.current) fileInputRef.current.click();
              }}
              className="flex flex-col items-center gap-1 text-slate-300 hover:text-white transition-colors text-[10px] font-bold cursor-pointer"
            >
              <div className="bg-slate-800 hover:bg-slate-700 p-2.5 rounded-full transition-colors border border-slate-700">
                <Upload className="w-4 h-4 text-emerald-400" />
              </div>
              <span>گیلری / PDF</span>
            </button>

            <button 
              type="button"
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full border-4 border-amber-400 flex items-center justify-center bg-white hover:bg-amber-50 active:scale-95 transition-all shadow-xl shadow-amber-500/25 cursor-pointer"
              title="تصویر کھینچیں"
            >
              <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center text-white">
                <Camera className="w-6 h-6 text-amber-400" />
              </div>
            </button>

            <button 
              type="button"
              onClick={stopCamera}
              className="flex flex-col items-center gap-1 text-slate-300 hover:text-white transition-colors text-[10px] font-bold cursor-pointer"
            >
              <div className="bg-slate-800 hover:bg-slate-700 p-2.5 rounded-full transition-colors border border-slate-700">
                <X className="w-4 h-4 text-rose-400" />
              </div>
              <span>کینسل</span>
            </button>
          </div>
        </div>
      )}

      {rawImage ? (
        <div className="w-full space-y-2.5">
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between text-[10px] text-emerald-900 font-bold px-1">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                تحریر فلٹر:
              </span>
              <span className="text-[9px] text-slate-500">پنسل یا مدہم لکھائی واضح کریں</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setFilterMode("magic")}
                className={`py-1.5 px-1 rounded-md flex items-center justify-center gap-1 transition-all border cursor-pointer ${
                  filterMode === "magic"
                    ? "bg-[#0f172a] text-white border-slate-800 shadow-xs"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
              >
                <Wand2 className="w-3 h-3 text-amber-300" />
                <span>میجک موڈ</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterMode("pencil")}
                className={`py-1.5 px-1 rounded-md flex items-center justify-center gap-1 transition-all border cursor-pointer ${
                  filterMode === "pencil"
                    ? "bg-[#0f172a] text-white border-slate-800 shadow-xs"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>پنسل تحریر</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterMode("bw")}
                className={`py-1.5 px-1 rounded-md flex items-center justify-center gap-1 transition-all border cursor-pointer ${
                  filterMode === "bw"
                    ? "bg-[#0f172a] text-white border-slate-800 shadow-xs"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>بلیک و وائٹ</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterMode("original")}
                className={`py-1.5 px-1 rounded-md flex items-center justify-center gap-1 transition-all border cursor-pointer ${
                  filterMode === "original"
                    ? "bg-[#0f172a] text-white border-slate-800 shadow-xs"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>اصل تصویر</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 text-[10px] font-bold shadow-xs">
            <button
              type="button"
              onClick={() => setRotation(p => (p + 90) % 360)}
              className="bg-white hover:bg-slate-50 text-slate-800 px-2.5 py-1 rounded border border-slate-300 flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
            >
              <RotateCw className="w-3 h-3 text-slate-700" />
              <span>گھمائیں (90°)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowFineTune(!showFineTune)}
              className={`px-2.5 py-1 rounded border flex items-center gap-1 transition-all cursor-pointer ${
                showFineTune 
                  ? "bg-[#0f172a] text-white border-slate-800 shadow-2xs" 
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-2xs"
              }`}
            >
              <Sliders className="w-3 h-3" />
              <span>روشنی و کنٹراسٹ</span>
            </button>
          </div>

          {showFineTune && (
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-2 text-[10px] shadow-xs">
              <div className="grid grid-cols-2 gap-3 text-slate-700">
                <div>
                  <label className="flex items-center gap-1 mb-1 text-[10px] font-bold">
                    <Sun className="w-3 h-3 text-amber-500" />
                    <span>روشنی: {brightness}</span>
                  </label>
                  <input 
                    type="range" min="-50" max="50" 
                    value={brightness} 
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full accent-slate-800" 
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 mb-1 text-[10px] font-bold">
                    <Contrast className="w-3 h-3 text-slate-700" />
                    <span>کنٹراسٹ: {contrast}</span>
                  </label>
                  <input 
                    type="range" min="-50" max="50" 
                    value={contrast} 
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full accent-slate-800" 
                  />
                </div>
              </div>
            </div>
          )}

          <div className="relative max-h-[175px] rounded-lg overflow-hidden border border-slate-200 bg-white flex flex-col items-center justify-center p-1 shadow-inner">
            {processedImage ? (
              <img 
                src={processedImage} 
                className="max-h-[160px] object-contain rounded border border-slate-100" 
                alt="Enhanced Preview" 
              />
            ) : (
              <div className="p-4 text-center text-xs text-slate-500">تصویر پروسیس ہو رہی ہے...</div>
            )}
          </div>

          {scannedSuccess && (
            <div className="bg-slate-100 border border-slate-300 rounded-lg p-2 text-center text-[11px] font-bold text-slate-900 flex items-center justify-center gap-1.5 shadow-xs">
              <FileCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>تصویر کی سافٹ کاپی کامیابی سے درج کر دی گئی ہے!</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => handleTranscribe()}
            disabled={isProcessing}
            className={`w-full py-2.5 rounded-lg font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isProcessing
                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                : "bg-[#0f172a] hover:bg-[#1e293b] text-white border border-slate-800 active:scale-95"
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                <span>تصویر و پنسل تحریر سے سافٹ کاپی بن رہی ہے...</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 text-amber-300" />
                <span>دوبارہ سافٹ کاپی حاصل کریں (Re-Scan Text)</span>
              </>
            )}
          </button>
        </div>
      ) : isConvertingPdf ? (
        <div className="flex flex-col items-center justify-center p-4 bg-white border border-slate-300 rounded-xl text-center space-y-1.5 shadow-xs">
          <RefreshCw className="w-6 h-6 text-slate-800 animate-spin" />
          <p className="text-xs font-bold text-slate-900">
            پی ڈی ایف فائل کے صفحات اسکین ہو رہے ہیں...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 w-full pt-0.5" dir="rtl">
          <button
            type="button"
            onClick={() => {
              if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                startCamera();
              } else if (cameraInputRef.current) {
                cameraInputRef.current.click();
              }
            }}
            className="bg-[#0f172a] hover:bg-[#1e293b] text-white border border-slate-800 rounded-xl p-2.5 flex items-center justify-center gap-2 font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Camera className="w-4 h-4 text-amber-300 shrink-0" />
            <div className="text-right">
              <div className="text-[11px] font-bold leading-tight">کیمرہ اسکین</div>
              <div className="text-[9px] text-slate-300 font-normal">فوٹو بنائیں</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
            className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl p-2.5 flex items-center justify-center gap-2 font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-slate-700 shrink-0" />
            <div className="text-right">
              <div className="text-[11px] font-bold leading-tight">فائل / تصویر اپلوڈ</div>
              <div className="text-[9px] text-slate-500 font-normal">PDF، JPG، PNG</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
});

export default StatementImageScanner;
