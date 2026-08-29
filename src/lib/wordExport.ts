import { InquiryData } from "../types";
import { POLICE_LOGO_BASE64 } from "../assets/logoBase64";

/**
 * Generates an official, print-perfect Microsoft Word document (.doc)
 * with authentic Punjab Police memo formatting, RTL Urdu typography,
 * formal tables, sections, and executive signature stamp.
 */
export function exportInquiryReportToWord(data: InquiryData, customEditedText?: string): void {
  const complainantName = data.complainantName?.trim() || "نامعلوم سائل";
  const subjectTitle = data.subjectTitle?.trim() || `رپورٹ درخواست ازاں ${complainantName} بر خلاف ${data.respondentName || "فریق مخالف"} بابت ${data.lawSections || "تنازعہ"}`;
  const senderDesignation = data.senderDesignation || "سینیئر سپرنٹنڈنٹ آف پولیس، ریجنل انویسٹی گیشن برانچ، گوجرانوالہ";
  const recipientDesignation = data.recipientDesignation || "جناب ریجنل پولیس آفیسر صاحب، گوجرانوالہ ریجن";
  const attention = data.attention ? data.attention.trim() : "";

  // Helper for formatted complainant statements
  const complainantStatements = (data.statements || []).filter(
    (s) => s.role === "Complainant" || s.role === "Supporting"
  );
  const respondentStatements = (data.statements || []).filter(
    (s) => s.role === "Respondent" || s.role === "RespondentWitness"
  );

  let bodyContentHtml = "";

  if (customEditedText && customEditedText.trim()) {
    // If user made custom edits in preview mode, preserve the paragraphs cleanly
    const paragraphs = customEditedText
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    bodyContentHtml = paragraphs
      .map(p => `<p class="MsoNormal" style="margin-bottom: 12pt; text-align: justify; line-height: 2.3; font-size: 14pt; font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', 'Arial', serif;">${p.replace(/\n/g, "<br/>")}</p>`)
      .join("\n");
  } else {
    // Build structured official Punjab Police document

    // 1. Statements Blocks
    const complainantStmtsHtml = complainantStatements.length > 0
      ? complainantStatements.map((st, idx) => `
        <div style="margin-bottom: 12pt; padding-right: 10pt; border-right: 2pt solid #002B49;">
          <p class="MsoNormal" style="margin: 0; font-weight: bold; color: #002B49; font-size: 13.5pt;">
            ${idx + 1}. بیان ازاں مسمی / مسمات <u>${st.personName || "_________________"}</u> (مکمل نام، ولدیت و پتہ):
          </p>
          <p class="MsoNormal" style="margin-top: 4pt; margin-bottom: 0; text-align: justify; line-height: 2.2; font-size: 13.5pt;">
            بیان کیا ہے کہ ${st.text || "کوئی بیان قلمبند نہیں کرایا۔"}
          </p>
        </div>
      `).join("\n")
      : `<p class="MsoNormal" style="color: #666; font-style: italic; font-size: 12pt;">کوئی اضافی بیان درج نہیں کیا گیا ۔</p>`;

    const respondentStmtsHtml = respondentStatements.length > 0
      ? respondentStatements.map((st, idx) => `
        <div style="margin-bottom: 12pt; padding-right: 10pt; border-right: 2pt solid #8B0000;">
          <p class="MsoNormal" style="margin: 0; font-weight: bold; color: #8B0000; font-size: 13.5pt;">
            ${idx + 1}. بیان ازاں مسمی / مسمات <u>${st.personName || "_________________"}</u> (مکمل نام، ولدیت و پتہ):
          </p>
          <p class="MsoNormal" style="margin-top: 4pt; margin-bottom: 0; text-align: justify; line-height: 2.2; font-size: 13.5pt;">
            بیان کیا ہے کہ ${st.text || "کوئی بیان قلمبند نہیں کرایا۔"}
          </p>
        </div>
      `).join("\n")
      : `<p class="MsoNormal" style="color: #666; font-style: italic; font-size: 12pt;">کوئی بیان الزام علیہ درج نہیں کیا گیا ۔</p>`;

    // 2. Facts and Findings
    const factsHtml = (data.factsAndFindings && data.factsAndFindings.length > 0)
      ? `
        <div style="margin-top: 16pt; margin-bottom: 16pt;">
          <p class="MsoNormal" style="font-weight: bold; font-size: 14pt; color: #002B49; border-bottom: 1pt solid #002B49; padding-bottom: 2pt; margin-bottom: 8pt;">
            دورانِ انکوائری سامنے آنے والے اہم حقائق و تفتیشی امور:
          </p>
          <ol style="margin-top: 4pt; margin-bottom: 8pt; padding-right: 20pt; line-height: 2.2; font-size: 13.5pt;">
            ${data.factsAndFindings.map(f => `<li style="margin-bottom: 6pt; text-align: justify;">${f}</li>`).join("\n")}
          </ol>
        </div>
      `
      : "";

    // 3. Progress Report (if included)
    const progressHtml = data.showProgressReport
      ? `
        <div style="margin-top: 16pt; margin-bottom: 16pt; background-color: #F8FAFC; border: 1pt solid #CBD5E1; padding: 10pt; border-radius: 4pt;">
          <p class="MsoNormal" style="font-weight: bold; font-size: 13.5pt; color: #0F172A; margin-bottom: 6pt;">
            ${data.progressHeading || "پراگرس رپورٹ تفتیش مقدمہ:"}
          </p>
          <p class="MsoNormal" style="text-align: justify; line-height: 2.2; font-size: 13pt; margin: 0;">
            ${(data.progressText || "تفتیش مقدمہ جاری ہے۔").replace(/\n/g, "<br/>")}
          </p>
        </div>
      `
      : "";

    bodyContentHtml = `
      <!-- Formal Memo Header Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 14pt; font-size: 13.5pt; border-bottom: 2pt solid #002B49; padding-bottom: 8pt;" dir="rtl">
        <tr>
          <td style="width: 65%; vertical-align: top; text-align: right; line-height: 2.1; font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', 'Arial', serif;">
            <p class="MsoNormal" style="margin: 0; font-weight: bold; color: #002B49; font-size: 14pt;"><b>منجانب:</b> ${senderDesignation}</p>
            <p class="MsoNormal" style="margin: 0; font-weight: bold; color: #1E293B; font-size: 14pt;"><b>بجانب:</b> ${recipientDesignation}</p>
            ${attention ? `<p class="MsoNormal" style="margin: 0; color: #334155; font-size: 13pt;"><b>توجہ:</b> ${attention}</p>` : ""}
          </td>
          <td style="width: 35%; vertical-align: top; text-align: left; line-height: 2.1; font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt;" dir="ltr">
            <p class="MsoNormal" style="margin: 0;"><b>No:</b> _________________</p>
            <p class="MsoNormal" style="margin: 0;"><b>Dated:</b> ______________</p>
          </td>
        </tr>
      </table>

      <!-- Subject (عنوان) Box -->
      <div style="background-color: #F1F5F9; border: 1.5pt solid #002B49; padding: 8pt 12pt; margin-bottom: 12pt; border-radius: 3pt;">
        <p class="MsoNormal" style="margin: 0; font-weight: bold; font-size: 14.5pt; color: #002B49; line-height: 2.2;">
          <b>عنوان :</b> <span style="text-decoration: underline;">${subjectTitle}</span>
        </p>
        <p class="MsoNormal" style="margin-top: 4pt; margin-bottom: 0; font-size: 11pt; color: #475569;">
          بحوالہ یاداشت نمبری: __________________________________
        </p>
      </div>

      <!-- Formal Salutation -->
      <div style="margin-bottom: 12pt;">
        <p class="MsoNormal" style="font-weight: bold; font-size: 15pt; color: #002B49; margin-bottom: 6pt;">جنابِ عالی!</p>
        <p class="MsoNormal" style="text-align: justify; line-height: 2.3; font-size: 14pt; margin-bottom: 12pt;">
          تحریر ہے کہ درخواست عنوان بالا موصول ہونے پر فریقین کو طلب کر کے دریافت عمل میں لائی گئی ۔حالات اس طرح پائے گئے جو ذیل ہیں۔
        </p>
      </div>

      <!-- Section 1: Complainant Narrative -->
      <div style="margin-bottom: 16pt;">
        <p class="MsoNormal" style="font-weight: bold; font-size: 14pt; color: #002B49; border-bottom: 1pt solid #CBD5E1; padding-bottom: 2pt; margin-bottom: 6pt;">
          <b>موقف درخواست گزار :</b>
        </p>
        <p class="MsoNormal" style="text-align: justify; line-height: 2.3; font-size: 13.5pt; margin-bottom: 10pt;">
          ${(data.complainantStatement || "سائل نے تحریری موقف میں الزام علیہان کے خلاف داد رسی کی استدعا کی ہے۔").replace(/\n/g, "<br/>")}
        </p>
      </div>

      <!-- Section 2: Statements of Complainant & Witnesses -->
      <div style="margin-bottom: 16pt;">
        <p class="MsoNormal" style="font-weight: bold; font-size: 14pt; color: #002B49; border-bottom: 1pt solid #CBD5E1; padding-bottom: 2pt; margin-bottom: 8pt;">
          <b>بیان ازان (سائل و تائیدی گواہان):</b>
        </p>
        ${complainantStmtsHtml}
      </div>

      <!-- Section 3: Statements of Respondent -->
      <div style="margin-bottom: 16pt;">
        <p class="MsoNormal" style="font-weight: bold; font-size: 14pt; color: #002B49; border-bottom: 1pt solid #CBD5E1; padding-bottom: 2pt; margin-bottom: 8pt;">
          <b>الزام علیہ درخواست کا بیان و دفاع:</b>
        </p>
        ${respondentStmtsHtml}
      </div>

      ${factsHtml}
      ${progressHtml}

      <!-- Section 4: Inquiry Conclusion (نتیجہ انکوائری) -->
      <div style="margin-top: 16pt; margin-bottom: 18pt; background-color: #F8FAFC; border: 1.5pt solid #002B49; padding: 10pt; border-radius: 4pt;">
        <p class="MsoNormal" style="font-weight: bold; font-size: 14.5pt; color: #002B49; margin-bottom: 6pt;">
          <b>نتیجہ انکوائری :</b>
        </p>
        <p class="MsoNormal" style="text-align: justify; line-height: 2.3; font-size: 14pt; margin: 0;">
          ${(data.inquiryConclusion || "دریافت فریقین، ملاحظہ ریکارڈ اور بالمشافہ گفتگو سے معاملہ باہمی تصفیہ طلب پایا گیا۔").replace(/\n/g, "<br/>")}
        </p>
      </div>

      <!-- Formal Closing -->
      <div style="margin-top: 14pt; margin-bottom: 40pt;">
        <p class="MsoNormal" style="font-weight: bold; font-size: 14pt; color: #002B49;">
          رپورٹ مرتب ہو کر برائے مناسب حکم ارسال خدمت ہے ۔
        </p>
      </div>

      <!-- Signature Stamp Block -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 30pt;" dir="rtl">
        <tr>
          <td style="width: 40%; vertical-align: top; text-align: right;">
            <!-- Official Seal / Stamp Placeholder -->
            <div style="border: 1pt dashed #94A3B8; padding: 8pt; width: 140pt; text-align: center; border-radius: 4pt; font-size: 10pt; color: #64748B;">
              مہر سرکاری و تاریخ
            </div>
          </td>
          <td style="width: 60%; vertical-align: top; text-align: left; line-height: 1.8;" dir="ltr">
            <div style="text-align: center; display: inline-block; font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', 'Arial', serif;" dir="rtl">
              <p class="MsoNormal" style="margin: 0; font-size: 14pt; font-weight: bold; color: #002B49;">
                سینیئر سپرنٹنڈنٹ آف پولیس
              </p>
              <p class="MsoNormal" style="margin: 0; font-size: 13pt; color: #334155;">
                ریجنل انویسٹی گیشن برانچ، گوجرانوالہ ریجن
              </p>
            </div>
          </td>
        </tr>
      </table>
    `;
  }

  // Complete Word Document Boilerplate with MSO XML tags
  const wordDocumentHtml = `
    <html xmlns:v="urn:schemas-microsoft-com:vml"
          xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns:m="http://schemas.microsoft.com/office/2004/12/omml"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${subjectTitle}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
          <w:ValidateAgainstSchemas/>
          <w:SaveIfXMLInvalid>false</w:SaveIfXMLInvalid>
          <w:IgnoreMarketFormatErrors>false</w:IgnoreMarketFormatErrors>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page WordSection1 {
          size: 595.3pt 841.9pt; /* A4 size in points */
          margin: 72pt 72pt 72pt 72pt; /* 1 inch margins */
          mso-header-margin: 36pt;
          mso-footer-margin: 36pt;
          mso-paper-source: 0;
        }
        div.WordSection1 {
          page: WordSection1;
        }
        body {
          font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', 'Urdu Typesetting', 'Calibri', 'Arial', serif;
          direction: rtl;
          text-align: right;
          font-size: 14pt;
          line-height: 2.2;
          color: #000000;
          background-color: #FFFFFF;
        }
        p.MsoNormal, li.MsoNormal, div.MsoNormal {
          mso-style-parent: "";
          margin: 0cm;
          margin-bottom: 8pt;
          direction: rtl;
          text-align: right;
          font-size: 14pt;
          font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', 'Urdu Typesetting', 'Calibri', 'Arial', serif;
          line-height: 2.2;
        }
        table {
          mso-displayed-decimal-separator: ".";
          mso-displayed-thousand-separator: ",";
        }
      </style>
    </head>
    <body lang="UR" style="tab-interval: 36.0pt;">
      <div class="WordSection1" dir="rtl">
        ${bodyContentHtml}
      </div>
    </body>
    </html>
  `;

  // Download Blob with UTF-8 BOM
  const blob = new Blob(["\ufeff", wordDocumentHtml], {
    type: "application/msword;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  const safeFilename = `Inquiry_Report_${complainantName.replace(/[/\\?%*:|"<>]/g, "_")}_${Date.now()}.doc`;
  downloadLink.download = safeFilename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
}
