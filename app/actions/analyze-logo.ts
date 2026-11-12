"use server"

import { generateText, Output } from "ai"
import { z } from "zod"

const LogoSchema = z.object({
  style: z.string().min(1).max(100),
  bestBackground: z.enum(["dark", "light", "both"]),
  placement: z.enum(["left", "center"]),
  sizing: z.enum(["small", "medium", "large"]),
  treatment: z.string().min(1).max(240),
  confidence: z.enum(["high", "medium", "low"]),
})

export type LogoAnalysis = z.infer<typeof LogoSchema>

const MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"])
const MAX_BASE64_LENGTH = 900_000

export async function analyzeLogo(
  imageBase64: string,
  mimeType: string,
): Promise<{ ok: true; data: LogoAnalysis } | { ok: false; error?: string }> {
  if (
    typeof imageBase64 !== "string" ||
    typeof mimeType !== "string" ||
    !MIME_TYPES.has(mimeType) ||
    imageBase64.length < 100 ||
    imageBase64.length > MAX_BASE64_LENGTH ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(imageBase64)
  ) {
    return { ok: false, error: "Unsupported or oversized image" }
  }

  try {
    const { output } = await generateText({
      model: "google/gemini-3.8-flash",
      output: Output.object({ schema: LogoSchema }),
      messages: [
        {
          role: "user",
          content: [
            { type: "image", image: `data:${mimeType};base64,${imageBase64}` },
            {
              type: "text",
              text:
                "Review this company logo for a luxury video production inquiry form. The form is near-black (#0b0a10) with copper/gold accents. Return a concise visual style, whether it works best on a dark, light, or either background, left or centered header placement, a small/medium/large display size (approximately 24/36/48px tall), one practical premium presentation tip, and how confidently it reads at small UI sizes. Base your recommendations only on the visible image.",
            },
          ],
        },
      ],
    })

    return { ok: true, data: output }
  } catch (error) {
    console.error("[ai] analyzeLogo failed:", error instanceof Error ? error.message : String(error))
    return { ok: false, error: "Analysis failed" }
  }
}
