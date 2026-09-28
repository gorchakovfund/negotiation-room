// A tiny linear state machine. One piece of state, one list of screens.
// Stage 3 will persist `state` to localStorage and seal it at the point of no return.

export const SCREEN_ORDER = [
  "welcome",      // 01
  "identify",     // 01b
  "period",       // 02
  "region",       // 03  ← point of no return on confirm
  "choice",       // 04
  "situation",    // 05
  "role",         // 06
  "development",  // 07
  "case",         // 08
  "video",        // 09
];

// Screens from which the applicant may step back.
const CAN_GO_BACK = new Set(["identify", "period", "region"]);

export const state = {
  screen: "welcome",
  applicationId: "",
  period: null,
  region: null,
  sealed: null, // { situation, variant, caseId } once confirmed
};

const listeners = new Set();
export const subscribe = (fn) => listeners.add(fn);
const emit = () => listeners.forEach(fn => fn(state));

export function go(screen) {
  if (!SCREEN_ORDER.includes(screen)) throw new Error(`Unknown screen: ${screen}`);
  state.screen = screen;
  emit();
}

export function next() {
  const i = SCREEN_ORDER.indexOf(state.screen);
  if (i < SCREEN_ORDER.length - 1) go(SCREEN_ORDER[i + 1]);
}

export function back() {
  if (!CAN_GO_BACK.has(state.screen)) return;
  const i = SCREEN_ORDER.indexOf(state.screen);
  go(SCREEN_ORDER[i - 1]);
}

export function set(patch) { Object.assign(state, patch); }

export function reset() {
  Object.assign(state, { screen: "welcome", applicationId: "", period: null, region: null, sealed: null });
  emit();
}
