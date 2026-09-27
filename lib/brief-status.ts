// lib/brief-status.ts — shared by server and client code (no secrets here).
export const STATUSES = ["active", "closed", "archived"] as const
export type BriefStatus = (typeof STATUSES)[number]
export const STATUS_LABEL: Record<BriefStatus, string> = { active: "Active", closed: "Closed", archived: "Archived" }
export const isStatus = (v: unknown): v is BriefStatus => STATUSES.includes(v as BriefStatus)
