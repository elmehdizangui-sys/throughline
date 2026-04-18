import type {
  MinimapWeek,
  ThroughlineEntry,
  ThroughlineGoal,
  ThroughlineProject,
  ThroughlineTweaks,
} from "@/lib/types";

function iso(daysAgo: number, hour = 10, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export const DEFAULT_TWEAKS: ThroughlineTweaks = {
  theme: "light",
  accent: "indigo",
  layout: "sidebar",
  density: "airy",
  entry: "journal",
  font: "editorial",
};

export const SEED_GOALS: ThroughlineGoal[] = [
  { id: "g1", name: "Build a business that compounds", color: "var(--accent)", order_index: 0 },
  { id: "g2", name: "Write every day, ship every month", color: "var(--accent)", order_index: 1 },
  { id: "g3", name: "Be present with Maya & Leo", color: "var(--accent)", order_index: 2 },
];

export const SEED_PROJECTS: ThroughlineProject[] = [
  { id: "p1", name: "Throughline launch", tag: "throughline", order_index: 0 },
  { id: "p2", name: "Q2 client work - Ember Co.", tag: "ember", order_index: 1 },
];

export const SEED_ENTRIES: ThroughlineEntry[] = [
  {
    id: "e1",
    content:
      "Morning thought: the 'organizing tax' on notes is the reason I stop journaling. If capture is free but sorting is deferred, the system survives bad days.",
    created_at: iso(0, 8, 14),
    starred: true,
    goals: ["g2"],
    projects: ["p1"],
    tags: ["product", "writing"],
  },
  {
    id: "e2",
    content:
      "Talked to Mateo about pricing. He pushed back on the $29 tier - says it reads 'consumer' when the user we want is a pro.",
    created_at: iso(0, 10, 47),
    goals: ["g1"],
    projects: ["p1"],
    tags: ["pricing"],
  },
  {
    id: "e3",
    content: "https://www.robinrendle.com/essays/newsletters-are-not-a-good-way-to-make-money/",
    created_at: iso(0, 12, 3),
    tags: ["reading"],
    link: {
      title: "Newsletters are not a good way to make money",
      desc: "A long read on the economics of independent writing on the open web, and why the subscription model is more subtle than it looks.",
      url: "robinrendle.com",
    },
  },
  {
    id: "e4",
    content:
      "```ts\nfunction throughline<T>(entries: T[], anchor: (e: T) => string) {\n  // collapse noise, keep signal\n  return entries.filter(e => anchor(e));\n}\n```",
    created_at: iso(0, 14, 22),
    isCode: true,
    projects: ["p1"],
    tags: ["code"],
  },
  {
    id: "e5",
    content:
      "Leo asked why grown-ups 'look at phones at dinner.' Filed under: not a product insight, but the thing all product insights should serve.",
    created_at: iso(0, 19, 40),
    starred: true,
    goals: ["g3"],
    tags: ["family"],
  },
  {
    id: "e6",
    content:
      "Kickoff for Ember Co. went well - they want the homepage rewrite in 3 weeks, not 6. Margin is thin; say yes once, say no to scope creep after.",
    created_at: iso(1, 9, 12),
    goals: ["g1"],
    projects: ["p2"],
    tags: ["consulting"],
  },
  {
    id: "e7",
    content:
      "Pattern I keep seeing: founders write features but read feelings. Rewrite landing in the voice of someone who's been avoiding journaling for 6 months.",
    created_at: iso(1, 11, 28),
    starred: true,
    goals: ["g1", "g2"],
    projects: ["p1"],
    tags: ["copy", "insight"],
  },
  {
    id: "e8",
    content: "Fixed the sticky-header jitter on mobile. Sometimes a bug is just a 1px calc() you wrote at 11pm.",
    created_at: iso(1, 15, 55),
    projects: ["p1"],
    tags: ["bug"],
  },
  {
    id: "e9",
    content: "Run: 6.4km, slow. Good thinking pace. #running",
    created_at: iso(1, 18, 10),
    goals: ["g3"],
    tags: ["running"],
  },
  {
    id: "pivot1",
    content: "",
    created_at: iso(2, 10, 0),
    isPivot: true,
    from: "Consulting, indefinitely",
    to: "Build a business that compounds",
    slotKind: "Life goal",
  },
  {
    id: "e10",
    content:
      "Rewrote the three Life Goals this morning. 'Consulting indefinitely' was the thing I was doing, not the thing I wanted. Moved it to the Projects row - it's a means, not an end.",
    created_at: iso(2, 10, 5),
    starred: true,
    goals: ["g1"],
    tags: ["review"],
  },
  {
    id: "e11",
    content:
      "Idea: the weekly review should never be more than 12 entries. Over that, the brain rebels and you close the tab.",
    created_at: iso(2, 16, 14),
    goals: ["g2"],
    projects: ["p1"],
    tags: ["product"],
  },
  {
    id: "e12",
    content:
      "Dinner with Sam. They asked 'what's your throughline right now?' - that's the name. Stop looking.",
    created_at: iso(3, 20, 30),
    starred: true,
    projects: ["p1"],
    tags: ["naming"],
  },
  {
    id: "e13",
    content:
      "Can't shake the feeling that notebooks-as-products always drift into todo-lists. Resist.",
    created_at: iso(3, 22, 8),
    projects: ["p1"],
    tags: ["product"],
  },
  {
    id: "e14",
    content: "Ember's Head of Brand sent a mood board. Three of six references are Craig Mod. Noted.",
    created_at: iso(4, 13, 45),
    projects: ["p2"],
    tags: ["brand"],
  },
  {
    id: "e15",
    content:
      "Re-read Morning Pages chapter. The friction to WRITE anything is lower than the friction to FILE it. Build for the first, hide the second.",
    created_at: iso(4, 8, 22),
    goals: ["g2"],
    tags: ["reading"],
  },
  {
    id: "e16",
    content: "Shipped the landing v1. Not proud of it yet. That's fine - shipped > proud, for now.",
    created_at: iso(6, 17, 0),
    starred: true,
    goals: ["g2"],
    projects: ["p1"],
    tags: ["ship"],
  },
];

export const SEED_MINIMAP: MinimapWeek[] = [
  { week: "W16", level: 3, pivot: true },
  { week: "W15", level: 2 },
  { week: "W14", level: 3 },
  { week: "W13", level: 2 },
  { week: "W12", level: 1 },
  { week: "W11", level: 0 },
  { week: "W10", level: 2 },
  { week: "W09", level: 1 },
];
