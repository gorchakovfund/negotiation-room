// STAGE 1 ONLY. Replaced in Stage 2 by data/taxonomy.json + data/situations.json.
// Mirrors the agreed MVP matrix: 5 situations, 4 periods (1990s hidden: no cases).

export const PERIODS = [
  { code: "1919", label: "1919", desc: "Building peace after a major war" },
  { code: "1962", label: "1962", desc: "A world on the brink of a global crisis" },
  { code: "1990", label: "1990s", desc: "Old rules are disappearing, new ones have not yet been established" },
  { code: "2026", label: "2026", desc: "A world of growing uncertainty" },
  { code: "2040", label: "2040", desc: "A future whose rules are yet to be written" },
];

export const REGIONS = [
  { code: "EU", label: "Europe" },
  { code: "ME", label: "Middle East" },
  { code: "AS", label: "Asia" },
  { code: "AF", label: "Africa" },
  { code: "LA", label: "Latin America" },
  { code: "GL", label: "Global" },
];

const LOREM = "Placeholder context. The real text (500–800 characters) will explain what is happening, who the main parties are, why negotiations are necessary and what makes agreement difficult. It will stop at a decision point and never reveal the real historical outcome. This paragraph only exists so you can judge reading length and pacing on your phone and desktop.";

export const SITUATIONS = [
  { id: "PWS", period: "1919", region: "EU", title: "Post-war settlement", type: "real" },
  { id: "CMC", period: "1962", region: "GL", title: "Cuban Missile Crisis", type: "real" },
  { id: "TBR", period: "2026", region: "AF", title: "Transboundary river in a drought", type: "fictional" },
  { id: "MAR", period: "2026", region: "AS", title: "Maritime incident", type: "fictional" },
  { id: "NTR", period: "2040", region: "GL", title: "Rules for a new technology", type: "fictional" },
].map(s => ({
  ...s,
  context: LOREM,
  variants: [
    { id: "MED", version: 1, role: "Mediator", brief: "Placeholder role brief: who you represent, your mandate, and what you cannot do.", development: "Placeholder development: a military incident has occurred. It is still unclear who was responsible." },
    { id: "ADV", version: 1, role: "Adviser to the Head of Delegation", brief: "Placeholder role brief.", development: "Placeholder development: details of the confidential talks have leaked to the media." },
  ],
}));

export const periodsWithCases = () =>
  PERIODS.filter(p => SITUATIONS.some(s => s.period === p.code));

export const regionsFor = (period) =>
  new Set(SITUATIONS.filter(s => s.period === period).map(s => s.region));
