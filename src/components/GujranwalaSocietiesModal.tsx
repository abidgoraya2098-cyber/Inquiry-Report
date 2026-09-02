import React, { useState, useMemo } from "react";
import { 
  Search, 
  MapPin, 
  Building2, 
  Shield, 
  Copy, 
  Check, 
  X, 
  Sparkles, 
  Compass, 
  ChevronRight, 
  ExternalLink,
  Navigation,
  Layers,
  Home
} from "lucide-react";

export interface SocietyItem {
  id: string;
  nameUrdu: string;
  nameEng: string;
  category: "society" | "colony" | "mohalla" | "chowk" | "town";
  categoryLabel: string;
  roadZone: string;
  policeStation: string;
  popularLandmark?: string;
  description?: string;
}

export const GUJRANWALA_AREAS: SocietyItem[] = [
  // ==================== 1. PREMIER HOUSING SOCIETIES ====================
  {
    id: "dha_gujranwala",
    nameUrdu: "ڈی ایچ اے گوجرانوالہ (DHA)",
    nameEng: "DHA Gujranwala",
    category: "society",
    categoryLabel: "ہاؤسنگ سوسائٹی",
    roadZone: "جی ٹی روڈ / کینٹ ایریا",
    policeStation: "تھانہ کینٹ / تھانہ راہوالی، گوجرانوالہ",
    popularLandmark: "نزد راہوالی کینٹ و جی ٹی روڈ",
    description: "گوجرانوالہ کی سب سے بڑی اور جدید ترین ایلیٹ ہاؤسنگ اتھارٹی"
  },
  {
    id: "master_city",
    nameUrdu: "ماسٹر سٹی گوجرانوالہ (Master City)",
    nameEng: "Master City Gujranwala",
    category: "society",
    categoryLabel: "ہاؤسنگ سوسائٹی",
    roadZone: "سیالکوٹ بائی پاس روڈ / اپر چناب کینال",
    policeStation: "تھانہ کینٹ / تھانہ سول لائنز، گوجرانوالہ",
    popularLandmark: "نزد سیالکوٹ بائی پاس نہر چناب",
    description: "انتہائی پرائم اور لگژری ہاؤسنگ سوسائٹی مع جدید سہولیات"
  },
  {
    id: "citi_housing_p1",
    nameUrdu: "سٹی ہاؤسنگ فیز 1 (Citi Housing Phase 1)",
    nameEng: "Citi Housing Phase 1",
    category: "society",
    categoryLabel: "ہاؤسنگ سوسائٹی",
    roadZone: "اپر چناب نہر / سیالکوٹ بائی پاس",
    policeStation: "تھانہ کینٹ، گوجرانوالہ",
    popularLandmark: "نہر کنارے بالمقابل ماسٹر سٹی",
    description: "گولڈ مونوگرام جدید ترین رہائشی پروجیکٹ"
  },
  {
    id: "citi_housing_p2",
    nameUrdu: "سٹی ہاؤسنگ فیز 2 (Citi Housing Phase 2)",
    nameEng: "Citi Housing Phase 2",
    category: "society",
    categoryLabel: "ہاؤسنگ سوسائٹی",
    roadZone: "سیالکوٹ روڈ / گوندلانوالہ",
    policeStation: "تھانہ اروپ / تھانہ صدر، گوجرانوالہ",
    popularLandmark: "سیالکوٹ روڈ بائی پاس",
    description: "وسیع رقبے پر محیط فیز ٹو رہائشی سوسائٹی"
  },
  {
    id: "royal_palm_city",
    nameUrdu: "رائل پام سٹی (Royal Palm City)",
    nameEng: "Royal Palm City",
    category: "society",
    categoryLabel: "ہاؤسنگ سوسائٹی",
    roadZone: "مین جی ٹی روڈ",
    policeStation: "تھانہ صدر، گوجرانوالہ",
    popularLandmark: "جی ٹی روڈ نزد چندہ قلعہ",
    description: "پام سوسائٹیز گروپ کا بین الاقوامی طرز کا پروجیکٹ"
  },
  {
    id: "dc_colony",
    nameUrdu: "ڈی سی کالونی (DC Colony)",
    nameEng: "DC Colony",
    category: "society",
    categoryLabel: "ہاؤسنگ سوسائٹی",
    roadZone: "راہوالی کینٹ / جی ٹی روڈ",
    policeStation: "تھانہ کینٹ، گوجرانوالہ",
    popularLandmark: "نزد راہوالی ریلوے اسٹیشن و کینٹ",
    description: "افسران و اعلیٰ سرکاری و نجی سوسائٹی"
  },
  {
    id: "wapda_town_p1",
    nameUrdu: "واپڈا ٹاؤن فیز 1 (WAPDA Town Phase 1)",
    nameEng: "WAPDA Town Phase 1",
    category: "society",
    categoryLabel: "ہاؤسنگ سوسائٹی",
    roadZone: "پنڈی بائی پاس روڈ",
    policeStation: "تھانہ گرجاکھ / تھانہ کوتوالی، گوجرانوالہ",
    popularLandmark: "پنڈی بائی پاس انٹرچینج",
    description: "واپڈا ملازمین و شہریوں کی مشہور ماڈل سوسائٹی"
  },
  {
    id: "wapda_town_p2",
    nameUrdu: "واپڈا ٹاؤن فیز 2 (WAPDA Town Phase 2)",
    nameEng: "WAPDA Town Phase 2",
    category: "society",
    categoryLabel: "ہاؤسنگ سوسائٹی",
    roadZone: "پنڈی بائی پاس / حافظ آباد روڈ",
    policeStation: "تھانہ گرجاکھ، گوجرانوالہ",
    popularLandmark: "نزد واپڈا ٹاؤن ایکسٹینشن",
    description: "فیز ٹو واپڈا ٹاؤن رہائشی بلاکس"
  },
  {
    id: "garden_town",
    nameUrdu: "گارڈن ٹاؤن (Garden Town)",
    nameEng: "Garden Town Gujranwala",
    category: "society",
    categoryLabel: "ہاؤسنگ سوسائٹی",
    roadZone: "شیرانوالہ بائی پاس / پنڈی بائی پاس",
    policeStation: "تھانہ پیپلز کالونی، گوجرانوالہ",
    popularLandmark: "نزد شیل پٹرول پمپ بائی پاس",
    description: "پرامن اور منظم رہائشی سوسائٹی"
  },
  {
    id: "canal_view",
    nameUrdu: "کینال ویو ہاؤسنگ سکیم (Canal View)",
    nameEng: "Canal View Housing Scheme",
    category: "society",
    categoryLabel: "ہاؤسنگ سوسائٹی",
    roadZone: "نندی پور روڈ / کینال بینک",
    policeStation: "تھانہ کینٹ / تھانہ نندی پور، گوجرانوالہ",
    popularLandmark: "نہر اپر چناب کینال روڈ",
    description: "خوبصورت نہر کنارے واقع رہائشی علاقہ"
  },
  {
    id: "fazaia_housing",
    nameUrdu: "فضائیہ ہاؤسنگ سکیم (Fazaia Housing Scheme)",
    nameEng: "Fazaia Housing Scheme",
    category: "society",
    categoryLabel: "ہاؤسنگ سوسائٹی",
    roadZone: "راہوالی کینٹ بائی پاس",
    policeStation: "تھانہ کینٹ، گوجرانوالہ",
    popularLandmark: "پاکستان ایئر فورس بیس و کینٹ روڈ",
    description: "پی اے ایف کا باوقار سیکیور رہائشی منصوبہ"
  },
  {
    id: "judicial_colony",
    nameUrdu: "جوڈیشل ہاؤسنگ سوسائٹی (Judicial Colony)",
    nameEng: "Judicial Housing Society",
    category: "society",
    categoryLabel: "ہاؤسنگ سوسائٹی",
    roadZone: "سیالکوٹ بائی پاس روڈ",
    policeStation: "تھانہ اروپ، گوجرانوالہ",
    popularLandmark: "نزد ڈسٹرکٹ کورٹس و بائی پاس",
    description: "وکلاء اور ججز کی رہائشی سوسائٹی"
  },
  {
    id: "g_magnolia",
    nameUrdu: "جی میگنولیا پارک (G Magnolia Park)",
    nameEng: "G Magnolia Park",
    category: "society",
    categoryLabel: "ہاؤسنگ سوسائٹی",
    roadZone: "مین جی ٹی روڈ",
    policeStation: "تھانہ صدر، گوجرانوالہ",
    popularLandmark: "جی ٹی روڈ نزد چندہ قلعہ بائی پاس",
    description: "جدید سوسائٹی مع کمرشل پلازہ و پارکس"
  },
  {
    id: "palm_city",
    nameUrdu: "پام سٹی (Palm City Gujranwala)",
    nameEng: "Palm City",
    category: "society",
    categoryLabel: "ہاؤسنگ سوسائٹی",
    roadZone: "وزیر آباد روڈ",
    policeStation: "تھانہ کینٹ / تھانہ راہوالی، گوجرانوالہ",
    popularLandmark: "وزیر آباد روڈ نزد گھکڑ لنک",
    description: "وزیر آباد روڈ پر تیز رفتاری سے ابھرتی سوسائٹی"
  },
  {
    id: "shalimar_town",
    nameUrdu: "شالیمار ٹاؤن (Shalimar Town)",
    nameEng: "Shalimar Town",
    category: "society",
    categoryLabel: "ہاؤسنگ سوسائٹی",
    roadZone: "سیالکوٹ روڈ بائی پاس",
    policeStation: "تھانہ اروپ، گوجرانوالہ",
    popularLandmark: "سیالکوٹ روڈ کراسنگ",
    description: "سیالکوٹ روڈ کی معروف سوسائٹی"
  },
  {
    id: "super_city",
    nameUrdu: "سپر سٹی ہاؤسنگ سکیم (Super City)",
    nameEng: "Super City",
    category: "society",
    categoryLabel: "ہاؤسنگ سوسائٹی",
    roadZone: "قلعہ دیدار سنگھ روڈ",
    policeStation: "تھانہ قلعہ دیدار سنگھ، گوجرانوالہ",
    popularLandmark: "قلعہ دیدار سنگھ مین انٹرنس",
    description: "قلعہ دیدار سنگھ روڈ کی پرائم سوسائٹی"
  },
  {
    id: "al_raaziq_garden",
    nameUrdu: "الرازق گارڈن (Al-Raziq Garden)",
    nameEng: "Al-Raziq Garden",
    category: "society",
    categoryLabel: "ہاؤسنگ سوسائٹی",
    roadZone: "پسروڑ روڈ",
    policeStation: "تھانہ اروپ، گوجرانوالہ",
    popularLandmark: "پسروڑ بائی پاس روڈ",
    description: "پسروڑ لنک کی پرسکون رہائشی آبادی"
  },
  {
    id: "muhafiz_town",
    nameUrdu: "محافظ ٹاؤن (Muhafiz Town)",
    nameEng: "Muhafiz Town",
    category: "society",
    categoryLabel: "ہاؤسنگ سوسائٹی",
    roadZone: "پنڈی بائی پاس / شاہین آباد",
    policeStation: "تھانہ شاہین آباد، گوجرانوالہ",
    popularLandmark: "نزد شاہین آباد کراسنگ",
    description: "پولیس اور سیکیورٹی فورسز کے تعاون سے بنی سوسائٹی"
  },

  // ==================== 2. FAMOUS COLONIES & TOWNS ====================
  {
    id: "model_town",
    nameUrdu: "ماڈل ٹاؤن گوجرانوالہ (Model Town)",
    nameEng: "Model Town Gujranwala",
    category: "colony",
    categoryLabel: "کالونی / ٹاؤن",
    roadZone: "جی ٹی روڈ / شیرانوالہ باغ",
    policeStation: "تھانہ سول لائنز، گوجرانوالہ",
    popularLandmark: "ٹرسٹ پلازہ، ماڈل ٹاؤن مارکیٹ، پارک",
    description: "گوجرانوالہ کا دل اور سب سے پرانا وی آئی پی رہائشی و کمرشل ایریا"
  },
  {
    id: "satellite_town",
    nameUrdu: "سیٹلائٹ ٹاؤن (بلاکس A, B, C, D) (Satellite Town)",
    nameEng: "Satellite Town",
    category: "colony",
    categoryLabel: "کالونی / ٹاؤن",
    roadZone: "پنڈی بائی پاس / کچہری روڈ",
    policeStation: "تھانہ سیٹلائٹ ٹاؤن، گوجرانوالہ",
    popularLandmark: "مین مارکیٹ سیٹلائٹ ٹاؤن، راوی کالج، ڈی سی روڈ",
    description: "تعلیمی اداروں، تجارتی مراکز اور رہائشی بلاکس کا گڑھ"
  },
  {
    id: "peoples_colony",
    nameUrdu: "پیپلز کالونی (Peoples Colony)",
    nameEng: "Peoples Colony",
    category: "colony",
    categoryLabel: "کالونی / ٹاؤن",
    roadZone: "سیالکوٹ روڈ / چندہ قلعہ لنک",
    policeStation: "تھانہ پیپلز کالونی، گوجرانوالہ",
    popularLandmark: "پیپلز کالونی جامع مسجد و کمرشل مارکیٹ",
    description: "شہر کا مرکزی اور گنجان معروف رہائشی علاقہ"
  },
  {
    id: "civil_lines",
    nameUrdu: "سول لائنز (Civil Lines)",
    nameEng: "Civil Lines Gujranwala",
    category: "colony",
    categoryLabel: "کالونی / ٹاؤن",
    roadZone: "کمشنر آفس روڈ / کچہری روڈ",
    policeStation: "تھانہ سول لائنز، گوجرانوالہ",
    popularLandmark: "سی پی او آفس، ڈویژنل کمشنر ہاؤس، سیشن کورٹس",
    description: "تمام سرکاری دفاتر اور انتظامی ہیڈکوارٹرز کا مرکز"
  },
  {
    id: "doctors_colony",
    nameUrdu: "ڈاکٹرز کالونی (Doctor's Colony)",
    nameEng: "Doctor's Colony",
    category: "colony",
    categoryLabel: "کالونی / ٹاؤن",
    roadZone: "ڈی ایچ کیو ہسپتال روڈ / سول لائنز",
    policeStation: "تھانہ سول لائنز، گوجرانوالہ",
    popularLandmark: "ڈسٹرکٹ ہیڈکوارٹر ٹیچنگ ہسپتال",
    description: "طبی ماہرین اور پروفیشنلز کا رہائشی زون"
  },
  {
    id: "professors_colony",
    nameUrdu: "پروفیسرز کالونی (Professors Colony)",
    nameEng: "Professors Colony",
    category: "colony",
    categoryLabel: "کالونی / ٹاؤن",
    roadZone: "گورنمنٹ کالج روڈ / ریلوے لائن",
    policeStation: "تھانہ کوتوالی، گوجرانوالہ",
    popularLandmark: "گورنمنٹ پوسٹ گریجویٹ اسلامیہ کالج",
    description: "اساتذہ و ماہرینِ تعلیم کا تاریخی رہائشی ایریا"
  },
  {
    id: "gulshan_colony",
    nameUrdu: "گلشن کالونی (Gulshan Colony)",
    nameEng: "Gulshan Colony",
    category: "colony",
    categoryLabel: "کالونی / ٹاؤن",
    roadZone: "حافظ آباد روڈ",
    policeStation: "تھانہ گرجاکھ، گوجرانوالہ",
    popularLandmark: "حافظ آباد روڈ بائی پاس",
    description: "حافظ آباد روڈ کی پرانی اور معروف کالونی"
  },
  {
    id: "clifton_town",
    nameUrdu: "کلفٹن ٹاؤن (Clifton Town)",
    nameEng: "Clifton Town",
    category: "colony",
    categoryLabel: "کالونی / ٹاؤن",
    roadZone: "پنڈی بائی پاس لنک",
    policeStation: "تھانہ گرجاکھ، گوجرانوالہ",
    popularLandmark: "نزد واپڈا ٹاؤن بائی پاس",
    description: "جدید طرز کی نجی آبادی"
  },
  {
    id: "rehman_city",
    nameUrdu: "رحمٰن سٹی و گرین ٹاؤن (Rehman City & Green Town)",
    nameEng: "Rehman City",
    category: "colony",
    categoryLabel: "کالونی / ٹاؤن",
    roadZone: "سیالکوٹ بائی پاس",
    policeStation: "تھانہ اروپ، گوجرانوالہ",
    popularLandmark: "بائی پاس کینال کراسنگ",
    description: "درمیانے طبقے کی تیزی سے آباد ہوتی کالونی"
  },
  {
    id: "kashmir_colony",
    nameUrdu: "کشمیر کالونی و خیابانِ اقبال (Kashmir Colony)",
    nameEng: "Kashmir Colony",
    category: "colony",
    categoryLabel: "کالونی / ٹاؤن",
    roadZone: "کشمیر روڈ / جی ٹی روڈ",
    policeStation: "تھانہ پیپلز کالونی، گوجرانوالہ",
    popularLandmark: "کشمیر روڈ چوک",
    description: "کشمیر روڈ کی اہم رہائشی و کاروباری بستی"
  },
  {
    id: "farid_town",
    nameUrdu: "فرید ٹاؤن و اسلام پورہ (Farid Town & Islampura)",
    nameEng: "Farid Town",
    category: "colony",
    categoryLabel: "کالونی / ٹاؤن",
    roadZone: "پسروڑ روڈ / چندہ قلعہ",
    policeStation: "تھانہ باغبانپورہ، گوجرانوالہ",
    popularLandmark: "باغبانپورہ بائی پاس لنک",
    description: "روایتی پرامن کالونی"
  },

  // ==================== 3. FAMOUS LOCAL AREAS & MOHALLAS ====================
  {
    id: "garjakh",
    nameUrdu: "گرجاکھ (Garjakh)",
    nameEng: "Garjakh",
    category: "mohalla",
    categoryLabel: "قدیمی علاقہ / محلہ",
    roadZone: "گرجاکھ روڈ / حافظ آباد روڈ",
    policeStation: "تھانہ گرجاکھ، گوجرانوالہ",
    popularLandmark: "گرجاکھ بازار، مین چوک، گرجاکھ قبرستان",
    description: "گوجرانوالہ کا سب سے بڑا اور قدیمی تاریخی قصبہ و محلہ"
  },
  {
    id: "baghbanpura",
    nameUrdu: "باغبانپورہ (Baghbanpura)",
    nameEng: "Baghbanpura",
    category: "mohalla",
    categoryLabel: "قدیمی علاقہ / محلہ",
    roadZone: "پسروڑ روڈ / سیالکوٹ پھاٹک",
    policeStation: "تھانہ باغبانپورہ، گوجرانوالہ",
    popularLandmark: "باغبانپورہ مین بازار، لوہے کی فیکٹریاں",
    description: "صنعتی اور گنجان آباد معروف ترین پرانا علاقہ"
  },
  {
    id: "dhulley",
    nameUrdu: "دھلے (Dhulley)",
    nameEng: "Dhulley",
    category: "mohalla",
    categoryLabel: "قدیمی علاقہ / محلہ",
    roadZone: "دھلے چوک / گوندلانوالہ روڈ",
    policeStation: "تھانہ دھلے، گوجرانوالہ",
    popularLandmark: "دھلے چوک، سبزی منڈی لنک، دھلے پل",
    description: "تھانہ دھلے کی حدود کا اہم اور بڑا آبادی والا علاقہ"
  },
  {
    id: "gondlanwala",
    nameUrdu: "گوندلانوالہ و گوندلانوالہ روڈ (Gondlanwala)",
    nameEng: "Gondlanwala",
    category: "mohalla",
    categoryLabel: "قدیمی علاقہ / محلہ",
    roadZone: "گوندلانوالہ روڈ / پرانی سبزی منڈی",
    policeStation: "تھانہ گوندلانوالہ / تھانہ دھلے، گوجرانوالہ",
    popularLandmark: "گوندلانوالہ اڈا، ریلوے پھاٹک",
    description: "قدیم تجارتی راستہ اور گنجان علاقہ"
  },
  {
    id: "khiyali",
    nameUrdu: "خیالی و شاہ پور (Khiyali Shahpur)",
    nameEng: "Khiyali Shahpur",
    category: "mohalla",
    categoryLabel: "قدیمی علاقہ / محلہ",
    roadZone: "خیالی بائی پاس / شیخوپورہ روڈ",
    policeStation: "تھانہ خیالی شاہ پور، گوجرانوالہ",
    popularLandmark: "خیالی پل، شیخوپورہ موڑ بائی پاس",
    description: "صنعتی فیکٹریوں اور وسیع آبادی کا مرکز"
  },
  {
    id: "aroop",
    nameUrdu: "اروپ و اروپ روڈ (Aroop)",
    nameEng: "Aroop",
    category: "mohalla",
    categoryLabel: "قدیمی علاقہ / محلہ",
    roadZone: "اروپ روڈ / سیالکوٹ بائی پاس",
    policeStation: "تھانہ اروپ، گوجرانوالہ",
    popularLandmark: "اروپ ہائی سکول، سیالکوٹ روڈ کراسنگ",
    description: "تھانہ اروپ کا مرکزی تاریخی گاؤں اور شہری بستی"
  },
  {
    id: "ferozewala",
    nameUrdu: "فیروز والہ (Ferozewala Gujranwala)",
    nameEng: "Ferozewala",
    category: "mohalla",
    categoryLabel: "قدیمی علاقہ / محلہ",
    roadZone: "فیروز والہ روڈ / جی ٹی روڈ",
    policeStation: "تھانہ فیروز والہ / تھانہ صدر، گوجرانوالہ",
    popularLandmark: "فیروز والہ چوک و بازار",
    description: "جی ٹی روڈ پر واقع پرانا گنجان علاقہ"
  },
  {
    id: "kotli_peer_ahmed",
    nameUrdu: "کوٹلی پیر احمد شاہ (Kotli Peer Ahmed Shah)",
    nameEng: "Kotli Peer Ahmed Shah",
    category: "mohalla",
    categoryLabel: "قدیمی علاقہ / محلہ",
    roadZone: "پنڈی بائی پاس / قلعہ دیدار سنگھ روڈ",
    policeStation: "تھانہ قلعہ دیدار سنگھ / گرجاکھ، گوجرانوالہ",
    popularLandmark: "دربار پیر احمد شاہ",
    description: "مشہور روحانی و تاریخی گاؤں اور رہائشی علاقہ"
  },
  {
    id: "shaheenabad",
    nameUrdu: "شاہین آباد (Shaheenabad)",
    nameEng: "Shaheenabad",
    category: "mohalla",
    categoryLabel: "قدیمی علاقہ / محلہ",
    roadZone: "پنڈی بائی پاس / گرجاکھ لنک",
    policeStation: "تھانہ شاہین آباد، گوجرانوالہ",
    popularLandmark: "شاہین آباد چوک، جامعہ مسجد شاہین آباد",
    description: "تھانہ شاہین آباد کا گنجان شہری علاقہ"
  },
  {
    id: "kangniwala",
    nameUrdu: "کنگنی والا (Kangniwala)",
    nameEng: "Kangniwala",
    category: "mohalla",
    categoryLabel: "قدیمی علاقہ / محلہ",
    roadZone: "جی ٹی روڈ / چندہ قلعہ لنک",
    policeStation: "تھانہ صدر، گوجرانوالہ",
    popularLandmark: "کنگنی والا بائی پاس فلائی اوور",
    description: "جی ٹی روڈ بائی پاس انٹرچینج کا اہم مقام"
  },
  {
    id: "attawa",
    nameUrdu: "اٹووا (Attawa)",
    nameEng: "Attawa",
    category: "mohalla",
    categoryLabel: "قدیمی علاقہ / محلہ",
    roadZone: "جی ٹی روڈ / چندہ قلعہ",
    policeStation: "تھانہ صدر، گوجرانوالہ",
    popularLandmark: "اٹووا فلائی اوور جی ٹی روڈ",
    description: "جی ٹی روڈ کا بڑا دیہی و نیم شہری علاقہ"
  },
  {
    id: "kot_mian_khan",
    nameUrdu: "کوٹ میاں خان و کوٹ اسحاق (Kot Mian Khan)",
    nameEng: "Kot Mian Khan",
    category: "mohalla",
    categoryLabel: "قدیمی علاقہ / محلہ",
    roadZone: "حافظ آباد روڈ",
    policeStation: "تھانہ قلعہ دیدار سنگھ، گوجرانوالہ",
    popularLandmark: "حافظ آباد روڈ نہر پل",
    description: "حافظ آباد روڈ کی اہم آبادی"
  },

  // ==================== 4. FAMOUS CHOWKS & COMMERCIAL BAZARS ====================
  {
    id: "chanda_qila",
    nameUrdu: "چندہ قلعہ چوک (Chanda Qila)",
    nameEng: "Chanda Qila Chowk",
    category: "chowk",
    categoryLabel: "مشہور چوک / بازار",
    roadZone: "جی ٹی روڈ و بائی پاس جنکشن",
    policeStation: "تھانہ صدر، گوجرانوالہ",
    popularLandmark: "چندہ قلعہ بائی پاس، لاہور روڈ انٹرنس",
    description: "لاہور کی جانب سے گوجرانوالہ کا مین داخلی گیٹ و چوک"
  },
  {
    id: "aziz_cross",
    nameUrdu: "عزیز کراس / پنڈی بائی پاس چوک (Aziz Cross)",
    nameEng: "Aziz Cross Chowk",
    category: "chowk",
    categoryLabel: "مشہور چوک / بازار",
    roadZone: "جی ٹی روڈ و پنڈی بائی پاس",
    policeStation: "تھانہ سیٹلائٹ ٹاؤن / سول لائنز، گوجرانوالہ",
    popularLandmark: "عزیز کراس فلائی اوور، پنڈی بائی پاس",
    description: "اسلام آباد اور پنڈی روڈ کا مرکزی جنکشن فلائی اوور"
  },
  {
    id: "sialkot_bypass_chowk",
    nameUrdu: "سیالکوٹ بائی پاس چوک (Sialkot Bypass Chowk)",
    nameEng: "Sialkot Bypass",
    category: "chowk",
    categoryLabel: "مشہور چوک / بازار",
    roadZone: "سیالکوٹ بائی پاس و جی ٹی روڈ",
    policeStation: "تھانہ کینٹ / اروپ، گوجرانوالہ",
    popularLandmark: "سیالکوٹ روڈ فلائی اوور، اپر چناب کینال برج",
    description: "سیالکوٹ موٹروے و بائی پاس کا انتہائی مصروف چوک"
  },
  {
    id: "climax_chowk",
    nameUrdu: "کلائمکس چوک (Climax Chowk)",
    nameEng: "Climax Chowk",
    category: "chowk",
    categoryLabel: "مشہور چوک / بازار",
    roadZone: "جی ٹی روڈ سینٹرل",
    policeStation: "تھانہ ماڈل ٹاؤن / سول لائنز، گوجرانوالہ",
    popularLandmark: "کلائمکس فین فیکٹری، جی ٹی روڈ",
    description: "جی ٹی روڈ کا تاریخی صنعتی و کمرشل چوک"
  },
  {
    id: "sheranwala_bagh",
    nameUrdu: "شیرانوالہ باغ و کچہری چوک (Sheranwala Bagh)",
    nameEng: "Sheranwala Bagh",
    category: "chowk",
    categoryLabel: "مشہور چوک / بازار",
    roadZone: "جی ٹی روڈ / پرانا شہر",
    policeStation: "تھانہ کوتوالی، گوجرانوالہ",
    popularLandmark: "شیرانوالہ باغ اسٹیڈیم، کچہری چوک",
    description: "گوجرانوالہ کا تاریخی اسٹیڈیم اور مرکزی چوک"
  },
  {
    id: "urdu_bazar",
    nameUrdu: "اردو بازار و صرافہ بازار (Urdu Bazar)",
    nameEng: "Urdu Bazar & Sarafa Bazar",
    category: "chowk",
    categoryLabel: "مشہور چوک / بازار",
    roadZone: "اندرون شہر / ریل بازار",
    policeStation: "تھانہ کوتوالی، گوجرانوالہ",
    popularLandmark: "گھنٹہ گھر، صرافہ مارکیٹ، کتاب مارکیٹ",
    description: "کتابوں، سونے، کپڑے اور ہول سیل تجارت کا ایشیا کا بڑا بازار"
  },
  {
    id: "rail_bazar",
    nameUrdu: "ریل بازار و دال بازار (Rail Bazar & Dal Bazar)",
    nameEng: "Rail Bazar",
    category: "chowk",
    categoryLabel: "مشہور چوک / بازار",
    roadZone: "پرانا ریلوے اسٹیشن ایریا",
    policeStation: "تھانہ کوتوالی، گوجرانوالہ",
    popularLandmark: "گوجرانوالہ پرانا ریلوے اسٹیشن",
    description: "اناج، دالیں اور روایتی کھانوں کا تاریخی مرکز"
  },

  // ==================== 5. TEHSILS, TOWNS & CANTONMENT ====================
  {
    id: "rahwali_cantt",
    nameUrdu: "راہوالی کینٹ (Rahwali Cantonment)",
    nameEng: "Rahwali Cantt",
    category: "town",
    categoryLabel: "تحصیل / قصبہ / کینٹ",
    roadZone: "جی ٹی روڈ نارتھ",
    policeStation: "تھانہ کینٹ / تھانہ راہوالی، گوجرانوالہ",
    popularLandmark: "کینٹ آرمی گیٹ، شوگر ملز روڈ، ریلوے اسٹیشن",
    description: "فوجی چھاؤنی اور وسیع شہری علاقہ"
  },
  {
    id: "kamoke",
    nameUrdu: "کامونکی (Kamoke)",
    nameEng: "Kamoke Tehsil",
    category: "town",
    categoryLabel: "تحصیل / قصبہ / کینٹ",
    roadZone: "جی ٹی روڈ ساؤتھ (لاہور روڈ)",
    policeStation: "تھانہ سٹی کامونکی / تھانہ صدر کامونکی، گوجرانوالہ",
    popularLandmark: "کامونکی چاول منڈی، کامونکی کچہری",
    description: "ضلع گوجرانوالہ کی سب سے بڑی تحصیل اور چاول کی عالمی منڈی"
  },
  {
    id: "qila_didar_singh",
    nameUrdu: "قلعہ دیدار سنگھ (Qila Didar Singh)",
    nameEng: "Qila Didar Singh",
    category: "town",
    categoryLabel: "تحصیل / قصبہ / کینٹ",
    roadZone: "حافظ آباد روڈ ویسٹ",
    policeStation: "تھانہ قلعہ دیدار سنگھ، گوجرانوالہ",
    popularLandmark: "دیدار سنگھ قلعہ، اناج منڈی",
    description: "تحصیل قلعہ دیدار سنگھ کا ہیڈکوارٹر اور تاریخی تجارتی مرکز"
  },
  {
    id: "eminabad",
    nameUrdu: "ایمن آباد و موڑ ایمن آباد (Eminabad)",
    nameEng: "Eminabad",
    category: "town",
    categoryLabel: "تحصیل / قصبہ / کینٹ",
    roadZone: "جی ٹی روڈ / پرانا ایمن آباد روڈ",
    policeStation: "تھانہ ایمن آباد، گوجرانوالہ",
    popularLandmark: "گردوارہ روڑی صاحب، ایمن آباد موڑ",
    description: "تاریخی سکھ یاترا گاہ اور گوجرانوالہ کا پرانا قصبہ"
  },
  {
    id: "ghakhar_mandi",
    nameUrdu: "گکھڑ منڈی (Ghakhar Mandi)",
    nameEng: "Ghakhar Mandi",
    category: "town",
    categoryLabel: "تحصیل / قصبہ / کینٹ",
    roadZone: "جی ٹی روڈ نارتھ (وزیر آباد بارڈر)",
    policeStation: "تھانہ گکھڑ منڈی، گوجرانوالہ",
    popularLandmark: "گکھڑ منڈی ریلوے اسٹیشن، دریاں منڈی",
    description: "دریوں اور قالین بافی کا بین الاقوامی شہر"
  },
  {
    id: "nandipur",
    nameUrdu: "نندی پور (Nandipur)",
    nameEng: "Nandipur",
    category: "town",
    categoryLabel: "تحصیل / قصبہ / کینٹ",
    roadZone: "سیالکوٹ روڈ / نہر اپر چناب",
    policeStation: "تھانہ اروپ / تھانہ کینٹ، گوجرانوالہ",
    popularLandmark: "نندی پور پاور پلانٹ، ہائیڈرو ریسرچ اسٹیشن",
    description: "پاور پلانٹ اور نہری ریسرچ سینٹر کا علاقہ"
  },
  {
    id: "alipur_chattha",
    nameUrdu: "علی پور چٹھہ (Alipur Chattha)",
    nameEng: "Alipur Chattha",
    category: "town",
    categoryLabel: "تحصیل / قصبہ / کینٹ",
    roadZone: "علی پور روڈ / قادر آباد لنک",
    policeStation: "تھانہ علی پور چٹھہ، گوجرانوالہ",
    popularLandmark: "چٹھہ ہاؤس، نہر قادر آباد",
    description: "ضلع گوجرانوالہ کی تحصیل وزیر آباد کا بڑا زرعی قصبہ"
  },
  {
    id: "nowshera_virkan",
    nameUrdu: "نوشہرہ ورکاں (Nowshera Virkan)",
    nameEng: "Nowshera Virkan",
    category: "town",
    categoryLabel: "تحصیل / قصبہ / کینٹ",
    roadZone: "شیخوپورہ روڈ لنک",
    policeStation: "تھانہ نوشہرہ ورکاں، گوجرانوالہ",
    popularLandmark: "کچہری نوشہرہ ورکاں، چاول مارکیٹ",
    description: "گوجرانوالہ کی اہم زرعی و کچہری تحصیل"
  }
];

