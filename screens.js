// One render function per screen. All interface text comes from data/ui-text.json via ui();
// all case text comes from data/situations.json via t().
import { state, set, next, back, go } from "./state.js";
import { t, periodsWithCases, periodLabel, getThemes, themesFor, themeLabel } from "./data.js";
import { ui, getLang } from "./i18n.js";
import { assignCase } from "./assign.js";
import { CONFIG } from "./config.js";

const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const $ = (root, sel) => root.querySelector(sel);
const N = { n: CONFIG.videoMaxMinutes };

// Case IDs may wrap on narrow screens, but only at a hyphen.
const idHtml = (id) => esc(id).replaceAll("-", "-<wbr>");

const backBtn = () => `<button type="button" class="btn btn--ghost" data-action="back">${ui("back")}</button>`;

// "Parties at the table": public position + what constrains each party.
// Real interests are deliberately left for the applicant to work out.
const partiesHtml = (parties) => `
  <section class="parties" aria-label="${esc(ui("parties"))}">
    <h2 class="parties__h">${ui("parties")}</h2>
    <ul class="parties__list">
      ${parties.map(p => `
        <li class="party">
          <p class="party__name">${esc(t(p.name))}</p>
          <p class="party__row"><span>${ui("position")}</span>${esc(t(p.position))}</p>
          <p class="party__row"><span>${ui("constraint")}</span>${esc(t(p.constraint))}</p>
        </li>`).join("")}
    </ul>
  </section>`;

// Reveal screens have two phases: a teaser line + button, then the content.
const reveal = { role: false, development: false };

