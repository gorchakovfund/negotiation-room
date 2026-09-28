// STAGE 1 placeholder assignment.
// Stage 3: pick only among validated variants.
// Stage 4: variant = hash(applicationId + situation) so it cannot be rerolled; real Case ID with check char.
import { situationsFor } from "./data.js";
import { CONFIG } from "./config.js";

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

const pick = (list) => list[crypto.getRandomValues(new Uint32Array(1))[0] % list.length];

// The applicant chooses only the time. The situation and the role are chosen for them.
export function assignCase({ period }) {
  const options = situationsFor(period);
  if (!options.length) throw new Error(`No situation for ${period}`);
  const situation = pick(options);
  const variant = pick(situation.variants);

  const bytes = crypto.getRandomValues(new Uint8Array(5));
  const suffix = Array.from(bytes, b => CROCKFORD[b % 32]).join("");
  const caseId = [
    CONFIG.programmeCode, period.toUpperCase(), situation.id, variant.id,
    String(variant.version).padStart(2, "0"), suffix,
  ].join("-");

  return { situation, variant, caseId };
}
