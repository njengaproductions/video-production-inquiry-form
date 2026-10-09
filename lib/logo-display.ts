import type { CSSProperties } from "react"

export const LOGO_FITS = ["contain", "cover", "fill"] as const
export type LogoFit = (typeof LOGO_FITS)[number]
export type LogoPosition = { x: number; y: number }
export type LogoDisplay = { fit: LogoFit; scale: number; position: LogoPosition }

export const LOGO_SCALE_RANGE = { min: 0.5, max: 2, step: 0.05 }
export const LOGO_OFFSET_RANGE = { min: -40, max: 40, step: 4 }
export const DEFAULT_LOGO_DISPLAY: LogoDisplay = { fit: "contain", scale: 1, position: { x: 0, y: 0 } }

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export function normalizeLogoDisplay(input: { fit?: unknown; scale?: unknown; position?: unknown }): LogoDisplay {
  const fit = LOGO_FITS.includes(input.fit as LogoFit) ? (input.fit as LogoFit) : DEFAULT_LOGO_DISPLAY.fit
  const scaleNumber = Number(input.scale)
  const scale = input.scale != null && Number.isFinite(scaleNumber) ? clamp(scaleNumber, LOGO_SCALE_RANGE.min, LOGO_SCALE_RANGE.max) : DEFAULT_LOGO_DISPLAY.scale

  let raw: unknown = input.position
  if (typeof raw === "string") {
    try { raw = JSON.parse(raw) } catch { raw = null }
  }
  const point = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  const axis = (value: unknown) => (Number.isFinite(Number(value)) ? clamp(Number(value), LOGO_OFFSET_RANGE.min, LOGO_OFFSET_RANGE.max) : 0)

  return { fit, scale, position: { x: axis(point.x), y: axis(point.y) } }
}

export function logoImageStyle(display?: Partial<LogoDisplay> | null): CSSProperties {
  const { fit, scale, position } = normalizeLogoDisplay(display ?? {})
  return { objectFit: fit, transform: `translate(${position.x}px, ${position.y}px) scale(${scale})` }
}
