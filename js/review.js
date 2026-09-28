import { loadData, getSituations, t, periodLabel, regionLabel } from "./data.js";
import { loadUi, getLang, ui } from "./i18n.js";

const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

await Promise.all([loadUi(), loadData()]);
document.getElementById("l-" + getLang())?.classList.add("is-active");
const list = getSituations();

document.getElementById("toc").innerHTML = list.map(s => `
  <li><a href="#${s.id}"><b>${esc(periodLabel(s.period))} · ${esc(s.region)}</b>${esc(t(s.title))}</a></li>`).join("");

document.getElementById("cases").innerHTML = list.map(s => `
  <article class="case briefing" id="${s.id}">
    <div class="briefing__meta">
      <span>Time <b>${esc(periodLabel(s.period))}</b></span>
      <span>Region <b>${esc(regionLabel(s.region))}</b></span>
      <span>Code <b>${esc(s.id)}</b></span>
      <span class="status ${s.status === "validated" ? "status--validated" : ""}">${esc(s.status)}</span>
    </div>
    <h2>${esc(t(s.title))}</h2>
    <p class="briefing__body">${esc(t(s.context))}</p>
    <p class="small muted">${t(s.context).length} characters</p>
    <section class="parties">
      <h3 class="parties__h">${ui("parties")}</h3>
      <ul class="parties__list">
        ${s.parties.map(p => `
          <li class="party">
            <p class="party__name">${esc(t(p.name))}</p>
            <p class="party__row"><span>${ui("position")}</span>${esc(t(p.position))}</p>
            <p class="party__row"><span>${ui("constraint")}</span>${esc(t(p.constraint))}</p>
          </li>`).join("")}
      </ul>
    </section>
    <section class="parties">
      <h3 class="parties__h">Variants (one is assigned per applicant)</h3>
      <div class="variants">
        ${s.variants.map(v => `
          <div class="variant">
            <span class="variant__code">${esc(v.id)} · v${v.version}</span>
            <h3>${esc(t(v.role.title))}</h3>
            <p><span>${ui("your_role")}</span>${esc(t(v.role.brief))}</p>
            <p><span>${ui("new_development")}</span>${esc(t(v.development))}</p>
          </div>`).join("")}
      </div>
    </section>
  </article>`).join("");
