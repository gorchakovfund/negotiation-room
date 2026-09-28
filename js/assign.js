// STAGE 1 placeholder assignment.
// Stage 3: pick only among validated variants.
// Stage 4: variant = hash(applicationId + situation) so it cannot be rerolled; real Case ID with check char.
import { findSituation } from "./data.js";
import { CONFIG } from "./config.js";

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function assignCase({ period, region }) {
  const situation = findSituation(period, region);
  if (!situation) throw new Error(`No situation for ${period}/${region}`);
  const variant = situation.variants[Math.floor(Math.random() * situation.variants.length)];

  const bytes = crypto.getRandomValues(new Uint8Array(5));
  const suffix = Array.from(bytes, b => CROCKFORD[b % 32]).join("");
  const caseId = [
    CONFIG.programmeCode, period, region, situation.id, variant.id,
    String(variant.version).padStart(2, "0"), suffix,
  ].join("-");

  return { situation, variant, caseId };
}
