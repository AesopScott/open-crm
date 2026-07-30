import type { PipelineKey } from "@/types";

export const PIPELINES: Array<{
  key: PipelineKey;
  label: string;
  shortLabel: string;
  contactLabel: string;
  companyLabel: string;
  dealLabel: string;
}> = [
  {
    key: "vip_registrants",
    label: "Guest registrants",
    shortLabel: "Guests",
    contactLabel: "Guest registrant",
    companyLabel: "Guest organizations",
    dealLabel: "Guest pipeline",
  },
  {
    key: "vendor_sponsors",
    label: "Partners",
    shortLabel: "Partners",
    contactLabel: "Partner contact",
    companyLabel: "Partners",
    dealLabel: "Partner pipeline",
  },
];

export const DEFAULT_PIPELINE: PipelineKey = "vip_registrants";

export function pipelineLabel(key: PipelineKey): string {
  return PIPELINES.find((p) => p.key === key)?.label ?? key;
}

export function pipelineMeta(key: PipelineKey) {
  return PIPELINES.find((p) => p.key === key) ?? PIPELINES[0];
}
