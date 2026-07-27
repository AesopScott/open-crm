import { useMemo, useState } from "react";
import { Copy, KeyRound, Plus, RefreshCw, Ban } from "lucide-react";
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
      <PageHeader title="VIP invite links" count={inviteCodes.length}>
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
                <button
                  key={link}
                  onClick={() => copy([link])}
                  className="min-w-0 truncate rounded border border-border bg-background px-3 py-1.5 text-left font-mono text-sm font-semibold hover:border-[var(--ring)]"
                  title="Copy registration link"
                >
                  {link}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {inviteCodes.length === 0 ? (
        <EmptyState title="No VIP invite links yet. Generate a link before inviting a registrant." />
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Registration link</TableHead>
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
