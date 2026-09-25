"use client"

// components/brief/gap-check.tsx — Step D
// Shown once, when the client first presses "Submit Brief" and critical gaps remain.
// Every answer writes straight into an existing form field, so the server recomputes
// gaps from real data. All questions are optional; pressing "Send brief" again submits.

import { useEffect, useRef } from "react"
import type { BriefForm } from "./data"
import { structuralGaps } from "./gaps"
import { RadioGroup, TextField } from "./fields"

type AnswerField = "projectDate" | "location" | "deadlineDate" | "approver" | "serviceType" | "customBudget"

export type GapQuestion = {
  gapId: string
  field: AnswerField
  kind: "text" | "radio"
  label: string
  placeholder?: string
  options?: string[]
}

// Only critical gaps a client can actually answer. Document ambiguities
// (e.g. "pending board approval") stay on the producer's agenda instead.
const QUESTIONS: Record<string, GapQuestion> = {
  "service-undecided": {
    gapId: "service-undecided",
    field: "serviceType",
    kind: "radio",
    label: "Do you need us to film, edit, or both?",
    options: [
      "Full Production (Shoot + Edit)",
      "Shoot Only — I need footage captured",
      "Edit Only — I have existing footage",
    ],
  },
  "no-date": {
    gapId: "no-date",
    field: "projectDate",
    kind: "text",
    label: "Do you have a date or date range for the shoot?",
    placeholder: "e.g. Late October, or 11 / 08 / 2026",
  },
  "no-location": {
    gapId: "no-location",
    field: "location",
    kind: "text",
    label: "Where will we be filming?",
    placeholder: "A city or venue is fine for now",
  },
  "deadline-missing": {
    gapId: "deadline-missing",
    field: "deadlineDate",
    kind: "text",
    label: "What date do you need the final video by?",
    placeholder: "MM / DD / YYYY",
  },
  "no-budget-range": {
    gapId: "no-budget-range",
    field: "customBudget",
    kind: "text",
    label: "What budget range should we plan around?",
    placeholder: "$1,500 – $3,000",
  },
  approver: {
    gapId: "approver",
    field: "approver",
    kind: "text",
    label: "Who gives final approval, and can they join our planning call?",
    placeholder: "e.g. Jordan Mills, Board Chair — yes, can join",
  },
}

export function gapQuestions(form: BriefForm): GapQuestion[] {
  return structuralGaps(form)
    .filter((g) => g.severity === "critical" && QUESTIONS[g.id])
    .map((g) => QUESTIONS[g.id])
}

export function GapCheck({
  questions,
  form,
  onAnswer,
}: {
  questions: GapQuestion[]
  form: BriefForm
  onAnswer: (field: AnswerField, value: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    ref.current?.focus()
  }, [])

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="region"
      aria-label="A few details before you send"
      className="brief-badge-in mt-8 rounded-lg border-2 border-brand bg-accent p-5 outline-none"
    >
      <p className="mb-1 font-serif text-[17px] font-bold text-foreground">A few details before you send</p>
      <p className="mb-5 font-sans text-[13px] leading-relaxed text-muted-foreground">
        {questions.length === 1 ? "This answer helps" : "These answers help"} us book the right planning call for
        you. Skip anything you don&apos;t know yet — we&apos;ll cover it together.
      </p>

      {questions.map((q) =>
        q.kind === "radio" ? (
          <RadioGroup
            key={q.gapId}
            label={q.label}
            options={q.options ?? []}
            value={form[q.field]}
            onChange={(v: string) => onAnswer(q.field, v)}
          />
        ) : (
          <TextField
            key={q.gapId}
            label={q.label}
            placeholder={q.placeholder}
            value={form[q.field]}
            onChange={(v: string) => onAnswer(q.field, v)}
          />
        ),
      )}
    </div>
  )
}
