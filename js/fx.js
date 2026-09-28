// Small, restrained effects. Everything here is skipped when the visitor prefers reduced motion.
export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const wait = (ms) => new Promise(r => setTimeout(r, ms));
const GLYPHS = "ABCDEFGHJKMNPQRSTVWXYZ0123456789";

/* ---------------------------------------------------------------------------
   Typing: text types itself out with a blinking caret.
   Screen readers get the full text at once (visually hidden copy).
--------------------------------------------------------------------------- */
function prepare(el) {
  if (el._typing) return el._typing;
  const full = el.textContent.trim();
  el.textContent = "";
  const sr = Object.assign(document.createElement("span"), { className: "visually-hidden", textContent: full });
  const out = document.createElement("span"); out.setAttribute("aria-hidden", "true");
  el.append(sr, out);
  return (el._typing = { full, out });
}

export async function typeText(el, { speed = 26 } = {}) {
  if (!el || !el.isConnected) return;
  const { full, out } = prepare(el);
  if (reducedMotion()) { out.textContent = full; return; }
  const caret = Object.assign(document.createElement("span"), { className: "caret" });
  caret.setAttribute("aria-hidden", "true");
  el.append(caret);
  for (let i = 1; i <= full.length; i++) {
    if (!el.isConnected) return;
    out.textContent = full.slice(0, i);
    await wait(full[i - 1] === " " ? speed * 1.6 : /[.,:;?!—]/.test(full[i - 1]) ? speed * 5 : speed);
  }
  caret.remove();
}

// Types every [data-type] element inside root, one after another, then marks root as typed
// (elements with class "after-type" fade in at that point).
export async function typeAll(root, selector = "[data-type]") {
  const section = root.querySelector(".screen");
  const els = [...root.querySelectorAll(selector)];
  if (!els.length) return;                      // screens with their own sequence (case assembly) mark themselves
  els.forEach(prepare);
  if (reducedMotion()) { els.forEach(el => (el._typing.out.textContent = el._typing.full)); section?.classList.add("is-typed"); return; }
  for (const el of els) await typeText(el);
  if (section?.isConnected) section.classList.add("is-typed");
}