interface GujranwalaSocietiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectArea?: (area: SocietyItem, targetMode?: "address" | "station" | "subject") => void;
}

export const GujranwalaSocietiesModal: React.FC<GujranwalaSocietiesModalProps> = ({
  isOpen,
  onClose,
  onSelectArea
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    { id: "all", label: "تمام علاقے و سوسائٹیز", count: GUJRANWALA_AREAS.length },
    { id: "society", label: "🏡 ہاؤسنگ سوسائٹیز", count: GUJRANWALA_AREAS.filter(a => a.category === "society").length },
    { id: "colony", label: "🏢 کالونیز و ٹاؤنز", count: GUJRANWALA_AREAS.filter(a => a.category === "colony").length },
    { id: "mohalla", label: "🏘️ قدیمی محلے و علاقے", count: GUJRANWALA_AREAS.filter(a => a.category === "mohalla").length },
    { id: "chowk", label: "🚦 مشہور چوک و بازار", count: GUJRANWALA_AREAS.filter(a => a.category === "chowk").length },
    { id: "town", label: "🏛️ تحصیلیں و قصبات", count: GUJRANWALA_AREAS.filter(a => a.category === "town").length },
  ];

  const filteredAreas = useMemo(() => {
    let list = GUJRANWALA_AREAS;

    if (activeCategory !== "all") {
      list = list.filter(item => item.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item => 
        item.nameUrdu.toLowerCase().includes(q) ||
        item.nameEng.toLowerCase().includes(q) ||
        item.roadZone.toLowerCase().includes(q) ||
        item.policeStation.toLowerCase().includes(q) ||
        (item.popularLandmark && item.popularLandmark.toLowerCase().includes(q))
      );
    }

    return list;
  }, [searchQuery, activeCategory]);

  const handleCopyName = (item: SocietyItem, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.nameUrdu);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApplyToAddress = (item: SocietyItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onSelectArea) {
      onSelectArea(item, "address");
    }
    onClose();
  };

  const handleApplyToStation = (item: SocietyItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onSelectArea) {
      onSelectArea(item, "station");
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn" dir="rtl">
      <div 
        className="bg-slate-900 border border-amber-400/40 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ================= MODAL HEADER & SEARCH BAR ================= */}
        <div className="bg-gradient-to-r from-[#051124] via-[#091f3d] to-[#040e1d] border-b border-amber-400/30 p-4 sm:p-6 space-y-4">
          
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-400/20 shrink-0">
                <Compass className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-black text-white font-naskh flex items-center gap-2">
                  گوجرانوالہ سوسائٹیز و لوکل ایریاز ڈائریکٹری
                  <span className="bg-amber-400/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full border border-amber-400/40 font-mono font-bold">
                    {GUJRANWALA_AREAS.length} مقامات
                  </span>
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  گوجرانوالہ کی تمام ہاؤسنگ سوسائٹیز، کالونیز، محلے، چوک اور متعلقہ تھانہ جات کی تلاش
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 hover:bg-slate-800/60 rounded-full cursor-pointer transition-colors"
              title="بند کریں (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* REALTIME EXPANDED SEARCH INPUT (Looks like Spotlight) */}
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-amber-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="تلاش کریں سوسائٹی، علاقہ، روڈ، یا تھانہ (مثلاً: ڈی ایچ اے، ماسٹر سٹی، ماڈل ٹاؤن، کینٹ، گرجاکھ، چندہ قلعہ)..."
              className="w-full bg-slate-950/90 border-2 border-amber-400/60 focus:border-amber-300 rounded-2xl pr-11 pl-10 py-3.5 text-sm sm:text-base font-bold text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-amber-400/20 shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* CATEGORY FILTER TABS */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    isActive
                      ? "bg-amber-400 text-slate-950 shadow-md font-black"
                      : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700"
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? "bg-slate-950/20 text-slate-950 font-mono" : "bg-slate-900 text-slate-400 font-mono"}`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

        </div>

        {/* ================= MAIN CONTENT LIST & DETAILS ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-slate-950/60">
          
          {filteredAreas.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-3">
              <MapPin className="w-12 h-12 mx-auto text-slate-600 animate-pulse" />
              <p className="text-base font-bold text-slate-300">کوئی سوسائٹی یا علاقہ نہیں ملا</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                آپ نے جو لفظ تلاش کیا ہے وہ لسٹ میں نہیں ہے۔ براہِ کرم اردو یا انگریزی میں دوسرا نام لکھ کر دیکھیں۔
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredAreas.map((item) => {
                const isCopied = copiedId === item.id;
                return (
                  <div
                    key={item.id}
                    className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-amber-400/60 rounded-2xl p-4 transition-all shadow-md flex flex-col justify-between gap-3 group"
                  >
                    <div className="space-y-2">
                      
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="bg-amber-400/10 text-amber-300 text-[10px] px-2.5 py-0.5 rounded-lg border border-amber-400/30 font-bold">
                          {item.categoryLabel}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleCopyName(item, e)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              isCopied 
                                ? "bg-emerald-500 text-slate-950 font-black" 
                                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                            }`}
                            title="علاقے کا نام کاپی کریں"
                          >
                            {isCopied ? <Check className="w-3 h-3 text-slate-950" /> : <Copy className="w-3 h-3 text-amber-400" />}
                            <span>{isCopied ? "کاپی ہو گیا!" : "کاپی"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Name in Urdu & English */}
                      <div>
                        <h3 className="text-base font-black text-white group-hover:text-amber-300 transition-colors font-naskh">
                          {item.nameUrdu}
                        </h3>
                        <p className="text-xs text-slate-400 font-mono font-semibold" dir="ltr">
                          {item.nameEng}
                        </p>
                      </div>

                      {/* Location & Police Station Info */}
                      <div className="space-y-1 pt-2 border-t border-slate-800 text-xs">
                        <div className="flex items-start gap-1.5 text-slate-300">
                          <Navigation className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span><strong className="text-slate-400">روڈ / زون:</strong> {item.roadZone}</span>
                        </div>

                        <div className="flex items-start gap-1.5 text-indigo-300">
                          <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                          <span><strong className="text-indigo-400">متعلقہ تھانہ:</strong> {item.policeStation}</span>
                        </div>

                        {item.popularLandmark && (
                          <div className="flex items-start gap-1.5 text-slate-400 text-[11px]">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span><strong className="text-emerald-400">مشہور نشان:</strong> {item.popularLandmark}</span>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Quick Action Insert Buttons */}
                    <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={(e) => handleApplyToAddress(item, e)}
                        className="bg-gradient-to-r from-emerald-900 to-teal-900 hover:from-emerald-800 hover:to-teal-800 active:scale-95 text-emerald-200 border border-emerald-700/60 px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-xs"
                        title="سائل کے پتہ یا سکنہ میں شامل کریں"
                      >
                        <Home className="w-3 h-3 text-emerald-400" />
                        <span>سکنہ / پتہ میں لگائیں</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleApplyToStation(item, e)}
                        className="bg-indigo-950 hover:bg-indigo-900 active:scale-95 text-indigo-200 border border-indigo-700/60 px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-xs"
                        title="رپورٹ کا متعلقہ تھانہ سیٹ کریں"
                      >
                        <Shield className="w-3 h-3 text-indigo-400" />
                        <span>تھانہ سیٹ کریں</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* ================= FOOTER BAR ================= */}
        <div className="bg-slate-900 border-t border-slate-800 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>گوجرانوالہ ڈویژن کی تمام آفیشل ہاؤسنگ سوسائٹیز، کینٹ، ٹاؤنز اور تھانہ جات لائیو فعال ہیں۔</span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-xl font-bold cursor-pointer transition-all border border-slate-700"
          >
            بند کریں (Close)
          </button>
        </div>

      </div>
    </div>
  );
};
