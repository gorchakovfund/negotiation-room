// Loads the case bank from data/*.json. The only file that knows where cases come from,
// so a future backend replaces this file, not the screens.
import { getLang } from "./i18n.js";

let taxonomy = null;
let situations = [];

export async function loadData() {
  const [tax, sit] = await Promise.all([
    fetch("data/taxonomy.json", { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error("taxonomy.json " + r.status); return r.json(); }),
    fetch("data/situations.json", { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error("situations.json " + r.status); return r.json(); }),
  ]);
  taxonomy = tax;
  situations = sit.situations;
}

// Text in the current language (or the one given), falling back to English.
export const t = (obj, l = getLang()) => (obj == null ? "" : typeof obj === "string" ? obj : obj[l] || obj.en || "");

export const getPeriods = () => taxonomy.periods;
export const getRegions = () => taxonomy.regions;
export const getThemes = () => taxonomy.themes;
export const getSituations = () => situations;

export const periodLabel = (code, l) => t(taxonomy.periods.find(p => p.code === code)?.label, l);
export const regionLabel = (code, l) => t(taxonomy.regions.find(r => r.code === code)?.label, l);
export const themeLabel = (code, l) => t(taxonomy.themes.find(x => x.code === code)?.label, l);

// Stage 3 will add: public mode shows only status === "validated".
const visible = () => situations;

export const periodsWithCases = () =>
  taxonomy.periods.filter(p => visible().some(s => s.period === p.code));

export const themesFor = (period) =>
  new Set(visible().filter(s => s.period === period).map(s => s.theme));

export const situationsFor = (period, theme) =>
  visible().filter(s => s.period === period && s.theme === theme);