export const SCREENS = {
  /* 01 ---------------------------------------------------------------- */
  welcome: {
    label: () => ui("label_welcome"),
    render: () => `
      <section class="screen">
        <p class="eyebrow">${ui("welcome_eyebrow")}</p>
        <h1 class="display" id="screen-title">${ui("title")}</h1>
        <p class="subtitle">${ui("subtitle")}</p>
        <div class="lead">
          <p>${ui("welcome_p1")}</p>
          <p>${ui("welcome_p2")}</p>
          <p>${ui("welcome_p3")}</p>
          <p>${ui("welcome_p4", N)}</p>
        </div>
        <div class="actions">
          <button type="button" class="btn" data-action="next">${ui("welcome_btn")}</button>
        </div>
      </section>`,
  },

  /* 01b --------------------------------------------------------------- */
  identify: {
    label: () => ui("label_identify"),
    render: () => `
      <section class="screen">
        <p class="eyebrow">${ui("id_eyebrow")}</p>
        <h1 id="screen-title">${ui("id_title")}</h1>
        <p class="lead">${ui("id_lead")}</p>
        <form class="field" id="id-form" novalidate>
          <label for="app-id">${ui("id_label")}</label>
          <input id="app-id" name="app-id" autocomplete="off" autocapitalize="characters" spellcheck="false"
                 inputmode="text" placeholder="${CONFIG.applicationIdExample}" value="${esc(state.applicationId)}"
                 aria-describedby="app-id-hint app-id-error">
          <p class="field__hint" id="app-id-hint">${ui("id_hint", { example: CONFIG.applicationIdExample })}</p>
          <p class="field__error" id="app-id-error" role="alert"></p>
          <div class="actions">
            ${backBtn()}
            <button type="submit" class="btn">${ui("continue")}</button>
          </div>
        </form>
      </section>`,
    bind: (root) => {
      const form = $(root, "#id-form"), input = $(root, "#app-id"), err = $(root, "#app-id-error");
      input.addEventListener("input", () => {
        input.removeAttribute("aria-invalid"); err.textContent = "";
        set({ applicationId: input.value }); // survives a language switch
      });
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const v = input.value.trim().toUpperCase();
        if (!CONFIG.applicationIdPattern.test(v)) {
          input.setAttribute("aria-invalid", "true");
          err.textContent = ui("id_error", { example: CONFIG.applicationIdExample });
          input.focus();
          return;
        }
        set({ applicationId: v });
        next();
      });
    },
  },

  /* 02 ---------------------------------------------------------------- */
  period: {
    label: () => ui("label_period"),
    render: () => `
      <section class="screen">
        <p class="eyebrow">${ui("period_eyebrow")}</p>
        <form id="period-form">
          <fieldset class="options">
            <legend><h1 id="screen-title">${ui("period_title")}</h1></legend>
            ${periodsWithCases().map(p => `
              <div class="option">
                <input type="radio" name="period" id="p-${p.code}" value="${p.code}" ${state.period === p.code ? "checked" : ""}>
                <label for="p-${p.code}">
                  <span class="option__key">${esc(t(p.label))}</span>
                  <span class="option__desc">${esc(t(p.desc))}</span>
                </label>
              </div>`).join("")}
          </fieldset>
          <div class="actions">
            ${backBtn()}
            <button type="submit" class="btn" ${state.period ? "" : "disabled"}>${ui("continue")}</button>
          </div>
        </form>
      </section>`,
    bind: (root) => {
      const form = $(root, "#period-form"), submit = $(form, "[type=submit]");
      form.addEventListener("change", () => {
        submit.disabled = false;
        const period = new FormData(form).get("period");
        if (period !== state.period) set({ theme: null });
        set({ period }); // survives a language switch
      });
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!new FormData(form).get("period")) return;
        next();
      });
    },
  },

  /* 03 ---------------------------------------------------------------- */
  theme: {
    label: () => ui("label_theme"),
    render: () => {
      const available = themesFor(state.period);
      return `
      <section class="screen">
        <p class="eyebrow">${ui("theme_eyebrow")} · ${esc(periodLabel(state.period))}</p>
        <form id="theme-form">
          <fieldset class="options">
            <legend><h1 id="screen-title">${ui("theme_title")}</h1></legend>
            ${getThemes().filter(th => available.has(th.code)).map(th => `
              <div class="option">
                <input type="radio" name="theme" id="t-${th.code}" value="${th.code}" ${state.theme === th.code ? "checked" : ""}>
                <label for="t-${th.code}">
                  <span class="option__key">${esc(t(th.label))}</span>
                  <span class="option__desc">${esc(t(th.desc))}</span>
                </label>
              </div>`).join("")}
          </fieldset>
          <div class="notice" style="margin-top:var(--space-5)">
            <strong>${ui("final_title")}</strong>
            ${ui("final_body")}
          </div>
          <div class="actions">
            ${backBtn()}
            <button type="submit" class="btn" ${state.theme ? "" : "disabled"}>${ui("final_btn")}</button>
          </div>
        </form>
      </section>`;
    },
    bind: (root) => {
      const form = $(root, "#theme-form"), submit = $(form, "[type=submit]");
      form.addEventListener("change", () => {
        submit.disabled = false;
        set({ theme: new FormData(form).get("theme") });
      });
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const theme = new FormData(form).get("theme");
        if (!theme) return;
        set({ theme, sealed: assignCase({ period: state.period, theme }) });
        reveal.role = reveal.development = false;
        next();
      });
    },
  },

  /* 04 ---------------------------------------------------------------- */
  choice: {
    label: () => ui("label_choice"),
    render: () => `
      <section class="screen interstitial">
        <p class="eyebrow">${ui("choice_eyebrow")}</p>
        <h1 id="screen-title">
          <span class="line">${ui("choice_l1")}</span>
          <span class="line dim">${ui("choice_l2")}</span>
          <span class="line">${ui("choice_l3")}</span>
        </h1>
        <div class="actions"><button type="button" class="btn" data-action="next">${ui("choice_btn")}</button></div>
      </section>`,
  },

  /* 05 ---------------------------------------------------------------- */
  situation: {
    label: () => ui("label_situation"),
    render: () => {
      const { situation } = state.sealed;
      return `
      <section class="screen">
        <p class="eyebrow">${ui("sit_eyebrow")}</p>
        <article class="briefing" aria-labelledby="screen-title">
          <div class="briefing__meta">
            <span>${ui("time")} <b>${esc(periodLabel(situation.period))}</b></span>
            <span>${ui("theme")} <b>${esc(themeLabel(situation.theme))}</b></span>
          </div>
          <h1 id="screen-title">${esc(t(situation.title))}</h1>
          <p class="briefing__body">${esc(t(situation.context))}</p>
          ${partiesHtml(situation.parties)}
        </article>
        <div class="actions"><button type="button" class="btn" data-action="next">${ui("continue")}</button></div>
      </section>`;
    },
  },

  /* 06 ---------------------------------------------------------------- */
  role: {
    label: () => ui("label_role"),
    render: () => {
      if (!reveal.role) return `
      <section class="screen interstitial">
        <p class="eyebrow">${ui("role_eyebrow")}</p>
        <h1 id="screen-title"><span class="line">${ui("role_teaser")}</span></h1>
        <div class="actions"><button type="button" class="btn" data-action="reveal" data-key="role">${ui("role_btn")}</button></div>
      </section>`;
      const { variant } = state.sealed;
      return `
      <section class="screen">
        <p class="eyebrow">${ui("role_eyebrow")}</p>
        <article class="briefing" aria-labelledby="screen-title">
          <h1 id="screen-title">${esc(t(variant.role.title))}</h1>
          <p class="briefing__body">${esc(t(variant.role.brief))}</p>
        </article>
        <div class="actions"><button type="button" class="btn" data-action="next">${ui("continue")}</button></div>
      </section>`;
    },
  },

  /* 07 ---------------------------------------------------------------- */
  development: {
    label: () => ui("label_development"),
    render: () => {
      if (!reveal.development) return `
      <section class="screen interstitial">
        <p class="eyebrow">${ui("dev_eyebrow")}</p>
        <h1 id="screen-title">
          <span class="line">${ui("dev_l1")}</span>
          <span class="line dim">${ui("dev_l2")}</span>
        </h1>
        <div class="actions"><button type="button" class="btn" data-action="reveal" data-key="development">${ui("dev_btn")}</button></div>
      </section>`;
      const { variant } = state.sealed;
      return `
      <section class="screen">
        <p class="eyebrow">${ui("dev_eyebrow")}</p>
        <article class="briefing" aria-labelledby="screen-title">
          <h1 id="screen-title" class="visually-hidden">${ui("new_development")}</h1>
          <p class="briefing__body">${esc(t(variant.development))}</p>
        </article>
        <div class="actions"><button type="button" class="btn" data-action="next">${ui("open_case")}</button></div>
      </section>`;
    },
  },

  /* 08 ---------------------------------------------------------------- */
  case: {
    label: () => ui("label_case"),
    render: () => {
      const { situation, variant, caseId } = state.sealed;
      return `
      <section class="screen">
        <article class="dossier" aria-labelledby="screen-title">
          <span class="dossier__stamp" aria-hidden="true">${ui("stamp")}</span>
          <h1 id="screen-title">${ui("case_title")}</h1>
          <div class="dossier__id">
            <span>${ui("case_id")}</span>
            <code id="case-id">${idHtml(caseId)}</code>
          </div>
          <dl>
            <dt>${ui("time")}</dt><dd>${esc(periodLabel(situation.period))}</dd>
            <dt>${ui("theme")}</dt><dd>${esc(themeLabel(situation.theme))}</dd>
            <dt>${ui("situation")}</dt><dd><strong>${esc(t(situation.title))}</strong><br>${esc(t(situation.context))}</dd>
            <dt>${ui("your_role")}</dt><dd><strong>${esc(t(variant.role.title))}</strong><br>${esc(t(variant.role.brief))}</dd>
            <dt>${ui("new_development")}</dt><dd>${esc(t(variant.development))}</dd>
          </dl>
          ${partiesHtml(situation.parties)}
          <section class="dossier__task" aria-labelledby="task-h">
            <h2 id="task-h">${ui("task")}</h2>
            <p class="rule">${ui("task_rule", N)}</p>
            <p>${ui("task_address")}</p>
            <ul>
              <li>${ui("q1")}</li><li>${ui("q2")}</li><li>${ui("q3")}</li><li>${ui("q4")}</li><li>${ui("q5")}</li>
            </ul>
            <p>${ui("task_close")}</p>
          </section>
        </article>
        <div class="actions">
          <button type="button" class="btn" data-action="copy-id">${ui("copy_id")}</button>
          <button type="button" class="btn btn--ghost" data-action="copy-case">${ui("copy_case")}</button>
          <button type="button" class="btn btn--ghost" data-action="print">${ui("print")}</button>
        </div>
        <p class="toast" id="toast" role="status"></p>
        <div class="actions"><button type="button" class="btn" data-action="next">${ui("next_video")}</button></div>
      </section>`;
    },
    bind: (root) => {
      const toast = $(root, "#toast");
      const say = (m) => { toast.textContent = m; setTimeout(() => { toast.textContent = ""; }, 3000); };
      const copy = async (text, ok) => {
        try { await navigator.clipboard.writeText(text); say(ok); }
        catch { say(ui("copy_blocked")); }
      };
      $(root, '[data-action="copy-id"]').addEventListener("click", () => copy(state.sealed.caseId, ui("copied_id")));
      $(root, '[data-action="copy-case"]').addEventListener("click", () => copy(caseAsText(), ui("copied_case")));
      $(root, '[data-action="print"]').addEventListener("click", () => window.print());
    },
  },

  /* 09 ---------------------------------------------------------------- */
  video: {
    label: () => ui("label_video"),
    render: () => `
      <section class="screen">
        <p class="eyebrow">${ui("video_eyebrow")}</p>
        <h1 id="screen-title">${ui("video_title", N)}</h1>
        <div class="lead">
          <p><strong>${ui("video_rule", N)}</strong></p>
          <p>${ui("video_body")}</p>
        </div>
        <div class="dossier__id" style="border-color:var(--line-strong);max-width:560px">
          <span style="color:var(--muted)">${ui("your_case_id")}</span>
          <code>${idHtml(state.sealed.caseId)}</code>
        </div>
        <div class="actions">
          <a class="btn" href="${esc(CONFIG.applicationFormUrl)}" target="_blank" rel="noopener">${ui("go_form")}</a>
          <button type="button" class="btn btn--ghost" data-action="to-case">${ui("back_case")}</button>
        </div>
      </section>`,
    bind: (root) => {
      $(root, '[data-action="to-case"]').addEventListener("click", () => go("case"));
    },
  },
};

