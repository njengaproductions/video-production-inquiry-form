"use client"

import { useRef, useState } from "react"
import { analyzeLogo, type LogoAnalysis } from "@/app/actions/analyze-logo"

type UploadState = "idle" | "reading" | "analyzing" | "done" | "error"
const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_ACTION_IMAGE_BYTES = 640 * 1024
const ACCEPTED_FILE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"])

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Could not read image"))
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Invalid image"))
    reader.readAsDataURL(file)
  })
}

async function makePreviewAndPayload(file: File) {
  const source = await readAsDataUrl(file)
  const image = new Image()
  image.crossOrigin = "anonymous"
  image.src = source
  await image.decode()

  for (const maxDimension of [1400, 1100, 850]) {
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const canvasContext = canvas.getContext("2d")
    if (!canvasContext) throw new Error("Image processing is unavailable")
    canvasContext.drawImage(image, 0, 0, canvas.width, canvas.height)

    for (const quality of [0.84, 0.7, 0.56]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality))
      if (blob && blob.size <= MAX_ACTION_IMAGE_BYTES) {
        const dataUrl = await readAsDataUrl(new File([blob], "logo.webp", { type: "image/webp" }))
        return { dataUrl, base64: dataUrl.split(",")[1] ?? "" }
      }
    }
  }

  throw new Error("Image is too large to analyze")
}

