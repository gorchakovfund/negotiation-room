import { state, subscribe, reset, SCREEN_ORDER } from "./state.js";
import { SCREENS, bindCommon } from "./screens.js";
import { loadData } from "./data.js";
import { loadUi, ui, getLang, setLang } from "./i18n.js";

const main = document.getElementById("main");
const progress = document.getElementById("progress");
const announcer = document.getElementById("announcer");

// Text that lives in index.html rather than in a screen.
function applyStaticText() {
  document.title = ui("page_title");
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = ui(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-label]").forEach(el => { el.setAttribute("aria-label", ui(el.dataset.i18nLabel)); });
  document.querySelectorAll("[data-lang]").forEach(b => {
    const on = b.dataset.lang === getLang();
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  if (restart) restart.textContent = ui("restart");
}

function renderProgress() {
  const current = SCREEN_ORDER.indexOf(state.screen);
  progress.innerHTML = SCREEN_ORDER.map((id, i) => {
    const cls = i < current ? "is-done" : i === current ? "is-current" : "";
    const cur = i === current ? ` aria-current="step"` : "";
    return `<li class="${cls}"${cur}><span class="visually-hidden">${i + 1}. ${SCREENS[id].label()}</span></li>`;
  }).join("");
}

function render({ keepFocus = false } = {}) {
  const screen = SCREENS[state.screen];
  main.innerHTML = screen.render(state);
  screen.bind?.(main);
  renderProgress();

  // Move focus to the new heading so keyboard and screen-reader users land in the right place.
  if (!keepFocus) {
    const title = main.querySelector("#screen-title");
    if (title) { title.setAttribute("tabindex", "-1"); title.focus({ preventScroll: true }); }
    window.scrollTo({ top: 0 });
  }
  announcer.textContent = ui("step_announce", { i: SCREEN_ORDER.indexOf(state.screen) + 1, n: SCREEN_ORDER.length, label: screen.label() });
}

// Stage 1 convenience only: restart the prototype. Removed from public mode in Stage 3.
const footer = document.querySelector(".footer");
const restart = document.createElement("button");
restart.type = "button";
restart.className = "lang";
restart.style.marginLeft = "12px";
restart.addEventListener("click", reset);
footer.append(restart);

// Language switch: works on any screen and keeps the applicant exactly where they are.
// Repair the buttons first, in case the browser still has an older index.html cached
// (older versions shipped RU as a disabled button without data-lang).
document.querySelectorAll(".topbar__lang button").forEach(b => {
  const code = b.textContent.trim().toLowerCase();
  if (!b.dataset.lang && (code === "en" || code === "ru")) b.dataset.lang = code;
  b.disabled = false;
  b.removeAttribute("title");
});
document.querySelectorAll("[data-lang]").forEach(b => b.addEventListener("click", () => {
  if (b.dataset.lang === getLang()) return;
  const y = window.scrollY;
  setLang(b.dataset.lang);
  applyStaticText();
  render({ keepFocus: true });
  window.scrollTo({ top: y });
  b.focus();
}));

bindCommon(main, () => render());
subscribe(() => render());

try {
  await Promise.all([loadUi(), loadData()]);
  applyStaticText();
  render();
} catch (err) {
  console.error(err);
  main.innerHTML = `<section class="screen"><h1>The case files could not be loaded. / Не удалось загрузить материалы кейсов.</h1>
    <p class="lead">Please refresh the page. / Обновите страницу.</p></section>`;
}
