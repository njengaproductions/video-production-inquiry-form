"use client"

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react"

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

export function DateField({ label, required, value, onChange, status, id, showFeeHint = false }: Omit<InputProps, "placeholder" | "type"> & { showFeeHint?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const [focusedDay, setFocusedDay] = useState<number | null>(null)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const parsed = parseMDY(value)

  const [viewYear, setViewYear] = useState(() => parsed?.getFullYear() ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(() => parsed?.getMonth() ?? today.getMonth())

  const feeHint = showFeeHint && parsed ? (() => {
    const days = Math.ceil((parsed.getTime() - today.getTime()) / 86400000)
    if (days < 7) return { type: "rush", message: "This date is within 7 days. A rush fee will likely apply — we'll confirm during your consultation." }
    if (days < 14) return { type: "expedited", message: "This is a tight timeline. We'll do our best to accommodate — turnaround fees may apply." }
    return null
  })() : null

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  useEffect(() => {
    if (open) {
      const first = parsed?.getMonth() === viewMonth && parsed?.getFullYear() === viewYear
        ? parsed.getDate()
        : today.getMonth() === viewMonth && today.getFullYear() === viewYear
          ? today.getDate()
          : 1
      setFocusedDay(first)
    }
  }, [open, viewMonth, viewYear])

  useEffect(() => {
    if (open && focusedDay !== null && gridRef.current) {
      const btn = gridRef.current.querySelector(`[data-day="${focusedDay}"]`) as HTMLButtonElement | null
      btn?.focus()
    }
  }, [focusedDay, open])

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  function isPast(day: number) {
    const d = new Date(viewYear, viewMonth, day)
    d.setHours(0, 0, 0, 0)
    return d < today
  }

  function isToday(day: number) {
    return today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day
  }

  function selectDay(day: number) {
    if (isPast(day)) return
    const m = String(viewMonth + 1).padStart(2, "0")
    const d = String(day).padStart(2, "0")
    onChange(`${m}/${d}/${viewYear}`)
    setOpen(false)
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
  }

  function handleDayKeyDown(e: ReactKeyboardEvent, day: number) {
    let next = day
    if (e.key === "ArrowRight") next = day < daysInMonth ? day + 1 : day
    else if (e.key === "ArrowLeft") next = day > 1 ? day - 1 : day
    else if (e.key === "ArrowDown") next = day + 7 <= daysInMonth ? day + 7 : day
    else if (e.key === "ArrowUp") next = day - 7 >= 1 ? day - 7 : day
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectDay(day); return }
    else return
    e.preventDefault()
    setFocusedDay(next)
  }

  const displayValue = parsed
    ? parsed.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : ""

  return (
    <div id={id} className="mb-[18px] scroll-mt-24" ref={ref}>
      <Label required={required} status={status}>{label}</Label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${controlClass(status)} flex items-center justify-between text-left`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={status === "missing" ? true : undefined}
        aria-label={displayValue ? `${label}: ${displayValue}. Press to change.` : `${label}: No date selected. Press to open calendar.`}
      >
        <span className={displayValue ? "text-foreground" : "text-muted-foreground/70"}>
          {displayValue || "Select a date"}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </button>

      {feeHint && (
        <div role="status" aria-live="polite" className={`mt-2 flex items-start gap-2 rounded-lg px-3 py-2.5 font-sans text-[12px] leading-snug ${feeHint.type === "rush" ? "bg-brand/10 text-brand" : "bg-muted text-muted-foreground"}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-px shrink-0" aria-hidden="true">
            {feeHint.type === "rush"
              ? <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>
              : <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
            }
          </svg>
          <span>{feeHint.message}</span>
        </div>
      )}

      {open && (
        <div role="dialog" aria-label={`Choose date for ${label}`} aria-modal="true" className="relative z-50 mt-2 w-full rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={prevMonth} aria-label="Previous month" className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="font-sans text-sm font-medium" aria-live="polite" aria-atomic="true">{MONTH_NAMES[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth} aria-label="Next month" className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1" role="row">
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d, i) => (
              <div key={d} role="columnheader" aria-label={["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][i]} className="text-center font-sans text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{d}</div>
            ))}
          </div>

          <div role="grid" aria-label={`${MONTH_NAMES[viewMonth]} ${viewYear}`} ref={gridRef} className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} role="gridcell" aria-hidden="true" />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const past = isPast(day)
              const todayFlag = isToday(day)
              const selected = parsed && parsed.getFullYear() === viewYear && parsed.getMonth() === viewMonth && parsed.getDate() === day
              const fullDate = new Date(viewYear, viewMonth, day).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
              return (
                <div key={day} role="gridcell">
                  <button
                    type="button"
                    data-day={day}
                    onClick={() => selectDay(day)}
                    onKeyDown={(e) => handleDayKeyDown(e, day)}
                    disabled={past}
                    aria-label={`${fullDate}${selected ? ", selected" : ""}${todayFlag ? ", today" : ""}${past ? ", unavailable" : ""}`}
                    aria-selected={selected ? true : undefined}
                    aria-disabled={past ? true : undefined}
                    tabIndex={focusedDay === day ? 0 : -1}
                    className={`aspect-square w-full rounded-lg font-sans text-sm transition-colors
                      ${past ? "cursor-not-allowed text-muted-foreground/30" : ""}
                      ${!past && !selected ? "text-foreground/80 hover:bg-muted hover:text-foreground" : ""}
                      ${selected ? "bg-brand font-semibold text-white" : ""}
                      ${todayFlag && !selected ? "ring-1 ring-brand/50" : ""}
                    `}
                  >
                    {day}
                  </button>
                </div>
              )
            })}
          </div>

          {value && (
            <button type="button" onClick={() => { onChange(""); setOpen(false) }} aria-label="Clear selected date" className="mt-3 w-full rounded-lg py-1.5 font-sans text-xs text-muted-foreground transition-colors hover:text-foreground">
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