export function LogoUpload({
  onAnalysis,
}: {
  onAnalysis?: (analysis: LogoAnalysis | null, dataUrl?: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<UploadState>("idle")
  const [analysis, setAnalysis] = useState<LogoAnalysis | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState("")

  const handleFile = async (file?: File) => {
    if (!file) return
    if (!ACCEPTED_FILE_TYPES.has(file.type) || file.size === 0 || file.size > MAX_FILE_SIZE) {
      setState("error")
      return
    }

    setFileName(file.name.slice(0, 120))
    setState("reading")
    try {
      const optimized = await makePreviewAndPayload(file)
      setPreview(optimized.dataUrl)
      setState("analyzing")
      const result = await analyzeLogo(optimized.base64, "image/webp")
      if (!result.ok) throw new Error(result.error || "Analysis failed")
      setAnalysis(result.data)
      onAnalysis?.(result.data, optimized.dataUrl)
      setState("done")
    } catch {
      setState("error")
    }
  }

  const reset = () => {
    onAnalysis?.(null)
    setState("idle")
    setAnalysis(null)
    setPreview(null)
    setFileName("")
    if (inputRef.current) inputRef.current.value = ""
  }

  const openPicker = () => inputRef.current?.click()
  const sizeLabel = { small: "Small (24px)", medium: "Medium (36px)", large: "Large (48px)" }
  const backgroundLabel = { dark: "Dark background", light: "Light background", both: "Works on both" }

  return (
    <div className="lu-wrap">
      {state === "idle" && (
        <div
          className="lu-drop"
          onClick={openPicker}
          onDrop={(event) => {
            event.preventDefault()
            void handleFile(event.dataTransfer.files[0])
          }}
          onDragOver={(event) => event.preventDefault()}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              openPicker()
            }
          }}
        >
          <span className="lu-icon" aria-hidden="true">↑</span>
          <span className="lu-label">Upload your logo</span>
          <span className="lu-hint">PNG, SVG, JPG, or WebP — AI will recommend the best fit</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            hidden
            aria-label="Choose a logo image"
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
        </div>
      )}

      {(state === "reading" || state === "analyzing") && (
        <div className="lu-loading" role="status" aria-live="polite">
          <span className="lu-spinner" aria-hidden="true" />
          <span>{state === "reading" ? "Preparing logo…" : "Analyzing fit…"}</span>
        </div>
      )}

      {state === "done" && analysis && (
        <div className="lu-result">
          <div className="lu-preview-row">
            {preview && (
              <div className="lu-thumb" data-bg={analysis.bestBackground === "light" ? "light" : "dark"}>
                <img src={preview} alt="Uploaded logo preview" />
              </div>
            )}
            <div className="lu-meta">
              <span className="lu-style">{analysis.style}</span>
              <span className="lu-filename">{fileName}</span>
              <button type="button" className="lu-replace" onClick={reset}>Replace</button>
            </div>
          </div>
          <div className="lu-recs">
            <div className="lu-rec"><span className="lu-rec-label">Background</span><span className="lu-rec-val">{backgroundLabel[analysis.bestBackground]}</span></div>
            <div className="lu-rec"><span className="lu-rec-label">Placement</span><span className="lu-rec-val">{analysis.placement === "center" ? "Centered" : "Left-aligned"}</span></div>
            <div className="lu-rec"><span className="lu-rec-label">Size</span><span className="lu-rec-val">{sizeLabel[analysis.sizing]}</span></div>
            <div className="lu-rec lu-rec--full"><span className="lu-rec-label">AI tip</span><span className="lu-rec-val">{analysis.treatment}</span></div>
          </div>
        </div>
      )}

      {state === "error" && (
        <div className="lu-error" role="alert">
          <span>Couldn&apos;t analyze this image. Choose a non-empty PNG, SVG, JPG, or WebP under 10 MB and try again.</span>
          <button type="button" onClick={reset}>Try again</button>
        </div>
      )}

      <style>{`
        .lu-wrap { width: 100%; }
        .lu-drop { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 28px 20px; border: 1px dashed rgba(194,122,53,.35); border-radius: 8px; background: rgba(194,122,53,.03); cursor: pointer; transition: background .15s; }
        .lu-drop:hover, .lu-drop:focus-visible { background: rgba(194,122,53,.07); border-color: rgba(194,122,53,.65); outline: none; }
        .lu-icon { font-size: 20px; opacity: .55; }
        .lu-label { color: var(--foreground); font-size: 13px; font-weight: 500; }
        .lu-hint { color: var(--muted-foreground); font-size: 11px; text-align: center; }
        .lu-loading { display: flex; align-items: center; gap: 10px; padding: 18px 16px; color: var(--muted-foreground); font-size: 13px; }
        .lu-spinner { width: 14px; height: 14px; border: 2px solid rgba(194,122,53,.25); border-top-color: #c27a35; border-radius: 50%; animation: lu-spin .7s linear infinite; }
        @keyframes lu-spin { to { transform: rotate(360deg); } }
        .lu-result { overflow: hidden; border: 1px solid rgba(194,122,53,.25); border-radius: 8px; }
        .lu-preview-row { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
        .lu-thumb { display: flex; flex: 0 0 auto; align-items: center; justify-content: center; width: 72px; height: 44px; overflow: hidden; padding: 6px; border: 1px solid var(--border); border-radius: 6px; background: #0b0a10; }
        .lu-thumb[data-bg="light"] { background: #f5f0eb; }
        .lu-thumb img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .lu-meta { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 2px; }
        .lu-style { color: #c27a35; font-size: 12px; font-weight: 500; }
        .lu-filename { overflow: hidden; color: var(--muted-foreground); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
        .lu-replace { width: fit-content; margin-top: 2px; padding: 0; border: 0; background: none; color: var(--muted-foreground); font-size: 11px; text-align: left; text-decoration: underline; cursor: pointer; }
        .lu-replace:hover { color: var(--foreground); }
        .lu-recs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .lu-rec { display: flex; flex-direction: column; gap: 2px; padding: 10px 16px; border-right: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .lu-rec:nth-child(even) { border-right: 0; }
        .lu-rec--full { grid-column: 1 / -1; border-right: 0; }
        .lu-rec-label { color: var(--muted-foreground); font-size: 10px; letter-spacing: .07em; text-transform: uppercase; }
        .lu-rec-val { color: var(--foreground); font-size: 12px; line-height: 1.45; }
        .lu-error { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 16px; color: #9a3128; font-size: 13px; }
        .lu-error button { padding: 4px 10px; border: 1px solid rgba(154,49,40,.45); border-radius: 4px; background: none; color: inherit; font-size: 12px; cursor: pointer; }
        @media (max-width: 420px) { .lu-recs { grid-template-columns: 1fr; } .lu-rec, .lu-rec:nth-child(even) { border-right: 0; } .lu-rec--full { grid-column: auto; } }
      `}</style>
    </div>
  )
}
