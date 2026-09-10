export const SECTIONS = [
  "About You",
  "Your Project",
  "Budget",
  "Timeline",
  "Creative Direction",
  "Agreements",
] as const

export type BudgetTier = {
  name: string
  range: string
  desc: string
  recommended?: boolean
}

export const BUDGET_TIERS: BudgetTier[] = [
  {
    name: "Edit Only",
    range: "$50 / hr",
    desc: "You provide footage. We handle color grading, music, graphics & delivery. Quote after footage review.",
  },
  {
    name: "Shoot Only",
    range: "From $600",
    desc: "Professional on-location capture, no edit — you receive all raw footage. Half day (4 hr min) $600 • Full day (up to 8 hr) $1,000 • Overtime $125/hr after 8 hr.",
  },
  {
    name: "Essential",
    range: "Under $1K",
    desc: "Up to 2 deliverables, professional editing, music & graphics, 1–2 revisions. Best for reels, promos & short brand videos.",
  },
  {
    name: "Growth",
    range: "$1K – $2.5K",
    desc: "Our premier package for Event Coverage. Full production day • Up to 3 deliverables • Color grading • Motion graphics • Licensed music • 3 revisions.",
    recommended: true,
  },
  {
    name: "Wedding",
    range: "$2.5K – $5K",
    desc: "Full ceremony & reception coverage, highlight film + full edit, color grading, licensed music, 3 revisions.",
  },
  {
    name: "Premium",
    range: "$5K+",
    desc: "Multi-day production, full creative direction, unlimited deliverables, priority turnaround. Custom quote required.",
  },
]

export type BriefForm = {
  fullName: string
  email: string
  phone: string
  contactMethod: string
  heardFrom: string
  referral: string
  decisionMaker: string
  serviceType: string
  projectType: string[]
  projectDate: string
  location: string
  indoorOutdoor: string
  subjects: string
  voiceover: string
  priorVideographer: string
  projectDesc: string
  budgetTier: string
  addOns: string[]
  customBudget: string
  customDesc: string
  startSoon: string
  deadline: string
  deadlineDate: string
  turnaround: string
  references: string
  tone: string[]
  notes: string
  depositAck: boolean
  revisionAck: boolean
  responseAck: boolean
}

export const INITIAL_FORM: BriefForm = {
  fullName: "",
  email: "",
  phone: "",
  contactMethod: "",
  heardFrom: "",
  referral: "",
  decisionMaker: "",
  serviceType: "",
  projectType: [],
  projectDate: "",
  location: "",
  indoorOutdoor: "",
  subjects: "",
  voiceover: "",
  priorVideographer: "",
  projectDesc: "",
  budgetTier: "",
  addOns: [],
  customBudget: "",
  customDesc: "",
  startSoon: "",
  deadline: "",
  deadlineDate: "",
  turnaround: "",
  references: "",
  tone: [],
  notes: "",
  depositAck: false,
  revisionAck: false,
  responseAck: false,
}
