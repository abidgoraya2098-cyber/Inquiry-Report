import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import QRCode from "qrcode";
import { 
  Scale, Mic, MicOff, FileText, Sparkles, 
  ClipboardCheck, Download, Upload, Trash2, Printer, 
  History, Plus, Edit3, RefreshCw, Shield, Trash, Save,
  Smartphone, Monitor, ChevronRight, User, BookOpen, AlertCircle, AlertTriangle, Check, Play, Settings, LogOut, Eye, EyeOff,
  Share2, QrCode as QrIcon, Copy, CheckCheck, ExternalLink, Key, X, Zap
} from "lucide-react";
import StatementImageScanner from "./components/StatementImageScanner";
import TargetedOcrModal, { TargetSection } from "./components/TargetedOcrModal";
import AutoScanReportModal from "./components/AutoScanReportModal";
import ReportPreview from "./components/ReportPreview";
import { convertPdfToPageImages, optimizeImageForOcr } from "./lib/pdfToImage";
import { POLICE_LOGO_BASE64 } from "./assets/logoBase64";
import { InquiryData, Statement } from "./types";
const policeLogo = POLICE_LOGO_BASE64;

// Background silent security: Obfuscate/encrypt data to protect it from being scraped or read by unauthorized extensions
const encryptData = (text: string): string => {
  try {
    const b64 = btoa(unescape(encodeURIComponent(text)));
    return "SEC_" + b64.split("").reverse().join("");
  } catch (e) {
    return text;
  }
};

const decryptData = (encrypted: string): string => {
  try {
    if (!encrypted.startsWith("SEC_")) return encrypted;
    const b64Reversed = encrypted.substring(4);
    const b64 = b64Reversed.split("").reverse().join("");
    return decodeURIComponent(escape(atob(b64)));
  } catch (e) {
    return encrypted;
  }
};

const LiveClock = React.memo(function LiveClock() {
  const [clock, setClock] = useState("");
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString("ur-PK", { hour: "2-digit", minute: "2-digit" }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return <div className="font-mono text-[9px] tracking-tight">{clock}</div>;
});

interface PasswordScreenProps {
  onLogin: (role: "user" | "admin") => void;
}

const PasswordScreen = React.memo(function PasswordScreen({ onLogin }: PasswordScreenProps) {
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = passwordInput.trim();
    if (trimmed === "5225") {
      setPasswordError("");
      onLogin("user");
    } else if (trimmed === "5225admin" || trimmed === "admin5225" || trimmed === "Admin5225") {
      setPasswordError("");
      onLogin("admin");
    } else {
      setPasswordError("غلط پاسورڈ! دوبارہ کوشش کریں۔");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-xs relative text-slate-800">
        
        <div className="flex flex-col items-center text-center mb-6">
          <div className="bg-slate-900 p-1 rounded-full shadow-xs mb-3 border-2 border-amber-400">
            <img 
              src={policeLogo} 
              alt="پنجاب پولیس" 
              className="w-18 h-18 rounded-full object-cover shadow-xs" 
              referrerPolicy="no-referrer"
              onError={(e) => { (e.target as HTMLImageElement).src = POLICE_LOGO_BASE64; }}
            />
          </div>
          <span className="bg-slate-100 text-slate-800 text-[11px] px-3.5 py-1 rounded-full font-bold border border-slate-200 font-naskh">
            ریجنل انویسٹی گیشن برانچ گوجرانوالہ
          </span>
          <h2 className="text-xl font-black text-slate-900 mt-3 font-naskh leading-snug tracking-tight">
            انکوائری و تفتیش رپورٹ اسسٹنٹ
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5 font-naskh">
            مقامی ڈیوائس پرائیوسی و رپورٹس سیکیورٹی
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 text-center font-naskh">
              لوکل پاسورڈ / سیکیورٹی پن درج کریں
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                placeholder="پاسورڈ لکھیں..."
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (passwordError) setPasswordError("");
                }}
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-xl pl-12 pr-12 py-3 text-sm text-slate-900 font-bold placeholder-slate-400 transition-all text-center"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title={showPassword ? "پاسورڈ چھپائیں" : "پاسورڈ دکھائیں"}
              >
                {showPassword ? <EyeOff className="w-5 h-5 text-slate-500" /> : <Eye className="w-5 h-5 text-slate-500" />}
              </button>
            </div>
            {passwordError && (
              <p className="text-rose-600 text-xs font-bold mt-2 text-center font-naskh">⚠️ {passwordError}</p>
            )}
          </div>

          <button 
            type="submit"
            className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white font-black text-sm py-3 px-4 rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer font-naskh border border-slate-800"
          >
            <span>پورٹل میں داخل ہوں</span>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center space-y-1">
          <p className="text-xs text-slate-500 font-medium leading-relaxed font-naskh">
            محفوظ نظام بمطابق قواعد پنجاب پولیس
          </p>
          <p className="text-[11px] font-bold text-slate-700 tracking-wide pt-1 border-t border-slate-100 font-nastaliq">
            عابد عباس علی گورائیہ
          </p>
        </div>
      </div>
    </div>
  );
});

