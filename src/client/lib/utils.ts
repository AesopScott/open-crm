import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Map data color tokens to Mojo-branded card / badge surfaces. */
export const colorPalette = {
  sky:     { bg: "bg-[#10295c]", border: "border-[#1666ff]/55", text: "text-[#d7e7ff]", ring: "ring-[#1666ff]", dot: "bg-[#1666ff]" },
  emerald: { bg: "bg-[#063b47]", border: "border-[#00e6ff]/55", text: "text-[#c9fbff]", ring: "ring-[#00e6ff]", dot: "bg-[#00e6ff]" },
  amber:   { bg: "bg-[#162d50]", border: "border-[#6da6ff]/55", text: "text-[#d7e7ff]", ring: "ring-[#6da6ff]", dot: "bg-[#6da6ff]" },
  rose:    { bg: "bg-[#332238]", border: "border-[#00e6ff]/40", text: "text-[#dffcff]", ring: "ring-[#00e6ff]", dot: "bg-[#00e6ff]" },
  violet:  { bg: "bg-[#12245c]", border: "border-[#1666ff]/45", text: "text-[#d7e7ff]", ring: "ring-[#1666ff]", dot: "bg-[#1666ff]" },
  fuchsia: { bg: "bg-[#073746]", border: "border-[#00e6ff]/45", text: "text-[#c9fbff]", ring: "ring-[#00e6ff]", dot: "bg-[#00e6ff]" },
  teal:    { bg: "bg-[#063b47]", border: "border-[#00e6ff]/55", text: "text-[#c9fbff]", ring: "ring-[#00e6ff]", dot: "bg-[#00e6ff]" },
  orange:  { bg: "bg-[#1b2333]", border: "border-[#6da6ff]/45", text: "text-[#d7e7ff]", ring: "ring-[#6da6ff]", dot: "bg-[#6da6ff]" },
  slate:   { bg: "bg-[#1b2333]", border: "border-white/15", text: "text-white", ring: "ring-white/20", dot: "bg-white" },
} as const;

export type ColorToken = keyof typeof colorPalette;

export function colorClasses(token: string | null | undefined): typeof colorPalette[ColorToken] {
  return colorPalette[(token as ColorToken)] ?? colorPalette.sky;
}

const TOKENS = Object.keys(colorPalette) as ColorToken[];

/** Deterministically map any string to a stable category color token (DESIGN-APPS
 *  signature #4 — color = data). The same value always gets the same color. */
export function categoryToken(value: string): ColorToken {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  return TOKENS[Math.abs(hash) % TOKENS.length];
}

/** Category classes for a value (badge/pill/avatar surface). */
export function categoryClasses(value: string | null | undefined) {
  return colorClasses(value ? categoryToken(value) : "slate");
}

export function getInitials(firstName?: string | null, lastName?: string | null): string {
  return ((firstName?.[0] || "") + (lastName?.[0] || "")).toUpperCase() || "?";
}

/** Format an ISO date string 'YYYY-MM-DD' or full datetime to a short date label. */
export function formatDate(iso: string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!iso) return "";
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, opts ?? { year: "numeric", month: "short", day: "numeric" });
}

/** Format a number as currency. Uses USD by default. */
export function formatMoney(n: number | null | undefined, currency = "USD"): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

/** YYYY-MM-DD for a given Date in local time. */
export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** YYYY-MM for the current month. */
export function currentPeriod(): string {
  return toIsoDate(new Date()).slice(0, 7);
}

/** Add or subtract months from a 'YYYY-MM' string. */
export function addMonths(period: string, delta: number): string {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Pretty 'April 2026' for 'YYYY-MM'. */
export function formatPeriod(period: string): string {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/** Days between two ISO dates (positive = b after a). */
export function daysBetween(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00`).getTime();
  const db = new Date(`${b}T00:00:00`).getTime();
  return Math.round((db - da) / 86_400_000);
}
