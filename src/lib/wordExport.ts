import { InquiryData } from "../types";

/**
 * Generates an official, print-perfect Microsoft Word document (.doc)
 * with authentic Punjab Police memo formatting, single line spacing (1.0),
 * RTL Urdu typography, and zero unnecessary lines, boxes, or gaps.
 */
export function exportInquiryReportToWord(data: InquiryData, customEditedText?: string): void {
  const complainantName = data.complainantName?.trim() || "سائل";
  const subjectTitle = data.subjectTitle?.trim() || `رپورٹ درخواست ازاں ${complainantName}`;
  const recipientDesignation = data.recipientDesignation?.trim() || "جناب ریجنل پولیس آفیسر صاحب، گوجرانوالہ";
  const attention = data.attention ? data.attention.trim() : "(انچارج شکایات سیل)";

  let bodyContentHtml = "";

  if (customEditedText && customEditedText.trim()) {
    // If user made custom edits in preview mode, preserve the exact paragraphs cleanly with 1.0 line spacing
    const paragraphs = customEditedText
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    bodyContentHtml = paragraphs
      .map(p => `<p class="MsoNormal" style="margin: 0; margin-bottom: 3.5pt; text-align: justify; line-height: 1.05; font-size: 13.5pt; font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', 'Arial', serif;">${p.replace(/\n/g, "<br/>")}</p>`)
      .join("\n");
  } else {
    // Build structured official Punjab Police document matching exact office sketch

    // Statements Blocks (NO borders, NO dividers after statements)
    const stmtsHtml = (data.statements || [])
      .filter(st => (st.personName && st.personName.trim()) || (st.text && st.text.trim()))
      .map(st => `
        <div style="margin-top: 4pt; margin-bottom: 3pt;">
          <p class="MsoNormal" style="margin: 0; font-weight: bold; font-size: 13.5pt; line-height: 1.05;">
            <b>بیان ازاں ${st.personName || "فریق"}:-</b>
          </p>
          <p class="MsoNormal" style="margin: 0; margin-top: 1.5pt; margin-bottom: 0; text-align: justify; line-height: 1.05; font-size: 13.5pt;">
            ${(st.text || "").replace(/\n/g, "<br/>")}
          </p>
        </div>
      `).join("\n");

    // Progress Report (if included)
    const progressHtml = (data.showProgressReport && (data.progressHeading || data.progressText))
      ? `
        <div style="margin-top: 4pt; margin-bottom: 3pt;">
          <p class="MsoNormal" style="font-weight: bold; font-size: 13.5pt; margin: 0; line-height: 1.05;">
            <b>${data.progressHeading || "پراگرس رپورٹ:"}:-</b>
          </p>
          <p class="MsoNormal" style="text-align: justify; line-height: 1.05; font-size: 13.5pt; margin: 0; margin-top: 1.5pt;">
            ${(data.progressText || "").replace(/\n/g, "<br/>")}
          </p>
        </div>
      `
      : "";

    // Complainant Summary Block
    const complainantSummaryHtml = data.complainantStatement && data.complainantStatement.trim()
      ? `
        <div style="margin-top: 4pt; margin-bottom: 3pt;">
          <p class="MsoNormal" style="font-weight: bold; font-size: 13.5pt; margin: 0; line-height: 1.05;">
            <b>خلاصہ درخواست ازاں ${complainantName}:-</b>
          </p>
          <p class="MsoNormal" style="text-align: justify; line-height: 1.05; font-size: 13.5pt; margin: 0; margin-top: 1.5pt;">
            ${data.complainantStatement.trim().replace(/\n/g, "<br/>")}
          </p>
        </div>
      `
      : "";

    // Conclusion Block
    const conclusionText = (data.inquiryConclusion || "")
      .replace(/رپورٹ مرتب ہو کر برائے مناسب حکم ارسال خدمت ہے[\s۔]*$/g, "")
      .trim();

    const formattedConclusionText = conclusionText.startsWith("دوران انکوائری پیش آمدہ حالات و ملاحظہ ریکارڈ سے پایا گیا ہے کہ")
      ? conclusionText
      : `دوران انکوائری پیش آمدہ حالات و ملاحظہ ریکارڈ سے پایا گیا ہے کہ ${conclusionText.replace(/^دریافت فریقین[،,]\s*ملاحظہ ریکارڈ و بالمشافہ گفتگو سے پایا گیا ہے کہ\s*/g, "")}`;

    const conclusionHtml = conclusionText
      ? `
        <div style="margin-top: 5pt; margin-bottom: 3pt;">
          <p class="MsoNormal" style="font-weight: bold; font-size: 13.5pt; margin: 0; line-height: 1.05;">
            <b>نتیجہ انکوائری:-</b>
          </p>
          <p class="MsoNormal" style="text-align: justify; line-height: 1.05; font-size: 13.5pt; margin: 0; margin-top: 1.5pt;">
            ${formattedConclusionText.replace(/\n/g, "<br/>")}
          </p>
        </div>
      `
      : "";

    bodyContentHtml = `
      <!-- Formal Memo Header Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 4pt; font-size: 13.5pt;" dir="rtl">
        <tr>
          <td style="width: 65%; vertical-align: top; text-align: right; line-height: 1.05; font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', 'Arial', serif;">
            <p class="MsoNormal" style="margin: 0; font-weight: bold; font-size: 13.5pt; line-height: 1.05;"><b>منجانب:</b> &nbsp; سپرنٹنڈنٹ آف پولیس</p>
            <p class="MsoNormal" style="margin: 0; font-weight: bold; font-size: 13.5pt; line-height: 1.05; padding-right: 44pt;">ریجنل انویسٹی گیشن برانچ، گوجرانوالہ</p>
            <p class="MsoNormal" style="margin-top: 2pt; margin-bottom: 0; font-weight: bold; font-size: 13.5pt; line-height: 1.05;"><b>بجانب:</b> &nbsp; ${recipientDesignation}</p>
            ${attention ? `<p class="MsoNormal" style="margin-top: 1.5pt; margin-bottom: 0; font-weight: bold; font-size: 13pt; line-height: 1.05;"><b>توجہ:</b> &nbsp; ${attention}</p>` : ""}
          </td>
          <td style="width: 35%; vertical-align: top; text-align: left; line-height: 1.05; font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', 'Arial', sans-serif; font-size: 12pt;" dir="rtl">
            <p class="MsoNormal" style="margin: 0; font-weight: bold; line-height: 1.05;">نمبر: _______________</p>
            <p class="MsoNormal" style="margin-top: 2pt; margin-bottom: 0; font-weight: bold; line-height: 1.05;">تاریخ: _______________</p>
          </td>
        </tr>
      </table>

      <!-- Subject (عنوان) & Reference (Pure clean single line layout) -->
      <div style="margin-top: 3pt; margin-bottom: 4pt;">
        <p class="MsoNormal" style="margin: 0; font-weight: bold; font-size: 13.5pt; line-height: 1.05;">
          <b>عنوان:-</b> &nbsp; ${subjectTitle}
        </p>
        <p class="MsoNormal" style="margin-top: 1.5pt; margin-bottom: 0; font-size: 12.5pt; font-weight: bold; line-height: 1.05;">
          بحوالہ یادداشت نمبر ${data.referenceNumber || "_________________"} مورخہ ${data.referenceDate || "_________________"}
        </p>
      </div>

      <!-- Formal Salutation & Intro -->
      <div style="margin-top: 4pt; margin-bottom: 4pt;">
        <p class="MsoNormal" style="font-weight: bold; font-size: 13.5pt; margin: 0; line-height: 1.05;">جناب عالی!</p>
        <p class="MsoNormal" style="text-align: justify; line-height: 1.05; font-size: 13.5pt; margin: 0; margin-top: 1.5pt;">
          تحریر ہے کہ درخواست عنوان بالا موصول ہونے پر فریقین کو طلب کر کے دریافت عمل میں لائی گئی۔ حالات اس طرح پائے گئے ہیں۔
        </p>
      </div>

      <!-- Section: Complainant Application Summary -->
      ${complainantSummaryHtml}

      <!-- Statements Section (Continuous natural flow) -->
      ${stmtsHtml}
      ${progressHtml}

      <!-- Section: Inquiry Conclusion (نتیجہ انکوائری) -->
      ${conclusionHtml}

      <!-- Formal Closing -->
      <div style="margin-top: 8pt; margin-bottom: 16pt; text-align: center;">
        <p class="MsoNormal" style="font-weight: bold; font-size: 13.5pt; text-align: center; line-height: 1.05; margin: 0;">
          رپورٹ مرتب ہو کر برائے مناسب حکم ارسال خدمت ہے۔
        </p>
      </div>

      <!-- Signature Stamp Block (Matching Office Sketch) -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 12pt;" dir="rtl">
        <tr>
          <td style="width: 100%; vertical-align: top; text-align: center; line-height: 1.05;">
            <div style="text-align: center; display: inline-block; font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', 'Arial', serif;" dir="rtl">
              <p class="MsoNormal" style="margin: 0; font-size: 13.5pt; font-weight: bold; line-height: 1.05;">
                سپرنٹنڈنٹ آف پولیس
              </p>
              <p class="MsoNormal" style="margin: 0; font-size: 12.5pt; font-weight: bold; line-height: 1.05;">
                ریجنل انویسٹی گیشن برانچ، گوجرانوالہ
              </p>
            </div>
          </td>
        </tr>
      </table>
    `;
  }

  // Complete Word Document Boilerplate with MSO XML tags and 1.0 single line spacing
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
          margin: 42pt 42pt 42pt 42pt; /* Clean 0.58 inch margins */
          mso-header-margin: 20pt;
          mso-footer-margin: 20pt;
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
          line-height: 1.05;
          color: #000000;
          background-color: #FFFFFF;
        }
        p.MsoNormal, li.MsoNormal, div.MsoNormal {
          mso-style-parent: "";
          margin: 0cm;
          margin-bottom: 2.5pt;
          direction: rtl;
          text-align: right;
          font-size: 13.5pt;
          font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', 'Urdu Typesetting', 'Calibri', 'Arial', serif;
          line-height: 1.05;
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
  const a = document.createElement("a");
  a.href = url;
  const safeFileName = (data.complainantName ? `انکوائری رپورٹ - ${data.complainantName}` : "انکوائری رپورٹ").replace(/[/\\?%*:|"<>]/g, "-");
  a.download = `${safeFileName}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
