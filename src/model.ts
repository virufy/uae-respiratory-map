// ---------------------------------------------------------------------------
// SIMULATED surveillance model. Every figure here is synthetic and illustrative.
// No real EHS site, patient, partner, or clinical-study value appears anywhere.
//
// Each emirate has a baseline respiratory index and screening volume. A selected
// season and an optional forecast scenario scale that load; a small modeled
// projection sits beside the observed value for the location detail card.
// ---------------------------------------------------------------------------

export type Lang = "en" | "ar";
export type Season = "spring" | "summer" | "autumn" | "winter";
export type SignalKey = "asthma" | "uri" | "bronch" | "rhin" | "pneu";
export type ScenarioKey = "baseline" | "winter" | "dust" | "flu" | "school";

export interface Emirate {
  code: string;
  geoName: string; // must match GeoJSON properties.shapeName
  en: string;
  ar: string;
  base: number; // annual-mean respiratory index (0-100)
  vol: number; // children screened (30d baseline)
  pop: number; // illustrative child population (for coverage rate)
  sig: SignalKey; // dominant local signal
  pfac: number; // modeled projection / observed ratio (illustrative forecast)
}

// 7 emirates, aligned 1:1 with the ADM1 GeoJSON features.
export const EMIRATES: Emirate[] = [
  { code: "AUH", geoName: "Abu Dhabi",      en: "Abu Dhabi",     ar: "أبوظبي",     base: 47, vol: 5200, pop: 720000, sig: "uri",    pfac: 1.05 },
  { code: "DXB", geoName: "Dubai",          en: "Dubai",         ar: "دبي",        base: 58, vol: 6340, pop: 520000, sig: "asthma", pfac: 0.97 },
  { code: "SHJ", geoName: "Sharjah",        en: "Sharjah",       ar: "الشارقة",    base: 66, vol: 3120, pop: 300000, sig: "asthma", pfac: 1.04 },
  { code: "AJM", geoName: "Ajman",          en: "Ajman",         ar: "عجمان",      base: 61, vol: 1040, pop: 130000, sig: "bronch", pfac: 0.95 },
  { code: "UAQ", geoName: "Umm al-Quwain",  en: "Umm Al Quwain", ar: "أم القيوين", base: 49, vol: 430,  pop: 26000,  sig: "uri",    pfac: 1.08 },
  { code: "RAK", geoName: "Ras al-Khaimah", en: "Ras Al Khaimah",ar: "رأس الخيمة", base: 70, vol: 1210, pop: 130000, sig: "asthma", pfac: 1.02 },
  { code: "FUJ", geoName: "Fujairah",       en: "Fujairah",      ar: "الفجيرة",    base: 51, vol: 820,  pop: 95000,  sig: "rhin",   pfac: 0.93 },
];

export const emById = new Map(EMIRATES.map((e) => [e.code, e]));

// --- season load -----------------------------------------------------------
export const SEASON_FACTOR: Record<Season, { i: number; v: number }> = {
  spring: { i: 0.9, v: 0.95 },
  summer: { i: 0.8, v: 0.86 },
  autumn: { i: 1.05, v: 1.02 },
  winter: { i: 1.24, v: 1.12 },
};
export const SEASON_ORDER: Season[] = ["spring", "summer", "autumn", "winter"];

// --- forecast scenarios (compact "what-if" chips) --------------------------
export interface Scenario {
  key: ScenarioKey;
  iMul: number; // respiratory-index multiplier
  vMul: number; // screening-volume multiplier
}
export const SCENARIOS: Scenario[] = [
  { key: "baseline", iMul: 1.0, vMul: 1.0 },
  { key: "winter", iMul: 1.16, vMul: 1.14 },
  { key: "dust", iMul: 1.12, vMul: 0.96 },
  { key: "flu", iMul: 1.22, vMul: 1.2 },
  { key: "school", iMul: 1.08, vMul: 1.12 },
];
export const scenarioByKey = (k: ScenarioKey) => SCENARIOS.find((s) => s.key === k)!;

// --- effective (season + scenario adjusted) values --------------------------
export const effIdx = (e: Emirate, s: Season, sc: Scenario) =>
  Math.min(96, e.base * SEASON_FACTOR[s].i * sc.iMul);
export const effVol = (e: Emirate, s: Season, sc: Scenario) =>
  Math.round(e.vol * SEASON_FACTOR[s].v * sc.vMul);
