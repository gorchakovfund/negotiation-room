// Small, restrained effects. Everything here is skipped when the visitor prefers reduced motion.
export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const GLYPHS = "ABCDEFGHJKMNPQRSTVWXYZ0123456789";

// Text "deciphers" from random characters into its final value, left to right.
export function scramble(el, text, { delay = 0, duration = 1400 } = {}) {
  if (!el) return;
  if (reducedMotion()) { el.textContent = text; return; }
  el.textContent = text.replace(/[^-]/g, "·");
  setTimeout(() => {
    const start = performance.now();
    const frame = (now) => {
      if (!el.isConnected) return;
      const p = Math.min(1, (now - start) / duration);
      const done = Math.floor(p * text.length);
      el.textContent = text.slice(0, done) + [...text.slice(done)]
        .map(c => (c === "-" ? "-" : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join("");
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, delay);
}

// The negotiation table on the welcome screen: six seats, and "threads" of dialogue crossing it.
export const tableSvg = () => {
  const seats = [[330, 85], [255, 144], [105, 144], [30, 85], [105, 26], [255, 26]];
  const threads = [[3, 0], [4, 1], [5, 2]];
  return `
  <svg class="table-fx" viewBox="0 0 360 170" aria-hidden="true" focusable="false">
    <ellipse class="t-table" cx="180" cy="85" rx="118" ry="46"/>
    ${threads.map(([a, b], i) => `<line class="t-thread" style="--i:${i}" x1="${seats[a][0]}" y1="${seats[a][1]}" x2="${seats[b][0]}" y2="${seats[b][1]}"/>`).join("")}
    ${seats.map(([x, y], i) => `<circle class="t-seat${i === 0 || i === 3 ? " is-key" : ""}" style="--i:${i % 3}" cx="${x}" cy="${y}" r="7"/>`).join("")}
    <rect class="t-core" x="176" y="81" width="8" height="8" transform="rotate(45 180 85)"/>
  </svg>`;
};
