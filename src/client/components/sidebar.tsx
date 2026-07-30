import { Users, Building2, CircleDollarSign, SlidersHorizontal, KeyRound } from "lucide-react";
import { useCrm } from "../context";
import { PIPELINES } from "@/lib/pipelines";
import { cn } from "../lib/utils";
import type { Route } from "../hooks/use-router";

const NAV = [
  { key: "contacts", path: "/contacts", label: "Contacts", icon: Users },
  { key: "invite-codes", path: "/invite-codes", label: "Guest invite links", icon: KeyRound },
  { key: "companies", path: "/companies", label: "Companies", icon: Building2 },
  { key: "deals", path: "/deals", label: "Deals", icon: CircleDollarSign },
] as const;

const SETTINGS_NAV = [
  { key: "properties", path: "/settings/properties", label: "Attributes", icon: SlidersHorizontal },
] as const;

export function Sidebar({ route, navigate }: { route: Route; navigate: (to: string) => void }) {
  const { stats, activePipeline, setActivePipeline } = useCrm();
  const counts: Record<string, number | undefined> = { contacts: stats.contacts, companies: stats.companies, deals: stats.deals };
  const activeKey = route.name === "contact" ? "contacts" : route.name;

  return (
    <aside className="flex w-[260px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-2.5 border-b border-sidebar-border px-5 py-4">
        <div className="flex size-7 items-center justify-center rounded-md bg-[linear-gradient(135deg,#1666ff,#00e6ff)] text-[#0a0f1e] shadow-[0_0_22px_rgba(0,230,255,0.22)]">
          <Users className="size-4" />
        </div>
        <span className="text-base font-bold tracking-[0.18em] text-sidebar-foreground">CRM</span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        <div className="eyebrow px-2.5 pb-1.5 pt-2">Pipeline</div>
        <div className="mb-3 grid gap-1 rounded-md border border-sidebar-border bg-background/35 p-1">
          {PIPELINES.map((pipeline) => {
            const active = activePipeline === pipeline.key;
            return (
              <button
                key={pipeline.key}
                onClick={() => setActivePipeline(pipeline.key)}
                aria-pressed={active}
                className={cn(
                  "flex items-center justify-between gap-2 rounded px-2.5 py-2 text-left text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-secondary",
                )}
              >
                <span>{pipeline.label}</span>
                <span className="text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground">{pipeline.shortLabel}</span>
              </button>
            );
          })}
        </div>

        <div className="eyebrow px-2.5 pb-1.5 pt-2">Records</div>
        {NAV.map((item) => {
          const active = activeKey === item.key;
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              aria-label={`View ${item.label}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-secondary",
              )}
            >
              <item.icon className="size-4 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {counts[item.key] !== undefined && (
                <span className={cn("tabular text-xs", active ? "text-sidebar-accent-foreground" : "text-muted-foreground")}>
                  {counts[item.key]}
                </span>
              )}
            </button>
          );
        })}

        <div className="eyebrow px-2.5 pb-1.5 pt-4">Settings</div>
        {SETTINGS_NAV.map((item) => {
          const active = activeKey === item.key;
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-secondary",
              )}
            >
              <item.icon className="size-4 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
