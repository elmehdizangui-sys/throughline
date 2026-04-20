import type { ReactNode } from "react";
import type { ThroughlineEntry, ThroughlineTweaks } from "@/lib/types";

const ACCENTS = {
  indigo: {
    a: "oklch(0.45 0.14 270)",
    soft: "oklch(0.93 0.04 270)",
    ink: "oklch(0.32 0.12 270)",
  },
  clay: {
    a: "oklch(0.55 0.12 40)",
    soft: "oklch(0.94 0.03 40)",
    ink: "oklch(0.4 0.1 40)",
  },
  moss: {
    a: "oklch(0.48 0.1 150)",
    soft: "oklch(0.93 0.03 150)",
    ink: "oklch(0.35 0.08 150)",
  },
  ink: {
    a: "oklch(0.25 0.02 260)",
    soft: "oklch(0.9 0.01 260)",
    ink: "oklch(0.2 0.02 260)",
  },
  rose: {
    a: "oklch(0.55 0.14 10)",
    soft: "oklch(0.94 0.04 10)",
    ink: "oklch(0.4 0.11 10)",
  },
} as const;

const DARK_ACCENT = {
  a: "oklch(0.72 0.11 80)",
  soft: "oklch(0.28 0.06 80)",
  ink: "oklch(0.85 0.12 80)",
} as const;

const FONTS = {
  editorial: {
    display: 'var(--font-fraunces), "Source Serif 4", Georgia, serif',
    body: 'var(--font-inter), system-ui, sans-serif',
  },
  sans: {
    display: 'var(--font-inter), system-ui, sans-serif',
    body: 'var(--font-inter), system-ui, sans-serif',
  },
  serif: {
    display: 'var(--font-fraunces), Georgia, serif',
    body: 'var(--font-source-serif), Georgia, serif',
  },
} as const;

const BLOCKNOTE_CONTENT_PREFIX = "blocknote:v1:";

interface BlockNoteSerializedContent {
  html: string;
  markdown: string;
}

