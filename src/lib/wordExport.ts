import { InquiryData } from "../types";
import { POLICE_LOGO_BASE64 } from "../assets/logoBase64";

/**
 * Generates an official, print-perfect Microsoft Word document (.doc)
 * with authentic Punjab Police memo formatting, RTL Urdu typography,
 * formal tables, sections, and executive signature stamp.
 */
export function exportInquiryReportToWord(data: InquiryData, customEditedText?: string): void {
  const complainantName = data.complainantName?.trim() || "نامعلوم سائل";
  const subjectTitle = data.subjectTitle?.trim() || `رپورٹ درخواست ازاں ${complainantName}`;
  const senderDesignation = data.senderDesignation || "سپرنٹنڈنٹ آف پولیس، ریجنل انویسٹی گیشن برانچ، گوجرانوالہ";
  const recipientDesignation = data.recipientDesignation || "جناب ریجنل پولیس آفیسر صاحب، گوجرانوالہ";
  const attention = data.attention ? data.attention.trim() : "";

  // Helper for formatted complainant statements
  const complainantStatements = (data.statements || []).filter(
    (s) => s.role === "Complainant" || s.role === "Supporting" || s.role === "Complainant_Witness"
  );
  const respondentStatements = (data.statements || []).filter(
    (s) => s.role === "Respondent" || s.role === "RespondentWitness" || s.role === "Respondent_Witness" || s.role === "Police_Officer" || s.role === "Other"
  );

  let bodyContentHtml = "";

  if (customEditedText && customEditedText.trim()) {
    // If user made custom edits in preview mode, preserve the paragraphs cleanly with 1.0 line spacing
    const paragraphs = customEditedText
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    bodyContentHtml = paragraphs
      .map(p => `<p class="MsoNormal" style="margin-bottom: 6pt; text-align: justify; line-height: 1.15; font-size: 13.5pt; font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', 'Arial', serif;">${p.replace(/\n/g, "<br/>")}</p>`)
      .join("\n");
  } else {
    // Build structured official Punjab Police document matching exact office sketch

    // 1. Statements Blocks (NO borders, NO dividers after statements)
    const complainantStmtsHtml = complainantStatements.length > 0
      ? complainantStatements.map((st) => `
        <div style="margin-bottom: 6pt;">
          <p class="MsoNormal" style="margin: 0; font-weight: bold; font-size: 13.5pt; line-height: 1.15;">
            <b><u>بیان ازاں ${st.personName || "سائل"}:-</u></b>
          </p>
          <p class="MsoNormal" style="margin-top: 2pt; margin-bottom: 0; text-align: justify; line-height: 1.15; font-size: 13.5pt;">
            ${st.text || "کوئی بیان قلمبند نہیں کرایا۔"}
          </p>
        </div>
      `).join("\n")
      : "";

    const respondentStmtsHtml = respondentStatements.length > 0
      ? respondentStatements.map((st) => `
        <div style="margin-bottom: 6pt;">
          <p class="MsoNormal" style="margin: 0; font-weight: bold; font-size: 13.5pt; line-height: 1.15;">
            <b><u>بیان ازاں ${st.personName || "الزام علیہ"}:-</u></b>
          </p>
          <p class="MsoNormal" style="margin-top: 2pt; margin-bottom: 0; text-align: justify; line-height: 1.15; font-size: 13.5pt;">
            ${st.text || "کوئی بیان قلمبند نہیں کرایا۔"}
          </p>
        </div>
      `).join("\n")
      : "";

    // 2. Facts and Findings
    const factsHtml = (data.factsAndFindings && data.factsAndFindings.length > 0)
      ? `
        <div style="margin-top: 8pt; margin-bottom: 8pt;">
          <p class="MsoNormal" style="font-weight: bold; font-size: 13.5pt; margin-bottom: 3pt; line-height: 1.15;">
            <b><u>دورانِ انکوائری سامنے آنے والے اہم حقائق و امور:-</u></b>
          </p>
          <ol style="margin-top: 2pt; margin-bottom: 4pt; padding-right: 20pt; line-height: 1.15; font-size: 13pt;">
            ${data.factsAndFindings.map(f => `<li style="margin-bottom: 3pt; text-align: justify;">${f}</li>`).join("\n")}
          </ol>
        </div>
      `
      : "";

    // 3. Progress Report (if included)
    const progressHtml = data.showProgressReport
      ? `
        <div style="margin-top: 8pt; margin-bottom: 8pt;">
          <p class="MsoNormal" style="font-weight: bold; font-size: 13.5pt; margin-bottom: 2pt; line-height: 1.15;">
            <b><u>${data.progressHeading || "پراگرس رپورٹ:"}</u></b>
          </p>
          <p class="MsoNormal" style="text-align: justify; line-height: 1.15; font-size: 13pt; margin: 0;">
            ${(data.progressText || "تفتیش مقدمہ جاری ہے۔").replace(/\n/g, "<br/>")}
          </p>
        </div>
      `
      : "";

    bodyContentHtml = `
      <!-- Formal Memo Header Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 8pt; font-size: 13.5pt;" dir="rtl">
        <tr>
          <td style="width: 65%; vertical-align: top; text-align: right; line-height: 1.15; font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', 'Arial', serif;">
            <p class="MsoNormal" style="margin: 0; font-weight: bold; font-size: 14pt; line-height: 1.15;"><b>منجانب:</b> &nbsp; سپرنٹنڈنٹ آف پولیس</p>
            <p class="MsoNormal" style="margin: 0; font-weight: bold; font-size: 13.5pt; line-height: 1.15; padding-right: 42pt;">ریجنل انویسٹی گیشن برانچ، گوجرانوالہ</p>
            <p class="MsoNormal" style="margin-top: 2pt; margin-bottom: 0; font-weight: bold; font-size: 13.5pt; line-height: 1.15;"><b>بجانب:</b> &nbsp; ${recipientDesignation}</p>
            ${attention ? `<p class="MsoNormal" style="margin-top: 1pt; margin-bottom: 0; font-size: 13pt; line-height: 1.15;"><b>توجہ:</b> &nbsp; ${attention}</p>` : ""}
          </td>
          <td style="width: 35%; vertical-align: top; text-align: left; line-height: 1.15; font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', 'Arial', sans-serif; font-size: 12pt;" dir="rtl">
            <p class="MsoNormal" style="margin: 0; font-weight: bold; line-height: 1.15;">نمبر: _______________</p>
            <p class="MsoNormal" style="margin-top: 2pt; margin-bottom: 0; font-weight: bold; line-height: 1.15;">تاریخ: _______________</p>
          </td>
        </tr>
      </table>

      <!-- Subject (عنوان) & Reference (NO BOX - Pure clean layout) -->
      <div style="margin-top: 4pt; margin-bottom: 6pt;">
        <p class="MsoNormal" style="margin: 0; font-weight: bold; font-size: 14pt; line-height: 1.15;">
          <b>عنوان:-</b> &nbsp; <u>${subjectTitle}</u>
        </p>
        <p class="MsoNormal" style="margin-top: 2pt; margin-bottom: 0; font-size: 13pt; font-weight: bold; line-height: 1.15;">
          بحوالہ یادداشت نمبر ${data.referenceNumber || "_________________"} مورخہ ${data.referenceDate || "_________________"}
        </p>
      </div>

      <!-- Formal Salutation & Intro -->
      <div style="margin-top: 6pt; margin-bottom: 6pt;">
        <p class="MsoNormal" style="font-weight: bold; font-size: 14pt; margin-bottom: 2pt; line-height: 1.15;">جناب عالی!</p>
        <p class="MsoNormal" style="text-align: justify; line-height: 1.15; font-size: 13.5pt; margin-bottom: 4pt;">
          تحریر ہے کہ درخواست عنوان بالا موصول ہونے پر فریقین کو طلب کر کے دریافت عمل میں لائی گئی۔ حالات اس طرح پائے گئے ہیں۔
        </p>
      </div>

      <!-- Section: Complainant Application Summary -->
      <div style="margin-bottom: 6pt;">
        <p class="MsoNormal" style="font-weight: bold; font-size: 13.5pt; margin-bottom: 2pt; line-height: 1.15;">
          <b><u>خلاصہ درخواست ازاں ${complainantName || "سائل"}:-</u></b>
        </p>
        <p class="MsoNormal" style="text-align: justify; line-height: 1.15; font-size: 13.5pt; margin-bottom: 4pt;">
          ${(data.complainantStatement || "سائل نے تحریری موقف میں الزام علیہان کے خلاف داد رسی کی استدعا کی ہے۔").replace(/\n/g, "<br/>")}
        </p>
      </div>

      <!-- Statements Section (NO borders, continuous natural flow) -->
      ${complainantStmtsHtml}
      ${respondentStmtsHtml}
      ${factsHtml}
      ${progressHtml}

      <!-- Section: Inquiry Conclusion (نتیجہ انکوائری - NO BOX) -->
      <div style="margin-top: 8pt; margin-bottom: 8pt;">
        <p class="MsoNormal" style="font-weight: bold; font-size: 14pt; margin-bottom: 2pt; line-height: 1.15;">
          <b><u>نتیجہ انکوائری:-</u></b>
        </p>
        <p class="MsoNormal" style="text-align: justify; line-height: 1.15; font-size: 13.5pt; margin: 0;">
          ${(data.inquiryConclusion || "دوران انکوائری پیش آمدہ حالات و ملاحظہ ریکارڈ سے پایا گیا ہے کہ معاملہ فریقین کے مابین تنازعہ کا ہے۔").replace(/\n/g, "<br/>")}
        </p>
      </div>

      <!-- Formal Closing -->
      <div style="margin-top: 8pt; margin-bottom: 24pt; text-align: center;">
        <p class="MsoNormal" style="font-weight: bold; font-size: 13.5pt; text-align: center; line-height: 1.15;">
          رپورٹ مرتب ہو کر برائے مناسب حکم ارسال خدمت ہے۔
        </p>
      </div>

      <!-- Signature Stamp Block (Matching Office Sketch) -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 20pt;" dir="rtl">
        <tr>
          <td style="width: 100%; vertical-align: top; text-align: center; line-height: 1.15;">
            <div style="text-align: center; display: inline-block; font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', 'Arial', serif;" dir="rtl">
              <p class="MsoNormal" style="margin: 0; font-size: 14pt; font-weight: bold;">
                سپرنٹنڈنٹ آف پولیس
              </p>
              <p class="MsoNormal" style="margin: 0; font-size: 13pt;">
                ریجنل انویسٹی گیشن برانچ، گوجرانوالہ
              </p>
            </div>
          </td>
        </tr>
      </table>
    `;
  }

  // Complete Word Document Boilerplate with MSO XML tags and 1.0 line spacing
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
          margin: 54pt 54pt 54pt 54pt; /* 0.75 inch clean margins */
          mso-header-margin: 28pt;
          mso-footer-margin: 28pt;
          mso-paper-source: 0;
        }
        div.WordSection1 {
          page: WordSection1;
        }
        body {
          font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', 'Urdu Typesetting', 'Calibri', 'Arial', serif;
          direction: rtl;
          text-align: right;
          font-size: 13.5pt;
          line-height: 1.15;
          color: #000000;
          background-color: #FFFFFF;
        }
        p.MsoNormal, li.MsoNormal, div.MsoNormal {
          mso-style-parent: "";
          margin: 0cm;
          margin-bottom: 4pt;
          direction: rtl;
          text-align: right;
          font-size: 13.5pt;
          font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', 'Urdu Typesetting', 'Calibri', 'Arial', serif;
          line-height: 1.15;
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
