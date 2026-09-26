"use client"

import type { ReactNode } from "react"

// "filled"  = pre-filled from the uploaded document (client should review it)
// "missing" = required and still empty after an upload (pulses, then keeps an outline)
export type FieldStatus = "filled" | "missing"

function Label({ children, required, status }: { children: ReactNode; required?: boolean; status?: FieldStatus }) {
  return (
    <span className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-serif text-[13px] font-semibold text-foreground">
      <span>
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
    <div className="mb-5 border-b border-hairline pb-2 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-brand">
      {children}
    </div>
  )
}

// Background and border are chosen per state (not overridden), so classes never conflict.
const controlBase =
  "w-full rounded-md border px-3.5 py-2.5 font-sans text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-brand focus:ring-2 focus:ring-brand/[0.13]"

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
      className={`rounded-full border px-3.5 py-1.5 font-sans text-[13px] transition-all duration-150 ease-out ${
        active
          ? "scale-[1.03] border-brand bg-accent font-semibold text-brand ring-2 ring-brand/20"
          : "border-input bg-surface text-muted-foreground hover:border-brand/50"
      }`}
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