export const covOf = (e: Emirate, s: Season, sc: Scenario) =>
  (effVol(e, s, sc) / e.pop) * 1000;
export const predIdx = (e: Emirate, s: Season, sc: Scenario) =>
  Math.min(98, Math.round(effIdx(e, s, sc) * e.pfac));

// --- 5-tier severity scale (Low → Critical) ---------------------------------
export interface Tier {
  key: string;
  c: string;
  min: number; // inclusive index threshold
}
// Single-hue warm-red sequential scale (light → deep), the epidemiology standard.
export const TIERS: Tier[] = [
  { key: "low",      c: "#fccbb4", min: 0 },
  { key: "moderate", c: "#f79479", min: 44 },
  { key: "elevated", c: "#ef5f4c", min: 56 },
  { key: "high",     c: "#d62f2f", min: 68 },
  { key: "critical", c: "#9e1515", min: 80 },
];
export function tierOf(idx: number): number {
  let i = 0;
  while (i < TIERS.length - 1 && idx >= TIERS[i + 1].min) i++;
  return i;
}
export const tierColor = (idx: number) => TIERS[tierOf(idx)].c;
// legible text colour on a tier-coloured pill/marker (pale tiers → dark, deep → white)
export const tierText = (idx: number) => (tierOf(idx) <= 1 ? "#7a1f12" : "#ffffff");

// --- presenting signals + age bands ----------------------------------------
export const SIGNALS: { k: SignalKey; v: number }[] = [
  { k: "asthma", v: 33 },
  { k: "uri", v: 29 },
  { k: "bronch", v: 15 },
  { k: "rhin", v: 14 },
  { k: "pneu", v: 9 },
];
export const AGE_BANDS: { k: string; v: number }[] = [
  { k: "a0", v: 14 },
  { k: "a1", v: 38 },
  { k: "a5", v: 31 },
  { k: "a10", v: 17 },
];

// 12-month national median-index shape (winter peak). Last point tied to season.
export const TREND_SHAPE = [52, 60, 71, 74, 66, 57, 49, 44, 46, 50, 55, 58];

// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------
export interface Dict {
  title: string;
  subtitle: string;
  demo: string;
  discB: string;
  disc: string;
  // controls
  location: string;
  allEmirates: string;
  season: string;
  scenario: string;
  scenarioNote: string;
  scen: Record<ScenarioKey, string>;
  scenNote: Record<ScenarioKey, string>;
  seasonCap: Record<Season, string>;
  signal: string;
  all: string;
  // kpis
  k1: string; k1m: string;
  k2: string; k2m: string;
  k3: string; k3u: string; k3m: string;
  // map
  mapTitle: string;
  mapHintAll: string;
  mapHintOne: (name: string) => string;
  lgSeverity: string;
  lgSize: string;
  positionsNote: string;
  viewAll: string;
  // detail
  national: string;
  dIndex: string;
  dScreened: string;
  dCoverage: string;
  dSignal: string;
  dModeled: string;
  rankTitle: string;
  rankHint: string;
  // charts
  sigTitle: string;
  sigSub: string;
  ageTitle: string;
  ageSub: string;
  trTitle: string;
  trHint: string;
  trActual: string;
  trModeled: string;
  // explainer
  whatTitle: string;
  what: string;
  mCough: string; mBreath: string; mVoice: string;
  appNote: string;
  // shared
  perThousand: string;
  tier: Record<string, string>;
  seasonName: Record<Season, string>;
  sig: Record<SignalKey, string>;
  age: Record<string, string>;
  months: string[];
}

