"use client"

import type { ReactNode } from "react"

function Label({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <span className="mb-1.5 block font-serif text-[13px] font-semibold text-foreground">
      {children}
      {required && <span className="ml-0.5 text-brand">*</span>}
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

const controlClass =
  "w-full rounded-md border border-input bg-field px-3.5 py-2.5 font-sans text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-brand focus:ring-2 focus:ring-brand/15"

type InputProps = {
  label: string
  required?: boolean
  placeholder?: string
  value: string
  onChange: (value: string) => void
  type?: string
}

export function TextField({ label, required, placeholder, value, onChange, type = "text" }: InputProps) {
  return (
    <label className="mb-[18px] block">
      <Label required={required}>{label}</Label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={controlClass}
      />
    </label>
  )
}

export function TextArea({ label, required, placeholder, value, onChange }: InputProps) {
  return (
    <label className="mb-[18px] block">
      <Label required={required}>{label}</Label>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className={`${controlClass} resize-y`}
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
      className={`rounded-full border px-3.5 py-1.5 font-sans text-[13px] transition-colors ${
        active
          ? "border-brand bg-accent font-semibold text-brand"
          : "border-input bg-surface text-muted-foreground hover:border-brand/50"
      }`}
    >
      {children}
    </button>
  )
}

type RadioProps = {
  label: string
  required?: boolean
  options: string[]
  value: string
  onChange: (value: string) => void
}

export function RadioGroup({ label, required, options, value, onChange }: RadioProps) {
  return (
    <fieldset className="mb-[18px]">
      <Label required={required}>{label}</Label>
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
}

export function CheckGroup({ label, required, options, values, onChange }: CheckProps) {
  const toggle = (opt: string) =>
    values.includes(opt) ? onChange(values.filter((v) => v !== opt)) : onChange([...values, opt])

  return (
    <fieldset className="mb-[18px]">
      <Label required={required}>{label}</Label>
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
