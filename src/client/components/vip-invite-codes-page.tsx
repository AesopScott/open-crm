import { useEffect, useMemo, useState } from "react";
import { Copy, Download, KeyRound, Plus, QrCode, RefreshCw, Trash2 } from "lucide-react";
import * as QRCode from "qrcode";
import { useCrm } from "@/context";
import { PageHeader, CategoryBadge, EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import type { VipInviteCode } from "@/types";
import { MOJO_EVENTS } from "../../shared/mojo-events";
import { ATTENDEE_TYPES, attendeeTypeLabel } from "../../shared/attendee-types";

export function VipInviteCodesPage() {
  const { inviteCodes, generateInviteCodes, deleteInviteCode, refetchInviteCodes, setError } = useCrm();
  const [count, setCount] = useState(1);
  const [inviteeName, setInviteeName] = useState("");
  const [selectedEventSlug, setSelectedEventSlug] = useState(MOJO_EVENTS[0]?.slug || "");
  const [selectedAttendeeType, setSelectedAttendeeType] = useState<string>(ATTENDEE_TYPES[0]?.value || "guest");
  const [busy, setBusy] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string[]>([]);
  const [lastGeneratedMeta, setLastGeneratedMeta] = useState<{ eventTitle: string; eventDate: string; attendeeType: string } | null>(null);

  const selectedEvent = useMemo(
    () => MOJO_EVENTS.find((event) => event.slug === selectedEventSlug),
    [selectedEventSlug],
  );

  const summary = useMemo(() => ({
    available: inviteCodes.filter((code) => code.status === "available").length,
    expired: inviteCodes.filter((code) => code.status === "expired").length,
    used: inviteCodes.filter((code) => code.status === "used").length,
    disabled: inviteCodes.filter((code) => code.status === "disabled").length,
  }), [inviteCodes]);

  const generate = async () => {
    if (!selectedEvent) {
      setError("Select an event before generating invite links.");
      return;
    }
    const trimmedInviteeName = inviteeName.trim();
    if (!trimmedInviteeName) {
      setError("Enter the registrant name before generating invite links.");
      return;
    }
    setBusy(true);
    try {
      const links = await generateInviteCodes(count, selectedEvent.slug, trimmedInviteeName, selectedAttendeeType);
      setLastGenerated(links);
      setLastGeneratedMeta({
        eventTitle: selectedEvent.title,
        eventDate: selectedEvent.dateLabel,
        attendeeType: selectedAttendeeType,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate invite links");
    } finally {
      setBusy(false);
    }
  };

  const copy = async (values: string[]) => {
    await navigator.clipboard.writeText(values.join("\n")).catch(() => undefined);
  };

  const deleteLink = async (code: VipInviteCode) => {
    if (code.status === "used") return;
    setBusy(true);
    try {
      await deleteInviteCode(code.code);
      setLastGenerated((prev) => prev.filter((item) => item !== code.registration_url));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete invite link");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader title="Guest invite links" count={inviteCodes.length}>
        <Button size="sm" variant="outline" onClick={() => refetchInviteCodes().catch((e) => setError((e as Error).message))}>
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </PageHeader>

      <div className="grid gap-4 border-b border-border p-6">
        <div className="grid gap-3 lg:grid-cols-[8rem_minmax(12rem,0.8fr)_minmax(16rem,1.15fr)_minmax(12rem,0.75fr)_auto] lg:items-end">
          <div className="grid max-w-sm gap-2">
            <Label htmlFor="invite-code-count">Links to generate</Label>
            <Input
              id="invite-code-count"
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(event) => setCount(Math.min(100, Math.max(1, Number(event.target.value) || 1)))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="invitee-name">Registrant</Label>
            <Input
              id="invitee-name"
              type="text"
              value={inviteeName}
              placeholder="Invitee name"
              onChange={(event) => setInviteeName(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="invite-event">Event for guest link</Label>
            <select
              id="invite-event"
              value={selectedEventSlug}
              onChange={(event) => setSelectedEventSlug(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {MOJO_EVENTS.map((event) => (
                <option key={event.slug} value={event.slug}>
                  {event.title} - {event.dateLabel}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="attendee-type">Attendee type</Label>
            <select
              id="attendee-type"
              value={selectedAttendeeType}
              onChange={(event) => setSelectedAttendeeType(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {ATTENDEE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={generate} disabled={busy || !selectedEvent || !inviteeName.trim()}>
            <Plus className="size-4" />
            {busy ? "Generating..." : "Generate Guest Link"}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-md border border-border px-3 py-1.5 text-muted-foreground">Available <strong className="tabular text-foreground">{summary.available}</strong></span>
          <span className="rounded-md border border-border px-3 py-1.5 text-muted-foreground">Expired <strong className="tabular text-foreground">{summary.expired}</strong></span>
          <span className="rounded-md border border-border px-3 py-1.5 text-muted-foreground">Used <strong className="tabular text-foreground">{summary.used}</strong></span>
          <span className="rounded-md border border-border px-3 py-1.5 text-muted-foreground">Disabled <strong className="tabular text-foreground">{summary.disabled}</strong></span>
        </div>

        {lastGenerated.length > 0 && (
          <div className="grid gap-3 rounded-md border border-[var(--ring)]/40 bg-secondary/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <KeyRound className="size-4 text-[var(--ring)]" />
                <span className="grid gap-0.5">
                  <span>Newly generated</span>
                  {lastGeneratedMeta && (
                    <span className="text-xs font-normal text-muted-foreground">
                      {lastGeneratedMeta.eventTitle} - {lastGeneratedMeta.eventDate} - {attendeeTypeLabel(lastGeneratedMeta.attendeeType)}
                    </span>
                  )}
                </span>
              </div>
              <Button size="sm" variant="outline" onClick={() => copy(lastGenerated)}>
                <Copy className="size-4" />
                Copy all
              </Button>
            </div>
            <div className="grid gap-2">
              {lastGenerated.map((link) => (
                <div
                  key={link}
                  className="grid gap-3 rounded border border-border bg-background p-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center"
                >
                  <InviteQrCode value={link} label={`guest-invite-${inviteCodeFromUrl(link) || "link"}`} />
                  <button
                    onClick={() => copy([link])}
                    className="min-w-0 truncate rounded border border-border bg-secondary/40 px-3 py-1.5 text-left font-mono text-sm font-semibold hover:border-[var(--ring)]"
                    title="Copy registration link"
                  >
                    {link}
                  </button>
                  <Button size="sm" variant="outline" onClick={() => copy([link])}>
                    <Copy className="size-4" />
                    Copy
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {inviteCodes.length === 0 ? (
        <EmptyState title="No guest invite links yet. Generate a link before inviting a registrant." />
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Registration link</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Attendee type</TableHead>
                <TableHead>QR code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registrant</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Used</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inviteCodes.map((code) => (
                <TableRow key={code.code}>
                  <TableCell>
                    <span className="grid min-w-[18rem] max-w-[34rem] gap-1">
                      <span className="truncate font-mono text-sm font-semibold">{code.registration_url}</span>
                      <span className="font-mono text-xs text-muted-foreground">ID {code.code}</span>
                    </span>
                  </TableCell>
                  <TableCell>
                    {code.event_name ? (
                      <span className="grid min-w-[14rem] gap-0.5">
                        <span className="truncate font-medium text-foreground">{code.event_name}</span>
                        <span className="text-xs text-muted-foreground">{code.event_date || "Date pending"}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell><CategoryBadge value={attendeeTypeLabel(code.attendee_type)} /></TableCell>
                  <TableCell>
                    <InviteQrCode value={code.registration_url} label={`guest-invite-${code.code}`} compact />
                  </TableCell>
                  <TableCell><CategoryBadge value={code.status} /></TableCell>
                  <TableCell>
                    {code.contact_name || code.contact_email || code.invitee_name ? (
                      <span className="grid gap-0.5">
                        <span className="truncate font-medium text-foreground">{code.contact_name || code.contact_email || code.invitee_name}</span>
                        {code.contact_email && <span className="truncate text-xs text-muted-foreground">{code.contact_email}</span>}
                        {!code.contact_id && code.invitee_name && <span className="truncate text-xs text-muted-foreground">Invited registrant</span>}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not registered</span>
                    )}
                  </TableCell>
                  <TableCell className="tabular text-muted-foreground">{formatDate(code.expires_at)}</TableCell>
                  <TableCell className="tabular text-muted-foreground">{formatDate(code.created_at)}</TableCell>
                  <TableCell className="tabular text-muted-foreground">{code.used_at ? formatDate(code.used_at) : "-"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="size-8" onClick={() => copy([code.registration_url])} aria-label={`Copy registration link ${code.code}`}>
                        <Copy className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        disabled={code.status === "used" || busy}
                        onClick={() => deleteLink(code)}
                        aria-label={`Delete registration link ${code.code}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function formatDate(value: string): string {
  if (!value) return "-";
  const date = new Date(value.endsWith("Z") ? value : `${value}Z`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function inviteCodeFromUrl(value: string): string {
  try {
    return new URL(value).searchParams.get("invite") || "";
  } catch {
    return "";
  }
}

function safeFileName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "guest-invite";
}

function InviteQrCode({ value, label, compact = false }: { value: string; label: string; compact?: boolean }) {
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 320,
      color: {
        dark: "#0A0F1E",
        light: "#FFFFFF",
      },
    })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(() => {
        if (active) setDataUrl("");
      });
    return () => {
      active = false;
    };
  }, [value]);

  const download = () => {
    if (!dataUrl) return;
    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = `${safeFileName(label)}-qr.png`;
    anchor.click();
  };

  return (
    <div className={compact ? "flex items-center gap-2" : "flex items-center gap-3"}>
      <div className={compact ? "flex size-14 items-center justify-center rounded border border-border bg-white p-1" : "flex size-20 items-center justify-center rounded border border-border bg-white p-1.5"}>
        {dataUrl ? (
          <img src={dataUrl} alt="" className="size-full" />
        ) : (
          <QrCode className="size-5 text-[#0A0F1E]" />
        )}
      </div>
      <Button
        size={compact ? "icon" : "sm"}
        variant="outline"
        className={compact ? "size-8" : undefined}
        onClick={download}
        disabled={!dataUrl}
        aria-label={`Download QR code for ${label}`}
        title="Download QR code"
      >
        <Download className="size-4" />
        {!compact && "Download QR"}
      </Button>
    </div>
  );
}