export const T: Record<Lang, Dict> = {
  en: {
    title: "UAE Respiratory Disease Map",
    subtitle: "Pediatric respiratory monitoring · app-based cough screening",
    demo: "Test data",
    discB: "Illustrative demonstration.",
    disc: "All figures are simulated. Nothing here represents a real patient, site, partner, or clinical result.",
    location: "Location",
    allEmirates: "All emirates",
    season: "Season",
    scenario: "Forecast scenario",
    scenarioNote: "A what-if that scales the respiratory load across every emirate.",
    scen: {
      baseline: "Baseline",
      winter: "Winter surge",
      dust: "Dust storm",
      flu: "Flu season",
      school: "School return",
    },
    scenNote: {
      baseline: "Seasonal load only, no added stressor.",
      winter: "Cold-season viral load lifts the index and submissions.",
      dust: "Airborne dust pushes asthma & wheeze up.",
      flu: "Influenza wave, the steepest index and volume rise.",
      school: "Term restart nudges viral spread.",
    },
    seasonCap: {
      spring: "Spring: mild load; allergic rhinitis ticks up with pollen and dust.",
      summer: "Summer: lowest respiratory load; heat keeps children indoors.",
      autumn: "Autumn: term restart and cooler air lift viral submissions.",
      winter: "Winter: peak load; flu/RSV and asthma drive the index up.",
    },
    signal: "Signal",
    all: "All",
    k1: "Children screened",
    k1m: "past 30 days · scenario-adjusted",
    k2: "Median respiratory index",
    k2m: "national, this view",
    k3: "Elevated emirates",
    k3u: "of 7",
    k3m: "respiratory index ≥ 56",
    mapTitle: "Respiratory signal by emirate",
    mapHintAll: "Circle size = children screened · colour = respiratory index",
    mapHintOne: (nm) => `Zoomed to ${nm} · select “All emirates” to zoom out`,
    lgSeverity: "Respiratory index",
    lgSize: "Circle = children screened",
    positionsNote: "Geography real · data simulated",
    viewAll: "All emirates",
    national: "National",
    dIndex: "Respiratory index",
    dScreened: "Children screened",
    dCoverage: "Screening coverage",
    dSignal: "Top signal",
    dModeled: "Modeled next-month",
    rankTitle: "Emirates ranked",
    rankHint: "Select one to zoom the map",
    sigTitle: "Presenting respiratory signals",
    sigSub: "Share of screenings",
    ageTitle: "Children screened by age band",
    ageSub: "Distribution",
    trTitle: "Seasonal respiratory trend · 12 months",
    trHint: "National median index; winter peak highlighted",
    trActual: "Observed",
    trModeled: "Modeled",
    whatTitle: "What this is",
    what: "A demonstration prototype. Emirate positions are real; every screening count, index and signal is a synthetic model built to show how app-based pediatric cough & breath screening could surface a respiratory signal across the seven emirates, season by season. It is not a raw data export. Swap in a real per-emirate feed before any clinical or partner audience.",
    mCough: "Cough",
    mBreath: "Breath",
    mVoice: "Voice",
    appNote: "A 30-second cough, breath and voice recording, scored by Virufy's respiratory AI at the point of care.",
    perThousand: "per 1,000",
    tier: { low: "Low", moderate: "Moderate", elevated: "Elevated", high: "High", critical: "Critical" },
    seasonName: { spring: "Spring", summer: "Summer", autumn: "Autumn", winter: "Winter" },
    sig: {
      asthma: "Asthma & wheeze",
      uri: "Viral URI (flu / RSV)",
      bronch: "Bronchiolitis",
      rhin: "Allergic rhinitis",
      pneu: "Pneumonia",
    },
    age: { a0: "Under 1 yr", a1: "1 to 4 yrs", a5: "5 to 9 yrs", a10: "10 to 14 yrs" },
    months: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
  },
  ar: {
    title: "خريطة أمراض الجهاز التنفسي، الإمارات",
    subtitle: "ترصد صحة الجهاز التنفسي للأطفال · فحص السعال عبر التطبيق",
    demo: "بيانات تجريبية",
    discB: "عرض توضيحي.",
    disc: "جميع الأرقام محاكاة. لا شيء هنا يمثل مريضًا أو موقعًا أو شريكًا أو نتيجة سريرية حقيقية.",
    location: "الموقع",
    allEmirates: "كل الإمارات",
    season: "الموسم",
    scenario: "سيناريو التوقّع",
    scenarioNote: "افتراض يضبط الحمل التنفسي عبر كل الإمارات.",
    scen: {
      baseline: "الوضع الأساسي",
      winter: "موجة شتوية",
      dust: "عاصفة غبار",
      flu: "موسم الإنفلونزا",
      school: "العودة للمدارس",
    },
    scenNote: {
      baseline: "الحمل الموسمي فقط، دون ضغط إضافي.",
      winter: "الحمل الفيروسي البارد يرفع المؤشر والفحوصات.",
      dust: "الغبار المحمول جوًّا يرفع الربو والصفير.",
      flu: "موجة إنفلونزا، أعلى ارتفاع في المؤشر والحجم.",
      school: "عودة الدراسة تزيد الانتشار الفيروسي.",
    },
    seasonCap: {
      spring: "الربيع: حمل خفيف؛ يرتفع التهاب الأنف التحسسي مع اللقاح والغبار.",
      summer: "الصيف: أدنى حمل تنفسي؛ الحرارة تُبقي الأطفال في الداخل.",
      autumn: "الخريف: عودة الدراسة والهواء الأبرد يرفعان الفحوصات الفيروسية.",
      winter: "الشتاء: ذروة الحمل؛ الإنفلونزا/RSV والربو يرفعان المؤشر.",
    },
    signal: "الإشارة",
    all: "الكل",
    k1: "الأطفال المفحوصون",
    k1m: "آخر ٣٠ يومًا · معدّل حسب السيناريو",
    k2: "مؤشر التنفس الوسيط",
    k2m: "وطنيًا، لهذا العرض",
    k3: "الإمارات المرتفعة",
    k3u: "من ٧",
    k3m: "مؤشر التنفس ≥ ٥٦",
    mapTitle: "الإشارة التنفسية حسب الإمارة",
    mapHintAll: "حجم الدائرة = الأطفال المفحوصون · اللون = مؤشر التنفس",
    mapHintOne: (nm) => `تكبير على ${nm} · اختر «كل الإمارات» للتصغير`,
    lgSeverity: "مؤشر التنفس",
    lgSize: "الدائرة = الأطفال المفحوصون",
    positionsNote: "الجغرافيا حقيقية · البيانات محاكاة",
    viewAll: "كل الإمارات",
    national: "وطني",
    dIndex: "مؤشر التنفس",
    dScreened: "الأطفال المفحوصون",
    dCoverage: "تغطية الفحص",
    dSignal: "الإشارة الأبرز",
    dModeled: "توقّع الشهر القادم",
    rankTitle: "ترتيب الإمارات",
    rankHint: "اختر واحدة لتكبير الخريطة",
    sigTitle: "الإشارات التنفسية عند المراجعة",
    sigSub: "نسبة الفحوصات",
    ageTitle: "المفحوصون حسب الفئة العمرية",
    ageSub: "التوزيع",
    trTitle: "الاتجاه الموسمي للتنفس · ١٢ شهرًا",
    trHint: "المؤشر الوطني الوسيط؛ مع إبراز ذروة الشتاء",
    trActual: "المرصود",
    trModeled: "المتوقّع",
    whatTitle: "ما هذا",
    what: "نموذج توضيحي. مواقع الإمارات حقيقية؛ أما كل عدد فحص ومؤشر وإشارة فهو نموذج اصطناعي يوضّح كيف يمكن لفحص السعال والتنفّس عبر التطبيق أن يُظهر إشارة تنفسية عبر الإمارات السبع، موسمًا بموسم. وهو ليس تصديرًا لبيانات حقيقية. استبدله ببثّ حقيقي لكل إمارة قبل أي عرض سريري أو أمام شريك.",
    mCough: "سعال",
    mBreath: "تنفّس",
    mVoice: "صوت",
    appNote: "تسجيل قصير للسعال والتنفّس والصوت (٣٠ ثانية) يقيّمه الذكاء الاصطناعي التنفّسي من Virufy عند نقطة الرعاية.",
    perThousand: "لكل ١٬٠٠٠",
    tier: { low: "منخفض", moderate: "متوسط", elevated: "مرتفع", high: "عالٍ", critical: "حرج" },
    seasonName: { spring: "الربيع", summer: "الصيف", autumn: "الخريف", winter: "الشتاء" },
    sig: {
      asthma: "الربو والصفير",
      uri: "عدوى فيروسية علوية (إنفلونزا/RSV)",
      bronch: "التهاب القصيبات",
      rhin: "التهاب الأنف التحسسي",
      pneu: "الالتهاب الرئوي",
    },
    age: { a0: "أقل من سنة", a1: "١ إلى ٤ سنوات", a5: "٥ إلى ٩ سنوات", a10: "١٠ إلى ١٤ سنة" },
    months: ["أكتوبر", "نوفمبر", "ديسمبر", "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر"],
  },
};

export function localeNum(n: number, lang: Lang): string {
  return n.toLocaleString(lang === "ar" ? "ar-EG" : "en-US");
}
