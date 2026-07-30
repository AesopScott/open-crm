export interface MojoEvent {
  slug: string;
  title: string;
  dateLabel: string;
  format: "Virtual" | "In person";
}

export const MOJO_EVENTS: MojoEvent[] = [
  {
    slug: "ai-executive-readiness",
    title: "AI Executive Readiness",
    dateLabel: "Friday, September 4, 2026",
    format: "Virtual",
  },
  {
    slug: "ai-use-cases-that-survive-finance",
    title: "AI Use Cases That Survive Finance",
    dateLabel: "Friday, September 25, 2026",
    format: "Virtual",
  },
  {
    slug: "ai-integration-and-workflow",
    title: "AI Integration and Workflow",
    dateLabel: "Friday, October 16, 2026",
    format: "Virtual",
  },
  {
    slug: "ai-security-governance-and-trust",
    title: "AI Security, Governance, and Trust",
    dateLabel: "Friday, November 6, 2026",
    format: "Virtual",
  },
  {
    slug: "ai-operating-model-for-2027",
    title: "AI Operating Model for 2027",
    dateLabel: "Friday, November 27, 2026",
    format: "Virtual",
  },
  {
    slug: "dallas-2027",
    title: "Dallas 2027 Summit",
    dateLabel: "January 2027",
    format: "In person",
  },
];

export function mojoEventBySlug(slug: string): MojoEvent | undefined {
  return MOJO_EVENTS.find((event) => event.slug === slug);
}
