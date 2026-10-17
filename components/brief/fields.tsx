"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

// "filled"  = pre-filled from the uploaded document (client should review it)
// "missing" = required and still empty after an upload (pulses, then keeps an outline)
export type FieldStatus = "filled" | "missing"

function Label({ children, required, status }: { children: ReactNode; required?: boolean; status?: FieldStatus }) {
  return (
    <span className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="lux-label">
        {children}
        {required && <span className="ml-0.5 text-brand">*</span>}
      </span>
      {status === "filled" && (
        <span className="rounded-full bg-accent px-2 py-0.5 font-sans text-[10px] font-semibold tracking-wide text-brand ring-1 ring-brand/25">
          Auto-filled · please check
        </span>
      )}
      {status === "missing" && (
        <span className="rounded-full bg-brand px-2 py-0.5 font-sans text-[10px] font-semibold tracking-wide text-primary-foreground">
          Still needed
        </span>
      )}
    </span>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="lux-eyebrow mb-7 border-b border-hairline pb-3">
      {children}
    </div>
  )
}

// Background and border are chosen per state (not overridden), so classes never conflict.
const controlBase =
  "w-full rounded-md border px-3.5 py-2.5 font-sans text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-brand focus:ring-2 focus:ring-brand/15"

function controlClass(status?: FieldStatus, error?: string) {
  const bg = status === "filled" ? "bg-accent" : "bg-field"
  const border =
    status === "missing"
      ? "border-brand ring-2 ring-brand/20 brief-pulse"
      : error
        ? "border-brand ring-2 ring-brand/15"
        : "border-input"
  return `${controlBase} ${bg} ${border}`
}

type InputProps = {
  label: string
  required?: boolean
  placeholder?: string
  value: string
  onChange: (value: string) => void
  type?: string
  error?: string
  status?: FieldStatus
  id?: string
}

export function TextField({ label, required, placeholder, value, onChange, type = "text", error, status, id }: InputProps) {
  return (
    <label id={id} className="mb-[18px] block scroll-mt-24">
      <Label required={required} status={status}>
        {label}
      </Label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error || status === "missing" ? true : undefined}
        className={controlClass(status, error)}
      />
      {error && <span className="mt-1.5 block font-sans text-[12px] text-brand">{error}</span>}
    </label>
  )
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

function parseMDY(value: string): Date | null {
  if (!value) return null
  const [m, d, y] = value.split("/").map((p) => p.trim())
  const dt = new Date(Number(y), Number(m) - 1, Number(d))
  return Number.isNaN(dt.getTime()) ? null : dt
}

export function DateField({ label, required, value, onChange, status, id }: Omit<InputProps, "placeholder" | "type">) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const parsed = parseMDY(value)

  const [viewYear, setViewYear] = useState(() => parsed?.getFullYear() ?? new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(() => parsed?.getMonth() ?? new Date().getMonth())

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  function selectDay(day: number) {
    const m = String(viewMonth + 1).padStart(2, "0")
    const d = String(day).padStart(2, "0")
    onChange(`${m}/${d}/${viewYear}`)
    setOpen(false)
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else setViewMonth((m) => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else setViewMonth((m) => m + 1)
  }

  const displayValue = parsed
    ? parsed.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : ""

  return (
    <div id={id} className="mb-[18px] scroll-mt-24" ref={ref}>
      <Label required={required} status={status}>
        {label}
      </Label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false)
        }}
        className={`${controlClass(status)} flex items-center justify-between text-left`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={status === "missing" ? true : undefined}
      >
        <span className={displayValue ? "text-foreground" : "text-muted-foreground/70"}>
          {displayValue || "Select a date"}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-muted-foreground"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={`${label} date picker`}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false)
          }}
          className="relative z-50 mt-2 w-full rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-2xl"
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              aria-label="Previous month"
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="font-sans text-sm font-medium" aria-live="polite">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              aria-label="Next month"
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1" aria-hidden="true">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-center font-sans text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const isSelected =
                parsed !== null &&
                parsed.getFullYear() === viewYear &&
                parsed.getMonth() === viewMonth &&
                parsed.getDate() === day
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  aria-label={`${MONTH_NAMES[viewMonth]} ${day}, ${viewYear}`}
                  aria-pressed={isSelected}
                  className={`aspect-square rounded-lg font-sans text-sm transition-colors ${
                    isSelected
                      ? "bg-brand font-semibold text-white"
                      : "text-foreground/80 hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {value && (
            <button
              type="button"
              onClick={() => {
                onChange("")
                setOpen(false)
              }}
              className="mt-3 w-full rounded-lg py-1.5 font-sans text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear date
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function TextArea({ label, required, placeholder, value, onChange, status, id }: InputProps) {
  return (
    <label id={id} className="mb-[18px] block scroll-mt-24">
      <Label required={required} status={status}>
        {label}
      </Label>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        aria-invalid={status === "missing" ? true : undefined}
        className={`${controlClass(status)} resize-y`}
      />
    </label>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="lux-chip"
    >
      {children}
    </button>
  )
}

// Chip groups get the highlight on the whole group.
function groupClass(status?: FieldStatus) {
  if (status === "missing") return "-mx-2 rounded-lg p-2 ring-2 ring-brand/30 brief-pulse"
  if (status === "filled") return "-mx-2 rounded-lg bg-accent/50 p-2"
  return ""
}

type RadioProps = {
  label: string
  required?: boolean
  options: string[]
  value: string
  onChange: (value: string) => void
  status?: FieldStatus
  id?: string
}

export function RadioGroup({ label, required, options, value, onChange, status, id }: RadioProps) {
  return (
    <fieldset id={id} className={`mb-[18px] scroll-mt-24 ${groupClass(status)}`}>
      <Label required={required} status={status}>
        {label}
      </Label>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((opt) => (
          <Chip key={opt} active={value === opt} onClick={() => onChange(opt)}>
            {opt}
          </Chip>
        ))}
      </div>
    </fieldset>
  )
}

type CheckProps = {
  label: string
  required?: boolean
  options: string[]
  values: string[]
  onChange: (values: string[]) => void
  status?: FieldStatus
  id?: string
}

export function CheckGroup({ label, required, options, values, onChange, status, id }: CheckProps) {
  const toggle = (opt: string) =>
    values.includes(opt) ? onChange(values.filter((v) => v !== opt)) : onChange([...values, opt])
  return (
    <fieldset id={id} className={`mb-[18px] scroll-mt-24 ${groupClass(status)}`}>
      <Label required={required} status={status}>
        {label}
      </Label>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((opt) => (
          <Chip key={opt} active={values.includes(opt)} onClick={() => toggle(opt)}>
            {opt}
          </Chip>
        ))}
      </div>
    </fieldset>
  )
}
