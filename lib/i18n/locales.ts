export type Locale = "en" | "fr" | "pt" | "ar" | "sw";

export const LOCALES: Array<{ code: Locale; name: string; native: string; flag: string; rtl?: boolean }> = [
  { code: "en", name: "English", native: "English", flag: "🇬🇧" },
  { code: "fr", name: "French", native: "Français", flag: "🇫🇷" },
  { code: "pt", name: "Portuguese", native: "Português", flag: "🇵🇹" },
  { code: "ar", name: "Arabic", native: "العربية", flag: "🇸🇦", rtl: true },
  { code: "sw", name: "Swahili", native: "Kiswahili", flag: "🇰🇪" }
];

export const DEFAULT_LOCALE: Locale = "en";

export function isRtl(locale: Locale): boolean {
  return !!LOCALES.find((l) => l.code === locale)?.rtl;
}

export const STRINGS: Record<Locale, Record<string, string>> = {
  en: {
    // Hero
    "hero.eyebrow": "AfriOrigin — AfCFTA compliance in seconds",
    "hero.title.a": "Stop paying $300 per shipment",
    "hero.title.b": "to figure out AfCFTA.",
    "hero.body":
      "Tell us what you're shipping. We'll classify it, check the Rules of Origin, calculate your tariff savings, and generate a Certificate of Origin — in 60 seconds, in your language.",
    "hero.cta.primary": "Run a free determination",
    "hero.cta.secondary": "See pricing",
    "hero.cta.tertiary": "Read the research",

    // Nav
    "nav.product": "Product",
    "nav.afriorigin": "AfriOrigin",
    "nav.pricing": "Pricing",
    "nav.developers": "Developers",
    "nav.docs": "Documentation",
    "nav.map": "Live Africa Map",
    "nav.afcfta": "AfCFTA Reference",
    "nav.marketplace": "Marketplace",
    "nav.suppliers": "Suppliers",
    "nav.logistics": "Logistics",
    "nav.research": "Research",
    "nav.about": "About",
    "nav.contact": "Contact",
    "nav.signin": "Sign in",
    "nav.start_free": "Start free",

    // Footer
    "footer.tagline": "Africa's trade engine. AfriOrigin is module one of the open TradeOS stack for the 1.3B-person AfCFTA market.",
    "footer.product": "Product",
    "footer.company": "Company",
    "footer.aligned_with": "Aligned with",
    "footer.all_operational": "All systems operational",
    "footer.copyright": "Built for the African Continental Free Trade Area.",

    // Pricing
    "pricing.title": "Compliance that pays for itself in one shipment.",
    "pricing.body": "SMEs pay freight forwarders $200-500 per shipment for AfCFTA paperwork — often blind to whether the rate even applies. AfriOrigin is a fraction of that, and you see the answer before you ship.",

    // Trust signals
    "trust.designed_with": "Designed in collaboration with",

    // Stats
    "stats.states": "State Parties covered",
    "stats.hs_codes": "HS codes mapped",
    "stats.languages": "Languages",
    "stats.time_saved": "Time saved per shipment",

    // Closing CTA
    "cta.title": "Ship under AfCFTA. In your language. In 60 seconds.",
    "cta.body": "Whether you're a Ghanaian shea cooperative, a Kenyan coffee estate, or a Zambian smelter — start with a free determination. No card, no commitment.",
    "cta.perk_a": "3 months free for early-access SMEs",
    "cta.perk_b": "Founding-cohort pricing locked for life",

    // Translation banner
    "translation.notice": "You are viewing the English version.",
    "translation.switch": "Switch language"
  },

  fr: {
    "hero.eyebrow": "AfriOrigin — Conformité ZLECAf en quelques secondes",
    "hero.title.a": "Arrêtez de payer 300 $ par expédition",
    "hero.title.b": "pour comprendre la ZLECAf.",
    "hero.body":
      "Dites-nous ce que vous expédiez. Nous le classerons, vérifierons les règles d'origine, calculerons vos économies de droits de douane et générerons un certificat d'origine — en 60 secondes, dans votre langue.",
    "hero.cta.primary": "Lancer une analyse gratuite",
    "hero.cta.secondary": "Voir les tarifs",
    "hero.cta.tertiary": "Lire la recherche",

    "nav.product": "Produit",
    "nav.afriorigin": "AfriOrigin",
    "nav.pricing": "Tarifs",
    "nav.developers": "Développeurs",
    "nav.docs": "Documentation",
    "nav.map": "Carte de l'Afrique en direct",
    "nav.afcfta": "Référence ZLECAf",
    "nav.marketplace": "Marché",
    "nav.suppliers": "Fournisseurs",
    "nav.logistics": "Logistique",
    "nav.research": "Recherche",
    "nav.about": "À propos",
    "nav.contact": "Contact",
    "nav.signin": "Se connecter",
    "nav.start_free": "Démarrer gratuitement",

    "footer.tagline": "Le moteur commercial de l'Afrique. AfriOrigin est le premier module de la pile TradeOS ouverte pour le marché de 1,3 milliard de personnes de la ZLECAf.",
    "footer.product": "Produit",
    "footer.company": "Entreprise",
    "footer.aligned_with": "Aligné avec",
    "footer.all_operational": "Tous les systèmes opérationnels",
    "footer.copyright": "Conçu pour la Zone de libre-échange continentale africaine.",

    "pricing.title": "Une conformité qui se rentabilise dès la première expédition.",
    "pricing.body": "Les PME paient aux transitaires 200 à 500 $ par expédition pour les formalités ZLECAf — souvent sans savoir si le tarif s'applique. AfriOrigin coûte une fraction de cela, et vous voyez la réponse avant d'expédier.",

    "trust.designed_with": "Conçu en collaboration avec",

    "stats.states": "États parties couverts",
    "stats.hs_codes": "Codes SH cartographiés",
    "stats.languages": "Langues",
    "stats.time_saved": "Temps économisé par expédition",

    "cta.title": "Expédiez sous ZLECAf. Dans votre langue. En 60 secondes.",
    "cta.body": "Que vous soyez une coopérative de karité au Ghana, un domaine caféier au Kenya ou une fonderie en Zambie — commencez par une analyse gratuite. Sans carte, sans engagement.",
    "cta.perk_a": "3 mois gratuits pour les PME en accès anticipé",
    "cta.perk_b": "Tarifs de cohorte fondatrice verrouillés à vie",

    "translation.notice": "Vous consultez la version française.",
    "translation.switch": "Changer de langue"
  },

  pt: {
    "hero.eyebrow": "AfriOrigin — Conformidade ZCLCA em segundos",
    "hero.title.a": "Pare de pagar 300 $ por remessa",
    "hero.title.b": "para entender a ZCLCA.",
    "hero.body":
      "Diga-nos o que está a expedir. Iremos classificá-lo, verificar as Regras de Origem, calcular as suas poupanças tarifárias e gerar um Certificado de Origem — em 60 segundos, no seu idioma.",
    "hero.cta.primary": "Executar uma análise gratuita",
    "hero.cta.secondary": "Ver preços",
    "hero.cta.tertiary": "Ler a pesquisa",

    "nav.product": "Produto",
    "nav.afriorigin": "AfriOrigin",
    "nav.pricing": "Preços",
    "nav.developers": "Programadores",
    "nav.docs": "Documentação",
    "nav.map": "Mapa da África ao vivo",
    "nav.afcfta": "Referência ZCLCA",
    "nav.marketplace": "Mercado",
    "nav.suppliers": "Fornecedores",
    "nav.logistics": "Logística",
    "nav.research": "Pesquisa",
    "nav.about": "Sobre",
    "nav.contact": "Contacto",
    "nav.signin": "Entrar",
    "nav.start_free": "Começar grátis",

    "footer.tagline": "O motor comercial da África. AfriOrigin é o módulo um da pilha TradeOS aberta para o mercado de 1,3 mil milhões de pessoas da ZCLCA.",
    "footer.product": "Produto",
    "footer.company": "Empresa",
    "footer.aligned_with": "Alinhado com",
    "footer.all_operational": "Todos os sistemas operacionais",
    "footer.copyright": "Construído para a Zona de Comércio Livre Continental Africana.",

    "pricing.title": "Conformidade que se paga numa única remessa.",
    "pricing.body": "As PMEs pagam aos transitários 200-500 $ por remessa pela papelada da ZCLCA — muitas vezes sem saber se a tarifa se aplica. O AfriOrigin custa uma fração disso, e vê a resposta antes de expedir.",

    "trust.designed_with": "Desenhado em colaboração com",

    "stats.states": "Estados Partes cobertos",
    "stats.hs_codes": "Códigos SH mapeados",
    "stats.languages": "Idiomas",
    "stats.time_saved": "Tempo poupado por remessa",

    "cta.title": "Expedir sob ZCLCA. No seu idioma. Em 60 segundos.",
    "cta.body": "Quer seja uma cooperativa de karité ganês, uma fazenda de café queniana ou uma fundição zambiana — comece com uma análise gratuita. Sem cartão, sem compromisso.",
    "cta.perk_a": "3 meses grátis para PMEs em acesso antecipado",
    "cta.perk_b": "Preços da coorte fundadora bloqueados para sempre",

    "translation.notice": "Está a ver a versão em português.",
    "translation.switch": "Mudar idioma"
  },

  ar: {
    "hero.eyebrow": "أفري أوريجين — الامتثال للزلكاف في ثوانٍ",
    "hero.title.a": "توقف عن دفع 300 دولار لكل شحنة",
    "hero.title.b": "لفهم منطقة التجارة الحرة القارية الإفريقية.",
    "hero.body":
      "أخبرنا بما تشحنه. سنصنفه ونتحقق من قواعد المنشأ ونحسب وفوراتك الجمركية وننشئ شهادة منشأ — في 60 ثانية، بلغتك.",
    "hero.cta.primary": "ابدأ تقييماً مجانياً",
    "hero.cta.secondary": "عرض الأسعار",
    "hero.cta.tertiary": "اقرأ البحث",

    "nav.product": "المنتج",
    "nav.afriorigin": "أفري أوريجين",
    "nav.pricing": "التسعير",
    "nav.developers": "المطورون",
    "nav.docs": "التوثيق",
    "nav.map": "خريطة إفريقيا المباشرة",
    "nav.afcfta": "مرجع الزلكاف",
    "nav.marketplace": "السوق",
    "nav.suppliers": "الموردون",
    "nav.logistics": "اللوجستيات",
    "nav.research": "الأبحاث",
    "nav.about": "من نحن",
    "nav.contact": "تواصل معنا",
    "nav.signin": "تسجيل الدخول",
    "nav.start_free": "ابدأ مجاناً",

    "footer.tagline": "محرك تجارة إفريقيا. أفري أوريجين هو الوحدة الأولى من حزمة TradeOS المفتوحة لسوق الزلكاف الذي يضم 1.3 مليار نسمة.",
    "footer.product": "المنتج",
    "footer.company": "الشركة",
    "footer.aligned_with": "متوافق مع",
    "footer.all_operational": "جميع الأنظمة تعمل",
    "footer.copyright": "مصمم لمنطقة التجارة الحرة القارية الإفريقية.",

    "pricing.title": "امتثال يدفع تكلفته بشحنة واحدة.",
    "pricing.body": "تدفع المؤسسات الصغيرة والمتوسطة لشركات الشحن 200-500 دولار لكل شحنة لأوراق الزلكاف — في كثير من الأحيان دون معرفة ما إذا كان السعر ينطبق. أفري أوريجين جزء من ذلك، وترى الإجابة قبل الشحن.",

    "trust.designed_with": "مصمم بالتعاون مع",

    "stats.states": "الدول الأطراف المغطاة",
    "stats.hs_codes": "رموز النظام المنسق المعرّفة",
    "stats.languages": "اللغات",
    "stats.time_saved": "الوقت الموفر لكل شحنة",

    "cta.title": "اشحن تحت الزلكاف. بلغتك. في 60 ثانية.",
    "cta.body": "سواء كنت تعاونية شيا غانية أو مزرعة قهوة كينية أو مصهر نحاس زامبي — ابدأ بتقييم مجاني. بدون بطاقة، بدون التزام.",
    "cta.perk_a": "3 أشهر مجانية للشركات الصغيرة والمتوسطة في الوصول المبكر",
    "cta.perk_b": "أسعار المؤسسين الأوائل ثابتة مدى الحياة",

    "translation.notice": "أنت تشاهد النسخة العربية.",
    "translation.switch": "تغيير اللغة"
  },

  sw: {
    "hero.eyebrow": "AfriOrigin — Utii wa AfCFTA kwa sekunde",
    "hero.title.a": "Acha kulipa $300 kwa kila shehena",
    "hero.title.b": "ili kuelewa AfCFTA.",
    "hero.body":
      "Tuambie unachosafirisha. Tutaainisha, kuangalia Kanuni za Asili, kuhesabu akiba yako ya ushuru, na kutengeneza Cheti cha Asili — kwa sekunde 60, kwa lugha yako.",
    "hero.cta.primary": "Endesha uchunguzi wa bure",
    "hero.cta.secondary": "Tazama bei",
    "hero.cta.tertiary": "Soma utafiti",

    "nav.product": "Bidhaa",
    "nav.afriorigin": "AfriOrigin",
    "nav.pricing": "Bei",
    "nav.developers": "Watengenezaji",
    "nav.docs": "Maelezo",
    "nav.map": "Ramani ya Afrika Moja kwa Moja",
    "nav.afcfta": "Marejeleo ya AfCFTA",
    "nav.marketplace": "Soko",
    "nav.suppliers": "Wasambazaji",
    "nav.logistics": "Lojistiki",
    "nav.research": "Utafiti",
    "nav.about": "Kuhusu",
    "nav.contact": "Wasiliana",
    "nav.signin": "Ingia",
    "nav.start_free": "Anza bure",

    "footer.tagline": "Injini ya biashara ya Afrika. AfriOrigin ni moduli ya kwanza ya rundo wazi la TradeOS kwa soko la watu bilioni 1.3 la AfCFTA.",
    "footer.product": "Bidhaa",
    "footer.company": "Kampuni",
    "footer.aligned_with": "Inafanya kazi na",
    "footer.all_operational": "Mifumo yote inafanya kazi",
    "footer.copyright": "Imejengwa kwa Eneo Huru la Biashara la Bara la Afrika.",

    "pricing.title": "Utii unaolipa gharama yake kwa shehena moja.",
    "pricing.body": "SMEs hulipa wasafiri $200-500 kwa kila shehena kwa karatasi za AfCFTA — mara nyingi bila kujua kama kiwango kinatumika. AfriOrigin ni sehemu ya hiyo, na unaona jibu kabla ya kusafirisha.",

    "trust.designed_with": "Imetengenezwa kwa ushirikiano na",

    "stats.states": "Nchi Wanachama zinazofikiwa",
    "stats.hs_codes": "Misimbo ya HS iliyochorwa",
    "stats.languages": "Lugha",
    "stats.time_saved": "Muda uliokokolewa kwa shehena",

    "cta.title": "Safirisha chini ya AfCFTA. Kwa lugha yako. Kwa sekunde 60.",
    "cta.body": "Iwe wewe ni ushirika wa shea wa Ghana, shamba la kahawa la Kenya, au kiyeyusha cha Zambia — anza na uchunguzi wa bure. Hakuna kadi, hakuna ahadi.",
    "cta.perk_a": "Miezi 3 bure kwa SMEs za ufikiaji wa mapema",
    "cta.perk_b": "Bei za kundi la kwanza zimefungwa milele",

    "translation.notice": "Unaangalia toleo la Kiswahili.",
    "translation.switch": "Badilisha lugha"
  }
};

export function t(locale: Locale, key: string): string {
  return STRINGS[locale]?.[key] ?? STRINGS[DEFAULT_LOCALE][key] ?? key;
}