// Plain-text case in one language. In the Russian interface, "Copy case" gives Russian + English,
// because the video must be recorded in English.
function caseText(l) {
  const { situation, variant, caseId } = state.sealed;
  const u = (k, v) => ui(k, v, l).toUpperCase();
  return [
    `${ui("title", {}, l).toUpperCase()} — ${ui("brand", {}, l)}`,
    `${u("case_id")}: ${caseId}`,
    ``,
    `${u("time")}: ${periodLabel(situation.period, l)}`,
    `${u("theme")}: ${themeLabel(situation.theme, l)}`,
    `${u("situation")}: ${t(situation.title, l)}`,
    t(situation.context, l),
    ``,
    u("parties"),
    ...situation.parties.map(p => `— ${t(p.name, l)}\n  ${ui("position", {}, l)}: ${t(p.position, l)}\n  ${ui("constraint", {}, l)}: ${t(p.constraint, l)}`),
    ``,
    `${u("your_role")}: ${t(variant.role.title, l)}`,
    t(variant.role.brief, l),
    ``,
    `${u("new_development")}: ${t(variant.development, l)}`,
    ``,
    `${u("task")}: ${ui("task_rule", N, l)}`,
  ].join("\n");
}

function caseAsText() {
  const l = getLang();
  return l === "en" ? caseText("en") : `${caseText(l)}\n\n────────────────────────\n\n${caseText("en")}`;
}

// Shared button handlers (next / back / reveal).
export function bindCommon(root, rerender) {
  root.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const a = btn.dataset.action;
    if (a === "next") next();
    else if (a === "back") back();
    else if (a === "reveal") { reveal[btn.dataset.key] = true; rerender(); }
  });
}
