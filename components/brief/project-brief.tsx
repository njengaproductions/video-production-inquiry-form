"use client"

import { useState } from "react"
import { submitBrief } from "@/app/actions/submit-brief"
import { BUDGET_TIERS, INITIAL_FORM, SECTIONS, type BriefForm } from "./data"
import { CheckGroup, RadioGroup, SectionLabel, TextArea, TextField } from "./fields"

const AGREEMENTS: { key: "depositAck" | "revisionAck" | "responseAck"; text: string }[] = [
  { key: "depositAck", text: "I understand a deposit is required to secure my project date." },
  { key: "revisionAck", text: "I understand revisions beyond the agreed number may incur additional fees." },
  {
    key: "responseAck",
    text: "I understand NJENGA Productions will follow up within 24–48 hours of receiving this brief.",
  },
]

export function ProjectBrief() {
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<BriefForm>(INITIAL_FORM)

  const set =
    <K extends keyof BriefForm>(key: K) =>
    (val: BriefForm[K]) =>
      setForm((f) => ({ ...f, [key]: val }))

  const toggleAck = (key: (typeof AGREEMENTS)[number]["key"]) =>
    setForm((f) => ({ ...f, [key]: !f[key] }))

  const progress = (step / (SECTIONS.length - 1)) * 100
  const agreementsDone = form.depositAck && form.revisionAck && form.responseAck

  const handleSubmit = async () => {
    if (!agreementsDone || sending) return
    setSending(true)
    setError(null)
    const result = await submitBrief(form)
    setSending(false)
    if (result.ok) {
      setSubmitted(true)
    } else {
      setError(result.error)
    }
  }

  const canNext = () => {
    if (step === 0)
      return Boolean(
        form.fullName && form.email && form.phone && form.contactMethod && form.heardFrom && form.decisionMaker,
      )
    if (step === 1) return Boolean(form.serviceType && form.projectType.length > 0 && form.projectDesc)
    if (step === 2) return Boolean(form.budgetTier)
    return true
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand text-3xl text-primary-foreground">
            <span aria-hidden>✓</span>
          </div>
          <h1 className="mb-3 text-balance font-serif text-[26px] leading-tight text-foreground">
            {"We're excited to create something legendary with you."}
          </h1>
          <p className="mb-6 font-sans text-sm leading-relaxed text-muted-foreground">
            Thanks for reaching out. Expect to hear from us within 24–48 hours.
          </p>
          <p className="font-sans text-[13px] font-semibold text-brand">@njengaproductions</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between bg-foreground px-6 py-4">
        <div>
          <div className="font-serif text-lg font-bold text-brand">NJENGA Productions Co.</div>
          <div className="mt-0.5 text-[11px] italic text-white/50">Content that builds brands.</div>
        </div>
        <div className="text-[11px] text-white/40">Client Project Brief</div>
      </header>

      {/* Progress */}
      <div className="border-b border-hairline bg-surface px-6 py-3">
        <div className="mx-auto max-w-2xl">
          <div className="mb-2 flex justify-between">
            {SECTIONS.map((s, i) => (
              <div
                key={s}
                className={`flex-1 text-center text-[10px] tracking-wide ${
                  i === step ? "font-bold text-brand" : i < step ? "text-muted-foreground" : "text-input"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </div>
            ))}
          </div>
          <div className="h-[3px] overflow-hidden rounded-full bg-hairline">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between">
            {SECTIONS.map((s, i) => (
              <div key={s} className={`flex-1 text-center text-[9px] ${i === step ? "text-brand" : "text-input"}`}>
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-2xl px-6 py-8">
        {step === 0 && (
          <section>
            <SectionLabel>Section 1 — Tell Us About Yourself</SectionLabel>
            <TextField label="Full Name" required placeholder="Your full name" value={form.fullName} onChange={set("fullName")} />
            <TextField label="Email Address" required type="email" placeholder="your@email.com" value={form.email} onChange={set("email")} />
            <TextField label="Phone Number" required type="tel" placeholder="(000) 000-0000" value={form.phone} onChange={set("phone")} />
            <RadioGroup label="Preferred Contact Method" required options={["Email", "Phone Call", "Text"]} value={form.contactMethod} onChange={set("contactMethod")} />
            <RadioGroup label="How did you hear about us?" required options={["Instagram", "Referral", "Google", "Other"]} value={form.heardFrom} onChange={set("heardFrom")} />
            {form.heardFrom === "Referral" && (
              <TextField label="Who referred you?" placeholder="Name of referral" value={form.referral} onChange={set("referral")} />
            )}
            <RadioGroup label="Are you the decision maker?" required options={["Yes, I make the final call", "No, I need approval from someone else"]} value={form.decisionMaker} onChange={set("decisionMaker")} />
          </section>
        )}

        {step === 1 && (
          <section>
            <SectionLabel>Section 2 — Your Project</SectionLabel>
            <RadioGroup label="What type of service do you need?" required options={["Full Production (Shoot + Edit)", "Edit Only — I have existing footage", "Not sure — let's talk"]} value={form.serviceType} onChange={set("serviceType")} />
            <CheckGroup label="Type of Project" required options={["Event Coverage", "Commercial", "Brand Film", "Wedding", "Social Media Content", "Other"]} values={form.projectType} onChange={set("projectType")} />
            <TextField label="Project / Event Date" placeholder="MM / DD / YYYY" value={form.projectDate} onChange={set("projectDate")} />
            <TextField label="Project Location" placeholder="City, venue, or address" value={form.location} onChange={set("location")} />
            <RadioGroup label="Indoor or Outdoor?" options={["Indoor", "Outdoor", "Both", "N/A — Edit Only"]} value={form.indoorOutdoor} onChange={set("indoorOutdoor")} />
            <TextField label="Estimated number of subjects / people" placeholder="e.g. 2 people, 50 guests" value={form.subjects} onChange={set("subjects")} />
            <RadioGroup label="Will you need a script or voiceover?" options={["Yes", "No", "Not sure"]} value={form.voiceover} onChange={set("voiceover")} />
            <RadioGroup label="Have you worked with a videographer before?" options={["Yes", "No"]} value={form.priorVideographer} onChange={set("priorVideographer")} />
            <TextArea label="Tell us about your project" required placeholder="Describe your vision, goals, and any details that will help us understand what you're looking for." value={form.projectDesc} onChange={set("projectDesc")} />
          </section>
        )}

        {step === 2 && (
          <section>
            <SectionLabel>Section 3 — Budget</SectionLabel>
            <p className="mb-5 font-sans text-[13px] leading-relaxed text-muted-foreground">
              Review the tiers below and select the one that best fits your project. Our Growth package is our most
              requested — built specifically for event coverage.
            </p>

            {BUDGET_TIERS.map((tier) => {
              const selected = form.budgetTier === tier.name
              return (
                <button
                  key={tier.name}
                  type="button"
                  onClick={() => set("budgetTier")(tier.name)}
                  aria-pressed={selected}
                  className={`mb-2.5 block w-full rounded-lg border-2 p-4 text-left transition-all ${
                    selected
                      ? tier.recommended
                        ? "border-green bg-green-bg ring-2 ring-green/15"
                        : "border-brand bg-accent ring-2 ring-brand/15"
                      : tier.recommended
                        ? "border-green/60 bg-surface hover:border-green"
                        : "border-brand-border bg-surface hover:border-brand/50"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`font-serif text-[15px] font-bold ${tier.recommended ? "text-green" : "text-brand"}`}>
                        {tier.name}
                      </span>
                      {tier.recommended && (
                        <span className="rounded-full bg-green px-2 py-0.5 text-[10px] font-bold tracking-wide text-white">
                          RECOMMENDED
                        </span>
                      )}
                    </div>
                    <span className="font-serif text-[15px] font-bold text-foreground">{tier.range}</span>
                  </div>
                  <p className="m-0 font-sans text-xs leading-relaxed text-muted-foreground">{tier.desc}</p>
                </button>
              )
            })}

            <div className="mt-4 rounded-lg border border-brand-border bg-muted p-4">
              <p className="mb-2 font-serif text-sm font-bold text-foreground">{"Don't see what you're looking for?"}</p>
              <p className="mb-3 font-sans text-xs leading-relaxed text-muted-foreground">
                No problem — every project is unique. Tell us your budget and vision.
              </p>
              <TextField label="My budget is" placeholder="e.g. $750" value={form.customBudget} onChange={set("customBudget")} />
              <TextArea label="Describe what you're looking for" placeholder="Tell us what you have in mind. We'll build something around you." value={form.customDesc} onChange={set("customDesc")} />
            </div>
          </section>
        )}

        {step === 3 && (
          <section>
            <SectionLabel>Section 4 — Timeline & Urgency</SectionLabel>
            <RadioGroup label="How soon do you want to get started?" required options={["Within 2 weeks", "1–2 months", "3–6 months", "Just exploring for now"]} value={form.startSoon} onChange={set("startSoon")} />
            <RadioGroup label="Do you have a delivery deadline?" required options={["Yes — hard deadline", "Preferred date but flexible", "No deadline"]} value={form.deadline} onChange={set("deadline")} />
            {form.deadline === "Yes — hard deadline" && (
              <TextField label="What is your delivery deadline?" placeholder="MM / DD / YYYY" value={form.deadlineDate} onChange={set("deadlineDate")} />
            )}
            <RadioGroup label="Turnaround time expectation" options={["Standard (2–4 weeks)", "Expedited (1–2 weeks)", "Rush (under 1 week — additional fees apply)"]} value={form.turnaround} onChange={set("turnaround")} />
          </section>
        )}

        {step === 4 && (
          <section>
            <SectionLabel>Section 5 — Creative Direction</SectionLabel>
            <TextField label="Reference videos or inspiration" placeholder="Paste YouTube, Instagram, or Vimeo links here" value={form.references} onChange={set("references")} />
            <CheckGroup label="Tone / Style of video" options={["Cinematic & Dramatic", "Clean & Corporate", "Fun & Energetic", "Emotional & Storytelling", "Not sure — open to suggestions"]} values={form.tone} onChange={set("tone")} />
            <TextArea label="Any additional notes for our team?" placeholder="Anything else we should know — special requests, concerns, or ideas." value={form.notes} onChange={set("notes")} />
          </section>
        )}

        {step === 5 && (
          <section>
            <SectionLabel>Section 6 — Agreements & Next Steps</SectionLabel>
            <div className="mb-6 rounded-lg border border-brand bg-accent p-4">
              <p className="mb-1.5 font-serif text-[13px] font-bold text-brand">Please review before submitting.</p>
              <p className="m-0 font-sans text-xs leading-relaxed text-muted-foreground">
                These acknowledgements help us serve you efficiently and protect both parties.
              </p>
            </div>

            {AGREEMENTS.map(({ key, text }) => {
              const checked = form[key]
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleAck(key)}
                  aria-pressed={checked}
                  className={`mb-2.5 flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                    checked ? "border-brand bg-accent" : "border-brand-border bg-surface hover:border-brand/50"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 ${
                      checked ? "border-brand bg-brand text-white" : "border-input bg-surface"
                    }`}
                    aria-hidden
                  >
                    {checked && <span className="text-xs font-bold">✓</span>}
                  </span>
                  <span className="font-sans text-[13px] leading-relaxed text-foreground">{text}</span>
                </button>
              )
            })}

            <div className="mt-5 rounded-lg bg-muted p-4">
              <p className="m-0 font-sans text-xs leading-relaxed text-muted-foreground">
                <strong className="text-foreground">Payment methods accepted:</strong> Check, ACH, or Wire Transfer.
                ACH/Wire details on file. Checks payable to{" "}
                <strong className="text-foreground">NJENGA Productions Co.</strong>
              </p>
            </div>
          </section>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between border-t border-hairline pt-5">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-md border border-input bg-surface px-5 py-2.5 font-sans text-[13px] text-muted-foreground transition-colors enabled:hover:border-brand/50 disabled:cursor-default disabled:text-input"
          >
            ← Back
          </button>

          <span className="font-sans text-[11px] text-muted-foreground/60">
            {step + 1} of {SECTIONS.length}
          </span>

          {step < SECTIONS.length - 1 ? (
            <button
              type="button"
              onClick={() => canNext() && setStep((s) => s + 1)}
              disabled={!canNext()}
              className="rounded-md bg-brand px-6 py-2.5 font-sans text-[13px] font-semibold text-primary-foreground transition-colors disabled:cursor-default disabled:bg-input"
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!agreementsDone || sending}
              className="rounded-md bg-brand px-6 py-2.5 font-sans text-[13px] font-semibold text-primary-foreground transition-colors disabled:cursor-default disabled:bg-input"
            >
              {sending ? "Sending…" : "Submit Brief"}
            </button>
          )}
        </div>

        {error && step === SECTIONS.length - 1 && (
          <p role="alert" className="mt-3 text-right font-sans text-[12px] text-brand">
            {error}
          </p>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-hairline bg-surface px-6 py-5 text-center">
        <p className="mb-1 font-serif text-xs font-bold text-brand">NJENGA Productions Co.</p>
        <p className="m-0 font-sans text-[11px] text-muted-foreground/70">
          Pittsburgh · @njengaproductions
        </p>
      </footer>
    </main>
  )
}
