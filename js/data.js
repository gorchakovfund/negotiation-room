// Loads the case bank from data/*.json. The only file that knows where cases come from,
// so a future backend replaces this file, not the screens.

let taxonomy = null;
let situations = [];
let lang = "en";

export async function loadData() {
  const [tax, sit] = await Promise.all([
    fetch("data/taxonomy.json", { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error("taxonomy.json " + r.status); return r.json(); }),
    fetch("data/situations.json", { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error("situations.json " + r.status); return r.json(); }),
  ]);
  taxonomy = tax;
  situations = sit.situations;
}

// Text in the current language, falling back to English.
export const t = (obj) => (obj == null ? "" : typeof obj === "string" ? obj : obj[lang] ?? obj.en ?? "");

export const getPeriods = () => taxonomy.periods;
export const getRegions = () => taxonomy.regions;
export const getSituations = () => situations;

export const periodLabel = (code) => t(taxonomy.periods.find(p => p.code === code)?.label);
export const regionLabel = (code) => t(taxonomy.regions.find(r => r.code === code)?.label);

// Stage 3 will add: public mode shows only status === "validated".
const visible = () => situations;

export const periodsWithCases = () =>
  taxonomy.periods.filter(p => visible().some(s => s.period === p.code));

export const regionsFor = (period) =>
  new Set(visible().filter(s => s.period === period).map(s => s.region));

export const findSituation = (period, region) =>
  visible().find(s => s.period === period && s.region === region);
