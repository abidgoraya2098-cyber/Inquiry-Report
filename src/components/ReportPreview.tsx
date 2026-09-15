import React, { useState, useEffect } from "react";
import { Printer, Edit3, Copy, RotateCcw, Scale, Sparkles, Type, FileDown, CheckCheck } from "lucide-react";
import { InquiryData } from "../types";
import { directClientCorrectSpelling, getClientGeminiApiKey } from "../lib/gemini";
import { exportInquiryReportToWord } from "../lib/wordExport";

interface ReportPreviewProps {
  data: InquiryData;
  onPrint: () => void;
}

const ReportPreview = React.memo(function ReportPreview({ data, onPrint }: ReportPreviewProps) {
  const {
    senderDesignation = "سپرنٹنڈنٹ آف پولیس، ریجنل انویسٹی گیشن برانچ، گوجرانوالہ",
    recipientDesignation = "جناب ریجنل پولیس آفیسر صاحب، گوجرانوالہ",
    attention = "(انچارج شکایات سیل)",
    complainantName = "",
    complainantStatement = "",
    statements = [],
    inquiryConclusion = "",
    showProgressReport = false,
    progressHeading = "",
    progressText = "",
    progressImages = []
  } = data;

  const [editMode, setEditMode] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // Default font configuration: 'nastaleeq'
  const [activeFont, setActiveFont] = useState<"nastaleeq" | "naskh" | "system">("nastaleeq");

  // AI Spell Checker State
  const [isAiChecking, setIsAiChecking] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  // Helper to get formatted title
  const getSubjectTitle = () => {
    if (data.subjectTitle && data.subjectTitle.trim()) return data.subjectTitle.trim();
    return `رپورٹ درخواست ازاں ${complainantName || "_________________"}`;
  };

  // Helper to format complainant statement
  const getFormattedComplainantStatement = () => {
    if (!complainantStatement || !complainantStatement.trim()) {
      return "";
    }
    return complainantStatement.trim();
  };

  // Helper to format inquiry conclusion with authentic opening phrase
  const getFormattedConclusion = () => {
    let text = inquiryConclusion ? inquiryConclusion.trim() : "";
    if (!text) {
      return "";
    }
    text = text.replace(/رپورٹ مرتب ہو کر برائے مناسب حکم ارسال خدمت ہے[\s۔]*$/g, "").trim();
    text = text.replace(/^دوران انکوائری پیش آمدہ حالات و ملاحظہ ریکارڈ سے پایا گیا ہے کہ\s*/g, "");
    text = text.replace(/^دریافت فریقین[،,]\s*ملاحظہ ریکارڈ و بالمشافہ گفتگو سے پایا گیا ہے کہ\s*/g, "");

    return `دوران انکوائری پیش آمدہ حالات و ملاحظہ ریکارڈ سے پایا گیا ہے کہ ${text}`;
  };

  // Helper to generate the exact authentic compiled report text matching the office sketch
  const getCompiledReportText = () => {
    const stmtsText = statements && statements.length > 0
      ? statements
          .filter(st => (st.personName && st.personName.trim()) || (st.text && st.text.trim()))
          .map(st => `بیان ازاں ${st.personName || "فریق"}:-\n${st.text || ""}`)
          .join("\n\n")
      : "";

    const progressBlock = (showProgressReport && (progressHeading || progressText))
      ? `\n\n${progressHeading || "پراگرس رپورٹ:"}:-\n${progressText || ""}`
      : "";

    const complainantSummaryBlock = getFormattedComplainantStatement()
      ? `خلاصہ درخواست ازاں ${complainantName || "سائل"}:-\n${getFormattedComplainantStatement()}`
      : "";

    const middleSections = [complainantSummaryBlock, stmtsText, progressBlock.trim()]
      .filter(Boolean)
      .join("\n\n");

    return `منجانب:    سپرنٹنڈنٹ آف پولیس
          ریجنل انویسٹی گیشن برانچ، گوجرانوالہ
بجانب:    ${recipientDesignation || "جناب ریجنل پولیس آفیسر صاحب، گوجرانوالہ"}
${attention ? `توجہ:     ${attention}\n` : ""}نمبر: ____________                 تاریخ: ____________

عنوان:-   ${getSubjectTitle()}
بحوالہ یادداشت نمبر ${data.referenceNumber || "_________________"} مورخہ ${data.referenceDate || "_________________"}

جناب عالی!
تحریر ہے کہ درخواست عنوان بالا موصول ہونے پر فریقین کو طلب کر کے دریافت عمل میں لائی گئی۔ حالات اس طرح پائے گئے ہیں۔

${middleSections}

نتیجہ انکوائری:-
${getFormattedConclusion()}

رپورٹ مرتب ہو کر برائے مناسب حکم ارسال خدمت ہے۔


                              سپرنٹنڈنٹ آف پولیس
                        ریجنل انویسٹی گیشن برانچ، گوجرانوالہ`;
  };

  useEffect(() => {
    setEditedText(getCompiledReportText());
  }, [data, editMode]);

  const handleCopy = () => {
    const textToCopy = editMode ? editedText : getCompiledReportText();
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleDownloadWord = () => {
    exportInquiryReportToWord(data, editMode ? editedText : undefined);
  };

  const handleReset = () => {
    if (confirm("کیا آپ ایڈیٹ کی ہوئی رپورٹ کو اصل فیلڈز کے مطابق ری سیٹ کرنا چاہتے ہیں؟")) {
      setEditedText(getCompiledReportText());
      setAiMessage(null);
    }
  };

  // AI Spell Check and Proofreading
  const handleAiSpellCheck = async () => {
    setIsAiChecking(true);
    setAiMessage(null);
    try {
      const textToCorrect = editMode ? editedText : getCompiledReportText();
      const customKey = getClientGeminiApiKey();
      let corrected = "";

      // 1. Try server endpoint
      try {
        const response = await fetch("/api/correct-spelling", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(customKey ? { "x-gemini-api-key": customKey } : {})
          },
          body: JSON.stringify({ 
            text: textToCorrect,
            apiKey: customKey || undefined
          })
        });

        if (response.ok) {
          const resData = await response.json();
          if (resData.correctedText) {
            corrected = resData.correctedText;
          }
        }
      } catch (serverErr) {
        console.warn("Server spell check notice:", serverErr);
      }

      // 2. Direct client fallback
      if (!corrected) {
        corrected = await directClientCorrectSpelling(textToCorrect, customKey);
      }

      if (corrected) {
        setEditedText(corrected);
        setEditMode(true);
        setAiMessage("کامیابی! اے آئی نے املا اور گرامر کی تمام غلطیاں درست کر دی ہیں۔");
      }
    } catch (error: any) {
      console.error(error);
      alert("املا درست کرنے میں خرابی پیش آئی: " + error.message);
    } finally {
      setIsAiChecking(false);
    }
  };

  const getFontClass = () => {
    if (activeFont === "nastaleeq") return "font-nastaliq leading-[1.25] tracking-normal";
    if (activeFont === "naskh") return "font-naskh leading-normal";
    return "font-system leading-normal";
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 sm:p-5 flex flex-col h-full space-y-3 no-print" id="report-preview-area">
      
      {/* Header Controls */}
      <div className="border-b border-slate-100 pb-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-slate-800" />
            <span>رپورٹ کا باضابطہ پرنٹ ریویو (Official Office Layout)</span>
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">بمطابق مہر و طریقہ کار ریجنل انویسٹی گیشن برانچ گوجرانوالہ</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* Font Selector Tool */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setActiveFont("system")}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${activeFont === "system" ? "bg-slate-900 text-white shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"}`}
              title="سادہ لکھائی"
            >
              سادہ
            </button>
            <button
              type="button"
              onClick={() => setActiveFont("naskh")}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${activeFont === "naskh" ? "bg-slate-900 text-white shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"}`}
              title="نسخ لکھائی"
            >
              نسخ
            </button>
            <button
              type="button"
              onClick={() => setActiveFont("nastaleeq")}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${activeFont === "nastaleeq" ? "bg-slate-900 text-white shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"}`}
              title="نوری نستعلیق لکھائی"
            >
              نستعلیق
            </button>
            <span className="px-1.5 text-slate-400 flex items-center gap-0.5">
              <Type className="w-3 h-3" />
            </span>
          </div>

          {/* Toggle Edit Mode */}
          <button
            type="button"
            onClick={() => setEditMode(!editMode)}
            className={`text-xs px-2.5 py-1.5 rounded-lg font-bold shadow-xs border transition-all flex items-center gap-1 cursor-pointer ${
              editMode 
                ? "bg-slate-900 text-white border-slate-900" 
                : "bg-white text-slate-700 hover:bg-slate-50 border-slate-300"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{editMode ? "دستاویز فارمیٹ" : "براہِ راست ترمیم"}</span>
          </button>

          {/* Word Download Button */}
          <button
            type="button"
            onClick={handleDownloadWord}
            className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs px-3 py-1.5 rounded-lg font-bold shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            title="ایم ایس ورڈ میں ڈاؤن لوڈ کریں"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-700" />
            <span>ورڈ فائل (.doc)</span>
          </button>

          {/* Print Button */}
          <button
            type="button"
            onClick={onPrint}
            className="bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs px-3 py-1.5 rounded-lg font-bold shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            title="پرنٹ یا پی ڈی ایف سیو کریں"
          >
            <Printer className="w-3.5 h-3.5 text-amber-300" />
            <span>پرنٹ / PDF</span>
          </button>
        </div>
      </div>

      {/* AI Assistance spelling box */}
      <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <div className="text-right">
            <p className="text-[11px] font-bold text-slate-900">مکمل اے آئی املا و گرامر درستگی سپورٹ</p>
            <p className="text-[9px] text-slate-500">کاپی کرنے یا کنورٹ کرنے سے پہلے املا کی تمام غلطیوں کی خودکار اصلاح کریں</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAiSpellCheck}
          disabled={isAiChecking}
          className={`text-[10px] px-3 py-1.5 rounded-lg font-bold shadow-xs border transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
            isAiChecking
              ? "bg-slate-200 text-slate-400 cursor-not-allowed border-slate-300"
              : "bg-[#0f172a] hover:bg-[#1e293b] text-white border-slate-800"
          }`}
        >
          {isAiChecking ? (
            <>
              <RotateCcw className="w-3 h-3 animate-spin text-amber-300" />
              <span>املا کی اصلاح ہو رہی ہے...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>املا درست کریں (سو فیصد تصحیح)</span>
            </>
          )}
        </button>
      </div>

      {aiMessage && (
        <div className="bg-slate-100 text-slate-900 border border-slate-200 text-[10px] font-bold p-2 rounded-lg text-center">
          {aiMessage}
        </div>
      )}

      {/* Main Body preview of document sheet */}
      {editMode ? (
        <div className="flex-1 flex flex-col space-y-2">
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold bg-slate-100 border border-slate-200 p-2 rounded-lg">
            <span>رپورٹ کے حتمی متن میں براہِ راست ترمیم کریں:</span>
            <button 
              type="button"
              onClick={handleReset}
              className="text-slate-700 hover:text-rose-700 flex items-center gap-0.5 font-sans cursor-pointer"
              title="رپورٹ کو ری سیٹ کریں"
            >
              <RotateCcw className="w-3 h-3" />
              <span>ری سیٹ کریں</span>
            </button>
          </div>
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="w-full flex-1 min-h-[420px] bg-slate-50 border border-slate-300 rounded-lg p-4 text-xs font-semibold leading-normal text-right text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
            dir="rtl"
            style={{ fontFamily: activeFont === "nastaleeq" ? "Noto Nastaliq Urdu" : activeFont === "naskh" ? "Noto Naskh Urdu" : "inherit" }}
          />
        </div>
      ) : (
        <div 
          className={`flex-1 bg-white border border-slate-300 rounded-xl p-5 sm:p-8 shadow-xs text-slate-950 select-text ${getFontClass()}`}
          dir="rtl"
        >
          {/* Official Letterhead Header */}
          <div className="pb-2 text-sm sm:text-base font-bold">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-0.5">
                <div className="flex items-start gap-2">
                  <span className="shrink-0 font-bold text-slate-950">منجانب:</span>
                  <div>
                    <p className="font-bold text-slate-950">سپرنٹنڈنٹ آف پولیس</p>
                    <p className="font-bold text-slate-900">ریجنل انویسٹی گیشن برانچ، گوجرانوالہ</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 pt-0.5">
                  <span className="shrink-0 font-bold text-slate-950">بجانب:</span>
                  <p className="font-bold text-slate-900">{recipientDesignation || "جناب ریجنل پولیس آفیسر صاحب، گوجرانوالہ"}</p>
                </div>
                {attention && (
                  <div className="flex items-start gap-2 pt-0.5">
                    <span className="shrink-0 font-bold text-slate-950">توجہ:</span>
                    <p className="font-bold text-slate-800">{attention}</p>
                  </div>
                )}
              </div>
              <div className="text-right text-xs sm:text-sm text-slate-900 space-y-0.5 shrink-0 font-bold">
                <p>نمبر: ____________</p>
                <p>تاریخ: ____________</p>
              </div>
            </div>
          </div>

          {/* Subject & Reference in ONE clean block under Title */}
          <div className="pt-2 font-bold text-sm sm:text-base">
            <p className="text-slate-950 font-bold">
              عنوان:- {getSubjectTitle()}
            </p>
            <p className="text-slate-900 text-xs sm:text-sm font-semibold mt-0.5">
              بحوالہ یادداشت نمبر {data.referenceNumber || "_________________"} مورخہ {data.referenceDate || "_________________"}
            </p>
          </div>

          {/* Formal Salutation & Intro */}
          <div className="pt-2 text-sm sm:text-base leading-normal">
            <p className="font-bold text-slate-950">جناب عالی!</p>
            <p className="text-justify font-normal text-slate-950 leading-normal mt-0.5">
              تحریر ہے کہ درخواست عنوان بالا موصول ہونے پر فریقین کو طلب کر کے دریافت عمل میں لائی گئی۔ حالات اس طرح پائے گئے ہیں۔
            </p>
          </div>

          {/* Complainant Narrative */}
          {getFormattedComplainantStatement() && (
            <div className="pt-2 text-sm sm:text-base leading-normal">
              <p className="font-bold text-slate-950">
                خلاصہ درخواست ازاں {complainantName || "سائل"}:-
              </p>
              <p className="text-justify font-normal text-slate-950 whitespace-pre-wrap leading-normal mt-0.5">
                {getFormattedComplainantStatement()}
              </p>
            </div>
          )}

          {/* Statements */}
          {statements && statements.length > 0 && (
            <div className="text-sm sm:text-base leading-normal">
              {statements
                .filter(st => (st.personName && st.personName.trim()) || (st.text && st.text.trim()))
                .map((st) => (
                  <div key={st.id} className="pt-2">
                    <p className="font-bold text-slate-950">
                      بیان ازاں {st.personName || "فریق"}:-
                    </p>
                    <p className="text-justify font-normal text-slate-950 whitespace-pre-wrap leading-normal mt-0.5">
                      {st.text}
                    </p>
                  </div>
                ))}
            </div>
          )}

          {/* Progress Report (only if checked and has content) */}
          {showProgressReport && (progressHeading || progressText) && (
            <div className="pt-2 text-sm sm:text-base leading-normal">
              <p className="font-bold text-slate-950">
                {progressHeading || "پراگرس رپورٹ:"}:-
              </p>
              <p className="text-justify font-normal text-slate-950 whitespace-pre-wrap leading-normal mt-0.5">
                {progressText}
              </p>

              {/* Progress Images */}
              {progressImages && progressImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                  {progressImages.map((img, idx) => (
                    <div key={idx} className="border border-slate-300 rounded-lg overflow-hidden p-1 bg-white">
                      <img src={img} alt={`Progress ${idx + 1}`} className="w-full h-24 object-contain" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Final Conclusion (NO BOX, NO BORDER, NO FILLER) */}
          {inquiryConclusion && (
            <div className="pt-2 text-sm sm:text-base leading-normal">
              <p className="font-bold text-slate-950">نتیجہ انکوائری:-</p>
              <p className="text-justify font-normal text-slate-950 whitespace-pre-wrap leading-normal mt-0.5">
                {getFormattedConclusion()}
              </p>
              <p className="font-bold text-slate-950 pt-3 text-center">
                رپورٹ مرتب ہو کر برائے مناسب حکم ارسال خدمت ہے۔
              </p>
            </div>
          )}

          {/* Official Stamp */}
          <div className="pt-6 flex justify-start mt-4" dir="ltr" style={{ direction: 'ltr' }}>
            <div className="text-center font-bold text-slate-950 leading-tight pr-6" dir="rtl" style={{ direction: 'rtl' }}>
              <p className="text-base font-bold">سپرنٹنڈنٹ آف پولیس</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">ریجنل انویسٹی گیشن برانچ، گوجرانوالہ</p>
            </div>
          </div>
        </div>
      )}

      {/* ACTION BUTTONS BAR */}
      <div className="pt-2.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className={`py-2.5 px-3 rounded-xl font-extrabold text-xs shadow-sm transition-all flex items-center justify-center gap-2 border cursor-pointer ${
            isCopied
              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
              : "bg-emerald-950 text-white hover:bg-slate-900 border-emerald-900"
          }`}
          title="مکمل تیار شدہ رپورٹ کاپی کریں"
        >
          {isCopied ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-amber-400" />}
          <span>{isCopied ? "رپورٹ کاپی ہو گئی!" : "مکمل رپورٹ کاپی کریں"}</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadWord}
          className="bg-indigo-900 hover:bg-indigo-800 text-white py-2.5 px-3 rounded-xl font-extrabold text-xs shadow-sm transition-all flex items-center justify-center gap-2 border border-indigo-700 cursor-pointer"
          title="ایم ایس ورڈ فائل ڈاؤن لوڈ کریں"
        >
          <FileDown className="w-4 h-4 text-indigo-300" />
          <span>ایم ایس ورڈ ڈاؤن لوڈ (.doc)</span>
        </button>
      </div>

    </div>
  );
});

export default ReportPreview;
