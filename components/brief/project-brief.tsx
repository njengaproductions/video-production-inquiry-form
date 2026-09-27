"use client"

import { useEffect, useRef, useState } from "react"
import { submitBrief } from "@/app/actions/submit-brief"
import { suggestTier } from "@/app/actions/suggest-tier"
import type { ExtractedBrief } from "@/app/actions/extract-brief"
import { BUDGET_TIERS, INITIAL_FORM, SECTIONS, type BriefForm } from "./data"
import { CheckGroup, RadioGroup, SectionLabel, TextArea, TextField, type FieldStatus } from "./fields"
import { ScopeUpload, type UploadSummary } from "./scope-upload"
import { Celebration } from "./celebration"
import type { Gap, MeetingPlan } from "./gaps"
import { GapCheck, gapQuestions, type GapQuestion } from "./gap-check"
import { budgetErrors, budgetLabel, budgetRule, budgetValid, fmtMoney, onlyDigits, parseBudgetRange } from "./budget"

// Required on step 1, in on-screen order (used for "Show me" and the remaining count).
const REQUIRED_STEP0 = [
  "fullName", "email", "phone", "contactMethod", "heardFrom",
  "decisionMaker", "serviceType", "projectType", "projectDesc",
] as const

const AGREEMENTS: { key: "depositAck" | "revisionAck" | "responseAck"; text: string }[] = [
  { key: "depositAck", text: "I understand a deposit is required to secure my project date." },
  { key: "revisionAck", text: "I understand revisions beyond the agreed number may incur additional fees." },
  {
    key: "responseAck",
    text: "I understand NJENGA Productions will follow up within 24–48 hours of receiving this brief.",
  },
]