// Text "deciphers" from random characters into its final value, left to right.
export function scramble(el, text, { duration = 1000 } = {}) {
  return new Promise(resolve => {
    if (!el) return resolve();
    if (reducedMotion()) { el.textContent = text; return resolve(); }
    const start = performance.now();
    const frame = (now) => {
      if (!el.isConnected) return resolve();
      const p = Math.min(1, (now - start) / duration);
      const done = Math.floor(p * text.length);
      el.textContent = text.slice(0, done) + [...text.slice(done)]
        .map(c => (c === "-" ? "-" : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join("");
      p < 1 ? requestAnimationFrame(frame) : resolve();
    };
    requestAnimationFrame(frame);
  });
}

/* ---------------------------------------------------------------------------
   "The situation chooses for you": the system types its log, seals the file,
   then the headline types itself and the button appears.
--------------------------------------------------------------------------- */
export async function runCaseAssembly(root, caseId) {
  const section = root.querySelector(".screen");
  const lines = [...root.querySelectorAll(".fx-log li")];
  const heads = [...root.querySelectorAll("[data-type-later]")];
  heads.forEach(prepare);
  if (reducedMotion()) {
    lines.forEach(li => li.classList.add("on", "done"));
    root.querySelector("#fx-id").textContent = caseId;
    heads.forEach(el => (el._typing.out.textContent = el._typing.full));
    section.classList.add("is-typed");
    return;
  }
  for (const li of lines) {
    if (!li.isConnected) return;
    li.classList.add("on");
    await typeText(li.querySelector(".label"), { speed: 22 });
    const id = li.querySelector("#fx-id");
    if (id) await scramble(id, caseId, { duration: 900 });
    await wait(220);
    li.classList.add("done");
  }
  await wait(300);
  for (const el of heads) await typeText(el, { speed: 30 });
  if (section.isConnected) section.classList.add("is-typed");
}

/* ---------------------------------------------------------------------------
   Background: glowing pulses travelling along the grid lines.
   The grid is drawn by CSS on <body> (64px cells); the canvas follows the same lines.
--------------------------------------------------------------------------- */
export function initGridGlow() {
  if (reducedMotion()) return;
  const CELL = 64, TRAIL = 170;
  const canvas = Object.assign(document.createElement("canvas"), { id: "grid-fx" });
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d");
  let w = 0, h = 0, dpr = 1, pulses = [];

  const line = (k) => k * CELL - 0.5;               // pixel position of grid line k
  const rand = (a, b) => a + Math.random() * (b - a);
  const count = () => Math.max(3, Math.min(8, Math.round((w * h) / 170000)));

  function spawn(anywhere = false) {
    const horizontal = Math.random() < 0.5;
    const cols = Math.ceil(w / CELL), rows = Math.ceil(h / CELL);
    let x, y, dx = 0, dy = 0;
    if (horizontal) {
      y = line(1 + ((Math.random() * (rows - 1)) | 0));
      dx = Math.random() < 0.5 ? 1 : -1;
      x = anywhere ? line((Math.random() * cols) | 0) : (dx > 0 ? -TRAIL : w + TRAIL);
    } else {
      x = line(1 + ((Math.random() * (cols - 1)) | 0));
      dy = Math.random() < 0.5 ? 1 : -1;
      y = anywhere ? line((Math.random() * rows) | 0) : (dy > 0 ? -TRAIL : h + TRAIL);
    }
    return { x, y, dx, dy, speed: rand(60, 120), trail: [{ x, y }], nextTurn: rand(2, 6) };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    while (pulses.length < count()) pulses.push(spawn(true));
    pulses.length = Math.min(pulses.length, count());
  }

  function step(p, dist) {
    // Move along the current line; at each grid crossing, sometimes turn 90°.
    while (dist > 0) {
      const pos = p.dx ? p.x : p.y, dir = p.dx || p.dy;
      const k = dir > 0 ? Math.floor((pos + 0.5) / CELL) + 1 : Math.ceil((pos + 0.5) / CELL) - 1;
      const toNode = Math.abs(line(k) - pos) || CELL;
      const move = Math.min(dist, toNode);
      if (p.dx) p.x += p.dx * move; else p.y += p.dy * move;
      dist -= move;
      if (move === toNode) {
        p.trail.push({ x: p.x, y: p.y });
        if (--p.nextTurn <= 0) {
          p.nextTurn = rand(2, 6);
          if (p.dx) { p.dy = Math.random() < 0.5 ? 1 : -1; p.dx = 0; } else { p.dx = Math.random() < 0.5 ? 1 : -1; p.dy = 0; }
        }
      }
    }
  }

  function draw(p) {
    // Trail: the recent path (corners + head), fading from head to tail.
    const pts = [...p.trail, { x: p.x, y: p.y }];
    let len = 0, i = pts.length - 1;
    ctx.lineCap = "round";
    for (; i > 0 && len < TRAIL; i--) {
      const a = pts[i], b = pts[i - 1];
      const seg = Math.hypot(a.x - b.x, a.y - b.y);
      const use = Math.min(seg, TRAIL - len);
      const t = use / (seg || 1);
      const bx = a.x + (b.x - a.x) * t, by = a.y + (b.y - a.y) * t;
      const a0 = 1 - len / TRAIL, a1 = 1 - (len + use) / TRAIL;
      // Soft halo, then a bright brass core.
      for (const [width, alpha, rgb] of [[6, 0.16, "212,170,90"], [1.6, 0.95, "236,200,122"]]) {
        const g = ctx.createLinearGradient(a.x, a.y, bx, by);
        g.addColorStop(0, `rgba(${rgb},${alpha * a0})`);
        g.addColorStop(1, `rgba(${rgb},${alpha * a1})`);
        ctx.strokeStyle = g; ctx.lineWidth = width;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(bx, by); ctx.stroke();
      }
      len += use;
    }
    if (i > 1) p.trail.splice(0, i - 1);            // forget points beyond the trail
    // Head: a soft glowing point.
    const r = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 14);
    r.addColorStop(0, "rgba(255,226,160,1)"); r.addColorStop(.25, "rgba(236,190,100,.55)"); r.addColorStop(1, "rgba(212,170,90,0)");
    ctx.fillStyle = r; ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, Math.PI * 2); ctx.fill();
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    pulses.forEach((p, i) => {
      step(p, p.speed * dt);
      draw(p);
      const out = p.x < -TRAIL * 2 || p.x > w + TRAIL * 2 || p.y < -TRAIL * 2 || p.y > h + TRAIL * 2;
      if (out) pulses[i] = spawn();
    });
    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(frame);
}
