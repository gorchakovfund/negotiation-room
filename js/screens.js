// One render function per screen. Stage 7 moves all text into data/ui-text.json (RU/EN).
import { state, set, next, back, go } from "./state.js";
import { t, getRegions, periodsWithCases, regionsFor, periodLabel, regionLabel } from "./data.js";
import { assignCase } from "./assign.js";
import { CONFIG } from "./config.js";

const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const $ = (root, sel) => root.querySelector(sel);

// Case IDs may wrap on narrow screens, but only at a hyphen.
const idHtml = (id) => esc(id).replaceAll("-", "-<wbr>");

const backBtn = `<button type="button" class="btn btn--ghost" data-action="back">Back</button>`;

// "Parties at the table": public position + what constrains each party.
// Real interests are deliberately left for the applicant to work out.
const partiesHtml = (parties, headingTag = "h2") => `
  <section class="parties" aria-label="Parties at the table">
    <${headingTag} class="parties__h">Parties at the table</${headingTag}>
    <ul class="parties__list">
      ${parties.map(p => `
        <li class="party">
          <p class="party__name">${esc(t(p.name))}</p>
          <p class="party__row"><span>Position</span>${esc(t(p.position))}</p>
          <p class="party__row"><span>Constraint</span>${esc(t(p.constraint))}</p>
        </li>`).join("")}
    </ul>
  </section>`;

// Reveal screens have two phases: a teaser line + button, then the content.
const reveal = { role: false, development: false };