export default function App() {
  // Application State
  const [inquiries, setInquiries] = useState<InquiryData[]>([]);
  const [currentInquiry, setCurrentInquiry] = useState<InquiryData>({
    id: "inquiry_" + Date.now(),
    createdAt: new Date().toLocaleDateString("ur-PK"),
    stationName: "تھانہ صدر، گوجرانوالہ",
    districtName: "ضلع گوجرانوالہ",
    inquiryOfficer: "سینیئر سپرنٹینڈنٹ آف پولیس، ریجنل انویسٹی گیشن برانچ۔ گوجرانوالہ ریجن",
    inquiryType: "other",
    lawSections: "",
    senderDesignation: "سینیئر سپرنٹینڈنٹ آف پولیس، ریجنل انویسٹی گیشن برانچ۔ گوجرانوالہ ریجن",
    recipientDesignation: "جناب ریجنل پولیس آفیسر صاحب، گوجرانوالہ",
    attention: "توجہ: انچارج شکایت سیل",
    reportNumber: "____________",
    reportDate: "____________",
    subjectTitle: "",
    complainantName: "",
    complainantStatement: "",
    referenceNumber: "____________",
    referenceDate: "____________",
    statements: [],
    observations: "",
    additionalNotes: "",
    showProgressReport: false,
    progressHeading: "پراگرس رپورٹ مقدمہ نمبر 600/26مورخہ19.07.26بجرم406ت پ تھانہ ۔۔۔۔۔۔۔۔وغیرہ",
    progressText: "تفتیش مقدمہ ۔۔۔۔۔کے سپرد ہوئی جس نے تفتیش مقدمہ عمل میں لاتے ہوئے ملاحظہ موقع کر کے نقشہ موقع نظری بلاسکیل مرتب کیا۔گواہان کے بیانات زیر دفعہ161ض ف قلمبند کئے گئے۔۔۔۔۔۔",
    progressImages: [],
    factsAndFindings: [],
    inquiryConclusion: ""
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Search Saved Inquiries Modal State
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState("");

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [installPlatform, setInstallPlatform] = useState<"android" | "ios" | "pc">("android");
  const [installCopiedNotice, setInstallCopiedNotice] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches || 
                           (navigator as any).standalone === true ||
                           document.referrer.includes("android-app://") ||
                           localStorage.getItem("pwa_installed") === "true";
      return isStandalone;
    }
    return false;
  });
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches || 
                           (navigator as any).standalone === true ||
                           document.referrer.includes("android-app://") ||
                           localStorage.getItem("pwa_installed") === "true";
      return !isStandalone;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches || 
                           (navigator as any).standalone === true ||
                           document.referrer.includes("android-app://") ||
                           localStorage.getItem("pwa_installed") === "true";
      if (isStandalone) {
        setIsAppInstalled(true);
        setShowInstallBanner(false);
      }

      const ua = navigator.userAgent.toLowerCase();
      const inApp = /fban|fbav|instagram|whatsapp|line|twitter|micromessenger|wv|snapchat/.test(ua);
      setIsInAppBrowser(inApp);
      if (/iphone|ipad|ipod/.test(ua)) {
        setInstallPlatform("ios");
      } else if (/android/.test(ua)) {
        setInstallPlatform("android");
      } else {
        setInstallPlatform("pc");
      }
    }
    if ((window as any).deferredInstallPrompt) {
      setDeferredPrompt((window as any).deferredInstallPrompt);
    }
    (window as any).onPWAInstallAvailable = (e: any) => {
      setDeferredPrompt(e);
    };
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredInstallPrompt = e;
    };
    const handlePwaReady = (e: any) => {
      const prompt = e.detail || e;
      setDeferredPrompt(prompt);
      (window as any).deferredInstallPrompt = prompt;
    };
    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("pwa_installed", "true");
      }
      setDeferredPrompt(null);
      (window as any).deferredInstallPrompt = null;
      setShowInstallBanner(false);
      setShowInstallModal(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("pwa-install-ready", handlePwaReady);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("pwa-install-ready", handlePwaReady);
      window.removeEventListener("appinstalled", handleAppInstalled);
      (window as any).onPWAInstallAvailable = null;
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || (window as any).deferredInstallPrompt;
    if (promptEvent && typeof promptEvent.prompt === 'function') {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setDeferredPrompt(null);
          (window as any).deferredInstallPrompt = null;
          setShowInstallModal(false);
          setShowInstallBanner(false);
          return;
        }
        return;
      } catch (err) {
        console.warn('PWA native prompt error:', err);
      }
    }

    setShowInstallModal(true);
  };

  // App Shell View State (Desktop vs Mobile Preview Wrapper)
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [mobileTab, setMobileTab] = useState<"records" | "details" | "statements" | "preview">("details");
  const [showSplash, setShowSplash] = useState(false);

  // Authentication State (Password disabled upon user request)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  // Admin state
  const [isBlocked, setIsBlocked] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem("police_admin_passed") === "true";
  });
  const [sessions, setSessions] = useState<any[]>([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [viewedSessionWork, setViewedSessionWork] = useState<any | null>(null);

  // App Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  // Gemini API Key Modal State
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [customApiKeyInput, setCustomApiKeyInput] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("GEMINI_CUSTOM_API_KEY") || "" : ""));
  const [keySaveMessage, setKeySaveMessage] = useState<string | null>(null);
  // Auto Scan & 1-Minute Full Report Modal State
  const [showAutoScanModal, setShowAutoScanModal] = useState(false);

  // Targeted OCR Modal State
  const [showTargetedOcrModal, setShowTargetedOcrModal] = useState(false);
  const [targetedOcrInitialSection, setTargetedOcrInitialSection] = useState<TargetSection>("all");

  const handleAutoCompiledReport = useCallback((data: Partial<InquiryData>) => {
    setCurrentInquiry(prev => {
      let updatedStatements = prev.statements || [];
      if (data.statements && Array.isArray(data.statements) && data.statements.length > 0) {
        updatedStatements = data.statements.map((st, i) => ({
          id: st.id || `stmt_${Date.now()}_${i}`,
          personName: st.personName || "",
          role: st.role || "Complainant",
          text: st.text || ""
        }));
      }

      const updated: InquiryData = {
        ...prev,
        complainantName: data.complainantName || prev.complainantName,
        complainantStatement: data.complainantStatement || prev.complainantStatement,
        senderDesignation: data.senderDesignation || prev.senderDesignation,
        recipientDesignation: data.recipientDesignation || prev.recipientDesignation,
        stationName: data.stationName || prev.stationName,
        districtName: data.districtName || prev.districtName,
        lawSections: data.lawSections || prev.lawSections,
        subjectTitle: data.subjectTitle || prev.subjectTitle || (data.complainantName ? `رپورٹ درخواست ازاں ${data.complainantName}` : prev.subjectTitle),
        showProgressReport: data.showProgressReport !== undefined ? data.showProgressReport : prev.showProgressReport,
        progressHeading: data.progressHeading || prev.progressHeading,
        progressText: data.progressText || prev.progressText,
        factsAndFindings: (data.factsAndFindings && data.factsAndFindings.length > 0) ? data.factsAndFindings : prev.factsAndFindings,
        inquiryConclusion: data.inquiryConclusion || prev.inquiryConclusion,
        statements: updatedStatements
      };

      setInquiries(prevList => {
        const idx = prevList.findIndex(item => item.id === updated.id);
        if (idx >= 0) {
          const n = [...prevList];
          n[idx] = updated;
          return n;
        }
        return [updated, ...prevList];
      });

      return updated;
    });

    setMobileTab("preview");
    setShowSuccessModal(true);
  }, []);

  const handleApplyTargetedOcrData = useCallback((target: TargetSection, extractedText: string) => {
    if (!extractedText.trim()) return;

    setCurrentInquiry(prev => {
      // 1. موقف درخواست گزار (Complainant Stance)
      if (target === "complainant_stance") {
        const currentVal = prev.complainantStatement || "";
        const updatedVal = currentVal ? `${currentVal}\n\n${extractedText}` : extractedText;
        return { ...prev, complainantStatement: updatedVal };
      }

      // 2. بیان درخواست گزار (Statement of Complainant)
      if (target === "complainant_statement") {
        const existingStatements = prev.statements || [];
        const complainantIdx = existingStatements.findIndex(s => s.role === "Complainant");
        if (complainantIdx >= 0) {
          const updated = [...existingStatements];
          updated[complainantIdx] = {
            ...updated[complainantIdx],
            text: updated[complainantIdx].text ? `${updated[complainantIdx].text}\n\n${extractedText}` : extractedText
          };
          return { ...prev, statements: updated };
        } else {
          const newStmt: Statement = {
            id: `stmt_comp_${Date.now()}`,
            personName: prev.complainantName || "سائل / درخواست گزار",
            role: "Complainant",
            text: extractedText,
            recordedDate: new Date().toLocaleDateString("ur-PK")
          };
          return { ...prev, statements: [...existingStatements, newStmt] };
        }
      }

      // 3. تائیدی بیان درخواست گزار (Witness Statement of Complainant)
      if (target === "complainant_witness") {
        const newStmt: Statement = {
          id: `stmt_comp_wit_${Date.now()}`,
          personName: "تائیدی گواہ (سائل)",
          role: "Complainant_Witness",
          text: extractedText,
          recordedDate: new Date().toLocaleDateString("ur-PK")
        };
        return { ...prev, statements: [...(prev.statements || []), newStmt] };
      }

      // 4. بیان الزام علیہ (Statement of Respondent)
      if (target === "respondent_statement") {
        const existingStatements = prev.statements || [];
        const respondentIdx = existingStatements.findIndex(s => s.role === "Respondent");
        if (respondentIdx >= 0) {
          const updated = [...existingStatements];
          updated[respondentIdx] = {
            ...updated[respondentIdx],
            text: updated[respondentIdx].text ? `${updated[respondentIdx].text}\n\n${extractedText}` : extractedText
          };
          return { ...prev, statements: updated };
        } else {
          const newStmt: Statement = {
            id: `stmt_resp_${Date.now()}`,
            personName: "الزام علیہ",
            role: "Respondent",
            text: extractedText,
            recordedDate: new Date().toLocaleDateString("ur-PK")
          };
          return { ...prev, statements: [...existingStatements, newStmt] };
        }
      }

      // 5. تائیدی بیان الزام علیہ (Witness Statement of Respondent)
      if (target === "respondent_witness") {
        const newStmt: Statement = {
          id: `stmt_resp_wit_${Date.now()}`,
          personName: "تائیدی گواہ (الزام علیہ)",
          role: "Respondent_Witness",
          text: extractedText,
          recordedDate: new Date().toLocaleDateString("ur-PK")
        };
        return { ...prev, statements: [...(prev.statements || []), newStmt] };
      }

      // 6. پراگرس رپورٹ (آپشنل) (Progress / Police Investigation Report)
      if (target === "progress_report") {
        const currentObs = prev.observations || "";
        const updatedObs = currentObs ? `${currentObs}\n\n[پراگرس رپورٹ]:\n${extractedText}` : `[پراگرس رپورٹ]:\n${extractedText}`;
        return { ...prev, observations: updatedObs };
      }

      // 7. تمام صفحات (All)
      const currentVal = prev.complainantStatement || "";
      const updatedVal = currentVal ? `${currentVal}\n\n${extractedText}` : extractedText;
      return { ...prev, complainantStatement: updatedVal };
    });
  }, []);

  useEffect(() => {
    if (showShareModal) {
      QRCode.toDataURL(window.location.href, {
        width: 300,
        margin: 1,
        color: { dark: "#022c22", light: "#ffffff" }
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error("QR Code Error:", err));
    }
  }, [showShareModal]);

  const handleLoginSuccess = useCallback((role: "user" | "admin") => {
    sessionStorage.setItem("police_auth_passed", "true");
    if (role === "admin") {
      sessionStorage.setItem("police_admin_passed", "true");
      setIsAdmin(true);
    } else {
      sessionStorage.setItem("police_admin_passed", "false");
      setIsAdmin(false);
    }
    setIsAuthenticated(true);
  }, []);

  // Helper to get persistent session id
  const getSessionId = () => {
    let id = localStorage.getItem("app_session_id");
    if (!id) {
      id = "sess_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now();
      localStorage.setItem("app_session_id", id);
    }
    return id;
  };

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem("police_auth_passed");
    sessionStorage.removeItem("police_admin_passed");
    setIsAuthenticated(false);
    setIsAdmin(false);
    setShowAdminPanel(false);
  }, []);

  // Helper for safe JSON response parsing
  const safeJsonParse = async (response: Response) => {
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      }
    } catch (e) {
      console.warn("Could not parse JSON response:", e);
    }
    return null;
  };

  // Keep currentInquiry in ref for background sync without re-triggering effects
  const currentInquiryRef = useRef(currentInquiry);
  useEffect(() => {
    currentInquiryRef.current = currentInquiry;
  }, [currentInquiry]);

  // Sync session registration & track block status
  useEffect(() => {
    let isMounted = true;
    const registerSession = async () => {
      try {
        const ci = currentInquiryRef.current;
        const response = await fetch("/api/session/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId: getSessionId(),
            currentWork: {
              complainantName: ci?.complainantName || "",
              reportNumber: ci?.reportNumber || "",
              subjectTitle: ci?.subjectTitle || "",
              inquiryOfficer: ci?.inquiryOfficer || "",
            }
          })
        });
        if (response.ok && isMounted) {
          const data = await safeJsonParse(response);
          if (data && typeof data.blocked === "boolean") {
            setIsBlocked(prev => (prev !== data.blocked ? data.blocked : prev));
          }
        }
      } catch (err) {
        // Silently capture transient network/offline errors
        console.warn("Session sync notice:", err);
      }
    };

    // Register immediately on mount
    registerSession();

    // Register every 15 seconds to keep track of active sessions & update current work
    const interval = setInterval(registerSession, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch("/api/admin/sessions");
      if (response.ok) {
        const data = await safeJsonParse(response);
        if (Array.isArray(data)) {
          // Sort sessions by last active time descending
          data.sort((a: any, b: any) => new Date(b.lastActiveTime).getTime() - new Date(a.lastActiveTime).getTime());
          setSessions(data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    }
  };

  const handleToggleBlock = async (targetSessionId: string, blocked: boolean) => {
    try {
      const response = await fetch("/api/admin/block", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetSessionId, blocked })
      });
      if (response.ok) {
        // Refresh session list
        fetchSessions();
      }
    } catch (err) {
      console.error("Failed to change block status:", err);
    }
  };

  // Speech Recognition state & refs for robust continuous updates
  const [listeningField, setListeningField] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const listeningFieldRef = useRef<string | null>(null);
  const handleSpeechResultRef = useRef<any>(null);
  const shouldListenRef = useRef<boolean>(false);

  // Splash Screen Fadeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  // Load speech support on mount
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      try {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.lang = "ur-PK"; // Urdu (Pakistan)
        rec.interimResults = true;
        rec.maxAlternatives = 1;

        rec.onresult = (event: any) => {
          let finalTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + " ";
            }
          }
          const text = finalTranscript.trim();
          const currentField = listeningFieldRef.current;
          if (text && currentField && handleSpeechResultRef.current) {
            handleSpeechResultRef.current(currentField, text);
          }
        };

        rec.onend = () => {
          if (shouldListenRef.current && listeningFieldRef.current) {
            try {
              rec.start();
            } catch (e) {
              // Ignore already active state
            }
          } else {
            setListeningField(null);
            listeningFieldRef.current = null;
          }
        };

        rec.onerror = (err: any) => {
          console.warn("Speech recognition notice:", err?.error || err);
          if (err.error === "not-allowed" || err.error === "service-not-allowed") {
            alert("مائیکروفون کی رسائی بلاک ہے۔ براہ کرم براؤزر ایڈریس بار میں مائیکروفون کا نشان دبا کر اجازت دیں تاکہ آپ آواز سے بول کر لکھ سکیں۔");
            shouldListenRef.current = false;
            setListeningField(null);
            listeningFieldRef.current = null;
          }
        };

        recognitionRef.current = rec;
      } catch (err) {
        console.warn("Speech Recognition initialization failed:", err);
      }
    }
  }, []);

  // Save inquiries in-memory state
  const saveToLocalStorage = (data: InquiryData[]) => {
    setInquiries(data);
  };

  // Explicit Manual Save function for current inquiry to memory array
  const handleSaveCurrentInquiry = useCallback(() => {
    if (!currentInquiry || !currentInquiry.id) return;
    
    setInquiries(prev => {
      const index = prev.findIndex(item => item.id === currentInquiry.id);
      let updated: InquiryData[];
      if (index >= 0) {
        updated = [...prev];
        updated[index] = currentInquiry;
      } else {
        updated = [currentInquiry, ...prev];
      }
      return updated;
    });
  }, [currentInquiry]);

  // Start/Stop voice recognition
  const toggleSpeech = (fieldName: string) => {
    if (!speechSupported || !recognitionRef.current) {
      alert("معذرت، آپ کا براؤزر اردو وائس ٹائپنگ کو سپورٹ نہیں کرتا۔ برائے مہربانی گوگل کروم (Google Chrome) یا ایج (Edge) استعمال کریں۔");
      return;
    }

    if (listeningField === fieldName) {
      shouldListenRef.current = false;
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setListeningField(null);
      listeningFieldRef.current = null;
    } else {
      if (listeningField) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      shouldListenRef.current = true;
      setListeningField(fieldName);
      listeningFieldRef.current = fieldName;
      try {
        recognitionRef.current.start();
      } catch (e) {
        setTimeout(() => {
          if (shouldListenRef.current) {
            try {
              recognitionRef.current.start();
            } catch (err) {}
          }
        }, 200);
      }
    }
  };

  const handleSpeechResult = (field: string, text: string) => {
    if (field.startsWith("stmt_text_")) {
      const stmtId = field.replace("stmt_text_", "");
      setCurrentInquiry(prev => {
        const stmt = (prev.statements || []).find(s => s.id === stmtId);
        const existing = stmt?.text || "";
        const updated = existing ? `${existing} ${text}` : text;
        const updatedStatements = (prev.statements || []).map(st => 
          st.id === stmtId ? { ...st, text: updated } : st
        );
        return { ...prev, statements: updatedStatements };
      });
      return;
    }
    if (field.startsWith("stmt_name_")) {
      const stmtId = field.replace("stmt_name_", "");
      setCurrentInquiry(prev => {
        const updatedStatements = (prev.statements || []).map(st => 
          st.id === stmtId ? { ...st, personName: text } : st
        );
        return { ...prev, statements: updatedStatements };
      });
      return;
    }

    // Append text if the field has existing value
    setCurrentInquiry(prev => {
      const existingVal = (prev[field as keyof InquiryData] as string) || "";
      const newVal = existingVal ? `${existingVal} ${text}` : text;
      return { ...prev, [field]: newVal };
    });
  };

  // Assign ref on every render so the latest closure of inquiries/state is available to SpeechRecognition
  handleSpeechResultRef.current = handleSpeechResult;

  // Handle manual field changes
  const handleFieldChange = useCallback((field: keyof InquiryData, value: any) => {
    setCurrentInquiry(prev => ({ ...prev, [field]: value }));
  }, []);

  // Stable scanner callbacks
  const handleScannedComplainantStatement = useCallback((scannedText: string) => {
    setCurrentInquiry(prev => {
      const currentVal = prev.complainantStatement || "";
      const updatedVal = currentVal ? `${currentVal}\n${scannedText}` : scannedText;
      return { ...prev, complainantStatement: updatedVal };
    });
  }, []);

  const handleScannedStatementText = useCallback((stmtId: string, scannedText: string) => {
    setCurrentInquiry(prev => {
      const updatedStatements = (prev.statements || []).map(st => {
        if (st.id === stmtId) {
          const currentVal = st.text || "";
          const updatedVal = currentVal ? `${currentVal}\n${scannedText}` : scannedText;
          return { ...st, text: updatedVal };
        }
        return st;
      });
      return { ...prev, statements: updatedStatements };
    });
  }, []);

  // Add a new statement
  const handleAddStatement = useCallback((newStmt: Statement) => {
    setCurrentInquiry(prev => ({
      ...prev,
      statements: [...(prev.statements || []), newStmt]
    }));
  }, []);

  // Optional statement helpers
  const addComplainantStatement = useCallback(() => {
    setCurrentInquiry(prev => {
      const newStmt: Statement = {
        id: "stmt_" + Date.now(),
        personName: prev.complainantName || "درخواست گزار",
        role: "Complainant",
        text: ""
      };
      return {
        ...prev,
        statements: [...(prev.statements || []), newStmt]
      };
    });
  }, []);

  const addSupportingStatement = useCallback(() => {
    const newStmt: Statement = {
      id: "stmt_" + Date.now(),
      personName: "گواہ سائل",
      role: "Complainant_Witness",
      text: ""
    };
    handleAddStatement(newStmt);
  }, [handleAddStatement]);

  const addRespondentStatement = useCallback(() => {
    const newStmt: Statement = {
      id: "stmt_" + Date.now(),
      personName: "الزام علیہ",
      role: "Respondent",
      text: ""
    };
    handleAddStatement(newStmt);
  }, [handleAddStatement]);

  const handleRemoveStatement = useCallback((id: string) => {
    setCurrentInquiry(prev => ({
      ...prev,
      statements: (prev.statements || []).filter(st => st.id !== id)
    }));
  }, []);

  const handleUpdateStatementText = useCallback((id: string, text: string) => {
    setCurrentInquiry(prev => ({
      ...prev,
      statements: (prev.statements || []).map(st => 
        st.id === id ? { ...st, text } : st
      )
    }));
  }, []);

  const handleUpdateStatementName = useCallback((id: string, name: string) => {
    setCurrentInquiry(prev => ({
      ...prev,
      statements: (prev.statements || []).map(st => 
        st.id === id ? { ...st, personName: name } : st
      )
    }));
  }, []);

  // Create a new empty inquiry template
  const handleNewInquiry = () => {
    const newId = "inquiry_" + Date.now();
    const newObj: InquiryData = {
      id: newId,
      createdAt: new Date().toLocaleDateString("ur-PK"),
      stationName: "تھانہ صدر، گوجرانوالہ",
      districtName: "ضلع گوجرانوالہ",
      inquiryOfficer: "سینیئر سپرنٹینڈنٹ آف پولیس، ریجنل انویسٹی گیشن برانچ۔ گوجرانوالہ ریجن",
      inquiryType: "other",
      lawSections: "",
      senderDesignation: "سینیئر سپرنٹینڈنٹ آف پولیس، ریجنل انویسٹی گیشن برانچ۔ گوجرانوالہ ریجن",
      recipientDesignation: "جناب ریجنل پولیس آفیسر صاحب، گوجرانوالہ",
      attention: "توجہ: انچارج شکایت سیل",
      reportNumber: "____________",
      reportDate: "____________",
      subjectTitle: "",
      complainantName: "",
      complainantStatement: "",
      referenceNumber: "____________",
      referenceDate: "____________",
      statements: [],
      observations: "",
      additionalNotes: "",
      showProgressReport: false,
      progressHeading: "پراگرس رپورٹ مقدمہ نمبر 600/26مورخہ19.07.26بجرم406ت پ تھانہ ۔۔۔۔۔۔۔۔وغیرہ",
      progressText: "تفتیش مقدمہ ۔۔۔۔۔کے سپرد ہوئی جس نے تفتیش مقدمہ عمل میں لاتے ہوئے ملاحظہ موقع کر کے نقشہ موقع نظری بلاسکیل مرتب کیا۔گواہان کے بیانات زیر دفعہ161ض ف قلمبند کئے گئے۔۔۔۔۔۔",
      progressImages: [],
      factsAndFindings: [],
      inquiryConclusion: ""
    };

    const updated = [newObj, ...inquiries];
    saveToLocalStorage(updated);
    setCurrentInquiry(newObj);
    setSelectedInquiryId(newId);
  };

  // Load an existing inquiry
  const handleSelectInquiry = (id: string) => {
    const found = inquiries.find(item => item.id === id);
    if (found) {
      setCurrentInquiry(found);
      setSelectedInquiryId(id);
    }
  };

  // Delete an inquiry
  const handleDeleteInquiry = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("کیا آپ اس رپورٹ کا ریکارڈ حذف کرنا چاہتے ہیں؟")) {
      const filtered = inquiries.filter(item => item.id !== id);
      saveToLocalStorage(filtered);
      
      if (selectedInquiryId === id) {
        if (filtered.length > 0) {
          setCurrentInquiry(filtered[0]);
          setSelectedInquiryId(filtered[0].id);
        } else {
          handleNewInquiry();
        }
      }
    }
  };

  // Delete all saved inquiries
  const handleClearAllInquiries = useCallback(() => {
    if (confirm("کیا آپ واقعی تمام محفوظ شدہ انکوائریز (تمام ریکارڈز) کو مکمل طور پر حذف کرنا چاہتے ہیں؟")) {
      setInquiries([]);
      localStorage.removeItem("police_inquiries");
      handleNewInquiry();
    }
  }, [handleNewInquiry]);

  // Generate Conclusion using Gemini API
  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const apiStatements: Statement[] = [];
      
      if (currentInquiry.complainantStatement) {
        apiStatements.push({
          id: "comp_main",
          personName: currentInquiry.complainantName || "درخواست گزار",
          role: "Complainant",
          text: currentInquiry.complainantStatement
        });
      }

      if (currentInquiry.statements) {
        apiStatements.push(...currentInquiry.statements);
      }

      const customKey = typeof window !== "undefined" ? localStorage.getItem("GEMINI_CUSTOM_API_KEY") || "" : "";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (customKey) {
        headers["x-gemini-api-key"] = customKey;
      }

      const response = await fetch("/api/generate-inquiry", {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...currentInquiry,
          statements: apiStatements,
          subjectTitle: `رپورٹ درخواست ازان ${currentInquiry.complainantName || "سائل"}`,
          apiKey: customKey || undefined
        })
      });

      if (!response.ok) {
        const errData = await safeJsonParse(response);
        throw new Error(errData?.error || "سرور سے رابطہ ناکام رہا۔");
      }

      const data = await safeJsonParse(response);
      if (!data) {
        throw new Error("سرور سے جواب حاصل نہ ہو سکا۔");
      }
      if (data.factsAndFindings && Array.isArray(data.factsAndFindings)) {
        handleFieldChange("factsAndFindings", data.factsAndFindings);
      }
      handleFieldChange("inquiryConclusion", data.inquiryConclusion || "");
      
      // Auto-switch mobile view tab to preview & open celebratory completion modal
      setMobileTab("preview");
      setShowSuccessModal(true);

      const element = document.getElementById("report-preview-area");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }

    } catch (error: any) {
      console.error("Error generating report:", error);
      alert(`نتیجہ انکوائری مرتب کرنے میں خرابی پیش آئی: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportBackup = () => {
    const backupData = {
      inquiries,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Police_Inquiry_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = e.target;
    const file = fileInput.files?.[0];
    if (!file) return;

    try {
      if (file.size > 15 * 1024 * 1024) {
        alert(`بیک اپ فائل کا سائز بہت بڑا ہے (${(file.size / (1024 * 1024)).toFixed(1)} MB)۔`);
        fileInput.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          if (!content) throw new Error("فائل مواد سے خالی ہے");
          const parsed = JSON.parse(content);
          if (parsed && Array.isArray(parsed.inquiries)) {
            saveToLocalStorage(parsed.inquiries);
            if (parsed.inquiries.length > 0) {
              setCurrentInquiry(parsed.inquiries[0]);
              setSelectedInquiryId(parsed.inquiries[0].id);
            }
            alert("بیک اپ کامیابی کے ساتھ بحال کر دیا گیا ہے!");
          } else {
            throw new Error("بیک اپ فائل کا ساخت (Structure) درست نہیں ہے۔");
          }
        } catch (err: any) {
          alert(`بیک اپ فائل لوڈ کرنے میں خرابی: ${err?.message || "فائل خراب یا غلط ہے۔"}`);
        } finally {
          fileInput.value = "";
        }
      };

      reader.onerror = () => {
        alert("فائل پڑھنے میں ڈیوائس ایرر پیش آیا۔");
        fileInput.value = "";
      };

      reader.readAsText(file);
    } catch (globalErr: any) {
      alert(`ایرر: ${globalErr?.message || "فائل پڑھنے میں ناکامی"}`);
      fileInput.value = "";
    }
  };

  const handleProgressFileUpload = async (files: FileList | null, e?: React.ChangeEvent<HTMLInputElement>) => {
    if (!files || files.length === 0) return;
    const newImages: string[] = [];

    for (const file of Array.from(files)) {
      try {
        // Size validation: Max 25MB per file
        if (file.size > 25 * 1024 * 1024) {
          alert(`فائل ${file.name} کا سائز 25MB سے زیادہ ہے۔ برائے مہربانی چھوٹی فائل اپ لوڈ کریں۔`);
          continue;
        }

        const fileName = file.name.toLowerCase();
        const fileType = file.type.toLowerCase();

        // 1. PDF File
        if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
          try {
            const pageImages = await convertPdfToPageImages(file);
            newImages.push(...pageImages);
          } catch (pdfErr: any) {
            console.error("PDF Upload Error:", pdfErr);
            alert(`پی ڈی ایف فائل ${file.name} کو تصاویر میں تبدیل کرنے میں خرابی پیش آئی: ${pdfErr?.message || "فائل ریڈ نہ ہو سکی"}`);
          }
        } 
        // 2. Image File
        else if (fileType.startsWith("image/") || /\.(jpg|jpeg|png|webp|bmp|gif|heic)$/i.test(fileName)) {
          await new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
              try {
                if (event.target?.result) {
                  const optimized = await optimizeImageForOcr(event.target.result as string, 1600, 0.82);
                  newImages.push(optimized);
                }
              } catch (imgErr) {
                console.error("Image Optimization Error:", imgErr);
              } finally {
                resolve();
              }
            };
            reader.onerror = () => {
              alert(`تصویر ${file.name} کو ڈیوائس سے ریڈ کرنے میں ناکامی ہوئی۔`);
              resolve();
            };
            reader.readAsDataURL(file);
          });
        } 
        // 3. Fallback
        else {
          alert(`فائل ${file.name} کا فارمیٹ مدعوم نہیں ہے۔ صرف تصاویر (JPG, PNG) یا PDF اپ لوڈ کریں۔`);
        }
      } catch (fileErr: any) {
        console.error("File processing error:", fileErr);
      }
    }

    if (e && e.target) {
      e.target.value = "";
    }

    if (newImages.length > 0) {
      const currentImages = currentInquiry.progressImages || [];
      handleFieldChange("progressImages", [...currentImages, ...newImages]);
    }
  };

  const filteredInquiries = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return inquiries.filter(item => {
      const subject = `رپورٹ درخواست ازان ${item.complainantName || ""}`;
      return (
        subject.toLowerCase().includes(query) ||
        (item.complainantName || "").toLowerCase().includes(query) ||
        (item.stationName || "").toLowerCase().includes(query) ||
        (item.reportNumber || "").toLowerCase().includes(query)
      );
    });
  }, [inquiries, searchQuery]);

  const modalFilteredInquiries = useMemo(() => {
    const q = modalSearchQuery.trim().toLowerCase();
    if (!q) return inquiries;
    return inquiries.filter(item => {
      const name = (item.complainantName || "").toLowerCase();
      const station = (item.stationName || "").toLowerCase();
      const repNum = (item.reportNumber || "").toLowerCase();
      const subj = (item.subjectTitle || "").toLowerCase();
      const date = (item.createdAt || "").toLowerCase();
      return (
        name.includes(q) ||
        station.includes(q) ||
        repNum.includes(q) ||
        subj.includes(q) ||
        date.includes(q)
      );
    });
  }, [inquiries, modalSearchQuery]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const complainantGroup = useMemo(() => {
    return (currentInquiry?.statements || []).filter(
      st => st.role === "Complainant" || st.role === "Complainant_Witness"
    );
  }, [currentInquiry?.statements]);

  const respondentGroup = useMemo(() => {
    return (currentInquiry?.statements || []).filter(
      st => st.role === "Respondent" || st.role === "Respondent_Witness"
    );
  }, [currentInquiry?.statements]);

  // Splash Screen early return
  if (showSplash) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-[#020617] via-[#0e1d3a] to-[#020617] flex flex-col items-center justify-center p-6 text-center select-none" dir="rtl">
        <div className="bg-gradient-to-tr from-amber-500 to-amber-300 p-1.5 rounded-full shadow-2xl mb-4">
          <img 
            src={policeLogo} 
            alt="پنجاب پولیس" 
            className="w-24 h-24 rounded-full object-cover border-4 border-[#020617] shadow-inner" 
            referrerPolicy="no-referrer"
            onError={(e) => { (e.target as HTMLImageElement).src = POLICE_LOGO_BASE64; }}
          />
        </div>
        <div className="space-y-2 max-w-md">
          <span className="bg-[#0b1b36] text-amber-400 text-xs px-3 py-1 rounded-full font-bold border border-[#1d3557]">پنجاب پولیس پاکستان</span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">پنجاب پولیس گوجرانوالہ</h1>
          <p className="text-xs text-amber-300/80 font-medium leading-relaxed opacity-80">آفیشل تفتیشی و انکوائری رپورٹ سسٹم - ریجنل انویسٹی گیشن برانچ</p>
          <div className="w-24 h-1 bg-amber-500/20 mx-auto rounded-full mt-4 overflow-hidden">
            <div className="w-full h-full bg-amber-500 rounded-full origin-left" />
          </div>
        </div>
      </div>
    );
  }

  // Security password gate early return
  if (!isAuthenticated) {
    return <PasswordScreen onLogin={handleLoginSuccess} />;
  }

  // Security blocked screen check
  if (isBlocked && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#09152e] to-[#020617] flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-md border-2 border-red-600 rounded-3xl p-8 shadow-2xl relative text-center">
          <div className="text-red-500 mb-4 flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-white font-nastaliq">آپ کی رسائی بلاک کر دی گئی ہے!</h2>
          <p className="text-sm text-slate-300 font-medium mt-3 leading-relaxed">
            سیکیورٹی اور ضابطہ اخلاق کی خلاف ورزی کی وجہ سے ایڈمنسٹریٹر نے اس سسٹم پر آپ کی رسائی عارضی طور پر معطل کر دی ہے۔
          </p>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 font-mono mt-5 text-center">
            <div>سیشن آئی ڈی: {getSessionId()}</div>
          </div>
          <p className="text-xs text-amber-500 font-semibold mt-5">
            بحالی کے لیے برائے مہربانی ریجنل پولیس افسر یا شکایت سیل ایڈمن سے رابطہ کریں۔
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-emerald-600 selection:text-white" dir="rtl">
      {/* Sticky Header with Special Executive Office Background Color */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#0c2238] via-[#113254] to-[#0c2238] text-white border-b-2 border-amber-400/90 shadow-md backdrop-blur-md no-print">
        <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2.5">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-500 shadow-md shrink-0 flex items-center justify-center border border-amber-400">
              <img
                src={policeLogo}
                alt="پنجاب پولیس گوجرانوالہ"
                className="w-full h-full rounded-full object-contain bg-slate-900 p-0.5"
                referrerPolicy="no-referrer"
                onError={(e) => { (e.target as HTMLImageElement).src = POLICE_LOGO_BASE64; }}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="bg-emerald-950/90 text-amber-300 text-[9px] px-2 py-0.5 rounded-md font-black border border-emerald-600/60 shadow-2xs">آفیشل انکوائری آفیسر</span>
                <span className="text-amber-400 text-xs font-black">پنجاب پولیس گوجرانوالہ</span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-white mt-0.5 flex items-center gap-1.5 font-naskh">
                انکوائری رپورٹ اسسٹنٹ
                <span className="text-amber-300 text-[10px] font-bold bg-[#071626] px-2 py-0.5 rounded-md border border-[#1b3d63]">ریجنل انویسٹی گیشن برانچ</span>
              </h1>
            </div>
          </div>

          {/* Visual Mode Selector and Quick Actions (All aligned neatly) */}
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
            
            {/* VIEW MODE TOGGLE (Desktop vs Mobile view) */}
            <div className="bg-[#071626] border border-[#1b3d63] rounded-lg p-0.5 flex items-center shadow-inner text-[10px] font-bold">
              <button
                onClick={() => setViewMode("desktop")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  viewMode === "desktop"
                    ? "bg-amber-400 text-slate-950 shadow-xs font-black"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <Monitor className="w-3 h-3" />
                <span>ڈیسک ٹاپ</span>
              </button>
              
              <button
                onClick={() => setViewMode("mobile")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  viewMode === "mobile"
                    ? "bg-amber-400 text-slate-950 shadow-xs font-black"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <Smartphone className="w-3 h-3" />
                <span>📱 موبائل ایپ</span>
              </button>
            </div>

            {/* Compact SEARCH SAVED INQUIRIES BUTTON */}
            <button 
              onClick={() => setShowSearchModal(true)}
              className="bg-[#091b2e] hover:bg-[#122e4d] text-amber-300 border border-amber-500/50 hover:border-amber-400 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 shrink-0"
              title="محفوظ انکوائری رپورٹس تلاش کریں"
            >
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>محفوظ فائلز ({inquiries.length})</span>
            </button>

            {/* Quick new template button */}
            <button 
              onClick={handleNewInquiry}
              className="bg-emerald-700 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-lg border border-emerald-500 font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs shrink-0"
              title="نیا خالی انکوائری ٹیمپلیٹ مرتب کریں"
            >
              <Plus className="w-3.5 h-3.5 text-amber-300" />
              <span>نیا ٹیمپلیٹ</span>
            </button>

            {/* 1-CLICK INSTANT AUTO-SCAN & 1-MIN REPORT BUTTON */}
            <button 
              onClick={() => setShowAutoScanModal(true)}
              className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 text-slate-950 px-3.5 py-1 rounded-lg border border-amber-300 font-black text-[11px] transition-all flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95 shrink-0"
              title="فوری مکمل AI سکینر اور 1 منٹ میں تیار رپورٹ (Instant 1-Minute Full Report)"
            >
              <Zap className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
              <span>⚡ 1 منٹ میں مکمل رپورٹ</span>
            </button>

            {/* TARGETED OCR SCANNER BUTTON */}
            <button 
              onClick={() => {
                setTargetedOcrInitialSection("all");
                setShowTargetedOcrModal(true);
              }}
              className="bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-amber-300 px-3 py-1 rounded-lg border border-emerald-400 font-black text-[11px] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 shrink-0 animate-pulse"
              title="خانہ وار الگ الگ AI سکینر (Targeted OCR Scanner)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>خانہ وار AI سکینر</span>
            </button>

            {/* SHARE PORTAL BUTTON */}
            <button 
              onClick={() => setShowShareModal(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1 rounded-lg border border-amber-400 font-black text-[11px] transition-all flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 shrink-0"
              title="پورٹل کا لنک اور کیو آر کوڈ شیئر کریں"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>شیئر QR</span>
            </button>

            {/* GEMINI AI KEY SETTINGS BUTTON */}
            <button
              onClick={() => setShowApiKeyModal(true)}
              className="bg-[#091b2e] hover:bg-[#122e4d] text-amber-300 border border-slate-700 hover:border-amber-400 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 shrink-0"
              title="Google Gemini AI Key سیٹنگز"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>AI Key</span>
            </button>

            {/* Always Visible Install Button */}
            <button
              onClick={handleInstallClick}
              className="bg-[#01875f] hover:bg-[#00704e] text-white px-2.5 py-1 rounded-lg font-extrabold text-[11px] flex items-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0 border border-emerald-400"
              title="ایپ انسٹال کریں (PWA App Install)"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span>انسٹال کریں</span>
            </button>

            {/* Admin Controls Dashboard Button (only shown if isAdmin is true) */}
            {isAdmin && (
              <button 
                onClick={() => {
                  setShowAdminPanel(!showAdminPanel);
                  if (!showAdminPanel) {
                    fetchSessions();
                  }
                }}
                className={`px-2.5 py-1 rounded-lg border font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer shadow-xs ${
                  showAdminPanel 
                    ? "bg-amber-400 text-slate-950 border-amber-500" 
                    : "bg-[#182a4d] text-indigo-200 border-indigo-700 hover:bg-[#203663]"
                }`}
                title="ایڈمنسٹریٹر پینل"
              >
                <Shield className="w-3.5 h-3.5 text-amber-300" />
                <span>نگرانی پینل</span>
              </button>
            )}

            {/* Log Out button */}
            <button 
              onClick={handleLogout}
              className="bg-rose-950/90 hover:bg-rose-900 border border-rose-700/80 text-rose-200 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer shadow-xs shrink-0 active:scale-95"
              title="سسٹم سے لاگ آؤٹ کریں"
            >
              <LogOut className="w-3 h-3 text-rose-400" />
              <span>لاگ آؤٹ</span>
            </button>
          </div>

        </div>
      </header>

      {/* Prominent PWA Install Notification Card - Only shown if not installed */}
      {!isAppInstalled && showInstallBanner && (
        <div className="bg-gradient-to-br from-[#022c22] via-[#064e3b] to-[#022c22] border-b-2 border-amber-400/80 px-4 py-3 text-white shadow-md relative z-30 no-print" dir="rtl">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* Right side: Crest Logo & Title */}
            <div className="flex items-center gap-3.5 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <img 
                    src={policeLogo} 
                    alt="پنجاب پولیس" 
                    className="w-11 h-11 rounded-2xl object-cover border-2 border-amber-400/90 shadow-md bg-emerald-950 p-0.5" 
                    referrerPolicy="no-referrer" 
                    onError={(e) => { (e.target as HTMLImageElement).src = POLICE_LOGO_BASE64; }} 
                  />
                  <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 font-black text-[9px] px-1 rounded-md shadow-xs">
                    PWA
                  </span>
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-amber-300 tracking-tight font-naskh flex items-center gap-2">
                    <span>ایپ انسٹال کریں (Inquiry Report)</span>
                  </h3>
                  <p className="text-[11px] text-emerald-100 font-medium mt-0.5">
                    موبائل اسکرین پر آفیشل پنجاب پولیس آئیکن اور "Inquiry Report" نام کے ساتھ
                  </p>
                </div>
              </div>

              {/* Mobile Close Button */}
              <button
                onClick={() => setShowInstallBanner(false)}
                className="text-emerald-300 hover:text-white sm:hidden p-1.5 hover:bg-emerald-800/60 rounded-full cursor-pointer transition-colors"
                title="بند کریں"
              >
                ✕
              </button>
            </div>

            {/* Left side: Install Action & Desktop Close Button */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                onClick={handleInstallClick}
                className="w-full sm:w-auto bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 active:scale-95 text-slate-950 font-black text-xs px-5 py-2 rounded-xl shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2 border border-amber-300 text-center"
              >
                <Smartphone className="w-4 h-4 text-slate-950" />
                <span>ایپ انسٹال کریں</span>
              </button>
              
              <button
                onClick={() => setShowInstallBanner(false)}
                className="hidden sm:block text-emerald-300 hover:text-white p-2 hover:bg-emerald-800/60 rounded-full cursor-pointer transition-colors text-sm font-bold"
                title="بند کریں"
              >
                ✕
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          MAIN LAYOUT AREA (no-print)
          ========================================================================= */}
      
      {showAdminPanel && isAdmin ? (
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 no-print" dir="rtl">
          <div className="bg-slate-900/90 rounded-3xl border border-indigo-500/30 p-6 shadow-2xl">
            {/* Header of Admin Panel */}
            <div className="flex flex-col md:flex-row justify-between items-center pb-6 border-b border-slate-800 gap-4 mb-6">
              <div className="text-right">
                <h2 className="text-2xl font-black text-white flex items-center gap-2 justify-start font-nastaliq">
                  <Shield className="w-6 h-6 text-amber-500" />
                  ایڈمنسٹریٹر نگرانی اور سیکیورٹی پینل (User Tracking & Security)
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  یہاں سے آپ دیکھ سکتے ہیں کہ یہ ایپ کہاں کہاں استعمال کی جا رہی ہے، فعال صارفین کی لوکیشن، ان کے موبائل یا کمپیوٹر کی معلومات اور ان کا موجودہ کام دیکھ سکتے ہیں۔
                </p>
              </div>
              <button 
                onClick={fetchSessions}
                className="bg-emerald-800 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg border border-emerald-700"
              >
                <RefreshCw className="w-4 h-4 text-amber-400" />
                <span>ڈیٹا ریفریش کریں</span>
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                <div className="text-right">
                  <p className="text-xs text-slate-500 font-bold">کل رجسٹرڈ سیشنز / صارفین</p>
                  <p className="text-2xl font-black text-indigo-400 mt-1">{sessions.length}</p>
                </div>
                <div className="bg-indigo-950 p-3 rounded-xl border border-indigo-800">
                  <User className="w-6 h-6 text-indigo-400" />
                </div>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                <div className="text-right">
                  <p className="text-xs text-slate-500 font-bold">فعال سیشنز (آخری 1 منٹ میں)</p>
                  <p className="text-2xl font-black text-emerald-400 mt-1">
                    {sessions.filter(s => {
                      const minutes = (Date.now() - new Date(s.lastActiveTime).getTime()) / 60000;
                      return minutes < 1;
                    }).length}
                  </p>
                </div>
                <div className="bg-emerald-950 p-3 rounded-xl border border-emerald-800 flex items-center justify-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block mr-1" />
                </div>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                <div className="text-right">
                  <p className="text-xs text-slate-500 font-bold">بلاک شدہ آئی پیز / صارفین</p>
                  <p className="text-2xl font-black text-rose-500 mt-1">
                    {sessions.filter(s => s.blocked).length}
                  </p>
                </div>
                <div className="bg-rose-950 p-3 rounded-xl border border-rose-800">
                  <AlertCircle className="w-6 h-6 text-rose-400" />
                </div>
              </div>
            </div>

            {/* Main Sessions Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
              <table className="w-full text-right border-collapse" dir="rtl">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-xs text-slate-400 font-bold">
                    <th className="p-4 text-center">آئی پی اور ڈیوائس</th>
                    <th className="p-4">لوکیشن / جگہ</th>
                    <th className="p-4">آخری سرگرمی</th>
                    <th className="p-4">کرنٹ کام (Current Work)</th>
                    <th className="p-4 text-center">سٹیٹس (Status)</th>
                    <th className="p-4 text-center">کنٹرول اور ایکشنز</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 text-sm">
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-500 italic">
                        کوئی سیشن ڈیٹا دستیاب نہیں ہے۔
                      </td>
                    </tr>
                  ) : (
                    sessions.map((s) => {
                      const isActiveNow = (Date.now() - new Date(s.lastActiveTime).getTime()) / 60000 < 1;
                      return (
                        <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                          {/* IP and Device */}
                          <td className="p-4 text-center">
                            <p className="font-mono text-slate-200 font-bold">{s.ip}</p>
                            <p className="text-xs text-slate-400 mt-0.5 flex items-center justify-center gap-1">
                              <span>{s.deviceType === "Mobile" ? "📱 موبائل" : "💻 کمپیوٹر"}</span>
                              <span>•</span>
                              <span>{s.os}</span>
                            </p>
                          </td>

                          {/* Geolocation */}
                          <td className="p-4">
                            {s.location?.city || s.location?.country ? (
                              <div>
                                <p className="font-bold text-indigo-400">
                                  {s.location.city || "نامعلوم شہر"}، {s.location.country || "پاکستان"}
                                </p>
                                {s.location.isp && (
                                  <p className="text-[11px] text-slate-500 mt-0.5">{s.location.isp}</p>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500">محل وقوع تلاش کیا جا رہا ہے...</p>
                            )}
                            {s.location?.latitude && s.location?.longitude && (
                              <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${s.location.latitude},${s.location.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-amber-500 hover:underline text-xs flex items-center gap-1 mt-1 font-bold"
                              >
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
                                نقشہ پر دیکھیں (Google Maps)
                              </a>
                            )}
                          </td>

                          {/* Last Active Time */}
                          <td className="p-4">
                            <p className="text-slate-200 font-bold">
                              {new Date(s.lastActiveTime).toLocaleTimeString("ur-PK", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {new Date(s.lastActiveTime).toLocaleDateString("ur-PK")}
                            </p>
                          </td>

                          {/* Current Work */}
                          <td className="p-4 max-w-xs">
                            {s.currentWork && (s.currentWork.complainantName || s.currentWork.reportNumber || s.currentWork.subjectTitle) ? (
                              <div className="space-y-0.5 text-xs text-right">
                                {s.currentWork.complainantName && (
                                  <p className="text-slate-300">
                                    <span className="text-slate-500 font-bold">درخواست گزار:</span> {s.currentWork.complainantName}
                                  </p>
                                )}
                                {s.currentWork.reportNumber && (
                                  <p className="text-slate-300">
                                    <span className="text-slate-500 font-bold">رپورٹ نمبر:</span> {s.currentWork.reportNumber}
                                  </p>
                                )}
                                {s.currentWork.subjectTitle && (
                                  <p className="text-slate-300 truncate max-w-[180px]" title={s.currentWork.subjectTitle}>
                                    <span className="text-slate-500 font-bold">عنوان:</span> {s.currentWork.subjectTitle}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500 italic">کوئی فعال کام نہیں</p>
                            )}
                          </td>

                          {/* Blocked Status */}
                          <td className="p-4 text-center">
                            {s.blocked ? (
                              <span className="bg-rose-950 border border-rose-800 text-rose-400 px-3 py-1 rounded-full text-xs font-bold">
                                بلاک شدہ
                              </span>
                            ) : isActiveNow ? (
                              <span className="bg-emerald-950 border border-emerald-800 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">
                                فعال (Online)
                              </span>
                            ) : (
                              <span className="bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1 rounded-full text-xs font-bold">
                                آف لائن
                              </span>
                            )}
                          </td>

                          {/* Actions Controls */}
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              {s.currentWork && (s.currentWork.complainantName || s.currentWork.reportNumber || s.currentWork.subjectTitle) ? (
                                <button
                                  onClick={() => setViewedSessionWork(s.currentWork)}
                                  className="bg-indigo-900 hover:bg-indigo-800 text-indigo-100 border border-indigo-700 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>کام دیکھیں</span>
                                </button>
                              ) : (
                                <button
                                  disabled
                                  className="bg-slate-900 text-slate-600 border border-slate-800 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 opacity-40 cursor-not-allowed"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>کوئی کام نہیں</span>
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleToggleBlock(s.id, !s.blocked)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer border transition-all ${
                                  s.blocked 
                                    ? "bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-800" 
                                    : "bg-rose-950 hover:bg-rose-900 text-rose-300 border-rose-800"
                                }`}
                              >
                                {s.blocked ? "بلاک ختم کریں" : "بلاک کریں"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Overlay to View Work Details */}
          {viewedSessionWork && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" dir="rtl">
              <div className="bg-slate-900 border border-slate-700 max-w-lg w-full rounded-3xl p-6 shadow-2xl">
                <h3 className="text-lg font-black text-white border-b border-slate-800 pb-3 mb-4 flex items-center gap-2 font-nastaliq text-right">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                  صارف کی حالیہ انکوائری رپورٹ کا کام
                </h3>
                <div className="space-y-4 text-sm text-slate-300 text-right">
                  <div className="grid grid-cols-3 border-b border-slate-800/60 pb-2">
                    <span className="text-slate-500 font-bold">درخواست گزار:</span>
                    <span className="col-span-2 text-white font-bold">{viewedSessionWork.complainantName || "دستیاب نہیں"}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-slate-800/60 pb-2">
                    <span className="text-slate-500 font-bold">رپورٹ نمبر:</span>
                    <span className="col-span-2 text-white font-mono">{viewedSessionWork.reportNumber || "دستیاب نہیں"}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-slate-800/60 pb-2">
                    <span className="text-slate-500 font-bold">عنوان رپورٹ:</span>
                    <span className="col-span-2 text-white font-semibold">{viewedSessionWork.subjectTitle || "دستیاب نہیں"}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-slate-800/60 pb-2">
                    <span className="text-slate-500 font-bold">انکوائری افسر:</span>
                    <span className="col-span-2 text-slate-200">{viewedSessionWork.inquiryOfficer || "دستیاب نہیں"}</span>
                  </div>
                  <div className="grid grid-cols-3 pb-1">
                    <span className="text-slate-500 font-bold">آخری اپڈیٹ کا وقت:</span>
                    <span className="col-span-2 text-slate-400">
                      {new Date(viewedSessionWork.updatedAt).toLocaleString("ur-PK")}
                    </span>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setViewedSessionWork(null)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    بند کریں (Close)
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      ) : viewMode === "desktop" ? (
        
        /* =========================================================================
            DESKTOP WIDESCREEN VIEW: 3-Column layout
            ========================================================================= */
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-5 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-5 no-print">
          
          {/* Column 1 (Left): Previous Reports & Backups */}
          <div className="lg:col-span-3 flex flex-col gap-4 font-sans">
            
            {/* Record Files list card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col min-h-[350px] shadow-xs text-slate-900">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3 flex-wrap gap-2">
                <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <History className="w-3.5 h-3.5 text-slate-700" />
                  <span>محفوظ انکوائری رپورٹ ({inquiries.length})</span>
                </h3>

                <div className="flex items-center gap-1 flex-wrap">
                  <button 
                    onClick={handleSaveCurrentInquiry}
                    className="bg-[#0f172a] hover:bg-[#1e293b] text-white px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-0.5 cursor-pointer active:scale-95 transition-all shadow-xs"
                    title="موجودہ فائل ڈرافٹ محفوظ کریں"
                  >
                    <Save className="w-3 h-3 text-amber-300" />
                    <span>سیو</span>
                  </button>

                  <button 
                    onClick={handleNewInquiry}
                    className="bg-white hover:bg-slate-50 text-slate-700 px-2 py-1 rounded-lg text-[10px] font-bold border border-slate-300 flex items-center gap-0.5 cursor-pointer active:scale-95 transition-all shadow-xs"
                    title="نیا خالی ٹیمپلیٹ کھولیں"
                  >
                    <Plus className="w-3 h-3" />
                    <span>نیا</span>
                  </button>

                  <button 
                    onClick={() => setShowSearchModal(true)}
                    className="bg-white hover:bg-slate-50 text-slate-700 px-2 py-1 rounded-lg text-[10px] font-bold border border-slate-300 flex items-center gap-0.5 cursor-pointer active:scale-95 transition-all shadow-xs"
                    title="محفوظ انکوائریز پورٹل سرچ"
                  >
                    <span>سرچ</span>
                  </button>

                  {inquiries.length > 0 && (
                    <button 
                      onClick={handleClearAllInquiries}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-2 py-1 rounded-lg text-[10px] font-bold border border-rose-200 flex items-center gap-0.5 cursor-pointer active:scale-95 transition-all"
                      title="تمام محفوظ انکوائریز حذف کریں"
                    >
                      <Trash2 className="w-3 h-3 text-rose-600" />
                      <span>حذف</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Inquiry list scroll */}
              <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2 pr-1">
                {filteredInquiries.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p>کوئی فائل موجود نہیں</p>
                  </div>
                ) : (
                  filteredInquiries.map((item) => {
                    const isSelected = selectedInquiryId === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectInquiry(item.id)}
                        className={`p-3 rounded-xl border text-right cursor-pointer transition-all ${
                          isSelected 
                            ? "bg-slate-100 border-slate-800 text-slate-950 shadow-xs font-bold" 
                            : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-xs truncate max-w-[150px]">
                            {item.complainantName ? `درخواست گزار: ${item.complainantName}` : "خالی رپورٹ"}
                          </h4>
                          <button 
                            onClick={(e) => handleDeleteInquiry(item.id, e)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                            title="حذف کریں"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-slate-500 mt-2 pt-1.5 border-t border-slate-200/60">
                          <span>{item.createdAt}</span>
                          <span className="text-slate-700 font-bold">{item.stationName ? item.stationName.split('،')[0] : "تھانہ"}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Backup Import/Export */}
              <div className="border-t border-slate-100 pt-3 mt-3 grid grid-cols-2 gap-2">
                <label className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 py-1.5 px-2 rounded-xl text-[10px] font-bold text-center cursor-pointer transition-all flex items-center justify-center gap-1 shadow-xs">
                  <Upload className="w-3 h-3 text-slate-700" />
                  <span>بیک اپ لوڈ</span>
                  <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                </label>

                <button 
                  onClick={handleExportBackup}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 shadow-xs"
                >
                  <Download className="w-3 h-3 text-slate-700" />
                  <span>بیک اپ سیو</span>
                </button>
              </div>

            </div>

          </div>

          {/* Column 2 (Middle): Dynamic Input Form Area */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 space-y-5 shadow-xs flex flex-col text-slate-900">
            
            {/* Header control banner */}
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-slate-800" />
                  <span>انکوائری فارم (Easy Pattern Maker)</span>
                </h2>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">درج ذیل مندرجات پُر کریں، دائیں طرف لائیو رپورٹ مرتب ہوگی۔</p>
              </div>
              {speechSupported && (
                <span className="text-[9px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 font-bold">
                  اردو وائس ٹائپنگ فعال ہے
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto max-h-[700px] space-y-5 pr-1">
              
              {/* ⚡ 1-CLICK INSTANT AUTO-SCAN & 1-MIN REPORT BANNER */}
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 rounded-2xl border-2 border-amber-400 shadow-md text-white flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-right">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
                    <Zap className="w-5 h-5 fill-slate-950" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs sm:text-sm text-amber-300 font-naskh">
                      ⚡ فوری مکمل AI سکینر اور 1 منٹ میں تیار رپورٹ
                    </h4>
                    <p className="text-[10px] text-slate-300 mt-0.5 leading-relaxed">
                      ہاتھ سے لکھی درخواست، بیانات، پی ڈی ایف، سٹامپ پیپر یا سکرین شاٹ دیں، رپورٹ خودکار تیار ہو جائے گی۔
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAutoScanModal(true)}
                  className="w-full sm:w-auto bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>صفحات اسکین کریں 🚀</span>
                </button>
              </div>

              {/* 1. Header Details (منجانب، بجانب، توجہ) */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-xs font-black text-slate-900 border-r-4 border-[#0f172a] pr-2">
                  مراسلہ ہیڈر تفصیلات (منجانب و بجانب):
                </h3>
                
                <div className="grid grid-cols-1 gap-3 text-slate-800">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">منجانب (Sender Designation):</label>
                    <input
                      type="text"
                      value={currentInquiry.senderDesignation || ""}
                      onChange={(e) => handleFieldChange("senderDesignation", e.target.value)}
                      placeholder="سینیئر سپرنٹنڈنٹ آف پولیس، ریجنل انویسٹی گیشن برانچ، گوجرانوالہ"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-slate-800 focus:border-slate-800 text-slate-900 font-bold text-right shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">بجانب (Recipient Designation):</label>
                    <input
                      type="text"
                      value={currentInquiry.recipientDesignation || ""}
                      onChange={(e) => handleFieldChange("recipientDesignation", e.target.value)}
                      placeholder="جناب ریجنل پولیس آفیسر صاحب، گوجرانوالہ"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-slate-800 focus:border-slate-800 text-slate-900 font-bold text-right shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">توجہ (Attention line):</label>
                    <input
                      type="text"
                      value={currentInquiry.attention || ""}
                      onChange={(e) => handleFieldChange("attention", e.target.value)}
                      placeholder="توجہ: انچارج شکایت سیل"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-slate-800 focus:border-slate-800 text-slate-900 text-right font-medium shadow-2xs"
                    />
                  </div>
                </div>

                <div className="bg-slate-100 border border-slate-200 p-2 rounded-lg text-center text-[10px] text-slate-600 font-bold">
                  بمطابق ضابطہ سرکاری، مراسلہ نمبر اور تاریخ لائن خالی چھوڑ دی گئی ہے۔
                </div>
              </div>

              {/* 2. Title & Complainant (عنوان اور موقف درخواست) */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3.5">
                <h3 className="text-xs font-black text-slate-900 border-r-4 border-[#0f172a] pr-2">
                  سائل کا نام اور موقف درخواست گزار (موقف درخواست ازاں):
                </h3>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">درخواست گزار / سائل کا نام:</label>
                  <input
                    type="text"
                    value={currentInquiry.complainantName || ""}
                    onChange={(e) => handleFieldChange("complainantName", e.target.value)}
                    placeholder="مثلاً: مسمات رخسانہ بی بی زوجہ محمد طفیل"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-slate-800 focus:border-slate-800 text-slate-900 font-bold text-right shadow-2xs"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[11px] font-bold text-slate-700">موقف درخواست ازان :</label>
                    {speechSupported && (
                      <button
                        onClick={() => toggleSpeech("complainantStatement")}
                        className={`text-[9px] px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                          listeningField === "complainantStatement"
                            ? "bg-rose-600 text-white"
                            : "bg-slate-100 text-slate-700 border border-slate-300"
                        }`}
                      >
                        <Mic className="w-3 h-3" />
                        <span>{listeningField === "complainantStatement" ? "ریکارڈنگ بند" : "آواز سے لکھیں"}</span>
                      </button>
                    )}
                  </div>
                  
                  <textarea
                    rows={4}
                    value={currentInquiry.complainantStatement || ""}
                    onChange={(e) => handleFieldChange("complainantStatement", e.target.value)}
                    placeholder="سائل کا موقف یا درخواست کا تحریری خلاصہ یہاں ٹائپ کریں۔ آواز ٹائپنگ بھی کر سکتے ہیں۔"
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs focus:ring-1 focus:ring-slate-800 focus:border-slate-800 text-slate-900 leading-relaxed text-right font-medium shadow-2xs"
                  />
                </div>

                {/* Scanners & Upload directly under narrative */}
                <div className="pt-2 border-t border-slate-200">
                  <StatementImageScanner 
                    onTextScanned={handleScannedComplainantStatement}
                  />
                </div>
              </div>

              {/* 3. Additional Witness statements (بیان ازاں) */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3.5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-900 border-r-4 border-[#0f172a] pr-2">
                    بیان ازان (سائل اور تائیدی گواہان کے بیانات):
                  </h3>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={addComplainantStatement}
                      className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-[10px] px-2.5 py-1.5 rounded-lg font-bold transition-all active:scale-95 shadow-xs"
                    >
                      ➕ بیان سائل
                    </button>
                    <button
                      onClick={addSupportingStatement}
                      className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-[10px] px-2.5 py-1.5 rounded-lg font-bold transition-all active:scale-95 shadow-xs"
                    >
                      ➕ تائیدی بیان
                    </button>
                  </div>
                </div>

                {complainantGroup.length === 0 ? (
                  <p className="text-[10px] text-slate-500 italic text-center py-2 font-medium">کوئی اضافی بیان درج نہیں ہے۔ بیانات شامل کرنے کے لیے اوپر موجود بٹن دبائیں۔</p>
                ) : (
                  <div className="space-y-3">
                    {complainantGroup.map((st) => (
                      <div key={st.id} className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 relative shadow-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {st.role === "Complainant" ? "درخواست گزار کا بیان" : "تائیدی بیان سائل"}
                          </span>
                          
                          <div className="flex items-center gap-1.5">
                            {speechSupported && (
                              <button
                                onClick={() => toggleSpeech(`stmt_text_${st.id}`)}
                                className={`text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center gap-1 ${
                                  listeningField === `stmt_text_${st.id}`
                                    ? "bg-rose-600 text-white"
                                    : "bg-slate-100 text-slate-700 border border-slate-200"
                                }`}
                              >
                                <Mic className="w-2.5 h-2.5" />
                                <span>آواز ٹائپنگ</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveStatement(st.id)}
                              className="text-slate-400 hover:text-rose-600 p-0.5"
                              title="حذف کریں"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="sm:col-span-1">
                            <label className="block text-[9px] font-bold text-slate-600 mb-0.5">نام فریق:</label>
                            <input
                              type="text"
                              value={st.personName}
                              onChange={(e) => handleUpdateStatementName(st.id, e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 font-bold focus:bg-white focus:border-slate-800"
                              placeholder="نام فریق"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-[9px] font-bold text-slate-600 mb-0.5">بیان متن:</label>
                            <textarea
                              rows={2}
                              value={st.text}
                              onChange={(e) => handleUpdateStatementText(st.id, e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900 font-medium focus:bg-white focus:border-slate-800"
                              placeholder="بیان کا متن لکھیں..."
                            />
                          </div>
                        </div>

                        {/* Camera and Upload Scanner for Desktop Supporting Statements */}
                        <div className="pt-2 border-t border-slate-100 mt-2">
                          <StatementImageScanner 
                            label={st.role === "Complainant" ? "دستاویزی اسکینر (درخواست گزار کا بیان یہاں سے اسکین کریں):" : "دستاویزی اسکینر (تائیدی گواہ کا بیان یہاں سے اسکین کریں):"}
                            onTextScanned={(scannedText) => handleScannedStatementText(st.id, scannedText)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Optional Respondent statements (بیان الزام علیہ) */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3.5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-900 border-r-4 border-[#0f172a] pr-2">
                    الزام علیہ کا بیان (Respondent Statements):
                  </h3>
                  
                  <button
                    onClick={addRespondentStatement}
                    className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-[10px] px-2.5 py-1.5 rounded-lg font-bold transition-all active:scale-95 flex items-center gap-1 shadow-xs"
                  >
                    <span>➕ بیان الزام علیہ شامل کریں</span>
                  </button>
                </div>

                {respondentGroup.length === 0 ? (
                  <p className="text-[10px] text-slate-500 italic text-center py-2 font-medium">کوئی بیان الزام علیہ درج نہیں ہے۔ بیانات شامل کرنے کے لیے اوپر بٹن دبائیں۔</p>
                ) : (
                  <div className="space-y-3">
                    {respondentGroup.map((st) => (
                      <div key={st.id} className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 relative shadow-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            بیان الزام علیہ
                          </span>
                          
                          <div className="flex items-center gap-1.5">
                            {speechSupported && (
                              <button
                                onClick={() => toggleSpeech(`stmt_text_${st.id}`)}
                                className={`text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center gap-1 ${
                                  listeningField === `stmt_text_${st.id}`
                                    ? "bg-rose-600 text-white"
                                    : "bg-slate-100 text-slate-700 border border-slate-200"
                                }`}
                              >
                                <Mic className="w-2.5 h-2.5" />
                                <span>آواز ٹائپنگ</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveStatement(st.id)}
                              className="text-slate-400 hover:text-rose-600 p-0.5"
                              title="حذف کریں"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="sm:col-span-1">
                            <label className="block text-[9px] font-bold text-slate-600 mb-0.5">نام الزام علیہ:</label>
                            <input
                              type="text"
                              value={st.personName}
                              onChange={(e) => handleUpdateStatementName(st.id, e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 font-bold focus:bg-white focus:border-slate-800"
                              placeholder="نام الزام علیہ"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-[9px] font-bold text-slate-600 mb-0.5">بیان متن:</label>
                            <textarea
                              rows={2}
                              value={st.text}
                              onChange={(e) => handleUpdateStatementText(st.id, e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900 font-medium focus:bg-white focus:border-slate-800"
                              placeholder="الزام علیہ کا دفاعی بیان..."
                            />
                          </div>
                        </div>

                        {/* Camera and Upload Scanner for Desktop Respondent Statements */}
                        <div className="pt-2 border-t border-slate-100 mt-2">
                          <StatementImageScanner 
                            label="دستاویزی اسکینر (الزام علیہ کا بیان یہاں سے اسکین کریں):"
                            onTextScanned={(scannedText) => handleScannedStatementText(st.id, scannedText)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Progress Report (پراگرس رپورٹ) */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      id="showProgressReport"
                      checked={currentInquiry.showProgressReport || false}
                      onChange={(e) => handleFieldChange("showProgressReport", e.target.checked)}
                      className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-800 cursor-pointer"
                    />
                    <label htmlFor="showProgressReport" className="text-xs font-bold text-slate-800 cursor-pointer select-none">
                      پراگرس رپورٹ شامل کریں (Include Progress Report)
                    </label>
                  </div>
                </div>

                {currentInquiry.showProgressReport && (
                  <div className="space-y-3.5 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">پراگرس رپورٹ ہیڈنگ:</label>
                      <input
                        type="text"
                        value={currentInquiry.progressHeading || ""}
                        onChange={(e) => handleFieldChange("progressHeading", e.target.value)}
                        placeholder="پراگرس رپورٹ کی ہیڈنگ درج کریں..."
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-slate-800 text-slate-900 font-bold text-right shadow-2xs"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[11px] font-bold text-slate-700">پراگرس رپورٹ متن (تفصیل):</label>
                        {speechSupported && (
                          <button
                            onClick={() => toggleSpeech("progressText")}
                            className={`text-[9px] px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                              listeningField === "progressText"
                                ? "bg-rose-600 text-white"
                                : "bg-slate-100 text-slate-700 border border-slate-300"
                            }`}
                          >
                            <Mic className="w-3 h-3" />
                            <span>{listeningField === "progressText" ? "ریکارڈنگ بند" : "آواز سے لکھیں"}</span>
                          </button>
                        )}
                      </div>
                      <textarea
                        rows={4}
                        value={currentInquiry.progressText || ""}
                        onChange={(e) => handleFieldChange("progressText", e.target.value)}
                        placeholder="تفتیش مقدمہ کی تفصیل درج کریں..."
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-slate-800 text-slate-900 leading-relaxed text-right font-medium shadow-2xs"
                      />
                    </div>

                    {/* Progress Report Images Upload */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-slate-700">تصویر / دستاویزی ثبوت (پراگرس رپورٹ):</label>
                      
                      <div className="flex flex-wrap gap-2 items-center">
                        <label className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-[10px] px-3 py-2 rounded-xl font-bold cursor-pointer transition-all select-none shadow-xs">
                          <Upload className="w-3.5 h-3.5 text-slate-700" />
                          <span>تصویر / PDF اپلوڈ کریں</span>
                          <input 
                            type="file" 
                            accept="image/*,application/pdf,.pdf" 
                            multiple 
                            onChange={(e) => handleProgressFileUpload(e.target.files)}
                            className="hidden" 
                          />
                        </label>
                        
                        <StatementImageScanner 
                          label="دستاویزی اسکینر سے متن اسکین کریں:"
                          onTextScanned={(scannedText) => {
                            const currentVal = currentInquiry.progressText || "";
                            const updatedVal = currentVal ? `${currentVal}\n${scannedText}` : scannedText;
                            handleFieldChange("progressText", updatedVal);
                          }}
                        />
                      </div>

                      {/* Display Uploaded Images */}
                      {currentInquiry.progressImages && currentInquiry.progressImages.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                          {currentInquiry.progressImages.map((img, idx) => (
                            <div key={idx} className="relative group border border-slate-200 rounded-lg overflow-hidden h-20 bg-white flex items-center justify-center shadow-xs">
                              <img src={img} alt={`Progress Attachment ${idx + 1}`} className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                              <button
                                onClick={() => {
                                  const updatedImages = [...(currentInquiry.progressImages || [])];
                                  updatedImages.splice(idx, 1);
                                  handleFieldChange("progressImages", updatedImages);
                                }}
                                className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-700 cursor-pointer"
                                title="حذف کریں"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Conclusion (نتیجہ انکوائری) */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-900 border-r-4 border-[#0f172a] pr-2">
                    حتمی نتیجہ انکوائری (Inquiry Conclusion):
                  </h3>
                  
                  <button
                    onClick={handleGenerateReport}
                    disabled={isGenerating}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                      isGenerating 
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                        : "bg-[#0f172a] hover:bg-[#1e293b] text-white active:scale-95"
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                        <span>مرتب ہو رہی ہے...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>AI سے نتیجہ انکوائری لکھیں</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    rows={4}
                    value={currentInquiry.inquiryConclusion || ""}
                    onChange={(e) => handleFieldChange("inquiryConclusion", e.target.value)}
                    placeholder="حتمی نتیجہ انکوائری یہاں لکھیں۔ اے آئی سے آٹومیٹک بھی مرتب کروا سکتے ہیں۔"
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs focus:ring-1 focus:ring-slate-800 text-slate-900 leading-relaxed text-right font-medium shadow-2xs"
                  />
                  
                  {speechSupported && (
                    <button
                      onClick={() => toggleSpeech("inquiryConclusion")}
                      className={`absolute bottom-3 left-3 p-2 rounded-full shadow-xs transition-all cursor-pointer ${
                        listeningField === "inquiryConclusion"
                          ? "bg-rose-600 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                      title="آواز ٹائپنگ"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="text-[10px] font-bold text-slate-600 py-1.5 border-t border-slate-200 mt-1 flex justify-between items-center">
                  <span>رپورٹ مرتب ہو کر برائے مناسب حکم ارسال خدمت ہے ۔</span>
                  <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold border border-slate-200">بمطابق قواعدِ پنجاب پولیس</span>
                </div>

                {/* PROMINENT SUBMIT / SAVE BUTTON AT END OF FORM */}
                <div className="pt-3 border-t border-slate-200">
                  <button
                    onClick={handleSaveCurrentInquiry}
                    className="w-full bg-[#0f172a] hover:bg-[#1e293b] active:scale-98 text-white font-black text-sm py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 border border-slate-800 cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-amber-300" />
                    <span>محفوظ کریں (Save Inquiry) 💾</span>
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* Column 3 (Right): Live Report Sheet Preview */}
          <div className="lg:col-span-4 flex flex-col h-full space-y-4">
            <ReportPreview 
              data={currentInquiry}
              onPrint={handlePrint}
            />
          </div>

        </main>
      ) : (
        
        /* =========================================================================
            📱 IMMERSIVE NATIVE PLAY STORE MOBILE APP VIEW (Real simulated phone)
            ========================================================================= */
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-4 sm:py-8 flex flex-col items-center justify-center no-print">
          
          {/* SENSATIONAL OUTER SMARTPHONE FRAME
              Only visible on Desktop. On native mobile screens, we remove the double margin and border
              via custom responsive utility class names (`w-full max-w-[420px] lg:border-8 ...`) */}
          <div className="w-full max-w-[425px] bg-slate-950 rounded-[48px] p-3.5 shadow-2xl border-4 border-slate-800 md:border-8 md:border-slate-800 relative">
            
            {/* Phone Bezel elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-950 rounded-b-2xl z-20 flex justify-center items-center gap-2">
              {/* Speaker pill */}
              <div className="w-12 h-1 bg-slate-800 rounded-full" />
              {/* Front Camera hole */}
              <div className="w-2.5 h-2.5 bg-slate-900 border border-slate-800 rounded-full" />
            </div>

            {/* Simulated Phone Screen Area */}
            <div className="w-full bg-slate-50 overflow-hidden rounded-[36px] flex flex-col h-[740px] relative text-slate-800 border border-slate-900">
              
              {/* 1. NATIVE STATUS BAR (Time, Wifi, Battery) */}
              <div className="bg-emerald-950 text-white h-7 px-6 pt-1.5 flex justify-between items-center text-[10px] font-bold select-none z-10 shrink-0">
                {/* Right: battery, signals */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-amber-400 font-mono">5G</span>
                  {/* Signal wave vector mockup */}
                  <div className="flex gap-0.5 items-end h-2.5">
                    <div className="w-0.5 h-1 bg-slate-400 rounded-xs" />
                    <div className="w-0.5 h-1.5 bg-slate-400 rounded-xs" />
                    <div className="w-0.5 h-2 bg-white rounded-xs" />
                    <div className="w-0.5 h-2.5 bg-white rounded-xs" />
                  </div>
                  {/* Battery mockup */}
                  <div className="flex items-center gap-0.5 border border-white/60 rounded-xs px-0.5 py-0.25">
                    <div className="w-3.5 h-1.5 bg-amber-400 rounded-2xs" />
                  </div>
                </div>

                {/* Left: Current Time */}
                <LiveClock />
              </div>

              {/* 2. PLAY STORE APP HEADER ACTION BAR */}
              <div className="bg-emerald-950 text-white px-4 py-3.5 flex justify-between items-center shadow-md shrink-0">
                <div className="flex items-center gap-2">
                  <img 
                    src={policeLogo} 
                    alt="لوگو" 
                    className="w-8 h-8 rounded-full border border-amber-500 object-contain p-0.5 bg-slate-900 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h2 className="text-xs font-black tracking-tight">پنجاب پولیس گوجرانوالہ</h2>
                    <p className="text-[8px] text-emerald-300 font-medium">آفیشل انکوائری رپورٹ میکر</p>
                  </div>
                </div>

                {/* Add dynamic record & download buttons */}
                <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleInstallClick}
                      className="bg-emerald-900 border border-emerald-800 text-amber-400 p-1.5 rounded-full shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                      title="ایپ ڈاؤن لوڈ کریں"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  <button
                    onClick={handleNewInquiry}
                    className="bg-amber-500 hover:bg-amber-600 text-emerald-950 p-1.5 rounded-full shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                    title="نیا ٹیمپلیٹ"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setShowSearchModal(true)}
                    className="bg-slate-900 border border-slate-700 text-amber-300 p-1.5 rounded-full shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                    title="محفوظ انکوائری سرچ"
                  >
                    <History className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 3. SCROLLABLE SCREEN BODY (Depending on Mobile Tab) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-16 bg-slate-100">
                
                {/* TAB 1: RECORDS & SEARCH */}
                {mobileTab === "records" && (
                  <div className="space-y-4 text-right">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={handleNewInquiry}
                            className="bg-emerald-800 hover:bg-emerald-700 text-white text-[9px] px-2 py-1 rounded-lg font-bold flex items-center gap-0.5 cursor-pointer"
                          >
                            <Plus className="w-3 h-3 text-amber-300" />
                            <span>نیا ٹیمپلیٹ</span>
                          </button>
                          <button
                            onClick={() => setShowSearchModal(true)}
                            className="bg-slate-800 hover:bg-slate-700 text-amber-300 text-[9px] px-2 py-1 rounded-lg font-bold flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>سرچ 🔍</span>
                          </button>
                          {inquiries.length > 0 && (
                            <button
                              onClick={handleClearAllInquiries}
                              className="bg-rose-900 hover:bg-rose-800 text-rose-200 text-[9px] px-2 py-1 rounded-lg font-bold flex items-center gap-0.5 cursor-pointer"
                              title="تمام محفوظ انکوائریز حذف کریں"
                            >
                              <Trash2 className="w-3 h-3 text-rose-300" />
                              <span>تمام حذف</span>
                            </button>
                          )}
                        </div>
                        <h3 className="font-extrabold text-slate-800 text-xs">محفوظ شدہ انکوائریز ({inquiries.length})</h3>
                      </div>

                      {/* List */}
                      <div className="space-y-2 max-h-[310px] overflow-y-auto pr-1">
                        {filteredInquiries.length === 0 ? (
                          <p className="text-center py-8 text-slate-400 text-xs font-bold">کوئی ریکارڈ نہیں ملا</p>
                        ) : (
                          filteredInquiries.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => {
                                handleSelectInquiry(item.id);
                                setMobileTab("details"); // auto switch to edit
                              }}
                              className={`p-3 rounded-xl border text-right cursor-pointer transition-all flex justify-between items-center ${
                                selectedInquiryId === item.id 
                                  ? "bg-emerald-50 border-emerald-600/30 text-emerald-950" 
                                  : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                              }`}
                            >
                              <button 
                                onClick={(e) => handleDeleteInquiry(item.id, e)}
                                className="text-slate-400 hover:text-rose-600 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <div className="truncate max-w-[200px]">
                                <h4 className="font-extrabold text-xs text-slate-800">
                                  {item.complainantName ? `درخواست گزار: ${item.complainantName}` : "خالی رپورٹ"}
                                </h4>
                                <span className="text-[9px] text-slate-400 block mt-0.5">{item.createdAt}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Quick Info & Backup Card */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm space-y-2.5">
                      <h4 className="text-xs font-extrabold text-slate-800">بیک اپ اور ری سٹور</h4>
                      <p className="text-[9.5px] text-slate-500 leading-relaxed">رپورٹس کے ڈیٹا کا محفوظ بیک اپ حاصل کرنے کے لیے بٹنز استعمال کریں:</p>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 py-2 px-2 rounded-xl text-[10px] font-bold text-center cursor-pointer flex items-center justify-center gap-1">
                          <Upload className="w-3.5 h-3.5 text-emerald-800" />
                          <span>بیک اپ لوڈ</span>
                          <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                        </label>

                        <button
                          onClick={handleExportBackup}
                          className="bg-emerald-950 text-white py-2 px-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5 text-amber-400" />
                          <span>ڈیٹا ڈاؤن لوڈ</span>
                        </button>
                      </div>
                    </div>

                    {/* Mobile View Google Play App badge - only shown if not installed */}
                    {!isAppInstalled && (
                      <div className="bg-white p-4 rounded-2xl border border-emerald-600/20 shadow-sm text-right space-y-3 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-20 h-20 bg-[#01875f]/5 rounded-full blur-lg pointer-events-none" />
                        
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 bg-white rounded-xl p-1 border border-slate-200 flex items-center justify-center relative shrink-0">
                            <img 
                              src={policeLogo} 
                              alt="Punjab Police" 
                              className="w-8 h-8 rounded-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-[#01875f] rounded-full border border-white flex items-center justify-center">
                              <span className="text-[5px] text-white">▶</span>
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-extrabold text-slate-800 text-[11px] truncate">پنجاب پولیس انکوائری رپورٹ</h4>
                            <p className="text-[9px] text-[#01875f] font-extrabold">آفیشل موبائل ایپ انسٹالیشن</p>
                          </div>
                        </div>

                        <button
                          onClick={handleInstallClick}
                          className="w-full bg-[#01875f] hover:bg-[#00704e] text-white py-2 rounded-xl font-extrabold text-[10px] flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-white" />
                          <span>اصلی آئیکن کے ساتھ انسٹال کریں</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: HEADER DETAILS (منجانب، بجانب) */}
                {mobileTab === "details" && (
                  <div className="space-y-4 text-right">
                    
                    {/* Header fields cards */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm space-y-3.5">
                      <div className="border-r-4 border-emerald-800 pr-2.5">
                        <h3 className="font-extrabold text-slate-800 text-xs">رپورٹ منجانب اور بجانب:</h3>
                        <p className="text-[9px] text-slate-400">سرکاری مراسلے کا باضابطہ ہیڈر پُر کریں</p>
                      </div>

                      {/* منجانب */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-extrabold text-slate-500">منجانب (Sender designation):</label>
                        <input
                          type="text"
                          value={currentInquiry.senderDesignation || ""}
                          onChange={(e) => handleFieldChange("senderDesignation", e.target.value)}
                          placeholder="سینیئر سپرنٹنڈنٹ آف پولیس، ریجنل انویسٹی گیشن برانچ، گوجرانوالہ"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs focus:ring-1 focus:ring-emerald-800 focus:outline-none text-slate-900 font-bold"
                        />
                      </div>

                      {/* بجانب */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-extrabold text-slate-500">بجانب (Recipient designation):</label>
                        <input
                          type="text"
                          value={currentInquiry.recipientDesignation || ""}
                          onChange={(e) => handleFieldChange("recipientDesignation", e.target.value)}
                          placeholder="جناب ریجنل پولیس آفیسر صاحب، گوجرانوالہ"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs focus:ring-1 focus:ring-emerald-800 focus:outline-none text-slate-900 font-bold"
                        />
                      </div>

                      {/* توجہ */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-extrabold text-slate-500">توجہ (Attention):</label>
                        <input
                          type="text"
                          value={currentInquiry.attention || ""}
                          onChange={(e) => handleFieldChange("attention", e.target.value)}
                          placeholder="توجہ: انچارج شکایت سیل"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs focus:ring-1 focus:ring-emerald-800 focus:outline-none text-slate-900 font-medium"
                        />
                      </div>

                      <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100 text-center text-[9px] text-amber-900 font-bold leading-normal">
                        سرکاری ضابطے کے مطابق، مراسلے کا نمبر اور تاریخ خالی رکھی گئی ہے۔
                      </div>
                    </div>

                    {/* App guide / helper block */}
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 flex items-start gap-2.5 text-right">
                      <AlertCircle className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                      <div className="text-[10px] text-emerald-950 font-medium leading-relaxed">
                        <p className="font-extrabold">رہنما ہدایات برائے تفتیش:</p>
                        <p className="text-slate-600 mt-0.5">تفصیلات کو مکمل کر کے اگلا ٹیب 👥 بیانات منتخب کریں اور بیانات فریقین قلمبند کریں۔</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: STATEMENTS & OCR SCANNER */}
                {mobileTab === "statements" && (
                  <div className="space-y-4 text-right">
                    
                    {/* ⚡ 1-CLICK INSTANT AUTO-SCAN FULL REPORT BANNER - MOBILE */}
                    <div className="bg-gradient-to-r from-slate-950 to-slate-900 p-3.5 rounded-2xl border border-amber-400 shadow-md text-white space-y-2.5 text-right">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
                          <Zap className="w-4 h-4 fill-slate-950" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs text-amber-300 font-naskh">
                            ⚡ 1 منٹ میں خودکار مکمل رپورٹ
                          </h4>
                          <p className="text-[9px] text-slate-300">تمام صفحات اسکین کر کے فوراً نتیجہ انکوائری رپورٹ حاصل کریں</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAutoScanModal(true)}
                        className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 fill-slate-950" />
                        <span>فوری مکمل اسکین شروع کریں 🚀</span>
                      </button>
                    </div>

                    {/* Complainant Narrative main card */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm space-y-3.5">
                      <div className="border-r-4 border-emerald-800 pr-2.5">
                        <h3 className="font-extrabold text-slate-800 text-xs">موقف درخواست ازاں (سائل موقف):</h3>
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 mb-1">درخواست گزار کا نام:</label>
                        <input
                          type="text"
                          value={currentInquiry.complainantName || ""}
                          onChange={(e) => handleFieldChange("complainantName", e.target.value)}
                          placeholder="مثلاً: مسمات رخسانہ بی بی"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 font-bold"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[10px] font-extrabold text-slate-500">سائل کا تحریری موقف:</label>
                          {speechSupported && (
                            <button
                              onClick={() => toggleSpeech("complainantStatement")}
                              className={`text-[9px] px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 ${
                                listeningField === "complainantStatement"
                                  ? "bg-rose-600 text-white"
                                  : "bg-emerald-50 text-emerald-800 border border-emerald-100"
                              }`}
                            >
                              <Mic className="w-2.5 h-2.5" />
                              <span>{listeningField === "complainantStatement" ? "ریکارڈنگ" : "بولیں"}</span>
                            </button>
                          )}
                        </div>
                        
                        <textarea
                          rows={3}
                          value={currentInquiry.complainantStatement || ""}
                          onChange={(e) => handleFieldChange("complainantStatement", e.target.value)}
                          placeholder="درخواست کا خلاصہ تحریر کریں..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-medium leading-relaxed"
                        />
                      </div>

                      {/* Scanner tool inline */}
                      <div className="pt-2 border-t border-slate-100">
                        <StatementImageScanner 
                          onTextScanned={handleScannedComplainantStatement}
                        />
                      </div>
                    </div>

                    {/* Optional complainant statements dynamic lists */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm space-y-3.5">
                      <div className="flex justify-between items-center">
                        <div className="flex gap-1">
                          <button
                            onClick={addComplainantStatement}
                            className="bg-emerald-800 text-white text-[9px] px-2 py-1 rounded font-bold"
                          >
                            ➕ بیان سائل
                          </button>
                          <button
                            onClick={addSupportingStatement}
                            className="bg-slate-200 text-slate-800 text-[9px] px-2 py-1 rounded font-bold"
                          >
                            ➕ تائیدی گواہ
                          </button>
                        </div>
                        <h4 className="font-extrabold text-slate-800 text-xs">بیان ازان (سائل گواہان):</h4>
                      </div>

                      {complainantGroup.length > 0 ? (
                        <div className="space-y-2">
                          {complainantGroup.map((st) => (
                            <div key={st.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5 relative">
                              <div className="flex justify-between items-center">
                                <button onClick={() => handleRemoveStatement(st.id)} className="text-rose-500 p-0.5">
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.25 rounded">
                                  {st.role === "Complainant" ? "بیان سائل" : "تائیدی بیان"}
                                </span>
                              </div>
                              <input
                                type="text"
                                value={st.personName}
                                onChange={(e) => handleUpdateStatementName(st.id, e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs font-bold text-slate-800"
                                placeholder="نام فریق"
                              />
                              <textarea
                                rows={2}
                                value={st.text}
                                onChange={(e) => handleUpdateStatementText(st.id, e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-800 font-medium"
                                placeholder="بیان متن..."
                              />
                              {/* Camera and Upload Scanner for Mobile Supporting Statements */}
                              <div className="pt-2 border-t border-slate-100 mt-1">
                                <StatementImageScanner 
                                  label={st.role === "Complainant" ? "دستاویزی اسکینر (درخواست گزار بیان):" : "دستاویزی اسکینر (تائیدی بیان):"}
                                  onTextScanned={(scannedText) => handleScannedStatementText(st.id, scannedText)}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[9px] text-slate-400 italic text-center">کوئی اضافی بیان درج نہیں ہے۔</p>
                      )}
                    </div>

                    {/* Optional Respondent statements dynamic list */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm space-y-3.5">
                      <div className="flex justify-between items-center">
                        <button
                          onClick={addRespondentStatement}
                          className="bg-amber-500 text-emerald-950 text-[9px] px-2.5 py-1 rounded-md font-extrabold"
                        >
                          ➕ بیان الزام علیہ شامل کریں
                        </button>
                        <h4 className="font-extrabold text-slate-800 text-xs">بیانات الزام علیہ:</h4>
                      </div>

                      {respondentGroup.length > 0 ? (
                        <div className="space-y-2">
                          {respondentGroup.map((st) => (
                            <div key={st.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5 relative">
                              <div className="flex justify-between items-center">
                                <button onClick={() => handleRemoveStatement(st.id)} className="text-rose-500 p-0.5">
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.25 rounded">
                                  بیان الزام علیہ
                                </span>
                              </div>
                              <input
                                type="text"
                                value={st.personName}
                                onChange={(e) => handleUpdateStatementName(st.id, e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs font-bold text-slate-800"
                                placeholder="نام الزام علیہ"
                              />
                              <textarea
                                rows={2}
                                value={st.text}
                                onChange={(e) => handleUpdateStatementText(st.id, e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-800 font-medium"
                                placeholder="بیان کا متن لکھیں..."
                              />
                              {/* Camera and Upload Scanner for Mobile Respondent Statements */}
                              <div className="pt-2 border-t border-slate-100 mt-1">
                                <StatementImageScanner 
                                  label="دستاویزی اسکینر (الزام علیہ کا بیان):"
                                  onTextScanned={(scannedText) => handleScannedStatementText(st.id, scannedText)}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[9px] text-slate-400 italic text-center">الزام علیہ کا کوئی بیان شامل نہیں ہے۔</p>
                      )}
                    </div>

                    {/* Progress Report (پراگرس رپورٹ) - Mobile UI */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox"
                            id="showProgressReportMobile"
                            checked={currentInquiry.showProgressReport || false}
                            onChange={(e) => handleFieldChange("showProgressReport", e.target.checked)}
                            className="w-4 h-4 text-emerald-800 rounded border-slate-300 focus:ring-emerald-800"
                          />
                          <label htmlFor="showProgressReportMobile" className="text-xs font-extrabold text-slate-800 cursor-pointer select-none">
                            پراگرس رپورٹ شامل کریں (Progress Report)
                          </label>
                        </div>
                      </div>

                      {currentInquiry.showProgressReport && (
                        <div className="space-y-3 pt-1">
                          <div>
                            <label className="block text-[10px] font-extrabold text-slate-500 mb-1">پراگرس رپورٹ ہیڈنگ:</label>
                            <input
                              type="text"
                              value={currentInquiry.progressHeading || ""}
                              onChange={(e) => handleFieldChange("progressHeading", e.target.value)}
                              placeholder="پراگرس رپورٹ ہیڈنگ..."
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 font-bold text-right"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="block text-[10px] font-extrabold text-slate-500">پراگرس رپورٹ متن (تفصیل):</label>
                              {speechSupported && (
                                <button
                                  onClick={() => toggleSpeech("progressText")}
                                  className={`text-[9px] px-1.5 py-0.5 rounded-lg font-bold flex items-center gap-1 ${
                                    listeningField === "progressText"
                                      ? "bg-rose-600 text-white"
                                      : "bg-emerald-50 text-emerald-800 border border-emerald-100"
                                  }`}
                                >
                                  <Mic className="w-3 h-3" />
                                  <span>{listeningField === "progressText" ? "ریکارڈنگ" : "آواز سے لکھیں"}</span>
                                </button>
                              )}
                            </div>
                            <textarea
                              rows={3}
                              value={currentInquiry.progressText || ""}
                              onChange={(e) => handleFieldChange("progressText", e.target.value)}
                              placeholder="تفتیش مقدمہ کی تفصیل لکھیں..."
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-medium text-right"
                            />
                          </div>

                          {/* Progress Report Images Upload */}
                          <div className="space-y-2">
                            <label className="block text-[10px] font-extrabold text-slate-500">تصویر / دستاویزی ثبوت:</label>
                            
                            <div className="flex flex-wrap gap-2 items-center">
                              <label className="flex items-center gap-1 bg-emerald-800 hover:bg-emerald-950 text-white text-[10px] px-2.5 py-1.5 rounded-xl font-bold cursor-pointer transition-all select-none">
                                <Upload className="w-3 h-3" />
                                <span>تصویر / PDF اپلوڈ</span>
                                <input 
                                  type="file" 
                                  accept="image/*,application/pdf,.pdf" 
                                  multiple 
                                  onChange={(e) => handleProgressFileUpload(e.target.files)}
                                  className="hidden" 
                                />
                              </label>
                              
                              <StatementImageScanner 
                                label="متن اسکینر:"
                                onTextScanned={(scannedText) => {
                                  const currentVal = currentInquiry.progressText || "";
                                  const updatedVal = currentVal ? `${currentVal}\n${scannedText}` : scannedText;
                                  handleFieldChange("progressText", updatedVal);
                                }}
                              />
                            </div>

                            {/* Display Uploaded Images */}
                            {currentInquiry.progressImages && currentInquiry.progressImages.length > 0 && (
                              <div className="grid grid-cols-3 gap-2 pt-1">
                                {currentInquiry.progressImages.map((img, idx) => (
                                  <div key={idx} className="relative group border border-slate-200 rounded-lg overflow-hidden h-16 bg-slate-100 flex items-center justify-center">
                                    <img src={img} alt={`Progress Attachment ${idx + 1}`} className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                                    <button
                                      onClick={() => {
                                        const updatedImages = [...(currentInquiry.progressImages || [])];
                                        updatedImages.splice(idx, 1);
                                        handleFieldChange("progressImages", updatedImages);
                                      }}
                                      className="absolute top-0.5 right-0.5 bg-rose-600 text-white rounded-full p-0.5"
                                      title="حذف کریں"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Generate Conclusion card trigger */}
                    <div className="bg-gradient-to-r from-emerald-950 to-emerald-900 p-4 rounded-2xl border border-emerald-900 shadow-sm space-y-2 text-center text-white">
                      <h4 className="text-xs font-extrabold text-amber-400">تیار کار نتیجہ انکوائری (AI)</h4>
                      <p className="text-[9px] text-slate-300">درج کردہ معلومات کی بنیاد پر AI سے نتیجہ انکوائری اور حتمی خلاصہ لکھوائیں:</p>
                      
                      <button
                        onClick={handleGenerateReport}
                        disabled={isGenerating}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-emerald-950 font-black text-xs py-2.5 rounded-xl shadow transition-all flex items-center justify-center gap-1 active:scale-95"
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>رپورٹ مرتب ہو رہی ہے...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>رپورٹ اور حتمی نتیجہ تیار کریں</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                )}

                {/* TAB 4: FINAL REPORT PREVIEW & ACTION EXPORTS */}
                {mobileTab === "preview" && (
                  <div className="space-y-4 text-right">
                    
                    {/* Inline preview header summary */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      <div className="border-r-4 border-amber-500 pr-2.5">
                        <h3 className="font-extrabold text-slate-800 text-xs">حتمی نتیجہ اور سرکاری رپورٹ:</h3>
                      </div>

                      {/* Manual edit of Conclusion field */}
                      <textarea
                        rows={3}
                        value={currentInquiry.inquiryConclusion || ""}
                        onChange={(e) => handleFieldChange("inquiryConclusion", e.target.value)}
                        placeholder="حتمی نتیجہ انکوائری..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800"
                      />

                      <div className="bg-amber-50 border border-amber-100 p-2 rounded-xl text-[9px] text-amber-900 font-bold text-center">
                        رپورٹ مرتب ہو کر برائے مناسب حکم ارسال خدمت ہے ۔
                      </div>

                      <button
                        onClick={handleSaveCurrentInquiry}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs py-2.5 rounded-xl shadow transition-all flex items-center justify-center gap-1.5 border border-emerald-400"
                      >
                        <Save className="w-4 h-4 text-amber-300" />
                        <span>انکوائری محفوظ کریں (Save) 💾</span>
                      </button>
                    </div>

                    {/* Fully complete preview panel */}
                    <ReportPreview 
                      data={currentInquiry}
                      onPrint={handlePrint}
                    />
                  </div>
                )}

              </div>

              {/* 4. EXECUTIVE NATIVE BOTTOM NAVIGATION BAR */}
              <div className="absolute bottom-0 inset-x-0 h-14 bg-[#0f172a] border-t border-slate-800 flex justify-around items-center px-2 shadow-2xl z-10 select-none shrink-0">
                
                {/* Tab 1: Records */}
                <button
                  onClick={() => setMobileTab("records")}
                  className={`flex flex-col items-center justify-center gap-1 w-14 transition-all cursor-pointer ${
                    mobileTab === "records" ? "text-amber-300 scale-105 font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span className="text-[8.5px] font-bold">فائلز</span>
                </button>

                {/* Tab 2: Details */}
                <button
                  onClick={() => setMobileTab("details")}
                  className={`flex flex-col items-center justify-center gap-1 w-14 transition-all cursor-pointer ${
                    mobileTab === "details" ? "text-amber-300 scale-105 font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span className="text-[8.5px] font-bold">ہیڈر معلومات</span>
                </button>

                {/* Tab 3: Statements */}
                <button
                  onClick={() => setMobileTab("statements")}
                  className={`flex flex-col items-center justify-center gap-1 w-14 transition-all cursor-pointer relative ${
                    mobileTab === "statements" ? "text-amber-300 scale-105 font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span className="text-[8.5px] font-bold">بیانات</span>
                  
                  {listeningField && (
                    <span className="absolute -top-1 right-2 w-2 h-2 bg-rose-600 rounded-full" />
                  )}
                </button>

                {/* Tab 4: Preview */}
                <button
                  onClick={() => setMobileTab("preview")}
                  className={`flex flex-col items-center justify-center gap-1 w-14 transition-all cursor-pointer ${
                    mobileTab === "preview" ? "text-amber-300 scale-105 font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[8.5px] font-bold">فائنل رپورٹ</span>
                </button>

              </div>

            </div>

          </div>

        </main>
      )}

      {/* =========================================================================
          SYSTEM FOOTER (No-print)
          ========================================================================= */}
      <footer className="bg-[#0f172a] border-t border-slate-800 py-3 mt-auto no-print text-center text-[10px] text-slate-400 font-medium">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} پولیس انکوائری رپورٹ میکر - ریجنل انویسٹی گیشن برانچ گوجرانوالہ</p>
        </div>
      </footer>

      {/* =========================================================================
          PRINT ONLY AREA: Authentic Government Stationery Format for physical print
          ========================================================================= */}
      <div className="hidden print-only text-right px-12 py-10 font-nastaliq bg-white text-black" dir="rtl" style={{ direction: 'rtl', fontSize: '15px', lineHeight: '2.2' }}>
        
        {/* Gujranwala Official Letterhead - Arrangement matches user requirements */}
        {(() => {
          const raw = currentInquiry.senderDesignation || "سینیئر سپرنٹینڈنٹ آف پولیس، ریجنل انویسٹی گیشن برانچ۔ گوجرانوالہ ریجن";
          let senderLines = [raw];
          if (raw.includes("سپرنٹنڈنٹ") || raw.includes("سپرنٹینڈنٹ")) {
            senderLines = ["سینیئر سپرنٹینڈنٹ آف پولیس", "ریجنل انویسٹی گیشن برانچ۔ گوجرانوالہ ریجن"];
          } else if (raw.includes("\n")) {
            senderLines = raw.split("\n");
          } else if (raw.includes("،")) {
            senderLines = raw.split("،").map(s => s.trim());
          } else if (raw.includes(",")) {
            senderLines = raw.split(",").map(s => s.trim());
          }

          return (
            <div className="text-right pb-4 mb-6">
              <div className="space-y-1 font-bold">
                {/* منجانب with 24 width tab alignment and font size 18px */}
                <div className="flex items-start" style={{ fontSize: '18px', lineHeight: '2' }}>
                  <span className="w-24 shrink-0 font-bold">منجانب:</span>
                  <div className="font-semibold flex-1">
                    {senderLines.map((line, index) => (
                      <p key={index}>{line}</p>
                    ))}
                  </div>
                </div>
                
                {/* بجانب with 24 width tab alignment and font size 18px */}
                <div className="flex items-start" style={{ fontSize: '18px', lineHeight: '2' }}>
                  <span className="w-24 shrink-0 font-bold">بجانب:</span>
                  <div className="font-semibold flex-1">
                    <p>{currentInquiry.recipientDesignation || "جناب ریجنل پولیس آفیسر صاحب، گوجرانوالہ"}</p>
                  </div>
                </div>

                {currentInquiry.attention && (
                  <div className="flex items-start" style={{ fontSize: '15px', lineHeight: '2' }}>
                    <span className="w-24 shrink-0"></span>
                    <p className="text-slate-800 font-bold flex-1">{currentInquiry.attention}</p>
                  </div>
                )}
              </div>
              
              {/* Number and Date fields on a SINGLE Line BELOW Attention as requested (size 15, no bottom border) */}
              <div className="flex justify-between items-center w-full pt-3 mt-2 font-bold text-[15px]">
                <p>نمبر: ____________________</p>
                <p>تاریخ: ____________________</p>
              </div>
            </div>
          );
        })()}

        {/* Title / Subject - Font size 18px */}
        <div className="mb-6 space-y-1.5">
          <p className="font-extrabold underline decoration-1 underline-offset-4" style={{ fontSize: '18px', lineHeight: '2' }}>
            عنوان : رپورٹ درخواست ازان {currentInquiry.complainantName || "_________________"}
          </p>
          {/* Blank reference line directly below Subject as requested (size 15, no bottom border) */}
          <p className="font-bold" style={{ fontSize: '15px', lineHeight: '2' }}>
            بحوالہ یاداشت نمبری: ____________________
          </p>
        </div>

        {/* Greeting (size 18px) and Standard Introduction (size 15px) */}
        <div className="mb-4">
          <p className="font-bold mb-1.5" style={{ fontSize: '18px', lineHeight: '2' }}>جنابِ عالی!</p>
          <p className="text-justify leading-loose" style={{ fontSize: '15px', lineHeight: '2.2' }}>
            تحریر ہے کہ درخواست عنوان بالا موصول ہونے پر فریقین کو طلب کر کے دریافت عمل میں لائی گئی ۔حالات اس طرح پائے گئے جو ذیل ہیں۔
          </p>
        </div>

        {/* 1. Complainant Narrative (Heading size 18px, content size 15px) */}
        <div className="mb-6 space-y-2">
          <h4 className="font-bold underline underline-offset-2" style={{ fontSize: '18px', lineHeight: '2' }}>موقف درخواست ازان :</h4>
          <p className="text-justify pr-4 leading-loose" style={{ fontSize: '15px', lineHeight: '2.2' }}>{currentInquiry.complainantStatement || "موقف درج نہیں کیا گیا۔"}</p>
        </div>

        {/* 2. Recorded Statements (بیان ازان) (Heading size 18px, content size 15px) */}
        {(() => {
          const complainantStatements = (currentInquiry.statements || []).filter(
            st => st.role === "Complainant" || st.role === "Complainant_Witness"
          );
          if (complainantStatements.length === 0) return null;
          return (
            <div className="mb-6 space-y-2">
              <h4 className="font-bold underline underline-offset-2" style={{ fontSize: '18px', lineHeight: '2' }}>بیان ازان :</h4>
              <div className="space-y-3 pr-4 border-r border-gray-400">
                {complainantStatements.map((st) => (
                  <p key={st.id} className="text-justify leading-relaxed" style={{ fontSize: '15px', lineHeight: '2.2' }}>
                    <span className="font-bold">موقف {st.role === "Complainant" ? "سائل" : "تائیدی گواہ"} ({st.personName}):</span> {st.text}
                  </p>
                ))}
              </div>
            </div>
          );
        })()}

        {/* 3. Respondent Statements (Heading size 18px, content size 15px) */}
        {(() => {
          const respondentStatements = (currentInquiry.statements || []).filter(
            st => st.role === "Respondent" || st.role === "Respondent_Witness"
          );
          if (respondentStatements.length === 0) return null;
          return (
            <div className="mb-6 space-y-2">
              <h4 className="font-bold underline underline-offset-2" style={{ fontSize: '18px', lineHeight: '2' }}>الزام علیہ درخواست کا بیان :</h4>
              <div className="space-y-3 pr-4 border-r border-gray-400">
                {respondentStatements.map((st) => (
                  <p key={st.id} className="text-justify leading-relaxed" style={{ fontSize: '15px', lineHeight: '2.2' }}>
                    <span className="font-bold">موقف الزام علیہ ({st.personName}):</span> {st.text}
                  </p>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Progress Report Section (Heading size 18px, content size 15px) */}
        {currentInquiry.showProgressReport && (
          <div className="mb-6 space-y-2">
            <h4 className="font-extrabold underline underline-offset-2" style={{ fontSize: '18px', lineHeight: '2' }}>
              {currentInquiry.progressHeading || "پراگرس رپورٹ:"}
            </h4>
            <p className="text-justify pr-4 leading-loose" style={{ fontSize: '15px', lineHeight: '2.2' }}>
              {currentInquiry.progressText || ""}
            </p>

            {/* Render uploaded progress images in the printable view as attachments if any */}
            {currentInquiry.progressImages && currentInquiry.progressImages.length > 0 && (
              <div className="grid grid-cols-2 gap-4 pt-4">
                {currentInquiry.progressImages.map((img, idx) => (
                  <div key={idx} className="border border-black p-1 rounded bg-white flex flex-col items-center">
                    <img src={img} alt={`منسلک ثبوت ${idx + 1}`} className="max-h-64 max-w-full object-contain" referrerPolicy="no-referrer" />
                    <p className="text-[10px] font-bold mt-1">منسلک ثبوت / تصویر پراگرس رپورٹ {idx + 1}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. Conclusion (Heading size 18px, content size 15px) */}
        <div className="mb-8 space-y-1.5">
          <h4 className="font-bold underline underline-offset-2" style={{ fontSize: '18px', lineHeight: '2' }}>نتیجہ انکوائری :</h4>
          <p className="text-justify pr-4 font-bold leading-loose" style={{ fontSize: '15px', lineHeight: '2.2' }}>{currentInquiry.inquiryConclusion || "نتیجہ انکوائری تفصیلی تحریر کیا جانا باقی ہے۔"}</p>
          <p className="font-bold text-black mt-2" style={{ fontSize: '15px', lineHeight: '2' }}>
            رپورٹ مرتب ہو کر برائے مناسب حکم ارسال خدمت ہے ۔
          </p>
        </div>

        {/* Signatures Footer - Extreme Left Aligned - Font size 18px */}
        <div className="mt-14 pt-8 flex justify-start font-bold border-t border-gray-300" dir="ltr" style={{ direction: 'ltr' }}>
          <div className="text-center leading-relaxed pr-12 font-extrabold" dir="rtl" style={{ direction: 'rtl', fontSize: '18px' }}>
            <p>سینیئر سپرنٹینڈنٹ آف پولیس</p>
            <p className="text-slate-800 mt-0.5" style={{ fontSize: '15px' }}>ریجنل انویسٹی گیشن برانچ۔ گوجرانوالہ ریجن</p>
          </div>
        </div>

      </div>

      {/* =========================================================================
          GOOGLE CHROME PWA INSTALL POPUP
          ========================================================================= */}
      {/* PWA / MOBILE APP INSTALL GUIDE MODAL */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[99999] font-sans animate-fadeIn no-print" dir="rtl">
          <div className="bg-white border border-slate-300 max-w-md w-full rounded-2xl overflow-hidden shadow-2xl relative text-slate-900 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-[#0b1b2b] p-4 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-500 shadow-md shrink-0 flex items-center justify-center border border-amber-400">
                  <img 
                    src={policeLogo} 
                    alt="Inquiry Report" 
                    className="w-full h-full rounded-full object-contain bg-slate-900 p-0.5" 
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.target as HTMLImageElement).src = POLICE_LOGO_BASE64; }}
                  />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white font-naskh">
                    ایپ انسٹالیشن گائیڈ (Install App)
                  </h3>
                  <p className="text-[10px] text-amber-300 font-medium">پنجاب پولیس انکوائری رپورٹ اسسٹنٹ</p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3.5 overflow-y-auto text-right text-xs">
              
              {/* Primary Direct 1-Click Install Button */}
              <button
                onClick={async () => {
                  const promptEvent = deferredPrompt || (window as any).deferredInstallPrompt;
                  if (promptEvent && typeof promptEvent.prompt === 'function') {
                    try {
                      await promptEvent.prompt();
                      const choice = await promptEvent.userChoice;
                      if (choice && choice.outcome === 'accepted') {
                        setDeferredPrompt(null);
                        (window as any).deferredInstallPrompt = null;
                        setShowInstallBanner(false);
                        setShowInstallModal(false);
                        return;
                      }
                    } catch (e) {
                      console.warn('Install prompt error:', e);
                    }
                  } else {
                    alert("اگر خودکار انسٹالیشن ڈائیلاگ اوپن نہیں ہوا، تو نیچے دیے گئے اپنے براؤزر کے طریقے پر عمل کریں۔");
                  }
                }}
                className="w-full bg-[#01875f] hover:bg-[#00704e] active:scale-95 text-white font-black py-3 px-4 rounded-xl text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 font-naskh border border-emerald-400"
              >
                <Download className="w-5 h-5 text-amber-300" />
                <span>براہِ راست انسٹال کریں (Install Directly)</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-2 text-[10px] font-bold text-slate-400">یا نیچے دیے گئے طریقے سے شامل کریں</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Instructions per device */}
              <div className="space-y-2 font-medium">
                {/* 1. Android */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 font-extrabold text-slate-900 text-xs font-naskh">
                    <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>1. اینڈرائیڈ فون (Android / Chrome):</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed pr-5">
                    کروم براؤزر کے اوپر دائیں کونے میں تین نقطوں <span className="font-bold text-slate-900 bg-slate-200 px-1 py-0.5 rounded">(⋮)</span> پر کلک کریں اور <span className="font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">"Install app"</span> یا <span className="font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">"Add to Home screen"</span> منتخب کریں۔
                  </p>
                </div>

                {/* 2. iPhone */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 font-extrabold text-slate-900 text-xs font-naskh">
                    <Smartphone className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>2. آئی فون (iPhone / Safari):</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed pr-5">
                    نیچے موجود شیئر بٹن <span className="font-bold text-slate-900 bg-slate-200 px-1 py-0.5 rounded">⎕↑</span> پر ٹیپ کریں اور نیچے اسکرول کر کے <span className="font-bold text-indigo-800 bg-indigo-100 px-1.5 py-0.5 rounded">"Add to Home Screen"</span> منتخب کریں۔
                  </p>
                </div>

                {/* 3. Computer */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 font-extrabold text-slate-900 text-xs font-naskh">
                    <Monitor className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>3. کمپیوٹر و لیپ ٹاپ (Chrome / Edge):</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed pr-5">
                    ایڈریس بار میں دائیں جانب موجود انسٹال آئیکن <span className="font-bold text-slate-900 bg-slate-200 px-1 py-0.5 rounded">⊕</span> پر کلک کریں یا براؤزر مینو سے <span className="font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded">"Install Inquiry Report"</span> پر کلک کریں۔
                  </p>
                </div>
              </div>

              {/* Offline Desktop Shortcut Download */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const currentUrl = typeof window !== "undefined" ? window.location.href : "https://inquiry-report.vercel.app/";
                    const urlContent = `[InternetShortcut]\nURL=${currentUrl}\nIconIndex=0\n`;
                    const blob = new Blob([urlContent], { type: "application/internet-shortcut" });
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.download = "Inquiry_Report_Shortcut.url";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 px-3 rounded-xl text-xs transition-all border border-slate-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-700" />
                  <span>کمپیوٹر ڈیسک ٹاپ شارٹ کٹ فائل ڈاؤن لوڈ کریں (.url)</span>
                </button>
              </div>

            </div>

            {/* Footer */}
            <div className="bg-slate-100 p-3 border-t border-slate-200 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-1.5 rounded-xl text-xs transition-all cursor-pointer border border-slate-300 shadow-2xs"
              >
                بند کریں
              </button>
            </div>

          </div>
        </div>
      )}

      {/* APP SHARE MODAL WITH QR CODE */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-sans" dir="rtl">
          <div className="bg-white border border-slate-300 max-w-lg w-full rounded-2xl overflow-hidden shadow-xl relative text-slate-900">
            
            {/* Header */}
            <div className="bg-[#0f172a] p-5 border-b border-slate-700 text-center relative text-white">
              <button 
                onClick={() => setShowShareModal(false)}
                className="absolute top-4 left-4 bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-full transition-all cursor-pointer"
                title="بند کریں"
              >
                ✕
              </button>
              
              <div className="inline-flex p-2.5 bg-white/10 border border-white/20 rounded-2xl mb-2">
                <QrIcon className="w-7 h-7 text-amber-300" />
              </div>
              
              <h3 className="text-lg font-black text-white">
                پورٹل شیئر کریں اور کیو آر کوڈ
              </h3>
              <p className="text-xs text-slate-300 mt-1 font-medium">
                پنجاب پولیس انکوائری رپورٹ پورٹل کو شیئر کرنے کے لیے لنک یا QR Code کا استعمال کریں
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 bg-slate-50">
              
              {/* QR CODE DISPLAY */}
              <div className="flex flex-col items-center justify-center bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="bg-white p-3 rounded-xl shadow-xs border-2 border-slate-800 relative group">
                  {qrDataUrl ? (
                    <img 
                      src={qrDataUrl} 
                      alt="پورٹل کیو آر کوڈ"
                      className="w-40 h-40 object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).src = POLICE_LOGO_BASE64; }}
                    />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center bg-slate-100 rounded-xl">
                      <RefreshCw className="w-6 h-6 text-slate-700 animate-spin" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-800 font-bold mt-2.5 text-center">
                  📱 اپنے موبائل کے کیمرے سے اس کوڈ کو اسکین کر کے فوراً پورٹل کھولیں
                </p>
              </div>

              {/* URL LINK COPY BOX */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 text-right">
                  پورٹل کا آفیشل ویب لنک (App URL):
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={window.location.href}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono text-left dir-ltr shadow-2xs"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2500);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border shadow-xs ${
                      copiedLink
                        ? "bg-slate-900 text-white border-slate-800"
                        : "bg-[#0f172a] hover:bg-[#1e293b] text-white border-slate-800"
                    }`}
                  >
                    {copiedLink ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-300" />}
                    <span>{copiedLink ? "کاپی ہو گیا!" : "کاپی لنک"}</span>
                  </button>
                </div>
              </div>

              {/* SHARE ACTION BUTTONS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {/* WhatsApp Share */}
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent('پنجاب پولیس انکوائری رپورٹ پورٹل:\n' + window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>واٹس ایپ پر شیئر کریں</span>
                </a>

                {/* System Native Share or Download QR */}
                {typeof navigator !== "undefined" && navigator.share ? (
                  <button
                    onClick={() => {
                      navigator.share({
                        title: 'پنجاب پولیس انکوائری رپورٹ پورٹل',
                        text: 'ریجنل انویسٹی گیشن برانچ گوجرانوالہ - انکوائری رپورٹ پورٹل',
                        url: window.location.href,
                      }).catch(() => {});
                    }}
                    className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-700" />
                    <span>موبائل پر شیئر کریں</span>
                  </button>
                ) : (
                  <a
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(window.location.href)}&format=png`}
                    target="_blank"
                    download="Police_Portal_QRCode.png"
                    className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-700" />
                    <span>کیو آر کوڈ ڈاؤن لوڈ</span>
                  </a>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-white px-5 py-3 flex justify-between items-center border-t border-slate-200">
              <span className="text-[11px] text-slate-500 font-bold">
                ریجنل انویسٹی گیشن برانچ گوجرانوالہ
              </span>
              <button
                onClick={() => setShowShareModal(false)}
                className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-300 shadow-xs"
              >
                بند کریں
              </button>
            </div>

          </div>
        </div>
      )}

      {/* SEARCH SAVED INQUIRIES QUICK MODAL */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-sans" dir="rtl">
          <div className="bg-white border border-slate-300 max-w-2xl w-full rounded-2xl overflow-hidden shadow-xl relative flex flex-col max-h-[85vh] text-slate-900">
            
            {/* Header */}
            <div className="bg-[#0f172a] p-4 border-b border-slate-700 flex justify-between items-center shrink-0 text-white">
              <div className="flex items-center gap-2.5">
                <div className="bg-white/10 p-2 rounded-xl border border-white/20">
                  <History className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    محفوظ انکوائری سرچ پورٹل
                    <span className="text-[10px] bg-slate-800 text-amber-300 px-2 py-0.5 rounded-full border border-slate-700 font-bold">
                      {inquiries.length} فائلز
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    سائل کے نام، تھانہ، تاریخ یا رپورٹ نمبر کے ذریعے تلاش کریں
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setShowSearchModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-full transition-all cursor-pointer"
                title="بند کریں"
              >
                ✕
              </button>
            </div>

            {/* Quick Actions Bar inside Modal */}
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex flex-wrap justify-between items-center gap-2 shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    handleNewInquiry();
                    setShowSearchModal(false);
                  }}
                  className="bg-[#0f172a] hover:bg-[#1e293b] text-white border border-slate-800 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition-all shadow-xs active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-300" />
                  <span>نیا ٹیمپلیٹ کھولیں</span>
                </button>

                {inquiries.length > 0 && (
                  <button
                    onClick={handleClearAllInquiries}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition-all shadow-xs active:scale-95"
                    title="تمام محفوظ انکوائریز حذف کریں"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>تمام حذف</span>
                  </button>
                )}
              </div>

              <span className="text-[11px] text-slate-700 font-bold">
                نتائج: {modalFilteredInquiries.length} انکوائریاں
              </span>
            </div>

            {/* Live Search Input Box */}
            <div className="p-3.5 bg-white border-b border-slate-200 shrink-0">
              <div className="relative">
                <input 
                  type="text"
                  autoFocus
                  placeholder="سائل کا نام، درخواست کا عنوان یا تھانہ تلاش کریں..."
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-slate-800 focus:bg-white rounded-xl px-4 py-2.5 text-xs focus:outline-none transition-all text-right font-bold text-slate-900 placeholder-slate-400 pr-9 shadow-2xs"
                />
                <History className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Scrollable Search Results List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50">
              {modalFilteredInquiries.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-1.5">
                  <FileText className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">کوئی محفوظ شدہ انکوائری رپورٹ نہیں ملی</p>
                  <p className="text-[11px] text-slate-400">براہ کرم سائل کا درست نام یا تاریخ درج کریں۔</p>
                </div>
              ) : (
                modalFilteredInquiries.map((item) => {
                  const isSelected = selectedInquiryId === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border transition-all text-right space-y-1.5 relative ${
                        isSelected 
                          ? "bg-slate-100 border-slate-800 text-slate-950 shadow-xs font-bold" 
                          : "bg-white hover:bg-slate-100 border-slate-200 text-slate-800 shadow-2xs"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="bg-slate-100 text-slate-800 text-[10px] px-2 py-0.5 rounded-md font-bold border border-slate-200">
                            {item.stationName || "تھانہ صدر گوجرانوالہ"}
                          </span>
                          <h4 className="font-bold text-xs text-slate-900 mt-1">
                            {item.complainantName ? `درخواست گزار: ${item.complainantName}` : "خالی رپورٹ"}
                          </h4>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              handleSelectInquiry(item.id);
                              setShowSearchModal(false);
                            }}
                            className="bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs px-2.5 py-1 rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3 text-amber-300" />
                            <span>کھولیں</span>
                          </button>

                          <button 
                            onClick={(e) => handleDeleteInquiry(item.id, e)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            title="حذف کریں"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {item.subjectTitle && (
                        <p className="text-[11px] text-slate-700 line-clamp-1 bg-slate-100/80 p-1.5 rounded-lg border border-slate-200 font-medium">
                          <span className="text-slate-500 font-bold">عنوان:</span> {item.subjectTitle}
                        </p>
                      )}

                      <div className="flex justify-between items-center text-[9px] text-slate-500 pt-1.5 border-t border-slate-200">
                        <span>تاریخ ریکارڈ: {item.createdAt}</span>
                        <span className="text-slate-700 font-bold">{item.districtName || "گوجرانوالہ"}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-white px-4 py-2.5 border-t border-slate-200 flex justify-between items-center shrink-0">
              <span className="text-[11px] text-slate-500 font-bold">
                ریجنل انویسٹی گیشن برانچ گوجرانوالہ
              </span>
              <button
                onClick={() => setShowSearchModal(false)}
                className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border border-slate-300 shadow-xs"
              >
                بند کریں
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          REPORT GENERATION SUCCESS MODAL POPUP
          ========================================================================= */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 font-sans animate-fadeIn no-print" dir="rtl">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-300 text-center relative space-y-4 animate-scaleUp">
            
            {/* Official Police Emblem */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-slate-900 p-0.5 border-2 border-amber-400 shadow-md flex items-center justify-center">
                  <img 
                    src={policeLogo} 
                    alt="پنجاب پولیس نشان" 
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = POLICE_LOGO_BASE64; }}
                  />
                </div>
              </div>

              <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-3 leading-snug font-naskh">
                آپ کی رپورٹ میسر ریکارڈ کے مطابق <span className="text-slate-900 font-nastaliq">عابد گورائیہ صاحب</span> تیار کر دی گئی ہے!
              </h2>
              <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed font-naskh">
                تمام قلمبند بیانات، پنسل و قلمی تحریری درخواستیں اور شواہد باضابطہ سرکاری انکوائری رپورٹ میں کامیابی سے مدون کر دیے گئے ہیں۔
              </p>
            </div>

            {/* Action Buttons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {/* 1. Read Report */}
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setMobileTab("preview");
                  const element = document.getElementById("report-preview-area");
                  if (element) element.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-[#0f172a] hover:bg-[#1e293b] active:scale-95 text-white font-bold text-xs py-2.5 px-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-800"
              >
                <BookOpen className="w-4 h-4 text-amber-300" />
                <span>رپورٹ مکمل پڑھیں</span>
              </button>

              {/* 2. Print / Save PDF */}
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setMobileTab("preview");
                  setTimeout(() => {
                    window.print();
                  }, 300);
                }}
                className="bg-white hover:bg-slate-50 active:scale-95 text-slate-800 font-bold text-xs py-2.5 px-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-300"
              >
                <Printer className="w-4 h-4 text-slate-700" />
                <span>پرنٹ / PDF</span>
              </button>

              {/* 3. Download MS Word (.doc) */}
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setMobileTab("preview");
                  const title = `رپورٹ درخواست ازاں ${currentInquiry.complainantName || "سائل"}`;
                  const docHtml = `
                    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                    <head>
                      <meta charset='utf-8'>
                      <title>${title}</title>
                      <style>
                        @page { size: A4 portrait; margin: 1in; }
                        body { font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Arial', serif; direction: rtl; text-align: right; line-height: 2.2; font-size: 14pt; }
                        p { margin-bottom: 12pt; text-align: justify; }
                      </style>
                    </head>
                    <body>
                      <p><b>منجانب:</b> ${currentInquiry.senderDesignation || "سینیئر سپرنٹنڈنٹ آف پولیس"}</p>
                      <p><b>بجانب:</b> ${currentInquiry.recipientDesignation || "جناب ریجنل پولیس آفیسر صاحب"}</p>
                      <p><b>عنوان:</b> ${title}</p>
                      <p><b>جنابِ عالی!</b></p>
                      <p>تحریر ہے کہ درخواست عنوان بالا موصول ہونے پر فریقین کو طلب کر کے دریافت عمل میں لائی گئی ۔حالات اس طرح پائے گئے جو ذیل ہیں۔</p>
                      <p><b>موقف درخواست گزار:</b> ${currentInquiry.complainantStatement || ""}</p>
                      ${(currentInquiry.factsAndFindings || []).length > 0 ? `<p><b>اہم حقائق:</b><br/>${(currentInquiry.factsAndFindings || []).join("<br/>")}</p>` : ''}
                      <p><b>نتیجہ انکوائری:</b> ${currentInquiry.inquiryConclusion || ""}</p>
                      <p>رپورٹ مرتب ہو کر برائے مناسب حکم ارسال خدمت ہے ۔</p>
                    </body>
                    </html>
                  `;
                  const blob = new Blob(['\\ufeff', docHtml], { type: 'application/msword;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Inquiry_Report_${currentInquiry.complainantName || 'Abid_Goraya'}_${Date.now()}.doc`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="bg-white hover:bg-slate-50 active:scale-95 text-slate-800 font-bold text-xs py-2.5 px-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-300"
              >
                <Download className="w-4 h-4 text-slate-700" />
                <span>ورڈ فائل (.doc)</span>
              </button>

              {/* 4. Copy Report */}
              <button
                onClick={() => {
                  const text = `منجانب: ${currentInquiry.senderDesignation || ""}\\nبجانب: ${currentInquiry.recipientDesignation || ""}\\nعنوان: رپورٹ درخواست ازاں ${currentInquiry.complainantName || "سائل"}\\n\\nجنابِ عالی!\\nتحریر ہے کہ درخواست عنوان بالا موصول ہونے پر فریقین کو طلب کر کے دریافت عمل میں لائی گئی ۔حالات اس طرح پائے گئے جو ذیل ہیں۔\\n\\nموقف درخواست گزار:\\n${currentInquiry.complainantStatement || ""}\\n\\nنتیجہ انکوائری:\\n${currentInquiry.inquiryConclusion || ""}\\n\\nرپورٹ مرتب ہو کر برائے مناسب حکم ارسال خدمت ہے ۔`;
                  navigator.clipboard.writeText(text);
                  alert("رپورٹ کامیابی سے کاپی ہو گئی!");
                  setShowSuccessModal(false);
                  setMobileTab("preview");
                }}
                className="bg-[#0f172a] hover:bg-[#1e293b] active:scale-95 text-white font-bold text-xs py-2.5 px-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-800"
              >
                <Copy className="w-4 h-4 text-amber-300" />
                <span>رپورٹ کاپی کریں</span>
              </button>
            </div>

            {/* Close Button */}
            <div className="pt-1">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium underline cursor-pointer"
              >
                بند کریں اور فارم پر جائیں
              </button>
            </div>

          </div>
        </div>
      )}

      {/* GEMINI API KEY MODAL */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 font-sans animate-fadeIn no-print" dir="rtl">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-300 space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-900 text-amber-400 rounded-lg">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 font-naskh">Google Gemini API Key سیٹنگز</h3>
                  <p className="text-[10px] text-slate-500">اے آئی اسکینر اور انکوائری رپورٹ جنریشن</p>
                </div>
              </div>
              <button
                onClick={() => { setShowApiKeyModal(false); setKeySaveMessage(null); }}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                اگر آپ کے ورسل سرور میں API Key سیٹ نہیں ہے، تو آپ اپنی ذاتی <span className="font-bold text-slate-900">Google Gemini API Key</span> یہاں درج کر سکتے ہیں۔ یہ Key آپ کے براؤزر میں محفوظ رہے گی:
              </p>
              <input
                type="password"
                value={customApiKeyInput}
                onChange={(e) => setCustomApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-slate-800 text-slate-900 font-mono text-left"
                dir="ltr"
              />
              {keySaveMessage && (
                <div className="text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 p-2 rounded-lg text-center">
                  {keySaveMessage}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("GEMINI_CUSTOM_API_KEY");
                  setCustomApiKeyInput("");
                  setKeySaveMessage("API Key حذف کر دی گئی ہے۔ اب سرور کی ڈیفالٹ Key استعمال ہو گی۔");
                }}
                className="text-xs text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-lg font-bold border border-rose-200 transition-all cursor-pointer"
              >
                ری سیٹ کریں
              </button>
              <button
                type="button"
                onClick={() => {
                  const key = customApiKeyInput.trim();
                  if (key) {
                    localStorage.setItem("GEMINI_CUSTOM_API_KEY", key);
                    setKeySaveMessage("API Key کامیابی سے محفوظ ہو گئی!");
                  } else {
                    localStorage.removeItem("GEMINI_CUSTOM_API_KEY");
                    setKeySaveMessage("خالی ہونے کی وجہ سے Key صاف کر دی گئی ہے۔");
                  }
                  setTimeout(() => {
                    setShowApiKeyModal(false);
                    setKeySaveMessage(null);
                  }, 1200);
                }}
                className="bg-[#0f172a] hover:bg-[#1e293b] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4 text-amber-300" />
                <span>محفوظ کریں</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1-CLICK INSTANT AUTO-SCAN & FULL REPORT MODAL */}
      <AutoScanReportModal
        isOpen={showAutoScanModal}
        onClose={() => setShowAutoScanModal(false)}
        onReportGenerated={handleAutoCompiledReport}
      />

      {/* TARGETED OCR SCANNER MODAL */}
      <TargetedOcrModal
        isOpen={showTargetedOcrModal}
        onClose={() => setShowTargetedOcrModal(false)}
        initialTarget={targetedOcrInitialSection}
        onApplyData={handleApplyTargetedOcrData}
      />

    </div>
  );
}
