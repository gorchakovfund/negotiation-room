// Settings organisers may need to change. No other file should need editing for these.
export const CONFIG = {
  programmeCode: "DF26",

  // Application ID entered by the applicant on screen 01b, e.g. DF-2026-000001
  applicationIdPattern: /^DF-2026-\d{6}$/,
  applicationIdExample: "DF-2026-000001",

  // Where applicants submit their video. TODO: set the real public form URL.
  applicationFormUrl: "https://en.gorchakovfund.ru/",

  videoMaxMinutes: 3,
};
