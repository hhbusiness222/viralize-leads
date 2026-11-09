export const STAGES = [
  { key: "texting", label: "Texting", color: "#623cd8", hint: "Replied, in the convo" },
  { key: "booked", label: "Call booked", color: "#155eef", hint: "Date and rep set" },
  { key: "calldone", label: "Call done", color: "#f79009", hint: "Log the outcome and next step" },
  { key: "won", label: "Won", color: "#17b26a", hint: "Signed" },
  { key: "lost", label: "Lost", color: "#8b93a1", hint: "Said no or went quiet" },
] as const;

export type StageKey = (typeof STAGES)[number]["key"];
export const STAGE_MAP: Record<string, (typeof STAGES)[number]> = Object.fromEntries(
  STAGES.map((s) => [s.key, s])
);

export const OUTCOMES = [
  "Showed, good fit",
  "Showed, not a fit",
  "Showed, thinking about it",
  "No show",
  "Rescheduled",
  "Cancelled",
];

export const DEFAULT_REPS = ["Hunter", "Jamal", "Jaxson", "Cameron", "Marcus", "Headsick", "Sebastian"];
export const DEFAULT_HOW = [
  "Word of mouth",
  "Referrals",
  "Paid ads",
  "Posting on socials",
  "Google / website",
  "Lead vendor (Angi, HomeStars etc)",
  "Door knocking / flyers",
  "Nothing really",
];

export type Lead = {
  id: string;
  business: string;
  contact: string;
  phone: string;
  email: string;
  trade: string;
  source: string;
  rep: string;
  stage: string;
  how: string[];
  text_notes: string;
  call_at: Date | null;
  call_rep: string;
  outcome: string;
  call_notes: string;
  next_step: string;
  lost_reason: string;
  value: number;
  created_by: string;
  created_at: Date;
  updated_at: Date;
};

export type Activity = {
  id: number;
  lead_id: string;
  at: Date;
  text: string;
  by_rep: string;
};
