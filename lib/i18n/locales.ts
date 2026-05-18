export type Locale = "en" | "fr" | "pt" | "ar" | "sw";

export const LOCALES: Array<{ code: Locale; name: string; native: string; flag: string; rtl?: boolean }> = [
  { code: "en", name: "English", native: "English", flag: "🇬🇧" },
  { code: "fr", name: "French", native: "Français", flag: "🇫🇷" },
  { code: "pt", name: "Portuguese", native: "Português", flag: "🇵🇹" },
  { code: "ar", name: "Arabic", native: "العربية", flag: "🇸🇦", rtl: true },
  { code: "sw", name: "Swahili", native: "Kiswahili", flag: "🇰🇪" }
];

export const DEFAULT_LOCALE: Locale = "en";

// Minimal translation map — covers the landing hero and primary CTAs.
// Production rollout uses next-intl with per-locale JSON files.
export const STRINGS: Record<Locale, Record<string, string>> = {
  en: {
    "hero.eyebrow": "AfriOrigin — AfCFTA compliance in seconds",
    "hero.title.a": "Stop paying $300 per shipment",
    "hero.title.b": "to figure out AfCFTA.",
    "hero.body":
      "Tell us what you're shipping. We'll classify it, check the Rules of Origin, calculate your tariff savings, and generate a Certificate of Origin — in 60 seconds, in your language.",
    "hero.cta.primary": "Run a free determination",
    "hero.cta.secondary": "See pricing",
    "translation.notice": "You are viewing the English version."
  },
  fr: {
    "hero.eyebrow": "AfriOrigin — Conformité ZLECAf en quelques secondes",
    "hero.title.a": "Arrêtez de payer 300 $ par expédition",
    "hero.title.b": "pour comprendre la ZLECAf.",
    "hero.body":
      "Dites-nous ce que vous expédiez. Nous le classerons, vérifierons les règles d'origine, calculerons vos économies de droits de douane et générerons un certificat d'origine — en 60 secondes, dans votre langue.",
    "hero.cta.primary": "Lancer une analyse gratuite",
    "hero.cta.secondary": "Voir les tarifs",
    "translation.notice": "Vous consultez la version française."
  },
  pt: {
    "hero.eyebrow": "AfriOrigin — Conformidade ZCLCA em segundos",
    "hero.title.a": "Pare de pagar 300 $ por remessa",
    "hero.title.b": "para entender a ZCLCA.",
    "hero.body":
      "Diga-nos o que está a expedir. Iremos classificá-lo, verificar as Regras de Origem, calcular as suas poupanças tarifárias e gerar um Certificado de Origem — em 60 segundos, no seu idioma.",
    "hero.cta.primary": "Executar uma análise gratuita",
    "hero.cta.secondary": "Ver preços",
    "translation.notice": "Está a ver a versão em português."
  },
  ar: {
    "hero.eyebrow": "أفري أوريجين — الامتثال للزلكاف في ثوانٍ",
    "hero.title.a": "توقف عن دفع 300 دولار لكل شحنة",
    "hero.title.b": "لفهم منطقة التجارة الحرة القارية الإفريقية.",
    "hero.body":
      "أخبرنا بما تشحنه. سنصنفه ونتحقق من قواعد المنشأ ونحسب وفوراتك الجمركية وننشئ شهادة منشأ — في 60 ثانية، بلغتك.",
    "hero.cta.primary": "ابدأ تقييماً مجانياً",
    "hero.cta.secondary": "عرض الأسعار",
    "translation.notice": "أنت تشاهد النسخة العربية."
  },
  sw: {
    "hero.eyebrow": "AfriOrigin — Utii wa AfCFTA kwa sekunde",
    "hero.title.a": "Acha kulipa $300 kwa kila shehena",
    "hero.title.b": "ili kuelewa AfCFTA.",
    "hero.body":
      "Tuambie unachosafirisha. Tutaainisha, kuangalia Kanuni za Asili, kuhesabu akiba yako ya ushuru, na kutengeneza Cheti cha Asili — kwa sekunde 60, kwa lugha yako.",
    "hero.cta.primary": "Endesha uchunguzi wa bure",
    "hero.cta.secondary": "Tazama bei",
    "translation.notice": "Unaangalia toleo la Kiswahili."
  }
};

export function t(locale: Locale, key: string): string {
  return STRINGS[locale]?.[key] ?? STRINGS[DEFAULT_LOCALE][key] ?? key;
}
