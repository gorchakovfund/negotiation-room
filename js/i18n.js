// Interface language. Case texts use t() in data.js, which reads the same language.
export const LANGS = ["en", "ru"];
let lang = "en";
let strings = { en: {}, ru: {} };

const STORE_KEY = "nr-lang";

export async function loadUi() {
  const r = await fetch("data/ui-text.json", { cache: "no-cache" });
  if (!r.ok) throw new Error("ui-text.json " + r.status);
  strings = await r.json();

  // ?lang=ru in the address wins, then the visitor's last choice, then the browser language.
  const fromUrl = new URLSearchParams(location.search).get("lang");
  let saved = null;
  try { saved = localStorage.getItem(STORE_KEY); } catch { /* storage blocked: fine */ }
  const browser = (navigator.language || "").toLowerCase().startsWith("ru") ? "ru" : "en";
  const chosen = fromUrl ?? saved;
  lang = [fromUrl, saved, browser].find(l => LANGS.includes(l)) ?? "en";
  document.documentElement.lang = lang;
  if (chosen && LANGS.includes(chosen)) { try { localStorage.setItem(STORE_KEY, lang); } catch { /* ignore */ } }
}

export const getLang = () => lang;

export function setLang(l) {
  if (!LANGS.includes(l)) return;
  lang = l;
  document.documentElement.lang = l;
  try { localStorage.setItem(STORE_KEY, l); } catch { /* ignore */ }
}

// ui("task_rule", { n: 3 }) → text with {n} replaced. Falls back to English, then to the key.
export function ui(key, vars = {}, l = lang) {
  const s = strings[l]?.[key] ?? strings.en?.[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));
}