export function ProjectBrief({
  onHome,
  onProgress,
}: {
  onHome?: () => void // logo click → back to the splash page
  onProgress?: (hasProgress: boolean) => void // lets the splash say "Continue your brief"
}) {
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState<"forward" | "back">("forward")
  const [celebrate, setCelebrate] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [form, setForm] = useState<BriefForm>(INITIAL_FORM)
  // Step C: ambiguities from the uploaded SOW, sent with the brief.
  const [docGaps, setDocGaps] = useState<Gap[]>([])
  // Stored for step E (booking page on the success screen). Not displayed yet.
  const [, setMeeting] = useState<MeetingPlan | null>(null)
  // Step D: null = not yet checked; [] or list = checked once.
  const [questions, setQuestions] = useState<GapQuestion[] | null>(null)
  // AI tier match: the AI picks one of our tiers from what the client described; prices stay ours.
  const [tierReason, setTierReason] = useState("")
  const [suggesting, setSuggesting] = useState(false)
  const suggestKey = useRef("")
  // Upload feedback: which fields the document filled, and whether to flag the empty required ones.
  const [autoFilled, setAutoFilled] = useState<Set<keyof BriefForm>>(new Set())
  const [flagMissing, setFlagMissing] = useState(false)
  const [filledCount, setFilledCount] = useState<number | null>(null)

  const showNotice = (msg: string) => {
    setNotice(msg)
    if (noticeTimer.current) clearTimeout(noticeTimer.current)
    noticeTimer.current = setTimeout(() => setNotice(null), 5000)
  }

  // Tell the page whether the client has started, so the splash can offer "Continue your brief".
  useEffect(() => {
    onProgress?.(step > 0 || JSON.stringify(form) !== JSON.stringify(INITIAL_FORM))
  }, [form, step, onProgress])

  // Scroll to the top on every step transition (forward and back).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [step])

  // On reaching the budget step, match the described project to a tier.
  // Re-runs only if the project details changed since the last match.
  useEffect(() => {
    if (step !== 1) return
    const input = {
      serviceType: form.serviceType,
      projectType: form.projectType,
      projectDesc: form.projectDesc,
      subjects: form.subjects,
      location: form.location,
      indoorOutdoor: form.indoorOutdoor,
      voiceover: form.voiceover,
      turnaround: form.turnaround,
      projectDate: form.projectDate,
    }
    const key = JSON.stringify(input)
    if (key === suggestKey.current) return
    suggestKey.current = key
    setSuggesting(true)
    suggestTier(input)
      .then((r) => {
        const tier = r.ok && r.data.confident ? r.data.tier : ""
        setTierReason(tier && r.ok ? r.data.reason : "")
        setForm((f) => ({ ...f, suggestedTier: tier }))
      })
      .catch(() => {
        setTierReason("")
        setForm((f) => ({ ...f, suggestedTier: "" }))
      })
      .finally(() => setSuggesting(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const unmark = (...keys: (keyof BriefForm)[]) =>
    setAutoFilled((s) => {
      if (!keys.some((k) => s.has(k))) return s
      const n = new Set(s)
      keys.forEach((k) => n.delete(k))
      return n
    })

  const set =
    <K extends keyof BriefForm>(key: K) =>
    (val: BriefForm[K]) => {
      setForm((f) => ({ ...f, [key]: val }))
      unmark(key)
    }

  const toggleAck = (key: (typeof AGREEMENTS)[number]["key"]) =>
    setForm((f) => ({ ...f, [key]: !f[key] }))

  // Selecting a tier clears add-ons unless it's the Shoot Only tier, so a Producer
  // Services selection can never persist as stale state under a different tier.
  // Selecting a tier is also mutually exclusive with the custom budget path.
  const selectTier = (name: string, tentative = false) => {
    const hadCustom = form.budgetMin !== "" || form.budgetMax !== "" || form.customDesc.trim() !== ""
    setForm((f) => ({
      ...f,
      budgetTier: name,
      tierTentative: tentative,
      addOns: name === "Shoot Only" ? f.addOns : [],
      customBudget: "",
      budgetMin: "",
      budgetMax: "",
      customDesc: "",
    }))
    if (hadCustom) showNotice(`Cleared to use ${name}`)
  }

  // Typing in either custom-budget field clears any tier selection (and add-ons).
  const setCustomDesc = (val: string) => {
    const hadTier = form.budgetTier !== ""
    setForm((f) => ({ ...f, customDesc: val, budgetTier: "", tierTentative: false, addOns: [] }))
    unmark("customDesc")
    if (hadTier) showNotice("Cleared to use your custom budget")
  }

  // Numbers only. Keeps customBudget (the label gaps/email read) in sync.
  const setBudget = (key: "budgetMin" | "budgetMax") => (val: string) => {
    const hadTier = form.budgetTier !== ""
    const digits = onlyDigits(val)
    setForm((f) => {
      const next = { ...f, [key]: digits, budgetTier: "", tierTentative: false, addOns: [] }
      return { ...next, customBudget: budgetLabel(next.budgetMin, next.budgetMax) }
    })
    unmark("budgetMin", "budgetMax")
    if (hadTier) showNotice("Cleared to use your custom budget")
  }

  const toggleProducer = () =>
    setForm((f) => ({
      ...f,
      addOns: f.addOns.includes("producer")
        ? f.addOns.filter((a) => a !== "producer")
        : [...f.addOns, "producer"],
    }))

  const isEmpty = (f: BriefForm, k: keyof BriefForm) => {
    const v = f[k]
    if (k === "email") return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim())
    return Array.isArray(v) ? v.length === 0 : typeof v === "string" ? !v.trim() : false
  }

  const missingKeys = REQUIRED_STEP0.filter((k) => isEmpty(form, k))

  // Status passed to each field: "missing" (required, empty, after an upload) beats "filled".
  const st = (k: keyof BriefForm, required = false): FieldStatus | undefined =>
    required && flagMissing && isEmpty(form, k) ? "missing" : autoFilled.has(k) ? "filled" : undefined

  const scrollToMissing = (keys: readonly (keyof BriefForm)[] = missingKeys) => {
    const first = keys[0]
    if (first) document.getElementById(`field-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  const applyExtracted = (data: ExtractedBrief) => {
    // Computed from current state (upload is a single user action) so we can count what was filled.
    const next = { ...form }
    const filled: (keyof BriefForm)[] = []
    // Only fill empty fields so we never overwrite what the client already typed.
    const strKeys = [
      "fullName", "email", "phone", "serviceType", "projectDate", "location",
      "subjects", "projectDesc", "customDesc", "deadlineDate", "references", "notes",
    ] as const
    for (const k of strKeys) {
      const v = data[k]
      if (typeof v === "string" && v.trim() && !next[k]) {
        next[k] = v.trim()
        filled.push(k)
      }
    }
    // Budget text from the SOW ("$1k-2k") becomes numeric From/To.
    if (data.customBudget?.trim() && !next.budgetMin && !next.budgetTier) {
      const { min, max } = parseBudgetRange(data.customBudget)
      if (min) {
        next.budgetMin = min
        next.budgetMax = max
        next.customBudget = budgetLabel(min, max)
        filled.push("budgetMin")
        if (max) filled.push("budgetMax")
      }
    }
    // Array fields: only set if the client hasn't chosen any yet.
    if (data.projectType?.length && next.projectType.length === 0) {
      next.projectType = [...data.projectType]
      filled.push("projectType")
    }
    if (data.tone?.length && next.tone.length === 0) {
      next.tone = [...data.tone]
      filled.push("tone")
    }
    setForm(next)
    setAutoFilled(new Set(filled))
    setFilledCount(filled.length)
    setFlagMissing(true)

    setDocGaps(
      (data.ambiguities ?? []).map((a, i) => ({
        id: `doc-${i}`,
        severity: a.severity,
        label: a.evidence ? `${a.issue} ("${a.evidence}")` : a.issue,
        agenda: a.agenda,
        source: "document" as const,
      })),
    )

    // Let the check mark land, then glide to the first required field still empty.
    const stillMissing = REQUIRED_STEP0.filter((k) => isEmpty(next, k))
    if (stillMissing.length) setTimeout(() => scrollToMissing(stillMissing), 1200)
  }

  const uploadSummary: UploadSummary | null =
    filledCount === null ? null : { filled: filledCount, remaining: missingKeys.length }

  const progress = (step / (SECTIONS.length - 1)) * 100
  const agreementsDone = form.depositAck && form.revisionAck && form.responseAck

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
  const emailError = form.email.trim().length > 0 && !emailValid ? "Please enter a valid email address." : undefined

  // Smart minimum for the custom budget path, based on service + project type.
  const rule = budgetRule(form)

  const bErr = budgetErrors(form)

  const handleSubmit = async () => {
    if (!agreementsDone || sending) return
    // Step D — first press: if critical gaps the client can answer remain, ask once instead of sending.
    if (questions === null) {
      const qs = gapQuestions(form)
      if (qs.length) {
        setQuestions(qs)
        return
      }
    }
    setSending(true)
    setError(null)
    const result = await submitBrief(form, docGaps)
    setSending(false)
    if (result.ok) {
      setMeeting(result.meeting)
      setSubmitted(true)
    } else {
      setError(result.error)
    }
  }

  const canNext = () => {
    // Step 1 — About You + Your Project
    if (step === 0)
      return Boolean(
        form.fullName &&
          emailValid &&
          form.phone &&
          form.contactMethod &&
          form.heardFrom &&
          form.decisionMaker &&
          form.serviceType &&
          form.projectType.length > 0 &&
          form.projectDesc,
      )
    // Step 2 — Budget + Timeline. A tier OR a completed custom request, plus timeline answers.
    if (step === 1)
      return Boolean(
        (form.budgetTier || (budgetValid(form) && form.customDesc.trim())) &&
          form.startSoon &&
          form.deadline,
      )
    return true
  }

  const goNext = () => {
    if (!canNext()) return
    setDir("forward")
    // Fire the celebration first, then advance the step once the burst is visible.
    setCelebrate(true)
    setTimeout(() => setStep((s) => Math.min(SECTIONS.length - 1, s + 1)), 450)
    setTimeout(() => setCelebrate(false), 1100)
  }

  const goBack = () => {
    setDir("back")
    setStep((s) => Math.max(0, s - 1))
  }

  if (submitted) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-foreground px-6">
        <div
          aria-hidden="true"
          className="splash-grain pointer-events-none absolute inset-[-50%] z-0 opacity-[0.06] mix-blend-screen"
        />
        <div className="relative z-10 max-w-md text-center">
          <div className="brief-cinematic mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand text-primary-foreground">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h1 className="brief-cinematic-delay mb-3 text-balance font-serif text-[26px] leading-tight text-white">
            {"We're excited to create something legendary with you."}
          </h1>
          <p className="brief-cinematic-delay mb-6 font-sans text-sm leading-relaxed text-white/60">
            Thanks for reaching out. Expect to hear from us within 24–48 hours.
          </p>
          <p className="brief-cinematic-delay-2 font-serif text-[15px] italic text-brand">Content that builds brands.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-foreground">
      {celebrate && <Celebration />}
      {/* Header */}
      <header className="flex items-center justify-between bg-foreground px-6 py-4">
        <button
          type="button"
          onClick={onHome}
          aria-label="NJENGA Productions Co. — back to start"
          className="group -m-1 rounded-md p-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
        >
          <span className="block font-serif text-xl font-semibold leading-none tracking-[0.14em] text-brand transition-opacity group-hover:opacity-80">
            NJENGA
          </span>
          <span className="mt-1 block font-serif text-[9px] tracking-[0.45em] text-mauve">PRODUCTIONS CO.</span>
        </button>
        <div className="text-[11px] text-white/40">Client Project Brief</div>
      </header>

      {/* Progress */}
      <div className="border-b border-white/10 bg-foreground px-6 py-3">
        <div className="mx-auto max-w-2xl">
          <div className="mb-2 flex justify-between">
            {SECTIONS.map((s, i) => (
              <div
                key={s}
                className={`flex flex-1 items-center justify-center ${
                  i === 0 ? "justify-start" : i === SECTIONS.length - 1 ? "justify-end" : "justify-center"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300 ${
                    i < step
                      ? "bg-brand text-primary-foreground"
                      : i === step
                        ? "bg-brand text-primary-foreground ring-4 ring-brand/15"
                        : "bg-white/10 text-white/50"
                  }`}
                >
                  {i < step ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
              </div>
            ))}
          </div>
          <div className="h-[4px] overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between">
            {SECTIONS.map((s, i) => (
              <div
                key={s}
                className={`flex-1 text-[9px] ${
                  i === 0 ? "text-left" : i === SECTIONS.length - 1 ? "text-right" : "text-center"
                } ${i === step ? "font-semibold text-brand" : "text-white/45"}`}
              >
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-2xl px-3 py-6 sm:px-6 sm:py-8">
        <div className="rounded-xl bg-background px-5 py-7 shadow-2xl shadow-black/40 sm:px-8">
        <div key={step} className={dir === "forward" ? "brief-slide-right" : "brief-slide-left"}>
          {step === 0 && (
            <section className="space-y-10">
              <div className="brief-stagger">
                <SectionLabel>Part 1 — Tell Us About Yourself</SectionLabel>
                <ScopeUpload onExtracted={applyExtracted} summary={uploadSummary} onShowMe={() => scrollToMissing()} />
                <TextField label="Full Name" required id="field-fullName" status={st("fullName", true)} placeholder="Your full name" value={form.fullName} onChange={set("fullName")} />
                <TextField label="Email Address" required id="field-email" status={st("email", true)} type="email" placeholder="your@email.com" value={form.email} onChange={set("email")} error={emailError} />
                <TextField label="Phone Number" required id="field-phone" status={st("phone", true)} type="tel" placeholder="(000) 000-0000" value={form.phone} onChange={set("phone")} />
                <RadioGroup label="Preferred Contact Method" required id="field-contactMethod" status={st("contactMethod", true)} options={["Email", "Phone Call", "Text"]} value={form.contactMethod} onChange={set("contactMethod")} />
                <RadioGroup label="How did you hear about us?" required id="field-heardFrom" status={st("heardFrom", true)} options={["Instagram", "Referral", "Google", "Other"]} value={form.heardFrom} onChange={set("heardFrom")} />
                {form.heardFrom === "Referral" && (
                  <TextField label="Who referred you?" placeholder="Name of referral" value={form.referral} onChange={set("referral")} />
                )}
                <RadioGroup label="Are you the decision maker?" required id="field-decisionMaker" status={st("decisionMaker", true)} options={["Yes, I make the final call", "No, I need approval from someone else"]} value={form.decisionMaker} onChange={set("decisionMaker")} />
              </div>

              <div className="brief-stagger">
                <SectionLabel>Part 2 — Your Project</SectionLabel>
                <RadioGroup label="What type of service do you need?" required id="field-serviceType" status={st("serviceType", true)} options={["Full Production (Shoot + Edit)", "Shoot Only — I need footage captured", "Edit Only — I have existing footage", "Not sure — let's talk"]} value={form.serviceType} onChange={set("serviceType")} />
                <CheckGroup label="Type of Project" required id="field-projectType" status={st("projectType", true)} options={["Event Coverage", "Commercial", "Brand Film", "Wedding", "Social Media Content", "Other"]} values={form.projectType} onChange={set("projectType")} />
                <TextField label="Project / Event Date" id="field-projectDate" status={st("projectDate")} placeholder="MM / DD / YYYY" value={form.projectDate} onChange={set("projectDate")} />
                <TextField label="Project Location" id="field-location" status={st("location")} placeholder="City, venue, or address" value={form.location} onChange={set("location")} />
                <RadioGroup label="Indoor or Outdoor?" options={["Indoor", "Outdoor", "Both", "N/A — Edit Only"]} value={form.indoorOutdoor} onChange={set("indoorOutdoor")} />
                <TextField label="Estimated number of subjects / people" id="field-subjects" status={st("subjects")} placeholder="e.g. 2 people, 50 guests" value={form.subjects} onChange={set("subjects")} />
                <RadioGroup label="Will you need a script or voiceover?" options={["Yes", "No", "Not sure"]} value={form.voiceover} onChange={set("voiceover")} />
                <RadioGroup label="Have you worked with a videographer before?" options={["Yes", "No"]} value={form.priorVideographer} onChange={set("priorVideographer")} />
                <TextArea label="Tell us about your project" required id="field-projectDesc" status={st("projectDesc", true)} placeholder="Describe your vision, goals, and any details that will help us understand what you're looking for." value={form.projectDesc} onChange={set("projectDesc")} />
              </div>
            </section>
          )}

          {step === 1 && (
            <section className="space-y-10">
              <div className="brief-stagger">
                <SectionLabel>Part 1 — Budget</SectionLabel>
                {notice && (
                  <div role="status" aria-live="polite" className="sticky top-3 z-30 mb-4 flex justify-center">
                    <span className="brief-badge-in inline-flex items-center rounded-full bg-brand px-4 py-1.5 font-sans text-[13px] font-semibold text-primary-foreground shadow-md">
                      {notice}
                    </span>
                  </div>
                )}
                <p className="mb-5 font-sans text-[13px] leading-relaxed text-muted-foreground">
                  Review the tiers below and select the one that best fits your project. Our Growth package is our most
                  requested — built specifically for event coverage.
                </p>

                {BUDGET_TIERS.map((tier) => {
                  const selected = form.budgetTier === tier.name
                  const isShootOnly = tier.name === "Shoot Only"
                  const producerChecked = form.addOns.includes("producer")
                  return (
                    <div key={tier.name}>
                      <button
                        type="button"
                        onClick={() => selectTier(tier.name)}
                        aria-pressed={selected}
                        className={`mb-2.5 block w-full rounded-lg border-2 p-4 text-left transition-all duration-200 ease-out ${
                          selected
                            ? tier.recommended
                              ? "scale-[1.01] border-green bg-green-bg shadow-lg shadow-green/20 ring-2 ring-green/15"
                              : "scale-[1.01] border-brand bg-accent shadow-lg shadow-brand/20 ring-2 ring-brand/15"
                            : tier.recommended
                              ? "border-green/60 bg-surface hover:border-green hover:shadow-md"
                              : "border-brand-border bg-surface hover:border-brand/50 hover:shadow-md"
                        }`}
                      >
                        <div className="mb-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`font-serif text-[15px] font-bold ${tier.recommended ? "text-green" : "text-brand"}`}>
                              {tier.name}
                            </span>
                            {tier.recommended && (
                              <span className="rounded-full bg-green px-2 py-0.5 text-[10px] font-bold tracking-wide text-white">
                                RECOMMENDED
                              </span>
                            )}
                            {form.suggestedTier === tier.name && (
                              <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold tracking-wide text-primary-foreground">
                                LIKELY FIT
                              </span>
                            )}
                          </div>
                          <span className="font-serif text-[15px] font-bold text-foreground">{tier.range}</span>
                        </div>
                        <p className="m-0 font-sans text-xs leading-relaxed text-muted-foreground">{tier.desc}</p>
                      </button>

                      {selected && form.tierTentative && (
                        <p className="-mt-1 mb-3 ml-4 font-sans text-[11px] italic leading-relaxed text-muted-foreground">
                          Tentative — a member of our team will review this with you on your pre-production call.
                        </p>
                      )}

                      {isShootOnly && selected && (
                        <label
                          className={`mb-2.5 -mt-1 ml-4 flex cursor-pointer items-start gap-3 rounded-lg border-2 border-dashed p-3 transition-all ${
                            producerChecked
                              ? "border-mauve bg-mauve-bg ring-2 ring-mauve/15"
                              : "border-mauve/45 bg-mauve-bg/40 hover:border-mauve"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={producerChecked}
                            onChange={toggleProducer}
                            className="mt-0.5 h-4 w-4 shrink-0 accent-mauve"
                          />
                          <span className="block">
                            <span className="flex flex-wrap items-center gap-x-2">
                              <span className="font-serif text-[13px] font-bold text-mauve">+ Add Producer Services</span>
                              <span className="font-serif text-[13px] font-bold text-mauve">($400 – $600)</span>
                            </span>
                            <span className="mt-0.5 block font-sans text-xs leading-relaxed text-muted-foreground">
                              Pre-production planning, shot-list coordination, on-site crew direction.
                            </span>
                          </span>
                        </label>
                      )}
                    </div>
                  )
                })}

                {/* Custom budget: emphasized whenever no tier is picked, so a range is the clear next move. */}
                <div
                  className={`mt-4 rounded-lg p-4 transition-colors ${
                    form.budgetTier ? "border border-brand-border bg-muted" : "border-2 border-brand bg-accent"
                  }`}
                >
                  <p className="mb-2 font-serif text-sm font-bold text-foreground">
                    {form.budgetTier ? "Don't see what you're looking for?" : "Not seeing a fit? Share your budget range."}
                  </p>
                  <p className="mb-3 font-sans text-xs leading-relaxed text-muted-foreground">
                    A range tells us what we&apos;re working with, so we can shape the right package around it. It&apos;s a
                    starting point, not a commitment.
                  </p>
                  {!form.budgetTier && suggesting && (
                    <p className="mb-3 font-sans text-xs italic text-muted-foreground" aria-live="polite">
                      Finding the best fit for what you&apos;ve described…
                    </p>
                  )}
                  {!form.budgetTier && !suggesting && form.suggestedTier && (() => {
                    const t = BUDGET_TIERS.find((b) => b.name === form.suggestedTier)
                    if (!t) return null
                    return (
                      <div className="brief-badge-in mb-4 rounded-md border border-brand/40 bg-surface p-3" aria-live="polite">
                        <p className="m-0 font-serif text-[14px] font-bold text-foreground">
                          Your project most likely fits <span className="text-brand">{t.name} ({t.range})</span>
                        </p>
                        {tierReason && (
                          <p className="mt-1 mb-0 font-sans text-xs leading-relaxed text-muted-foreground">{tierReason}</p>
                        )}
                        <button
                          type="button"
                          onClick={() => selectTier(t.name, true)}
                          className="mt-3 rounded-md bg-brand px-4 py-2 font-sans text-[12px] font-semibold text-primary-foreground"
                        >
                          Use {t.name} as my tentative tier
                        </button>
                        <p className="mt-2 mb-0 font-sans text-[11px] leading-relaxed text-muted-foreground">
                          Tentative — a member of our team will review it with you on your pre-production call. Or enter
                          your own range below.
                        </p>
                      </div>
                    )
                  })()}
                  <p className="mb-3 font-sans text-xs font-semibold text-brand">
                    Suggested for {rule.label.toLowerCase()}: ${fmtMoney(rule.suggest[0])} – ${fmtMoney(rule.suggest[1])}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <TextField
                      label="From ($)"
                      type="tel"
                      placeholder={fmtMoney(rule.suggest[0])}
                      value={fmtMoney(form.budgetMin)}
                      status={st("budgetMin")}
                      onChange={setBudget("budgetMin")}
                      error={bErr.min}
                    />
                    <TextField
                      label="To ($, optional)"
                      type="tel"
                      placeholder={fmtMoney(rule.suggest[1])}
                      value={fmtMoney(form.budgetMax)}
                      status={st("budgetMax")}
                      onChange={setBudget("budgetMax")}
                      error={bErr.max}
                    />
                  </div>
                  <TextArea label="What you're looking for" status={st("customDesc")} placeholder="Tell us what you have in mind. We'll build something around you." value={form.customDesc} onChange={setCustomDesc} />
                </div>
              </div>

              <div className="brief-stagger">
                <SectionLabel>Part 2 — Timeline & Urgency</SectionLabel>
                <RadioGroup label="How soon do you want to get started?" required options={["Within 2 weeks", "1–2 months", "3–6 months", "Just exploring for now"]} value={form.startSoon} onChange={set("startSoon")} />
                <RadioGroup label="Do you have a delivery deadline?" required options={["Yes — hard deadline", "Preferred date but flexible", "No deadline"]} value={form.deadline} onChange={set("deadline")} />
                {form.deadline === "Yes — hard deadline" && (
                  <TextField label="What is your delivery deadline?" id="field-deadlineDate" status={st("deadlineDate")} placeholder="MM / DD / YYYY" value={form.deadlineDate} onChange={set("deadlineDate")} />
                )}
                <RadioGroup label="Turnaround time expectation" options={["Standard (2–4 weeks)", "Expedited (1–2 weeks)", "Rush (under 1 week — additional fees apply)"]} value={form.turnaround} onChange={set("turnaround")} />
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-10">
              <div className="brief-stagger">
                <SectionLabel>Part 1 — Creative Direction</SectionLabel>
                <TextField label="Reference videos or inspiration" id="field-references" status={st("references")} placeholder="Paste YouTube, Instagram, or Vimeo links here" value={form.references} onChange={set("references")} />
                <CheckGroup label="Tone / Style of video" id="field-tone" status={st("tone")} options={["Cinematic & Dramatic", "Clean & Corporate", "Fun & Energetic", "Emotional & Storytelling", "Not sure — open to suggestions"]} values={form.tone} onChange={set("tone")} />
                <TextArea label="Any additional notes for our team?" id="field-notes" status={st("notes")} placeholder="Anything else we should know — special requests, concerns, or ideas." value={form.notes} onChange={set("notes")} />
              </div>

              <div className="brief-stagger">
                <SectionLabel>Part 2 — Agreements & Next Steps</SectionLabel>
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

                {/* Step D — optional gap questions, shown once on first submit press. */}
                {questions && questions.length > 0 && (
                  <GapCheck
                    questions={questions}
                    form={form}
                    onAnswer={(field, value) => setForm((f) => ({ ...f, [field]: value }))}
                  />
                )}
              </div>
            </section>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between border-t border-hairline pt-5">
          <button
            type="button"
            onClick={goBack}
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
              onClick={goNext}
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
              {sending ? "Sending…" : questions?.length ? "Send brief" : "Submit Brief"}
            </button>
          )}
        </div>

        {error && step === SECTIONS.length - 1 && (
          <p role="alert" className="mt-3 text-right font-sans text-[12px] text-brand">
            {error}
          </p>
        )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-foreground px-6 py-6 text-center">
        <p className="m-0 font-serif text-base font-semibold tracking-[0.14em] text-brand">NJENGA</p>
        <p className="mb-2 mt-0.5 font-serif text-[9px] tracking-[0.45em] text-mauve">PRODUCTIONS CO.</p>
        <p className="m-0 font-sans text-[11px] text-white/40">
          Pittsburgh · @njengaproductions
        </p>
      </footer>
    </main>
  )
}
