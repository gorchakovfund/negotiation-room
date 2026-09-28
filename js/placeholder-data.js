// STAGE 1 ONLY. Replaced in Stage 2 by data/taxonomy.json + data/situations.json.
// Proposed matrix (v2): 6 periods × 6 regions, 12 situations.
// Every region appears twice, every period offers two regions. Titles are working titles only.

export const PERIODS = [
  { code: "1990", label: "1990s", desc: "Old rules are disappearing, new ones have not yet been established" },
  { code: "2000", label: "2000s", desc: "A world that believed the big questions were settled" },
  { code: "2010", label: "2010s", desc: "Crises arrive faster than institutions can respond" },
  { code: "2026", label: "2026",  desc: "A world of growing uncertainty" },
  { code: "2040", label: "2040",  desc: "Climate and technology raise the stakes" },
  { code: "2050", label: "2050",  desc: "A future whose rules are yet to be written" },
];

export const REGIONS = [
  { code: "BK", label: "The Balkans" },
  { code: "AR", label: "Arabian Peninsula" },
  { code: "AF", label: "Africa" },
  { code: "LA", label: "Latin America" },
  { code: "EU", label: "Europe" },
  { code: "AS", label: "Asia" },
];

const LOREM = "Placeholder context. The real text (500–800 characters) will explain what is happening, who the main parties are, why negotiations are necessary and what makes agreement difficult. It will stop at a decision point and never reveal the real historical outcome. This paragraph only exists so you can judge reading length and pacing on your phone and desktop.";

export const SITUATIONS = [
  { id: "DTW", period: "1990", region: "BK", title: "A divided town after the ceasefire", type: "fictional" },
  { id: "DMB", period: "1990", region: "AF", title: "Disarming the armed groups", type: "fictional" },
  { id: "BDR", period: "2000", region: "AR", title: "Drawing the desert border", type: "fictional" },
  { id: "GAS", period: "2000", region: "LA", title: "Who owns the gas?", type: "fictional" },
  { id: "MIG", period: "2010", region: "EU", title: "Sharing responsibility for new arrivals", type: "fictional" },
  { id: "FSH", period: "2010", region: "AS", title: "An incident at the fishing grounds", type: "fictional" },
  { id: "SHP", period: "2026", region: "AR", title: "A threatened shipping lane", type: "fictional" },
  { id: "ENR", period: "2026", region: "BK", title: "A pipeline across three borders", type: "fictional" },
  { id: "RIV", period: "2040", region: "AF", title: "A river in a permanent drought", type: "fictional" },
  { id: "LTH", period: "2040", region: "LA", title: "Lithium and the forest", type: "fictional" },
  { id: "CLM", period: "2050", region: "EU", title: "Climate relocation", type: "fictional" },
  { id: "AIR", period: "2050", region: "AS", title: "Rules for autonomous systems", type: "fictional" },
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
