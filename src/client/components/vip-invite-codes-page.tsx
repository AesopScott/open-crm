import { useEffect, useMemo, useState } from "react";
import { Ban, Copy, Download, KeyRound, Plus, QrCode, RefreshCw } from "lucide-react";
import * as QRCode from "qrcode";
import { useCrm } from "@/context";
import { PageHeader, CategoryBadge, EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import type { VipInviteCode } from "@/types";

export function VipInviteCodesPage() {
  const { inviteCodes, generateInviteCodes, disableInviteCode, refetchInviteCodes, setError } = useCrm();
  const [count, setCount] = useState(1);
  const [busy, setBusy] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string[]>([]);

  const summary = useMemo(() => ({
    available: inviteCodes.filter((code) => code.status === "available").length,
    expired: inviteCodes.filter((code) => code.status === "expired").length,
    used: inviteCodes.filter((code) => code.status === "used").length,
    disabled: inviteCodes.filter((code) => code.status === "disabled").length,
  }), [inviteCodes]);

  const generate = async () => {
    setBusy(true);
    try {
      const links = await generateInviteCodes(count);
      setLastGenerated(links);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate invite links");
    } finally {
      setBusy(false);
    }
  };

  const copy = async (values: string[]) => {
    await navigator.clipboard.writeText(values.join("\n")).catch(() => undefined);
  };

  const disable = async (code: VipInviteCode) => {
    if (code.status !== "available") return;
    setBusy(true);
    try {
      await disableInviteCode(code.code);
      setLastGenerated((prev) => prev.filter((item) => item !== code.registration_url));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disable invite link");
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
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
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
          <Button onClick={generate} disabled={busy}>
            <Plus className="size-4" />
            {busy ? "Generating..." : "Generate links"}
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
                Newly generated
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
                    <InviteQrCode value={code.registration_url} label={`guest-invite-${code.code}`} compact />
                  </TableCell>
                  <TableCell><CategoryBadge value={code.status} /></TableCell>
                  <TableCell>
                    {code.contact_name || code.contact_email ? (
                      <span className="grid gap-0.5">
                        <span className="truncate font-medium text-foreground">{code.contact_name || code.contact_email}</span>
                        {code.contact_email && <span className="truncate text-xs text-muted-foreground">{code.contact_email}</span>}
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
                        disabled={code.status !== "available" || busy}
                        onClick={() => disable(code)}
                        aria-label={`Disable registration link ${code.code}`}
                      >
                        <Ban className="size-4" />
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
