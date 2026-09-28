import { state, subscribe, reset, SCREEN_ORDER } from "./state.js";
import { SCREENS, bindCommon } from "./screens.js";
import { loadData } from "./data.js";

const main = document.getElementById("main");
const progress = document.getElementById("progress");
const announcer = document.getElementById("announcer");

function renderProgress() {
  const current = SCREEN_ORDER.indexOf(state.screen);
  progress.innerHTML = SCREEN_ORDER.map((id, i) => {
    const cls = i < current ? "is-done" : i === current ? "is-current" : "";
    const cur = i === current ? ` aria-current="step"` : "";
    return `<li class="${cls}"${cur}><span class="visually-hidden">${i + 1}. ${SCREENS[id].label}</span></li>`;
  }).join("");
}

function render() {
  const screen = SCREENS[state.screen];
  main.innerHTML = screen.render(state);
  screen.bind?.(main);
  renderProgress();

  // Move focus to the new heading so keyboard and screen-reader users land in the right place.
  const title = main.querySelector("#screen-title");
  if (title) { title.setAttribute("tabindex", "-1"); title.focus({ preventScroll: true }); }
  announcer.textContent = `Step ${SCREEN_ORDER.indexOf(state.screen) + 1} of ${SCREEN_ORDER.length}: ${screen.label}`;
  window.scrollTo({ top: 0 });
}

bindCommon(main, render);
subscribe(render);

try {
  await loadData();
  render();
} catch (err) {
  console.error(err);
  main.innerHTML = `<section class="screen"><h1>The case files could not be loaded.</h1>
    <p class="lead">Please refresh the page. If the problem continues, contact the programme organisers.</p></section>`;
}

// Stage 1 convenience only: restart the prototype. Removed from public mode in Stage 3.
const footer = document.querySelector(".footer");
const restart = document.createElement("button");
restart.type = "button";
restart.textContent = "Restart prototype";
restart.className = "lang";
restart.style.marginLeft = "12px";
restart.addEventListener("click", reset);
footer.append(restart);
