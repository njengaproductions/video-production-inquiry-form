"use server"

import { generateText, Output } from "ai"
import { z } from "zod"
import mammoth from "mammoth"

// The subset of brief fields we attempt to auto-fill from a scope-of-work document.
const ExtractionSchema = z.object({
  fullName: z.string().describe("The client's or contact person's full name. Empty string if not found."),
  email: z.string().describe("The client's email address. Empty string if not found."),
  phone: z.string().describe("The client's phone number. Empty string if not found."),
  serviceType: z
    .string()
    .describe(
      "Must be exactly one of: 'Full Production (Shoot + Edit)', 'Edit Only — I have existing footage', 'Not sure — let's talk'. Empty string if unclear.",
    ),
  projectType: z
    .array(z.string())
    .describe(
      "Any that apply from: 'Event Coverage', 'Commercial', 'Brand Film', 'Wedding', 'Social Media Content', 'Other'. Empty array if none clearly apply.",
    ),
  projectDate: z.string().describe("The project or event date if mentioned. Empty string if not found."),
  location: z.string().describe("The project location, city, venue, or address. Empty string if not found."),
  subjects: z.string().describe("Estimated number of subjects/people involved. Empty string if not found."),
  projectDesc: z
    .string()
    .describe("A concise summary of the project vision, goals, and scope described in the document."),
  customBudget: z.string().describe("Any stated budget figure or range, e.g. '$750' or '$1k-2k'. Empty string if not found."),
  deadlineDate: z.string().describe("Any hard delivery deadline date mentioned. Empty string if not found."),
  references: z.string().describe("Any reference links or inspiration mentioned. Empty string if not found."),
  tone: z
    .array(z.string())
    .describe(
      "Any that apply from: 'Cinematic & Dramatic', 'Clean & Corporate', 'Fun & Energetic', 'Emotional & Storytelling', 'Not sure — open to suggestions'. Empty array if none clearly apply.",
    ),
  notes: z.string().describe("Any other useful details, special requests, or concerns. Empty string if not found."),
})

export type ExtractedBrief = z.infer<typeof ExtractionSchema>

const MAX_BYTES = 10 * 1024 * 1024 // 10MB

export async function extractBrief(
  formData: FormData,
): Promise<{ ok: true; data: ExtractedBrief } | { ok: false; error: string }> {
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return { ok: false, error: "No file was received. Please try again." }
  }
  if (file.size === 0) {
    return { ok: false, error: "That file appears to be empty." }
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "File is too large. Please upload a document under 10MB." }
  }

  const name = file.name.toLowerCase()
  const type = file.type

  try {
    // Build the user content: PDFs go to the model natively, docx/text are extracted to plain text.
    let contentPart:
      | { type: "text"; text: string }
      | { type: "file"; data: Uint8Array; mediaType: string }

    if (type === "application/pdf" || name.endsWith(".pdf")) {
      const bytes = new Uint8Array(await file.arrayBuffer())
      contentPart = { type: "file", data: bytes, mediaType: "application/pdf" }
    } else if (name.endsWith(".docx") || type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const buffer = Buffer.from(await file.arrayBuffer())
      const { value } = await mammoth.extractRawText({ buffer })
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
      model: "anthropic/claude-sonnet-4.5",
      output: Output.object({ schema: ExtractionSchema }),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "You are helping a video production company pre-fill a client intake form. " +
                "Read the attached scope-of-work / project brief document and extract the requested fields. " +
                "Only use information actually present in the document. Leave a field as an empty string (or empty array) if it is not clearly stated. " +
                "Do not invent details.",
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
