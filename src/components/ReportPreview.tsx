import React, { useState, useEffect, useCallback } from "react";
import { Printer, Edit3, Copy, Check, RotateCcw, Scale, Sparkles, Type, Download, FileDown, CheckCheck } from "lucide-react";
import { InquiryData } from "../types";
import { directClientCorrectSpelling, getClientGeminiApiKey } from "../lib/gemini";
import { exportInquiryReportToWord } from "../lib/wordExport";

interface ReportPreviewProps {
  data: InquiryData;
  onPrint: () => void;
}

const ReportPreview = React.memo(function ReportPreview({ data, onPrint }: ReportPreviewProps) {
  const {
    senderDesignation = "سینیئر سپرنٹنڈنٹ آف پولیس، ریجنل انویسٹی گیشن برانچ، گوجرانوالہ",
    recipientDesignation = "جناب ریجنل پولیس آفیسر صاحب، گوجرانوالہ",
    attention = "توجہ: انچارج شکایت سیل",
    complainantName = "",
    complainantStatement = "",
    statements = [],
    inquiryConclusion = "",
    factsAndFindings = [],
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
    if (data.subjectTitle) return data.subjectTitle;
    return `رپورٹ درخواست ازاں ${complainantName || "_________________"}`;
  };

  // Helper to format complainant statement with "گزارش ہے کہ سائل"
  const getFormattedComplainantStatement = () => {
    if (!complainantStatement || !complainantStatement.trim()) {
      return "گزارش ہے کہ سائل کا موقف درج کرنا ابھی باقی ہے۔";
    }
    const trimmed = complainantStatement.trim();
    if (trimmed.startsWith("گزارش ہے کہ سائل") || trimmed.startsWith("گزارش ہے کہ سائلہ") || trimmed.startsWith("گزارش ہے کہ")) {
      return trimmed;
    }
    return `گزارش ہے کہ سائل ${trimmed}`;
  };

  // Helper to format inquiry conclusion with required opening phrase
  const getFormattedConclusion = () => {
    let text = inquiryConclusion ? inquiryConclusion.trim() : "";
    if (!text) {
      return "دریافت فریقین، ملاحظہ ریکارڈ و بالمشافہ گفتگو سے پایا گیا ہے کہ نتیجہ انکوائری تفصیلی تحریر کیا جانا باقی ہے۔";
    }
    text = text.replace(/رپورٹ مرتب ہو کر برائے مناسب حکم ارسال خدمت ہے[\s۔]*$/g, "").trim();
    text = text.replace(/^دوران انکوائری پیش آمدہ حالات و ملاحظہ ریکارڈ سے پایا گیا ہے کہ\s*/g, "");
    text = text.replace(/^دریافت فریقین[،,]\s*ملاحظہ ریکارڈ و بالمشافہ گفتگو سے پایا گیا ہے کہ\s*/g, "");

    return `دریافت فریقین، ملاحظہ ریکارڈ و بالمشافہ گفتگو سے پایا گیا ہے کہ ${text}`;
  };

  // Helper to generate the default compiled report text
  const getCompiledReportText = () => {
    const complainantStatements = statements.filter(
      st => st.role === "Complainant" || st.role === "Complainant_Witness"
    );
    
    const respondentStatements = statements.filter(
      st => st.role === "Respondent" || st.role === "Respondent_Witness"
    );

    const complainantBlock = complainantStatements.length > 0
      ? complainantStatements.map((st) => {
          return `بیان ازاں مسمی / مسمات ${st.personName} (مکمل نام، ولدیت و سکونت/پتہ) :\n\t\tبیان کیا ہے کہ ${st.text}`;
        }).join("\n\n")
      : "کوئی بیان درج نہیں کیا گیا۔";

    const respondentBlock = respondentStatements.length > 0
      ? respondentStatements.map((st) => {
          return `بیان ازاں مسمی / مسمات ${st.personName} (مکمل نام، ولدیت و سکونت/پتہ) :\n\t\tبیان کیا ہے کہ ${st.text}`;
        }).join("\n\n")
      : "کوئی بیان درج نہیں کیا گیا۔";

    const findingsBlock = factsAndFindings && factsAndFindings.length > 0
      ? `\n\nدورانِ انکوائری سامنے آنے والے اہم حقائق و امور :\n${factsAndFindings.join("\n")}`
      : "";

    const progressBlock = showProgressReport
      ? `\n\n${progressHeading || "پراگرس رپورٹ:"}\n${progressText || "تفتیش مقدمہ جاری ہے۔"}`
      : "";

    return `منجانب: ${senderDesignation}
بجانب: ${recipientDesignation}
${attention ? `توجہ: ${attention}\n` : ""}نمبر: ____________                 تاریخ: ____________

عنوان : ${getSubjectTitle()}
بحوالہ یاداشت نمبری: ______________

جنابِ عالی!
تحریر ہے کہ درخواست عنوان بالا موصول ہونے پر فریقین کو طلب کر کے دریافت عمل میں لائی گئی ۔حالات اس طرح پائے گئے جو ذیل ہیں۔

موقف درخواست گزار :
${getFormattedComplainantStatement()}

بیان ازان :
${complainantBlock}

الزام علیہ درخواست کا بیان :
${respondentBlock}${findingsBlock}${progressBlock}

نتیجہ انکوائری :
${getFormattedConclusion()}

رپورٹ مرتب ہو کر برائے مناسب حکم ارسال خدمت ہے ۔

                                                               سینیئر سپرنٹنڈنٹ آف پولیس
                                                               ریجنل انویسٹی گیشن برانچ گوجرانوالہ ریجن`;
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

  const complainantStatements = statements.filter(
    st => st.role === "Complainant" || st.role === "Complainant_Witness"
  );
  const respondentStatements = statements.filter(
    st => st.role === "Respondent" || st.role === "Respondent_Witness"
  );

  const getSenderLines = () => {
    const raw = senderDesignation || "سینیئر سپرنٹنڈنٹ آف پولیس، ریجنل انویسٹی گیشن برانچ۔ گوجرانوالہ ریجن";
    if (raw.includes("سپرنٹنڈنٹ") || raw.includes("سپرنٹینڈنٹ")) {
      return ["سینیئر سپرنٹنڈنٹ آف پولیس", "ریجنل انویسٹی گیشن برانچ۔ گوجرانوالہ ریجن"];
    }
    if (raw.includes("\n")) {
      return raw.split("\n");
    }
    if (raw.includes("،")) {
      return raw.split("،").map(s => s.trim());
    }
    if (raw.includes(",")) {
      return raw.split(",").map(s => s.trim());
    }
    return [raw];
  };

  const getFontClass = () => {
    if (activeFont === "nastaleeq") return "font-nastaliq leading-[2.2]";
    if (activeFont === "naskh") return "font-naskh leading-relaxed";
    return "font-system leading-relaxed";
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 sm:p-5 flex flex-col h-full space-y-4 no-print" id="report-preview-area">
      
      {/* Header Controls */}
      <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-slate-800" />
            <span>رپورٹ کا فائنل پرنٹ ریویو (Final Document Review)</span>
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">باضابطہ نقشہ بمطابق مہر سرکاری و قواعدِ پولیس</p>
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
      <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
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
            className="w-full flex-1 min-h-[400px] bg-slate-50 border border-slate-300 rounded-lg p-4 text-xs font-semibold leading-relaxed text-right text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
            dir="rtl"
            style={{ fontFamily: activeFont === "nastaleeq" ? "Noto Nastaliq Urdu" : activeFont === "naskh" ? "Noto Naskh Urdu" : "inherit" }}
          />
        </div>
      ) : (
        <div 
          className={`flex-1 bg-white border border-slate-300 rounded-xl p-6 sm:p-10 shadow-xs space-y-6 text-slate-950 font-naskh select-text ${getFontClass()}`}
          dir="rtl"
        >
          {/* Official Letterhead Header */}
          <div className="space-y-1.5 pb-4 border-b-2 border-slate-300 text-sm sm:text-base font-bold">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-0.5">
                <p className="font-extrabold text-slate-900">منجانب: {senderDesignation}</p>
                <p className="font-bold text-slate-800">بجانب: {recipientDesignation}</p>
                {attention && <p className="font-semibold text-slate-700">{attention}</p>}
              </div>
              <div className="text-left font-sans text-xs text-slate-600 space-y-1 shrink-0" dir="ltr">
                <p>No: ______________</p>
                <p>Dated: ____________</p>
              </div>
            </div>
          </div>

          {/* Subject & Reference */}
          <div className="space-y-1 font-bold text-sm sm:text-base">
            <p className="text-slate-950 font-extrabold flex items-baseline gap-2">
              <span className="shrink-0">عنوان :</span>
              <span className="underline underline-offset-4 decoration-slate-400">{getSubjectTitle()}</span>
            </p>
            <p className="text-slate-600 text-xs sm:text-sm">
              بحوالہ یاداشت نمبری: ______________
            </p>
          </div>

          {/* Formal Salutation & Intro */}
          <div className="space-y-2 text-sm sm:text-base leading-relaxed">
            <p className="font-extrabold text-slate-900">جنابِ عالی!</p>
            <p className="text-justify font-medium text-slate-800">
              تحریر ہے کہ درخواست عنوان بالا موصول ہونے پر فریقین کو طلب کر کے دریافت عمل میں لائی گئی ۔حالات اس طرح پائے گئے جو ذیل ہیں۔
            </p>
          </div>

          {/* Complainant Narrative */}
          <div className="space-y-1 text-sm sm:text-base leading-relaxed">
            <p className="font-extrabold text-slate-900 underline underline-offset-2">موقف درخواست گزار :</p>
            <p className="text-justify font-medium text-slate-800 whitespace-pre-wrap">
              {getFormattedComplainantStatement()}
            </p>
          </div>

          {/* Complainant & Witness Statements */}
          <div className="space-y-3 text-sm sm:text-base leading-relaxed">
            <p className="font-extrabold text-slate-900 underline underline-offset-2">بیان ازان :</p>
            {complainantStatements.length === 0 ? (
              <p className="text-slate-400 italic text-xs">کوئی بیان درج نہیں کیا گیا ۔</p>
            ) : (
              complainantStatements.map((st) => (
                <div key={st.id} className="space-y-1 pr-2 border-r-2 border-slate-300">
                  <p className="font-bold text-slate-900">
                    بیان ازاں مسمی / مسمات <span className="font-extrabold underline">{st.personName || "_________________"}</span> (مکمل نام، ولدیت و سکونت/پتہ) :
                  </p>
                  <p className="text-justify font-medium text-slate-800 pl-4 whitespace-pre-wrap">
                    بیان کیا ہے کہ {st.text}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Respondent Statements */}
          <div className="space-y-3 text-sm sm:text-base leading-relaxed">
            <p className="font-extrabold text-slate-900 underline underline-offset-2">الزام علیہ درخواست کا بیان :</p>
            {respondentStatements.length === 0 ? (
              <p className="text-slate-400 italic text-xs">کوئی بیان درج نہیں کیا گیا ۔</p>
            ) : (
              respondentStatements.map((st) => (
                <div key={st.id} className="space-y-1 pr-2 border-r-2 border-slate-300">
                  <p className="font-bold text-slate-900">
                    بیان ازاں مسمی / مسمات <span className="font-extrabold underline">{st.personName || "_________________"}</span> (مکمل نام، ولدیت و سکونت/پتہ) :
                  </p>
                  <p className="text-justify font-medium text-slate-800 pl-4 whitespace-pre-wrap">
                    بیان کیا ہے کہ {st.text}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Facts & Findings (if any) */}
          {factsAndFindings && factsAndFindings.length > 0 && (
            <div className="space-y-2 text-sm sm:text-base leading-relaxed">
              <p className="font-extrabold text-slate-900 underline underline-offset-2">دورانِ انکوائری سامنے آنے والے اہم حقائق و امور :</p>
              <ul className="list-disc list-inside space-y-1 text-slate-800 pr-2">
                {factsAndFindings.map((finding, idx) => (
                  <li key={idx} className="text-justify">{finding}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Progress Report (if checked) */}
          {showProgressReport && (
            <div className="space-y-2 text-sm sm:text-base leading-relaxed">
              <p className="font-extrabold text-slate-900 underline underline-offset-2">
                {progressHeading || "پراگرس رپورٹ:"}
              </p>
              <p className="text-justify font-medium text-slate-800 whitespace-pre-wrap">
                {progressText || "تفتیش مقدمہ جاری ہے۔"}
              </p>

              {/* Display Progress Images in Print Sheet */}
              {progressImages && progressImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  {progressImages.map((img, idx) => (
                    <div key={idx} className="border border-slate-300 rounded-lg overflow-hidden p-1 bg-white">
                      <img src={img} alt={`Progress ${idx + 1}`} className="w-full h-28 object-contain" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Final Conclusion */}
          <div className="space-y-2 pt-2 text-sm sm:text-base leading-relaxed border-t border-slate-200">
            <p className="font-extrabold text-slate-900 underline underline-offset-2">نتیجہ انکوائری :</p>
            <p className="text-justify font-medium text-slate-800 whitespace-pre-wrap">
              {getFormattedConclusion()}
            </p>
            <p className="font-bold text-slate-900 pt-2">
              رپورٹ مرتب ہو کر برائے مناسب حکم ارسال خدمت ہے ۔
            </p>
          </div>

          {/* Official Stamp */}
          <div className="pt-8 flex justify-start mt-12 border-t border-slate-200" dir="ltr" style={{ direction: 'ltr' }}>
            <div className="text-center font-extrabold text-slate-900 leading-relaxed pr-12" dir="rtl" style={{ direction: 'rtl', fontSize: '18px' }}>
              <p className="font-bold">سینیئر سپرنٹنڈنٹ آف پولیس</p>
              <p className="text-slate-700 mt-0.5" style={{ fontSize: '15px' }}>ریجنل انویسٹی گیشن برانچ۔ گوجرانوالہ ریجن</p>
            </div>
          </div>
        </div>
      )}

      {/* ACTION BUTTONS BAR */}
      <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2">
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
