import React, { useState, useRef, useEffect } from "react";
import { 
  Camera, Upload, RefreshCw, FileText, X, Trash2, 
  RotateCw, Sparkles, Sliders, Wand2, Grid, Zap, ZapOff, 
  FlipHorizontal, Crop, Check, Sun, Contrast, Eye, FileCheck
} from "lucide-react";
import { convertPdfToSingleStackedImage, optimizeImageForOcr } from "../lib/pdfToImage";

interface StatementImageScannerProps {
  onTextScanned: (text: string) => void;
  placeholder?: string;
  label?: string;
}

type FilterMode = "magic" | "pencil" | "bw" | "grayscale" | "original";

const StatementImageScanner = React.memo(function StatementImageScanner({ 
  onTextScanned, 
  label = "اے آئی اسکینر (موبائل کیمرہ / گیلری / پی ڈی ایف سے درخواست یا بیان اسکین کریں):"
}: StatementImageScannerProps) {
  // Original raw image (captured or uploaded)
  const [rawImage, setRawImage] = useState<string | null>(null);
  // Processed image (filtered/cropped) shown in preview & sent to OCR
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConvertingPdf, setIsConvertingPdf] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [scannedSuccess, setScannedSuccess] = useState(false);
  
  // Camera Controls
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorchSupport, setHasTorchSupport] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  // Filter & Crop Controls
  const [filterMode, setFilterMode] = useState<FilterMode>("magic");
  const [rotation, setRotation] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(0);
  const [showFineTune, setShowFineTune] = useState(false);
  const [cropMargins, setCropMargins] = useState({ top: 0, bottom: 0, left: 0, right: 0 });
  const [showCropControls, setShowCropControls] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera lifecycle
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    
    const initCamera = async () => {
      try {
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
          console.warn("Ideal camera constraints failed, attempting fallback video constraints:", err1);
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode },
            audio: false
          });
        }
        activeStream = stream;
        streamRef.current = stream;

        // Check torch capabilities
        const track = stream.getVideoTracks()[0];
        if (track) {
          const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
          if (capabilities.torch) {
            setHasTorchSupport(true);
          } else {
            setHasTorchSupport(false);
          }
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.setAttribute("autoplay", "true");
          videoRef.current.setAttribute("muted", "true");
          await videoRef.current.play();
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        alert("براہ راست لائیو کیمرہ تک رسائی حاصل نہیں ہوسکی۔ براہ کرم نیچے 'نیٹیو کیمرہ' یا 'تصویر اپلوڈ کریں' آپشن استعمال کریں۔");
        setCameraActive(false);
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

  // Handle Torch Toggle
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
        console.warn("Torch failed to toggle", e);
      }
    }
  };

  // Switch Rear / Front camera
  const switchCamera = () => {
    setFacingMode(prev => (prev === "environment" ? "user" : "environment"));
  };

  // Re-apply Filters on rawImage whenever filter parameters change
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
        contrast,
        cropMargins
      );
      setProcessedImage(processed);
    };
  }, [
    rawImage, 
    filterMode, 
    rotation, 
    brightness, 
    contrast, 
    cropMargins.top, 
    cropMargins.bottom, 
    cropMargins.left, 
    cropMargins.right
  ]);

  // Core Canvas Document Filter Engine
  const renderDocumentFilter = (
    img: HTMLImageElement,
    mode: FilterMode,
    rot: number,
    bright: number,
    cont: number,
    crop: { top: number; bottom: number; left: number; right: number }
  ): string => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return img.src;

    const origW = img.naturalWidth || img.width;
    const origH = img.naturalHeight || img.height;

    const cropX = (crop.left / 100) * origW;
    const cropY = (crop.top / 100) * origH;
    const cropW = Math.max(10, origW * (1 - (crop.left + crop.right) / 100));
    const cropH = Math.max(10, origH * (1 - (crop.top + crop.bottom) / 100));

    const isRotated = rot === 90 || rot === 270;
    canvas.width = isRotated ? cropH : cropW;
    canvas.height = isRotated ? cropW : cropH;

    ctx.save();
    if (rot === 90) {
      ctx.translate(canvas.width, 0);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropH, cropW);
    } else if (rot === 180) {
      ctx.translate(canvas.width, canvas.height);
      ctx.rotate((180 * Math.PI) / 180);
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    } else if (rot === 270) {
      ctx.translate(0, canvas.height);
      ctx.rotate((270 * Math.PI) / 180);
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropH, cropW);
    } else {
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    }
    ctx.restore();

    if (mode === "original" && bright === 0 && cont === 0) {
      return canvas.toDataURL("image/jpeg", 0.88);
    }

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    const factor = (259 * (cont + 255)) / (255 * (259 - cont));

    for (let i = 0; i < d.length; i += 4) {
      let r = d[i];
      let g = d[i + 1];
      let b = d[i + 2];

      // Brightness adjustment
      if (bright !== 0) {
        r = Math.min(255, Math.max(0, r + bright));
        g = Math.min(255, Math.max(0, g + bright));
        b = Math.min(255, Math.max(0, b + bright));
      }

      // Contrast adjustment
      if (cont !== 0) {
        r = Math.min(255, Math.max(0, factor * (r - 128) + 128));
        g = Math.min(255, Math.max(0, factor * (g - 128) + 128));
        b = Math.min(255, Math.max(0, factor * (b - 128) + 128));
      }

      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      if (mode === "magic") {
        // Magic Color: Bleach background, sharpen ink/pencil strokes
        if (gray > 145) {
          const boost = (gray - 145) * 1.9;
          d[i] = Math.min(255, r + boost);
          d[i + 1] = Math.min(255, g + boost);
          d[i + 2] = Math.min(255, b + boost);
        } else {
          d[i] = Math.max(0, r * 0.6);
          d[i + 1] = Math.max(0, g * 0.6);
          d[i + 2] = Math.max(0, b * 0.6);
        }
      } else if (mode === "pencil") {
        // Pencil Handwriting Booster: Boost faint gray pencil writing on white paper
        if (gray > 185) {
          d[i] = 255;
          d[i + 1] = 255;
          d[i + 2] = 255;
        } else if (gray < 85) {
          d[i] = 10;
          d[i + 1] = 10;
          d[i + 2] = 10;
        } else {
          const mapped = Math.max(0, (gray - 85) * 1.6);
          d[i] = mapped;
          d[i + 1] = mapped;
          d[i + 2] = mapped;
        }
      } else if (mode === "bw") {
        // B&W Document
        const val = gray > 135 ? 255 : 0;
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

  // Send Processed Image to OCR Backend
  const handleTranscribe = async (directImage?: string) => {
    let imageToProcess = directImage || processedImage || rawImage;
    if (!imageToProcess) {
      alert("پہلے تصویر کھینچیں یا فائل اپ لوڈ کریں۔");
      return;
    }

    setIsProcessing(true);
    try {
      // Auto-optimize & compress image payload to ensure base64 size < 800KB before network POST
      imageToProcess = await optimizeImageForOcr(imageToProcess, 1600, 0.80);

      const response = await fetch("/api/transcribe-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imageToProcess
        })
      });

      const contentType = response.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");

      if (!response.ok) {
        let errorMsg = "سرور سے رابطہ ناکام رہا۔";
        if (isJson) {
          const errData = await response.json();
          if (errData.error) errorMsg = errData.error;
        }
        throw new Error(errorMsg);
      }

      if (!isJson) {
        throw new Error("سرور سے درست جواب موصول نہیں ہوا۔");
      }

      const data = await response.json();
      if (data.text) {
        onTextScanned(data.text);
        setScannedSuccess(true);
      } else {
        alert("تصویر میں کوئی واضح اردو تحریر نہیں مل سکی۔ براہ کرم دوبارہ صاف تصویر کھینچیں۔");
      }
    } catch (error: any) {
      console.error("OCR Error:", error);
      alert(`تحریر حاصل کرنے میں خرابی: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Robust File Upload Handler (Supports Images JPG, PNG, WEBP, HEIC and PDF files)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = e.target;
    const file = fileInput.files?.[0];
    if (!file) return;

    // Reset input value so same file can be uploaded again if needed
    const resetInput = () => {
      fileInput.value = "";
    };

    try {
      // 1. File Size Validation (Max 30MB)
      const MAX_SIZE_MB = 30;
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        alert(`فائل کا سائز بہت بڑا ہے (${(file.size / (1024 * 1024)).toFixed(1)} MB)۔ برائے مہربانی ${MAX_SIZE_MB}MB سے کم سائز کی فائل منتخب کریں۔`);
        resetInput();
        return;
      }

      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();

      // 2. PDF Handling
      if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
        try {
          setIsConvertingPdf(true);
          const stackedImage = await convertPdfToSingleStackedImage(file);
          const optimizedPdfImg = await optimizeImageForOcr(stackedImage, 1600, 0.80);
          setRawImage(optimizedPdfImg);
          setFilterMode("magic");
          setRotation(0);
          setBrightness(0);
          setContrast(0);
          setCropMargins({ top: 0, bottom: 0, left: 0, right: 0 });
          // Auto trigger transcribe to generate soft copy immediately
          handleTranscribe(optimizedPdfImg);
        } catch (pdfErr: any) {
          console.error("PDF Processing Error:", pdfErr);
          alert(`پی ڈی ایف فائل پڑھنے میں خرابی: ${pdfErr?.message || "فائل خراب ہے یا پاسورڈ لگا ہوا ہے۔"}`);
        } finally {
          setIsConvertingPdf(false);
          resetInput();
        }
        return;
      }

      // 3. Image File Handling (JPG, PNG, WEBP, BMP, HEIC, etc.)
      const isImage = fileType.startsWith("image/") || 
                      /\.(jpg|jpeg|png|webp|bmp|gif|heic|svg)$/i.test(fileName);

      if (isImage) {
        const reader = new FileReader();

        reader.onload = async () => {
          try {
            if (typeof reader.result === "string") {
              const optimized = await optimizeImageForOcr(reader.result, 1600, 0.82);
              setRawImage(optimized);
              setFilterMode("magic");
              setRotation(0);
              setBrightness(0);
              setContrast(0);
              setCropMargins({ top: 0, bottom: 0, left: 0, right: 0 });
              // Auto trigger transcribe to generate soft copy immediately
              handleTranscribe(optimized);
            } else {
              throw new Error("فائل ریڈ کرنے کا نتیجہ ڈیٹا URL کی صورت میں نہیں مل سکا۔");
            }
          } catch (imgOptErr: any) {
            console.error("Image Optimization Error:", imgOptErr);
            alert(`تصویر پروسیس کرنے میں خرابی: ${imgOptErr?.message || "تصویر کو پڑھا نہیں جا سکا۔"}`);
          } finally {
            resetInput();
          }
        };

        reader.onerror = (errorEvent) => {
          console.error("FileReader Error:", errorEvent);
          alert("فائل ریڈر ایرر: ڈیوائس سے فائل پڑھنے میں ناکامی ہوئی۔ برائے مہربانی دوبارہ کوشش کریں۔");
          resetInput();
        };

        reader.onabort = () => {
          alert("فائل اپ لوڈ کا عمل منسوخ کر دیا گیا۔");
          resetInput();
        };

        reader.readAsDataURL(file);
        return;
      }

      // 4. Fallback Unsupported File Type
      alert(`غیر مدعوم فائل فارمیٹ (${file.type || fileName.split('.').pop()})۔ برائے مہربانی صرف تصاویر (JPG, PNG) یا PDF فائل اپ لوڈ کریں۔`);
      resetInput();

    } catch (globalErr: any) {
      console.error("Global File Upload Error:", globalErr);
      alert(`فائل اپ لوڈنگ میں غیر متوقع خرابی پیش آئی: ${globalErr?.message || "برائے مہربانی دوسری فائل منتخب کریں۔"}`);
      resetInput();
    }
  };

  // Start Camera
  const startCamera = () => {
    setCameraActive(true);
  };

  // Stop Camera
  const stopCamera = () => {
    setCameraActive(false);
  };

  // Capture Photo
  const capturePhoto = async () => {
    if (!videoRef.current) return;
    
    // Trigger haptic vibration feedback if available
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(60);
    }

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 1920;
    canvas.height = videoRef.current.videoHeight || 1080;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.90);
      const optimizedPhoto = await optimizeImageForOcr(dataUrl, 1600, 0.82);
      
      setRawImage(optimizedPhoto);
      setFilterMode("magic");
      setRotation(0);
      setBrightness(0);
      setContrast(0);
      setCropMargins({ top: 0, bottom: 0, left: 0, right: 0 });
      setCameraActive(false);
      // Auto trigger transcribe to generate soft copy immediately
      handleTranscribe(optimizedPhoto);
    }
  };

  // Rotate 90 Degrees Clockwise
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const clearAll = () => {
    setRawImage(null);
    setProcessedImage(null);
    setScannedSuccess(false);
    setFilterMode("magic");
    setRotation(0);
    setBrightness(0);
    setContrast(0);
    setCropMargins({ top: 0, bottom: 0, left: 0, right: 0 });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-3 text-right w-full text-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-1.5">
          <Wand2 className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-black text-amber-300">{label}</span>
        </div>
        {rawImage && (
          <button
            onClick={clearAll}
            className="text-[10px] text-rose-400 font-bold hover:text-rose-300 flex items-center gap-1 bg-rose-950/60 hover:bg-rose-900/80 px-2 py-1 rounded-lg border border-rose-800/50 transition-all cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>نئی تصویر</span>
          </button>
        )}
      </div>

      {/* ==========================================
          FULL SCREEN RESPONSIVE MOBILE CAMERA
          ========================================== */}
      {cameraActive && (
        <div className="fixed inset-0 z-[99999] bg-black flex flex-col justify-between text-white select-none overflow-hidden h-[100dvh]" dir="rtl">
          {/* Header Controls Bar */}
          <div className="bg-black/90 backdrop-blur-md border-b border-zinc-800 px-4 py-3 flex items-center justify-between z-20">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-500/40">
                لائیو کیمرہ ایچ ڈی اسکین
              </span>
            </div>

            {/* Camera Options Row */}
            <div className="flex items-center gap-2">
              {/* Torch Light Toggle */}
              {hasTorchSupport && (
                <button
                  onClick={toggleTorch}
                  className={`p-2 rounded-full transition-all border ${
                    torchOn 
                      ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20" 
                      : "bg-zinc-800 text-slate-300 border-zinc-700 hover:bg-zinc-700"
                  }`}
                  title="ٹارچ / فلیش"
                >
                  {torchOn ? <Zap className="w-4 h-4 fill-slate-950" /> : <ZapOff className="w-4 h-4" />}
                </button>
              )}

              {/* Grid Lines Toggle */}
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`p-2 rounded-full transition-all border ${
                  showGrid 
                    ? "bg-emerald-800 text-emerald-200 border-emerald-600" 
                    : "bg-zinc-800 text-slate-300 border-zinc-700"
                }`}
                title="گرڈ لائنز"
              >
                <Grid className="w-4 h-4" />
              </button>

              {/* Switch Camera */}
              <button
                onClick={switchCamera}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-slate-200 rounded-full border border-zinc-700 transition-all"
                title="کیمرہ تبدیل کریں"
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>

              {/* Close Button */}
              <button 
                onClick={stopCamera}
                className="bg-rose-950 hover:bg-rose-900 text-rose-200 p-2 rounded-full border border-rose-800 transition-colors"
                title="بند کریں"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Camera Viewfinder - Responsive Full Bleed */}
          <div className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden">
            <video 
              ref={videoRef} 
              className="w-full h-full object-cover" 
              playsInline 
              autoPlay
              muted
            />

            {/* Subtle Grid Overlay if enabled */}
            {showGrid && (
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20">
                <div className="border border-white/20"></div>
                <div className="border border-white/20"></div>
                <div className="border border-white/20"></div>
                <div className="border border-white/20"></div>
                <div className="border border-white/20"></div>
                <div className="border border-white/20"></div>
                <div className="border border-white/20"></div>
                <div className="border border-white/20"></div>
                <div className="border border-white/20"></div>
              </div>
            )}

            {/* Clean Top Guidance Badge (No obstructive bounding box container) */}
            <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none px-4 z-10">
              <span className="bg-black/80 backdrop-blur-md text-amber-300 border border-amber-500/30 text-[11px] font-black px-4 py-1.5 rounded-full shadow-lg">
                کیمرہ تیار ہے - بیان یا درخواست کا صفحہ سامنے رکھیں
              </span>
            </div>
          </div>

          {/* Camera Bottom Control Bar */}
          <div className="bg-black/95 backdrop-blur-md py-5 px-6 flex items-center justify-between z-20 border-t border-zinc-800">
            {/* Gallery / PDF Upload inside Camera View */}
            <label className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer text-[10px] font-bold">
              <div className="bg-zinc-800 hover:bg-zinc-700 p-3 rounded-full transition-colors border border-zinc-700">
                <Upload className="w-5 h-5 text-emerald-400" />
              </div>
              <span>گیلری / PDF</span>
              <input 
                type="file" 
                accept="image/*,application/pdf,.pdf" 
                onChange={(e) => {
                  handleFileChange(e);
                  setCameraActive(false);
                }} 
                className="hidden" 
              />
            </label>

            {/* Glowing Big Capture Button */}
            <div className="flex flex-col items-center gap-1">
              <button 
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full border-4 border-amber-400 flex items-center justify-center bg-white hover:bg-amber-50 active:scale-95 transition-all shadow-xl shadow-amber-500/25 cursor-pointer"
                title="تصویر کھینچیں"
              >
                <div className="w-14 h-14 rounded-full bg-slate-950 flex items-center justify-center text-white">
                  <Camera className="w-7 h-7 text-amber-400" />
                </div>
              </button>
              <span className="text-[11px] font-black text-amber-400 mt-1">تصویر بنائیں</span>
            </div>

            {/* Close Camera button */}
            <button 
              onClick={stopCamera}
              className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors text-[10px] font-bold cursor-pointer"
            >
              <div className="bg-zinc-800 hover:bg-zinc-700 p-3 rounded-full transition-colors border border-zinc-700">
                <X className="w-5 h-5 text-rose-400" />
              </div>
              <span>کینسل</span>
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
          EDITOR & ENHANCEMENT PANEL
          ========================================== */}
      <div className="flex flex-col items-center justify-center w-full">
        {rawImage ? (
          <div className="w-full space-y-3.5">
            
            {/* Filter Selector Tabs */}
            <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  تصویر و تحریر اینہانس فلٹر:
                </span>
                <span className="text-[9px] text-slate-400 font-semibold">پنسل و مدہم تحریر زیادہ واضح کریں</span>
              </div>

              {/* Filter Buttons */}
              <div className="grid grid-cols-5 gap-1 text-[10px] font-extrabold">
                {/* 1. Magic Color */}
                <button
                  onClick={() => setFilterMode("magic")}
                  className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all border ${
                    filterMode === "magic"
                      ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20"
                      : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850"
                  }`}
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span className="text-[9px]">میجک اینہانس</span>
                </button>

                {/* 2. Pencil Booster */}
                <button
                  onClick={() => setFilterMode("pencil")}
                  className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all border ${
                    filterMode === "pencil"
                      ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20"
                      : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="text-[9px]">پنسل تحریر</span>
                </button>

                {/* 3. B&W Document */}
                <button
                  onClick={() => setFilterMode("bw")}
                  className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all border ${
                    filterMode === "bw"
                      ? "bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/20"
                      : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="text-[9px]">بلیک اینڈ وائٹ</span>
                </button>

                {/* 4. Grayscale */}
                <button
                  onClick={() => setFilterMode("grayscale")}
                  className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all border ${
                    filterMode === "grayscale"
                      ? "bg-purple-500 text-slate-950 border-purple-400 shadow-md"
                      : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="text-[9px]">گرے سکیل</span>
                </button>

                {/* 5. Original */}
                <button
                  onClick={() => setFilterMode("original")}
                  className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all border ${
                    filterMode === "original"
                      ? "bg-slate-200 text-slate-950 border-white shadow-md"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850"
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span className="text-[9px]">اصل تصویر</span>
                </button>
              </div>
            </div>

            {/* Quick Toolbar (Rotate, Crop Margins, Fine Tune) */}
            <div className="flex flex-wrap items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800 gap-1.5 text-[10px] font-bold">
              {/* Rotate 90 Deg */}
              <button
                onClick={handleRotate}
                className="bg-slate-900 hover:bg-slate-800 text-amber-300 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>گھمائیں (Rotate 90°)</span>
              </button>

              {/* Toggle Crop Margins */}
              <button
                onClick={() => {
                  setShowCropControls(!showCropControls);
                  setShowFineTune(false);
                }}
                className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                  showCropControls 
                    ? "bg-amber-500 text-slate-950 border-amber-400" 
                    : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700"
                }`}
              >
                <Crop className="w-3.5 h-3.5" />
                <span>حاشیے کاٹیں (Crop)</span>
              </button>

              {/* Toggle Brightness & Contrast */}
              <button
                onClick={() => {
                  setShowFineTune(!showFineTune);
                  setShowCropControls(false);
                }}
                className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                  showFineTune 
                    ? "bg-amber-500 text-slate-950 border-amber-400" 
                    : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>روشنی و کنٹراسٹ</span>
              </button>
            </div>

            {/* Crop Margin Sliders */}
            {showCropControls && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-[10px]">
                <div className="flex justify-between text-amber-300 font-bold">
                  <span>صفحے کے حاشیے کراپ کریں (Margin Crop):</span>
                  <button 
                    onClick={() => setCropMargins({ top: 0, bottom: 0, left: 0, right: 0 })}
                    className="text-rose-400 hover:underline"
                  >
                    ری سیٹ کراپ
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>
                    <label className="block mb-1">اوپر کا حاشیہ: {cropMargins.top}%</label>
                    <input 
                      type="range" min="0" max="35" 
                      value={cropMargins.top} 
                      onChange={(e) => setCropMargins(p => ({ ...p, top: Number(e.target.value) }))}
                      className="w-full accent-amber-400" 
                    />
                  </div>
                  <div>
                    <label className="block mb-1">نیچے کا حاشیہ: {cropMargins.bottom}%</label>
                    <input 
                      type="range" min="0" max="35" 
                      value={cropMargins.bottom} 
                      onChange={(e) => setCropMargins(p => ({ ...p, bottom: Number(e.target.value) }))}
                      className="w-full accent-amber-400" 
                    />
                  </div>
                  <div>
                    <label className="block mb-1">دائیں حاشیہ: {cropMargins.right}%</label>
                    <input 
                      type="range" min="0" max="35" 
                      value={cropMargins.right} 
                      onChange={(e) => setCropMargins(p => ({ ...p, right: Number(e.target.value) }))}
                      className="w-full accent-amber-400" 
                    />
                  </div>
                  <div>
                    <label className="block mb-1">بائیں حاشیہ: {cropMargins.left}%</label>
                    <input 
                      type="range" min="0" max="35" 
                      value={cropMargins.left} 
                      onChange={(e) => setCropMargins(p => ({ ...p, left: Number(e.target.value) }))}
                      className="w-full accent-amber-400" 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Brightness & Contrast Sliders */}
            {showFineTune && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-[10px]">
                <div className="flex justify-between text-amber-300 font-bold">
                  <span>روشنی اور کنٹراسٹ تبدیل کریں:</span>
                  <button 
                    onClick={() => { setBrightness(0); setContrast(0); }}
                    className="text-rose-400 hover:underline"
                  >
                    ری سیٹ ایڈجسٹمنٹ
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-slate-300">
                  <div>
                    <label className="flex items-center gap-1 mb-1">
                      <Sun className="w-3 h-3 text-amber-400" />
                      <span>روشنی (Brightness): {brightness}</span>
                    </label>
                    <input 
                      type="range" min="-50" max="50" 
                      value={brightness} 
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-full accent-amber-400" 
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 mb-1">
                      <Contrast className="w-3 h-3 text-emerald-400" />
                      <span>کنٹراسٹ (Contrast): {contrast}</span>
                    </label>
                    <input 
                      type="range" min="-50" max="50" 
                      value={contrast} 
                      onChange={(e) => setContrast(Number(e.target.value))}
                      className="w-full accent-emerald-400" 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Preview Window */}
            <div className="relative max-h-[260px] rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex flex-col items-center justify-center p-2 shadow-inner">
              {processedImage ? (
                <img 
                  src={processedImage} 
                  className="max-h-[240px] object-contain rounded-lg border border-slate-800 shadow-md" 
                  alt="Enhanced Preview" 
                />
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">تصویر اینہانس ہو رہی ہے...</div>
              )}
              
              {/* Filter indicator badge */}
              <div className="absolute top-3 right-3 bg-amber-400 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>
                  {filterMode === "magic" && "میجک اینہانس"}
                  {filterMode === "pencil" && "پنسل اینہانس"}
                  {filterMode === "bw" && "بلیک اینڈ وائٹ"}
                  {filterMode === "grayscale" && "گرے سکیل"}
                  {filterMode === "original" && "اصل تصویر"}
                </span>
              </div>
            </div>

            {/* Scanned Success Notification Banner */}
            {scannedSuccess && (
              <div className="bg-emerald-950/90 border-2 border-emerald-500/80 rounded-xl p-3 text-center text-xs font-black text-emerald-300 flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30">
                <FileCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>تصویر کی سافٹ کاپی (Urdu Text) کامیابی سے نیچے ٹیکسٹ فیلڈ میں درج کر دی گئی ہے!</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={clearAll}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl font-extrabold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>نئی تصویر اسکین کریں</span>
              </button>
              
              <button
                onClick={() => {
                  clearAll();
                  startCamera();
                }}
                className="py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>دوبارہ فوٹو بنائیں</span>
              </button>
            </div>

            {/* Main OCR Scan Transcribe Trigger Button */}
            <button
              onClick={() => handleTranscribe()}
              disabled={isProcessing}
              className={`w-full py-3.5 rounded-xl font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isProcessing
                  ? "bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white border border-emerald-500/50 shadow-emerald-900/40 hover:shadow-xl"
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>تصویر سے اردو سافٹ کاپی تیار کی جا رہی ہے...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4.5 h-4.5 text-amber-400" />
                  <span>دوبارہ سافٹ کاپی حاصل کریں (Re-Scan Soft Copy)</span>
                </>
              )}
            </button>
          </div>
        ) : isConvertingPdf ? (
          /* PDF Converting State Banner */
          <div className="flex flex-col items-center justify-center p-6 bg-slate-900 border-2 border-amber-500/50 rounded-2xl text-center space-y-2 shadow-xl">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
            <p className="text-xs font-black text-amber-300">
              پی ڈی ایف (PDF) فائل کے تمام صفحات کو سکین امیج میں تبدیل کیا جا رہا ہے...
            </p>
            <p className="text-[10px] font-bold text-slate-400">
              (خودکار آپٹمائزیشن سے سائز کو کنٹرول کیا جا رہا ہے تاکہ Vercel پر ایرر نہ آئے)
            </p>
          </div>
        ) : (
          /* Initial State Scanner Options - Matching Upload Pattern */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 w-full my-1" dir="rtl">
            {/* Card 1: Mobile Camera (Left) */}
            <div className="md:col-span-5 bg-[#eefbf4] border-2 border-[#10b981] rounded-3xl p-4 text-center flex flex-col justify-between min-h-[220px]">
              <div className="flex flex-col items-center">
                {/* Green circle with Camera Icon */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#00a86b] flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
                  <Camera className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-slate-900 font-black text-base sm:text-lg mt-2.5">
                  کیمرہ اسکینر
                </h3>
                <p className="text-slate-600 font-bold text-[11px] sm:text-xs mt-0.5">
                  بیان یا درخواست کی فوٹو بنائیں
                </p>
              </div>

              {/* Action buttons inside Camera Card */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  type="button"
                  onClick={startCamera}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-black text-[11px] py-2.5 px-2 rounded-xl shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>لائیو کیمرہ</span>
                </button>

                <label className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] py-2.5 px-2 rounded-xl shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer">
                  <Camera className="w-3.5 h-3.5" />
                  <span>موبائل کیمرہ</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Card 2: File or Image Upload (Right) */}
            <label className="md:col-span-7 bg-[#f3f4ff] hover:bg-[#ebdfff]/60 border-2 border-dashed border-[#6366f1]/80 rounded-3xl p-4 sm:p-5 text-center cursor-pointer transition-all hover:shadow-xl hover:border-indigo-600 flex flex-col items-center justify-center min-h-[220px] relative group overflow-hidden">
              <input 
                type="file" 
                accept="image/*,application/pdf,.pdf" 
                onChange={handleFileChange} 
                className="hidden" 
              />

              {/* Purple circle with Upload Icon */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#6366f1] flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
                <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>

              {/* Title */}
              <h3 className="text-slate-900 font-black text-lg sm:text-xl mt-3">
                فائل یا تصویر اپلوڈ کریں
              </h3>

              {/* Subtitle */}
              <p className="text-[#4338ca] font-black text-xs sm:text-sm mt-1">
                پی ڈی ایف، تصویر (PDF, JPG, PNG, WEBP وغیرہ) شامل کریں
              </p>

              {/* Chips / Badges Row */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-3.5">
                {/* PDF Chip */}
                <span className="bg-[#d1fae5] text-[#065f46] border border-[#a7f3d0] px-3 py-1 rounded-xl text-[11px] sm:text-xs font-black flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>PDF (خودکار صفحہ بہ صفحہ تصویر)</span>
                </span>

                {/* JPG Chip */}
                <span className="bg-[#fef3c7] text-[#92400e] border border-[#fde68a] px-3.5 py-1 rounded-xl text-[11px] sm:text-xs font-black shadow-sm">
                  JPG
                </span>

                {/* PNG Chip */}
                <span className="bg-[#e0f2fe] text-[#075985] border border-[#bae6fd] px-3.5 py-1 rounded-xl text-[11px] sm:text-xs font-black shadow-sm">
                  PNG
                </span>

                {/* WEBP Chip */}
                <span className="bg-[#f3e8ff] text-[#6b21a8] border border-[#e9d5ff] px-3.5 py-1 rounded-xl text-[11px] sm:text-xs font-black shadow-sm">
                  WEBP
                </span>
              </div>

              {/* Bottom Highlight Alert Box */}
              <div className="mt-4 w-full bg-[#eefbf4] border border-[#a7f3d0] rounded-2xl p-2.5 px-3 sm:px-4 text-center text-[11px] sm:text-xs font-black text-[#065f46] flex items-center justify-center gap-1.5 shadow-sm">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
                <span>پی ڈی ایف فائلز اب براؤزر میں خودکار طور پر بہترین کوالٹی تصاویر میں تبدیل ہو کر اسکین ہوتی ہیں۔</span>
              </div>
            </label>
          </div>
        )}
      </div>
    </div>
  );
});

export default StatementImageScanner;

