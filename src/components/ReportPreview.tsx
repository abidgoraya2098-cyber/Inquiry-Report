import React, { useState, useEffect, useCallback } from "react";
import { Printer, Edit3, Copy, Check, RotateCcw, Scale, Sparkles, Type, Download, FileDown, CheckCheck } from "lucide-react";
import { InquiryData } from "../types";

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
    const title = getSubjectTitle().replace(/[/\\?%*:|"<>]/g, '_');
    const content = editMode ? editedText : getCompiledReportText();
    
    // Create Microsoft Word HTML document with RTL Urdu styling
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${title}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 1in;
          }
          body {
            font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Arial', serif;
            direction: rtl;
            text-align: right;
            line-height: 2.2;
            font-size: 14pt;
            color: #000000;
          }
          h1, h2, h3, h4 {
            font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Arial', serif;
            margin-bottom: 8pt;
          }
          p {
            margin-bottom: 12pt;
            line-height: 2.2;
            text-align: justify;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15pt;
          }
          .signature-area {
            margin-top: 40pt;
            text-align: left;
            direction: ltr;
          }
          .stamp-box {
            display: inline-block;
            text-align: center;
            direction: rtl;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <pre style="font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Arial', serif; white-space: pre-wrap; word-wrap: break-word; font-size: 14pt; line-height: 2.2; direction: rtl; text-align: right;">${content}</pre>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Inquiry_Report_${complainantName || 'Abid_Goraya'}_${Date.now()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
      const response = await fetch("/api/correct-spelling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToCorrect })
      });

      if (!response.ok) {
        throw new Error("سرور سے رابطہ ناکام رہا۔");
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("سرور سے درست جواب موصول نہیں ہوا۔");
      }

      const resData = await response.json();
      if (resData.correctedText) {
        setEditedText(resData.correctedText);
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
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4 sm:p-6 flex flex-col h-full space-y-4 no-print" id="report-preview-area">
      
      {/* Header Controls */}
      <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-emerald-800" />
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
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${activeFont === "system" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"}`}
              title="سادہ لکھائی"
            >
              سادہ
            </button>
            <button
              type="button"
              onClick={() => setActiveFont("naskh")}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${activeFont === "naskh" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"}`}
              title="نسخ لکھائی"
            >
              نسخ
            </button>
            <button
              type="button"
              onClick={() => setActiveFont("nastaleeq")}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${activeFont === "nastaleeq" ? "bg-emerald-850 text-white shadow-xs" : "text-slate-500 hover:text-slate-900"}`}
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
                ? "bg-amber-100 text-amber-800 border-amber-300" 
                : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{editMode ? "دستاویز فارمیٹ" : "براہِ راست ترمیم"}</span>
          </button>

          {/* Word Download Button */}
          <button
            type="button"
            onClick={handleDownloadWord}
            className="bg-indigo-900 hover:bg-indigo-800 text-white text-xs px-3 py-1.5 rounded-lg font-bold shadow transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            title="ایم ایس ورڈ میں ڈاؤن لوڈ کریں"
          >
            <FileDown className="w-3.5 h-3.5 text-indigo-300" />
            <span>ورڈ فائل (.doc)</span>
          </button>

          {/* Print Button */}
          <button
            type="button"
            onClick={onPrint}
            className="bg-emerald-950 hover:bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg font-bold shadow transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            title="پرنٹ یا پی ڈی ایف سیو کریں"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>پرنٹ / PDF</span>
          </button>
        </div>
      </div>

      {/* AI Assistance spelling box */}
      <div className="bg-emerald-50/50 border border-emerald-100/80 p-3 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <div className="text-right">
            <p className="text-[11px] font-extrabold text-emerald-950">مکمل اے آئی املا و گرامر درستگی سپورٹ</p>
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
              : "bg-emerald-800 text-white hover:bg-emerald-900 border-emerald-700"
          }`}
        >
          {isAiChecking ? (
            <>
              <RotateCcw className="w-3 h-3 animate-spin" />
              <span>املا کی اصلاح ہو رہی ہے...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>املا درست کریں (سو فیصد تصحیح)</span>
            </>
          )}
        </button>
      </div>

      {aiMessage && (
        <div className="bg-emerald-100 text-emerald-900 border border-emerald-200 text-[10px] font-bold p-2 rounded-lg text-center">
          {aiMessage}
        </div>
      )}

      {/* Main Body preview of document sheet */}
      {editMode ? (
        <div className="flex-1 flex flex-col space-y-2">
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold bg-amber-50 border border-amber-200/60 p-2 rounded-lg">
            <span>رپورٹ کے حتمی متن میں براہِ راست ترمیم کریں:</span>
            <button 
              type="button"
              onClick={handleReset}
              className="text-amber-800 hover:text-rose-700 flex items-center gap-0.5 font-sans cursor-pointer"
              title="رپورٹ کو ری سیٹ کریں"
            >
              <RotateCcw className="w-3 h-3" />
              <span>ری سیٹ کریں</span>
            </button>
          </div>
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="w-full flex-1 min-h-[400px] bg-slate-50 border border-slate-300 rounded-lg p-4 text-xs font-semibold leading-relaxed text-right text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-800"
            dir="rtl"
            style={{ fontFamily: activeFont === "nastaleeq" ? "Noto Nastaliq Urdu" : activeFont === "naskh" ? "Noto Naskh Urdu" : "inherit" }}
          />
        </div>
      ) : (
        /* Sheet of Paper Web Preview */
        <div 
          className={`flex-1 bg-amber-50/10 border border-slate-200 rounded-lg p-6 sm:p-8 overflow-y-auto max-h-[500px] text-right text-black shadow-inner space-y-5 ${getFontClass()}`} 
          dir="rtl"
        >
          {/* Document Header */}
          <div className="pb-3 space-y-2 text-right">
            <div className="space-y-1 font-bold">
              <div className="flex items-start" style={{ fontSize: '18px', lineHeight: '2' }}>
                <span className="w-24 shrink-0 font-bold">منجانب:</span>
                <div className="font-semibold flex-1">
                  {getSenderLines().map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
              </div>

              <div className="flex items-start" style={{ fontSize: '18px', lineHeight: '2' }}>
                <span className="w-24 shrink-0 font-bold">بجانب:</span>
                <div className="font-semibold flex-1">
                  <p>{recipientDesignation}</p>
                </div>
              </div>

              {attention && (
                <div className="flex items-start" style={{ fontSize: '15px', lineHeight: '2' }}>
                  <span className="w-24 shrink-0"></span>
                  <p className="text-slate-700 font-bold flex-1">{attention}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center w-full pt-3 mt-2 font-bold text-slate-700" style={{ fontSize: '15px' }}>
              <p>نمبر: <span className="font-semibold">____________________</span></p>
              <p>تاریخ: <span className="font-semibold">____________________</span></p>
            </div>
          </div>

          {/* Subject Area */}
          <div className="space-y-1.5 pt-1">
            <p className="font-extrabold text-right" style={{ fontSize: '18px', lineHeight: '2' }}>
              عنوان : <span className="font-semibold underline decoration-2 decoration-black underline-offset-4">{getSubjectTitle()}</span>
            </p>
            
            <p className="font-bold text-right pt-0.5" style={{ fontSize: '15px', lineHeight: '2' }}>
              بحوالہ یاداشت نمبری: <span className="font-semibold">____________________</span>
            </p>
          </div>

          {/* Greeting */}
          <div className="pt-2">
            <p className="font-bold text-right" style={{ fontSize: '18px', lineHeight: '2' }}>
              جنابِ عالی!
            </p>
            <p className="text-justify font-medium leading-loose" style={{ fontSize: '15px', lineHeight: '2.2' }}>
              تحریر ہے کہ درخواست عنوان بالا موصول ہونے پر فریقین کو طلب کر کے دریافت عمل میں لائی گئی ۔حالات اس طرح پائے گئے جو ذیل ہیں۔
            </p>
          </div>

          {/* Complainant Narrative */}
          <div className="space-y-1.5 pt-2">
            <h4 className="font-extrabold text-right border-r-4 border-emerald-800 pr-2" style={{ fontSize: '18px', lineHeight: '2' }}>موقف درخواست گزار :</h4>
            <p className="text-justify pr-3 font-medium leading-relaxed" style={{ fontSize: '15px', lineHeight: '2.2' }}>
              {getFormattedComplainantStatement()}
            </p>
          </div>

          {/* Complainant & Witness Statements */}
          <div className="space-y-2 pt-2">
            <h4 className="font-extrabold text-right border-r-4 border-emerald-800 pr-2" style={{ fontSize: '18px', lineHeight: '2' }}>بیان ازان :</h4>
            <div className="space-y-3 pr-3">
              {complainantStatements.length > 0 ? (
                complainantStatements.map((st) => (
                  <div key={st.id} className="text-justify leading-relaxed" style={{ fontSize: '15px', lineHeight: '2.2' }}>
                    <span className="font-bold block text-slate-900 mb-0.5">بیان ازاں مسمی / مسمات {st.personName} (مکمل نام، ولدیت و سکونت/پتہ) :</span>
                    <span className="font-medium pr-8 block">بیان کیا ہے کہ {st.text}</span>
                  </div>
                ))
              ) : (
                <p className="italic text-slate-400" style={{ fontSize: '15px' }}>کوئی بیان شامل نہیں ہے۔</p>
              )}
            </div>
          </div>

          {/* Respondent Statements */}
          <div className="space-y-2 pt-2">
            <h4 className="font-extrabold text-right border-r-4 border-emerald-800 pr-2" style={{ fontSize: '18px', lineHeight: '2' }}>الزام علیہ درخواست کا بیان :</h4>
            <div className="space-y-3 pr-3">
              {respondentStatements.length > 0 ? (
                respondentStatements.map((st) => (
                  <div key={st.id} className="text-justify leading-relaxed" style={{ fontSize: '15px', lineHeight: '2.2' }}>
                    <span className="font-bold block text-slate-900 mb-0.5">بیان ازاں مسمی / مسمات {st.personName} (مکمل نام، ولدیت و سکونت/پتہ) :</span>
                    <span className="font-medium pr-8 block">بیان کیا ہے کہ {st.text}</span>
                  </div>
                ))
              ) : (
                <p className="italic text-slate-400" style={{ fontSize: '15px' }}>کوئی بیان شامل نہیں ہے۔</p>
              )}
            </div>
          </div>

          {/* Facts & Findings */}
          {factsAndFindings && factsAndFindings.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="font-extrabold text-right border-r-4 border-emerald-800 pr-2" style={{ fontSize: '18px', lineHeight: '2' }}>
                دورانِ انکوائری سامنے آنے والے اہم حقائق و امور :
              </h4>
              <div className="space-y-2 pr-3">
                {factsAndFindings.map((point, idx) => (
                  <p key={idx} className="text-justify font-medium leading-relaxed" style={{ fontSize: '15px', lineHeight: '2.2' }}>
                    {point}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Progress Report */}
          {showProgressReport && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="font-extrabold text-right border-r-4 border-emerald-800 pr-2" style={{ fontSize: '18px', lineHeight: '2' }}>
                {progressHeading || "پراگرس رپورٹ:"}
              </h4>
              <p className="text-justify font-medium leading-relaxed pr-3" style={{ fontSize: '15px', lineHeight: '2.2' }}>
                {progressText || "پراگرس رپورٹ کی تفصیل موجود نہیں ہے۔"}
              </p>
              
              {progressImages && progressImages.length > 0 && (
                <div className="grid grid-cols-2 gap-2 pt-2 pr-3">
                  {progressImages.map((img, idx) => (
                    <div key={idx} className="border border-slate-200 p-1 rounded bg-white flex flex-col items-center">
                      <img src={img} alt={`منسلک تصویر ${idx + 1}`} className="max-h-36 max-w-full object-contain" referrerPolicy="no-referrer" />
                      <p className="text-[9px] font-bold text-slate-500 mt-1">منسلک ثبوت / تصویر ${idx + 1}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Inquiry Conclusion */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="font-extrabold text-right border-r-4 border-emerald-800 pr-2" style={{ fontSize: '18px', lineHeight: '2' }}>نتیجہ انکوائری :</h4>
            <div className="text-justify font-semibold bg-emerald-50/40 p-3 rounded-lg border border-emerald-100 pr-3 border-r-4 border-r-emerald-800 leading-relaxed" style={{ fontSize: '15px', lineHeight: '2.2' }}>
              {getFormattedConclusion()}
            </div>
            <p className="font-bold text-slate-900 mt-2" style={{ fontSize: '15px', lineHeight: '2' }}>
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
