export interface Statement {
  id: string;
  personName: string;
  role: string; // e.g. 'Complainant', 'Respondent', 'Witness', 'Official'
  text: string;
}

export interface InquiryData {
  id: string;
  createdAt: string;
  stationName: string;
  districtName: string;
  inquiryOfficer: string;
  inquiryType: string;
  lawSections: string;
  
  // Official Header Fields from Image
  senderDesignation: string; // منجانب
  recipientDesignation: string; // بجانب
  attention: string; // توجہ
  reportNumber: string; // نمبر
  reportDate: string; // تاریخ
  subjectTitle: string; // عنوان
  referenceNumber: string; // بحوالہ نمبر
  referenceDate: string; // مورخہ
  
  // Dynamic Statements and Witnesses
  statements: Statement[];
  
  // Legacy fields (for compatibility)
  complainantName: string;
  complainantStatement: string;
  respondentName?: string;
  respondentStatement?: string;
  evidenceDescription?: string;
  
  observations: string; // موقع ملاحظہ اور مشاہدات
  additionalNotes: string;
  
  // Progress Report fields
  showProgressReport?: boolean;
  progressHeading?: string;
  progressText?: string;
  progressImages?: string[];
  
  // Generated and editable fields for the official report
  factsAndFindings?: string[]; // دوران انکوائری ذیل امور سامنے آئے ہیں
  inquiryConclusion?: string; // نتیجہ انکوائری
  generatedReport?: string; // Fully compiled layout markup/text
}

export interface StatementAnalysis {
  id: string;
  statement: string;
  analysisText: string;
  createdAt: string;
}

export const INQUIRY_TYPES = [
  { value: "money_dispute", label: "مالیاتی تنازعہ / لین دین (Financial Dispute)" },
  { value: "property_dispute", label: "جائیداد / زمین کا تنازعہ (Property Dispute)" },
  { value: "fight_assault", label: "لڑائی جھگڑا / مار پیٹ (Fight & Assault)" },
  { value: "theft_robbery", label: "چوری / ڈکیتی / فراڈ (Theft / Fraud)" },
  { value: "family_dispute", label: "خاندانی تنازعہ (Family Dispute)" },
  { value: "other", label: "دیگر تنازعات (Other Disputes)" }
];

export const STATEMENT_ROLES = [
  { value: "Complainant", label: "درخواست گزار (Complainant)" },
  { value: "Respondent", label: "مخالف فریق (Respondent)" },
  { value: "Witness", label: "گواہ (Witness)" },
  { value: "Police_Officer", label: "پولیس افسر / ملازم (Police Officer)" },
  { value: "Other", label: "دیگر فریق (Other)" }
];

export const QUICK_PHRASES = {
  complainant: [
    "درخواست گزار نے حاضر ہو کر بیان کیا کہ مخالف فریق نے دھوکہ دہی سے رقم اینٹھ لی...",
    "سائل نے الزام عائد کیا کہ مخالف فریق نے اس کی دکان پر آ کر گالی گلوچ کی...",
    "مخالف فریق نے زبردستی سائل کی زمین پر قبضہ کرنے کی کوشش کی...",
    "فریق ثانی نے سائل کو رقم کی واپسی کے مطالبے پر سنگین نتائج کی دھمکیاں دیں...",
    "سائل کے مطابق وقوعہ کے وقت موقع پر گواہان بھی موجود تھے جنہوں نے بچ بچاؤ کرایا..."
  ],
  respondent: [
    "مخالف فریق نے اپنے تحریری بیان میں سائل کے تمام الزامات کو یکسر مسترد کرتے ہوئے جھوٹا قرار دیا...",
    "مخالف فریق نے مؤقف اختیار کیا کہ اس نے سائل سے کوئی رقم وصول نہیں کی، سائل دشمنی کی بناء پر جھوٹ بول رہا ہے...",
    "مخالف فریق کے مطابق وہ وقوعہ کے وقت شہر میں موجود ہی نہیں تھا اور اس کا اس معاملے سے کوئی تعلق نہیں ہے...",
    "مخالف فریق نے بتایا کہ اصل تنازعہ زمین کی حد بندی کا ہے جسے سائل غلط رنگ دے رہا ہے..."
  ],
  evidence: [
    "درخواست گزار نے ثبوت کے طور پر بنک اسٹیٹمنٹ، واٹس ایپ پیغامات اور گواہ کے بیانات پیش کیے۔",
    "مخالف فریق نے اس تنازعے سے متعلق سابقہ عدالتی حکم امتناعی کی کاپی بطور ثبوت پیش کی ہے۔",
    "دونوں فریقین کوئی بھی ٹھوس دستاویزی ثبوت پیش کرنے میں ناکام رہے، محض زبانی الزامات عائد کیے۔",
    "سائل نے وقوعہ کی موبائل فون سے بنائی گئی ویڈیو ریکارڈنگ تفتیش کے لیے فراہم کی۔"
  ],
  observations: [
    "موقع ملاحظہ کرنے پر معلوم ہوا کہ متنازعہ دکان فی الوقت تالہ بند ہے اور آس پاس کے دکانداروں نے لڑائی کی تصدیق کی۔",
    "مقامی معززین اور اہل محلہ سے خفیہ دریافت کرنے پر سائل کا مؤقف درست پایا گیا۔",
    "موقع ملاحظہ پر زمین کا مبینہ قبضہ ثابت نہیں ہوا بلکہ فریقین کے مابین مشترکہ دیوار کا تنازعہ ملا۔",
    "فریقین کے قریبی رشتہ داروں اور محلے داروں نے دونوں کے مابین دیرینہ عداوت کی تصدیق کی ہے۔"
  ]
};