export const Icon = {
  Hash: (props: { size?: number }) => (
    <svg viewBox="0 0 16 16" width={props.size ?? 14} height={props.size ?? 14} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 6h10M3 10h10M6 3l-1 10M11 3l-1 10" />
    </svg>
  ),
  Code: (props: { size?: number }) => (
    <svg viewBox="0 0 16 16" width={props.size ?? 14} height={props.size ?? 14} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 5L3 8l3 3M10 5l3 3-3 3" />
    </svg>
  ),
  Link: (props: { size?: number }) => (
    <svg viewBox="0 0 16 16" width={props.size ?? 14} height={props.size ?? 14} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M7 9a3 3 0 004 0l2-2a3 3 0 10-4-4l-1 1M9 7a3 3 0 00-4 0l-2 2a3 3 0 004 4l1-1" />
    </svg>
  ),
  Paperclip: (props: { size?: number }) => (
    <svg viewBox="0 0 16 16" width={props.size ?? 14} height={props.size ?? 14} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M13 7L8 12a3 3 0 01-4-4l5-5a2 2 0 013 3l-5 5a1 1 0 01-2-1l4-4" />
    </svg>
  ),
  Star: (props: { size?: number; filled?: boolean }) => (
    <svg
      viewBox="0 0 16 16"
      width={props.size ?? 12}
      height={props.size ?? 12}
      fill={props.filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M8 2l1.8 3.7 4 .6-3 2.8.8 4-3.6-2-3.6 2 .8-4-3-2.8 4-.6z" />
    </svg>
  ),
  X: (props: { size?: number }) => (
    <svg viewBox="0 0 16 16" width={props.size ?? 12} height={props.size ?? 12} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  ),
  Settings: (props: { size?: number }) => (
    <svg viewBox="0 0 16 16" width={props.size ?? 14} height={props.size ?? 14} fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="2" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.5 3.5l1.5 1.5M11 11l1.5 1.5M3.5 12.5L5 11M11 5l1.5-1.5" />
    </svg>
  ),
} as const;

export function applyTweaks(tweaks: ThroughlineTweaks) {
  const root = document.documentElement;
  root.dataset.theme = tweaks.theme;
  root.dataset.layout = tweaks.layout;
  root.dataset.density = tweaks.density;
  root.dataset.entry = tweaks.entry;

  const accent = ACCENTS[tweaks.accent] ?? ACCENTS.indigo;
  const isDark = tweaks.theme === "dark";
  root.style.setProperty("--accent", isDark ? DARK_ACCENT.a : accent.a);
  root.style.setProperty("--accent-soft", isDark ? DARK_ACCENT.soft : accent.soft);
  root.style.setProperty("--accent-ink", isDark ? DARK_ACCENT.ink : accent.ink);

  const fonts = FONTS[tweaks.font] ?? FONTS.editorial;
  root.style.setProperty("--f-display", fonts.display);
  root.style.setProperty("--f-body", fonts.body);
}

export function formatTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function formatDay(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  if (target.getTime() === today.getTime()) {
    return `Today - ${date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}`;
  }
  if (target.getTime() === yesterday.getTime()) {
    return `Yesterday - ${date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}`;
  }

  return date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

export function extractTags(value: string) {
  const matches = value.match(/(^|\s)#([a-z0-9_-]+)/gi) ?? [];
  return [...new Set(matches.map((part) => part.trim().slice(1)))];
}

export function encodeBlockNoteContent(payload: BlockNoteSerializedContent) {
  const html = payload.html.trim();
  const markdown = payload.markdown.trim();
  if (!html && !markdown) return "";
  return `${BLOCKNOTE_CONTENT_PREFIX}${JSON.stringify({ html, markdown })}`;
}

export function parseBlockNoteContent(value: string): BlockNoteSerializedContent | null {
  if (!value.startsWith(BLOCKNOTE_CONTENT_PREFIX)) return null;
  const raw = value.slice(BLOCKNOTE_CONTENT_PREFIX.length);
  if (!raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<BlockNoteSerializedContent>;
    if (typeof parsed.html !== "string" || typeof parsed.markdown !== "string") return null;
    return {
      html: parsed.html,
      markdown: parsed.markdown,
    };
  } catch {
    return null;
  }
}

export function getEntryPlainText(content: string) {
  const rich = parseBlockNoteContent(content);
  return rich ? rich.markdown : content;
}

function sanitizeRichHtml(html: string) {
  if (!html.trim()) return "";
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    // SSR: return empty — the component is client-rendered, so this will
    // be replaced by the full sanitizer on hydration. Returning html
    // here would bypass event-handler and javascript: removal.
    return "";
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  doc.querySelectorAll("script,style,iframe,object,embed,link,meta").forEach((node) => node.remove());

  doc.querySelectorAll("*").forEach((element) => {
    for (const attribute of [...element.attributes]) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (name.startsWith("on")) {
        element.removeAttribute(attribute.name);
        continue;
      }
      if ((name === "href" || name === "src") && value.startsWith("javascript:")) {
        element.removeAttribute(attribute.name);
        continue;
      }
      if (name === "style") {
        element.removeAttribute(attribute.name);
      }
    }
  });

  return doc.body.innerHTML;
}

export function renderContent(text: string) {
  const rich = parseBlockNoteContent(text);
  if (rich) {
    return <div className="rich-content" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(rich.html) }} />;
  }

  const parts: ReactNode[] = [];
  const regex = /(https?:\/\/[^\s]+)|(#[a-z0-9_-]+)/gi;
  let last = 0;
  let index = 0;
  let match: RegExpExecArray | null = regex.exec(text);

  while (match) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    if (match[1]) {
      parts.push(
        <a key={`u-${index}`} href={match[1]} onClick={(event) => event.preventDefault()}>
          {match[1]}
        </a>,
      );
    } else {
      parts.push(
        <span key={`t-${index}`} style={{ color: "var(--ink-3)", fontFamily: "var(--f-mono)", fontSize: "0.88em" }}>
          {match[2]}
        </span>,
      );
    }

    index += 1;
    last = match.index + match[0].length;
    match = regex.exec(text);
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return parts;
}

export function CodeBlock({ content }: { content: string }) {
  const body = content.replace(/^```[a-z]*\n?/, "").replace(/```$/, "");
  return (
    <pre className="code-block">
      <code>{body}</code>
    </pre>
  );
}

export function isEntrySignal(entry: ThroughlineEntry) {
  return Boolean(entry.signal || entry.starred);
}