export const SCREENS = {
  /* 01 ---------------------------------------------------------------- */
  welcome: {
    label: "Welcome",
    render: () => `
      <section class="screen">
        <p class="eyebrow">File 00 · Briefing</p>
        <h1 class="display" id="screen-title">The Negotiation Room</h1>
        <p class="subtitle">A World Without Instructions</p>
        <div class="lead">
          <p>Welcome to the Negotiation Room.</p>
          <p>In real negotiations, you cannot control every circumstance.</p>
          <p>You will be able to make several choices. The rest will be determined by the situation.</p>
          <p>At the end, you will receive your negotiation case. You will have ${CONFIG.videoMaxMinutes} minutes to propose your solution.</p>
        </div>
        <div class="actions">
          <button type="button" class="btn" data-action="next">Enter the Negotiation Room</button>
        </div>
      </section>`,
  },

  /* 01b --------------------------------------------------------------- */
  identify: {
    label: "Identification",
    render: () => `
      <section class="screen">
        <p class="eyebrow">Access control</p>
        <h1 id="screen-title">Identify yourself</h1>
        <p class="lead">Enter your application ID. Your case will be linked to it, and the organisers will use it to match your video to your application.</p>
        <form class="field" id="id-form" novalidate>
          <label for="app-id">Application ID</label>
          <input id="app-id" name="app-id" autocomplete="off" autocapitalize="characters" spellcheck="false"
                 inputmode="text" placeholder="${CONFIG.applicationIdExample}" value="${esc(state.applicationId)}"
                 aria-describedby="app-id-hint app-id-error">
          <p class="field__hint" id="app-id-hint">Format: ${CONFIG.applicationIdExample}. You will find it in your application confirmation.</p>
          <p class="field__error" id="app-id-error" role="alert"></p>
          <div class="actions">
            ${backBtn}
            <button type="submit" class="btn">Continue</button>
          </div>
        </form>
      </section>`,
    bind: (root) => {
      const form = $(root, "#id-form"), input = $(root, "#app-id"), err = $(root, "#app-id-error");
      input.addEventListener("input", () => { input.removeAttribute("aria-invalid"); err.textContent = ""; });
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const v = input.value.trim().toUpperCase();
        if (!CONFIG.applicationIdPattern.test(v)) {
          input.setAttribute("aria-invalid", "true");
          err.textContent = `This does not look like an application ID. Expected format: ${CONFIG.applicationIdExample}`;
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
    label: "Choose your time",
    render: () => `
      <section class="screen">
        <p class="eyebrow">Choice 1 of 2</p>
        <form id="period-form">
          <fieldset class="options">
            <legend><h1 id="screen-title">When are your negotiations taking place?</h1></legend>
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
            ${backBtn}
            <button type="submit" class="btn" ${state.period ? "" : "disabled"}>Continue</button>
          </div>
        </form>
      </section>`,
    bind: (root) => {
      const form = $(root, "#period-form"), submit = $(form, "[type=submit]");
      form.addEventListener("change", () => { submit.disabled = false; });
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const period = new FormData(form).get("period");
        if (!period) return;
        if (period !== state.period) set({ region: null });
        set({ period });
        next();
      });
    },
  },

  /* 03 ---------------------------------------------------------------- */
  region: {
    label: "Choose your region",
    render: () => {
      const available = regionsFor(state.period);
      return `
      <section class="screen">
        <p class="eyebrow">Choice 2 of 2 · ${esc(periodLabel(state.period))}</p>
        <form id="region-form">
          <fieldset class="options">
            <legend><h1 id="screen-title">Where are the negotiations taking place?</h1></legend>
            ${getRegions().map(r => {
              const on = available.has(r.code);
              return `
              <div class="option">
                <input type="radio" name="region" id="r-${r.code}" value="${r.code}"
                  ${on ? "" : "disabled"} ${state.region === r.code ? "checked" : ""}
                  ${on ? "" : `aria-describedby="r-${r.code}-na"`}>
                <label for="r-${r.code}">
                  <span class="option__key">${esc(t(r.label))}</span>
                  ${on ? "" : `<span class="option__na" id="r-${r.code}-na">No active file</span>`}
                </label>
              </div>`;
            }).join("")}
          </fieldset>
          <div class="notice" style="margin-top:var(--space-5)">
            <strong>This choice is final</strong>
            Once you confirm, your case will be assigned and sealed. You will not be able to go back or start again.
          </div>
          <div class="actions">
            ${backBtn}
            <button type="submit" class="btn" ${state.region ? "" : "disabled"}>Confirm. This choice is final.</button>
          </div>
        </form>
      </section>`;
    },
    bind: (root) => {
      const form = $(root, "#region-form"), submit = $(form, "[type=submit]");
      form.addEventListener("change", () => { submit.disabled = false; });
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const region = new FormData(form).get("region");
        if (!region) return;
        set({ region, sealed: assignCase({ period: state.period, region }) });
        reveal.role = reveal.development = false;
        next();
      });
    },
  },

  /* 04 ---------------------------------------------------------------- */
  choice: {
    label: "The situation chooses",
    render: () => `
      <section class="screen interstitial">
        <p class="eyebrow">Case sealed</p>
        <h1 id="screen-title">
          <span class="line">You have made your choice.</span>
          <span class="line dim">But in negotiations, you cannot choose every circumstance.</span>
          <span class="line">From now on, the situation chooses for you.</span>
        </h1>
        <div class="actions"><button type="button" class="btn" data-action="next">Reveal my situation</button></div>
      </section>`,
  },

  /* 05 ---------------------------------------------------------------- */
  situation: {
    label: "Your situation",
    render: () => {
      const { situation } = state.sealed;
      return `
      <section class="screen">
        <p class="eyebrow">File 01 · Your situation</p>
        <article class="briefing" aria-labelledby="screen-title">
          <div class="briefing__meta">
            <span>Time <b>${esc(periodLabel(situation.period))}</b></span>
            <span>Region <b>${esc(regionLabel(situation.region))}</b></span>
          </div>
          <h1 id="screen-title">${esc(t(situation.title))}</h1>
          <p class="briefing__body">${esc(t(situation.context))}</p>
          ${partiesHtml(situation.parties)}
        </article>
        <div class="actions"><button type="button" class="btn" data-action="next">Continue</button></div>
      </section>`;
    },
  },

  /* 06 ---------------------------------------------------------------- */
  role: {
    label: "Your role",
    render: () => {
      if (!reveal.role) return `
      <section class="screen interstitial">
        <p class="eyebrow">File 02 · Your role</p>
        <h1 id="screen-title"><span class="line">But you still don’t know who you are at the negotiating table.</span></h1>
        <div class="actions"><button type="button" class="btn" data-action="reveal" data-key="role">Reveal my role</button></div>
      </section>`;
      const { variant } = state.sealed;
      return `
      <section class="screen">
        <p class="eyebrow">File 02 · Your role</p>
        <article class="briefing" aria-labelledby="screen-title">
          <h1 id="screen-title">${esc(t(variant.role.title))}</h1>
          <p class="briefing__body">${esc(t(variant.role.brief))}</p>
        </article>
        <div class="actions"><button type="button" class="btn" data-action="next">Continue</button></div>
      </section>`;
    },
  },

  /* 07 ---------------------------------------------------------------- */
  development: {
    label: "New development",
    render: () => {
      if (!reveal.development) return `
      <section class="screen interstitial">
        <p class="eyebrow">File 03 · New development</p>
        <h1 id="screen-title">
          <span class="line">The negotiations have begun.</span>
          <span class="line dim">But the situation has changed.</span>
        </h1>
        <div class="actions"><button type="button" class="btn" data-action="reveal" data-key="development">Reveal new development</button></div>
      </section>`;
      const { variant } = state.sealed;
      return `
      <section class="screen">
        <p class="eyebrow">File 03 · New development</p>
        <article class="briefing" aria-labelledby="screen-title">
          <h1 id="screen-title" class="visually-hidden">New development</h1>
          <p class="briefing__body">${esc(t(variant.development))}</p>
        </article>
        <div class="actions"><button type="button" class="btn" data-action="next">Open my case file</button></div>
      </section>`;
    },
  },

  /* 08 ---------------------------------------------------------------- */
  case: {
    label: "Your negotiation case",
    render: () => {
      const { situation, variant, caseId } = state.sealed;
      return `
      <section class="screen">
        <article class="dossier" aria-labelledby="screen-title">
          <span class="dossier__stamp" aria-hidden="true">Confidential</span>
          <h1 id="screen-title">Your negotiation case</h1>
          <div class="dossier__id">
            <span>Case ID</span>
            <code id="case-id">${idHtml(caseId)}</code>
          </div>
          <dl>
            <dt>Time</dt><dd>${esc(periodLabel(situation.period))}</dd>
            <dt>Region</dt><dd>${esc(regionLabel(situation.region))}</dd>
            <dt>Situation</dt><dd><strong>${esc(t(situation.title))}</strong><br>${esc(t(situation.context))}</dd>
            <dt>Your role</dt><dd><strong>${esc(t(variant.role.title))}</strong><br>${esc(t(variant.role.brief))}</dd>
            <dt>New development</dt><dd>${esc(t(variant.development))}</dd>
          </dl>
          ${partiesHtml(situation.parties)}
          <section class="dossier__task" aria-labelledby="task-h">
            <h2 id="task-h">Your task</h2>
            <p class="rule">Record a video in English, no longer than ${CONFIG.videoMaxMinutes} minutes, explaining what you would do next.</p>
            <p>You may address:</p>
            <ul>
              <li>What is your main objective?</li>
              <li>What would be your first step?</li>
              <li>What are you prepared to compromise on?</li>
              <li>What are you not prepared to sacrifice?</li>
              <li>What could make you change your strategy?</li>
            </ul>
            <p>There is no single correct answer. We are interested in how you think, how you understand the interests of different parties, and how you approach negotiations under uncertainty.</p>
          </section>
        </article>
        <div class="actions">
          <button type="button" class="btn" data-action="copy-id">Copy Case ID</button>
          <button type="button" class="btn btn--ghost" data-action="copy-case">Copy case</button>
          <button type="button" class="btn btn--ghost" data-action="print">Print / Save PDF</button>
        </div>
        <p class="toast" id="toast" role="status"></p>
        <div class="actions"><button type="button" class="btn" data-action="next">Next: record your video</button></div>
      </section>`;
    },
    bind: (root) => {
      const toast = $(root, "#toast");
      const say = (m) => { toast.textContent = m; setTimeout(() => { toast.textContent = ""; }, 3000); };
      const copy = async (text, ok) => {
        try { await navigator.clipboard.writeText(text); say(ok); }
        catch { say("Copying is blocked in this browser. Please select and copy the text manually."); }
      };
      root.querySelector('[data-action="copy-id"]').addEventListener("click", () => copy(state.sealed.caseId, "Case ID copied."));
      root.querySelector('[data-action="copy-case"]').addEventListener("click", () => copy(caseAsText(), "Case copied."));
      root.querySelector('[data-action="print"]').addEventListener("click", () => window.print());
    },
  },

  /* 09 ---------------------------------------------------------------- */
  video: {
    label: "Record your video",
    render: () => `
      <section class="screen">
        <p class="eyebrow">Final step</p>
        <h1 id="screen-title">Record your ${CONFIG.videoMaxMinutes}-minute video</h1>
        <div class="lead">
          <p><strong>In English. No longer than ${CONFIG.videoMaxMinutes} minutes.</strong></p>
          <p>Please say your Case ID at the start of the video. Then submit the video and your Case ID through the application form.</p>
        </div>
        <div class="dossier__id" style="border-color:var(--line-strong);max-width:560px">
          <span style="color:var(--muted)">Your Case ID</span>
          <code>${idHtml(state.sealed.caseId)}</code>
        </div>
        <div class="actions">
          <a class="btn" href="${esc(CONFIG.applicationFormUrl)}" target="_blank" rel="noopener">Go to the application form</a>
          <button type="button" class="btn btn--ghost" data-action="to-case">Back to my case</button>
        </div>
      </section>`,
    bind: (root) => {
      root.querySelector('[data-action="to-case"]').addEventListener("click", () => go("case"));
    },
  },
};

function caseAsText() {
  const { situation, variant, caseId } = state.sealed;
  return [
    `THE NEGOTIATION ROOM — Dialogue for the Future 2026`,
    `CASE ID: ${caseId}`,
    ``,
    `TIME: ${periodLabel(situation.period)}`,
    `REGION: ${regionLabel(situation.region)}`,
    `SITUATION: ${t(situation.title)}`,
    t(situation.context),
    ``,
    `PARTIES AT THE TABLE`,
    ...situation.parties.map(p => `— ${t(p.name)}\n  Position: ${t(p.position)}\n  Constraint: ${t(p.constraint)}`),
    ``,
    `YOUR ROLE: ${t(variant.role.title)}`,
    t(variant.role.brief),
    ``,
    `NEW DEVELOPMENT: ${t(variant.development)}`,
    ``,
    `YOUR TASK: Record a video in English, no longer than ${CONFIG.videoMaxMinutes} minutes, explaining what you would do next.`,
  ].join("\n");
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
