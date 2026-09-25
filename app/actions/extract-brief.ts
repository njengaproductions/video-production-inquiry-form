"use server"

// app/actions/extract-brief.ts — Step B2
// Changes vs. current:
//  1. serviceType now includes "Shoot Only" (was missing — shoot-only SOWs could never extract).
//  2. serviceType / projectType / tone are enums, so the model can't return a value no radio matches.
//  3. Adds customDesc (fixes step-2 block when only customBudget was extracted).
//  4. Adds ambiguities[] — document-level gaps that plain code can't detect.

import { generateText, Output } from "ai"
import { z } from "zod"
import mammoth from "mammoth"

const SERVICE_TYPES = [
  "Full Production (Shoot + Edit)",
  "Shoot Only — I need footage captured",
  "Edit Only — I have existing footage",
  "Not sure — let's talk",
  "",
] as const

const PROJECT_TYPES = ["Event Coverage", "Commercial", "Brand Film", "Wedding", "Social Media Content", "Other"] as const

const TONES = [
  "Cinematic & Dramatic",
  "Clean & Corporate",
  "Fun & Energetic",
  "Emotional & Storytelling",
  "Not sure — open to suggestions",
] as const

const ExtractionSchema = z.object({
  fullName: z.string().describe("The client's or contact person's full name. Empty string if not found."),
  email: z.string().describe("The client's email address. Empty string if not found."),
  phone: z.string().describe("The client's phone number. Empty string if not found."),
  serviceType: z.enum(SERVICE_TYPES).describe("Best match for the service needed. Empty string if unclear."),
  projectType: z.array(z.enum(PROJECT_TYPES)).describe("All that clearly apply. Empty array if none."),
  projectDate: z.string().describe("The project or event date if mentioned. Empty string if not found."),
  location: z.string().describe("The project location, city, venue, or address. Empty string if not found."),
  subjects: z.string().describe("Estimated number of subjects/people involved. Empty string if not found."),
  projectDesc: z.string().describe("A concise summary of the project vision, goals, and scope described in the document."),
  customBudget: z.string().describe("Any stated budget figure or range, e.g. '$750' or '$1k-2k'. Empty string if not found."),
  customDesc: z
    .string()
    .describe("If a budget is stated, one or two sentences on what the client expects for it. Empty string otherwise."),
  deadlineDate: z.string().describe("Any hard delivery deadline date mentioned. Empty string if not found."),
  references: z.string().describe("Any reference links or inspiration mentioned. Empty string if not found."),
  tone: z.array(z.enum(TONES)).describe("All that clearly apply. Empty array if none."),
  notes: z.string().describe("Any other useful details, special requests, or concerns. Empty string if not found."),
  ambiguities: z
    .array(
      z.object({
        issue: z.string().describe("Short producer-facing label, e.g. 'Budget depends on board approval'."),
        evidence: z.string().describe("The phrase from the document that shows it, under 15 words."),
        severity: z.enum(["critical", "minor"]).describe("critical = blocks quoting or scheduling; minor = clarify later."),
        agenda: z.string().describe("A pre-production meeting agenda item that resolves it."),
      }),
    )
    .describe(
      "Things stated vaguely, conditionally, or in conflict: dates 'TBD' or 'pending', budgets needing approval, " +
        "unclear deliverable counts, conflicting details, unclear usage rights or distribution. Empty array if none. " +
        "Do NOT list things simply missing from the document.",
    ),
})

export type ExtractedBrief = z.infer<typeof ExtractionSchema>

const MAX_BYTES = 10 * 1024 * 1024 // 10MB

export async function extractBrief(
  formData: FormData,
): Promise<{ ok: true; data: ExtractedBrief } | { ok: false; error: string }> {
  const file = formData.get("file")

  if (!(file instanceof File)) return { ok: false, error: "No file was received. Please try again." }
  if (file.size === 0) return { ok: false, error: "That file appears to be empty." }
  if (file.size > MAX_BYTES) return { ok: false, error: "File is too large. Please upload a document under 10MB." }

  const name = file.name.toLowerCase()
  const type = file.type

  try {
    let contentPart:
      | { type: "text"; text: string }
      | { type: "file"; data: Uint8Array; mediaType: string }

    if (type === "application/pdf" || name.endsWith(".pdf")) {
      contentPart = { type: "file", data: new Uint8Array(await file.arrayBuffer()), mediaType: "application/pdf" }
    } else if (
      name.endsWith(".docx") ||
      type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const { value } = await mammoth.extractRawText({ buffer: Buffer.from(await file.arrayBuffer()) })
      if (!value.trim()) return { ok: false, error: "We couldn't read any text from that document." }
      contentPart = { type: "text", text: value }
    } else if (type.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".md")) {
      const text = await file.text()
      if (!text.trim()) return { ok: false, error: "That file appears to be empty." }
      contentPart = { type: "text", text }
    } else {
      return { ok: false, error: "Unsupported file type. Please upload a PDF, Word (.docx), or text file." }
    }

    const { output } = await generateText({
      model: "google/gemini-2.5-flash",
      output: Output.object({ schema: ExtractionSchema }),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "You are helping a video production company pre-fill a client intake form. " +
                "Read the attached scope-of-work / project brief and extract the requested fields. " +
                "Only use information actually present in the document. Leave a field empty if it is not clearly stated. " +
                "Do not invent details. " +
                "Separately, list ambiguities: anything stated conditionally, vaguely, or in conflict " +
                "(e.g. 'date TBD', 'pending board approval', 'a few videos'). A conditional value is still extracted " +
                "into its field AND listed as an ambiguity.",
            },
            contentPart,
          ],
        },
      ],
    })

    return { ok: true, data: output }
  } catch (err) {
    console.log("[v0] extractBrief error:", err instanceof Error ? err.message : String(err))
    return { ok: false, error: "We couldn't read that document. You can still fill the form manually." }
  }
}
