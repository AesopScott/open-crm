export const ATTENDEE_TYPES = [
  { value: "guest", label: "Guest" },
  { value: "featured_guest", label: "Featured guest" },
  { value: "live_presenter", label: "Live presenter" },
  { value: "roundtable_leader", label: "Roundtable leader" },
] as const;

export type AttendeeType = (typeof ATTENDEE_TYPES)[number]["value"];

export function normalizeAttendeeType(value: unknown): AttendeeType {
  const raw = typeof value === "string" ? value.trim() : "";
  return ATTENDEE_TYPES.some((type) => type.value === raw) ? (raw as AttendeeType) : "guest";
}

export function attendeeTypeLabel(value: unknown): string {
  const normalized = normalizeAttendeeType(value);
  return ATTENDEE_TYPES.find((type) => type.value === normalized)?.label ?? "Guest";
}
