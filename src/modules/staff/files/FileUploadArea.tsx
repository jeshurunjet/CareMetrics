"use client"
import { useEffect, useRef, useState } from "react"
import { useStaffData, useUpdateStaffData } from "../data/context"
import type { GallerySubject, FileSelectionMetadata } from "./types"
import {
  addDemoFileMetadata,
  canSelectFiles,
  getGallerySubject,
} from "./adapter"
import {
  acceptedFiles,
  validateFileSelection,
  formatBytes,
  developmentFilePolicy,
} from "./policy"
import { Banner, Btn, Icon } from "../ui"
import FormField from "../ui/FormField"
import FileImage from "./FileImage"
type Phase = "idle" | "validating" | "selected" | "uploading" | "completed" | "failed" | "cancelled"
interface Selected extends FileSelectionMetadata {
  error?: string
  imageUrl?: string
}
export default function FileUploadArea({
  subject,
}: {
  subject: GallerySubject
}) {
  const s = useStaffData(),
    update = useUpdateStaffData(),
    input = useRef<HTMLInputElement>(null),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    generation = useRef(0),
    urls = useRef(new Set<string>())
  const [files, setFiles] = useState<Selected[]>([]),
    [phase, setPhase] = useState<Phase>("idle"),
    [progress, setProgress] = useState(0),
    [description, setDescription] = useState(""),
    [outcome, setOutcome] = useState("success"),
    [error, setError] = useState("")
  const release = () => {
    urls.current.forEach((url) => URL.revokeObjectURL(url))
    urls.current.clear()
  }
  useEffect(() => {
    const allocated = urls.current
    return () => {
      generation.current = -1
      clearTimeout(timer.current)
      allocated.forEach((url) => URL.revokeObjectURL(url))
      allocated.clear()
    }
  }, [])
  if (!canSelectFiles(s, subject)) return null
  const busy = phase === "validating" || phase === "uploading"
  function select(list: FileList | null) {
    if (!list || busy) return
    const next: Selected[] = Array.from(list).map((file) => {
      const issue = validateFileSelection(file),
        imageUrl =
          !issue && file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : undefined
      if (imageUrl) urls.current.add(imageUrl)
      return {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        size: file.size,
        error: issue,
        imageUrl,
      }
    })
    setPhase("validating")
    setError("")
    setFiles((old) => [...old, ...next])
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setPhase("selected"), 250)
  }
  function cancel() {
    generation.current++
    clearTimeout(timer.current)
    release()
    setFiles([])
    setProgress(0)
    setPhase("cancelled")
    setError("")
  }
  function upload() {
    if (!files.length || files.some((f) => f.error) || busy) return
    const token = ++generation.current
    setPhase("uploading")
    setProgress(0)
    setError("")
    let value = 0
    const tick = () => {
      if (token !== generation.current) return
      value += 25
      setProgress(value)
      if (outcome === "failure" && value >= 50) {
        setPhase("failed")
        setError(
          "Simulated upload failed. No file contents were sent or retained. You can retry.",
        )
        return
      }
      if (value < 100) timer.current = setTimeout(tick, 250)
      else {
        try {
          const next = addDemoFileMetadata(
            s,
            subject,
            files.map((f) => ({
              id: f.id,
              name: f.name,
              type: f.type,
              size: f.size,
              description,
            })),
            new Date().toISOString(),
          )
          update(next)
          release()
          setFiles([])
          setDescription("")
          setPhase("completed")
        } catch (e) {
          setError(e instanceof Error ? e.message : "Gallery unavailable")
          setPhase("failed")
        }
      }
    }
    timer.current = setTimeout(tick, 250)
  }
  return (
    <section
      className="cm-stack cm-gallery-upload"
      aria-label="Development file selection"
    >
      <div
        className="cm-dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          select(e.dataTransfer.files)
        }}
      >
        <span>
          <Icon name="upload" size={22} />
        </span>
        <div>
          <strong>Upload photos or documents</strong>
          <p>
            Drag files here or select from your device. Provisional development
            limit: {formatBytes(developmentFilePolicy.maxBytes)} each.
          </p>
        </div>
        <Btn
          variant="secondary"
          icon="plus"
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          Select files
        </Btn>
        <input
          ref={input}
          type="file"
          multiple
          hidden
          aria-label="Select demonstration files"
          accept={acceptedFiles()}
          onChange={(e) => {
            select(e.target.files)
            e.target.value = ""
          }}
        />
      </div>
      <p className="cm-hint">
        Accepted:{" "}
        {acceptedFiles()
          .split(".")
          .join("")
          .split(",")
          .join(", ")
          .toUpperCase()}
        . Selection checks are development feedback only.
      </p>
      {phase !== "idle" && (
        <div role="status" aria-live="polite">
          {phase === "validating"
            ? "Validating selection metadata…"
            : phase === "uploading"
              ? `Simulated uploading · ${progress}%`
              : phase === "completed"
                ? "Development preview completed: temporary file metadata added. File contents were not uploaded or retained; reload resets this gallery."
                : phase === "cancelled"
                  ? "Selection cancelled. Nothing was uploaded."
                  : phase === "failed"
                    ? "Simulated upload failed"
                    : "Development preview: file selected. Secure upload and permanent storage are not yet connected."}
        </div>
      )}
      {files.length > 0 && (
        <>
          <p className="cm-hint">
            Selected context: {getGallerySubject(s, subject)?.name}. Only
            fictional or non-sensitive demonstration files.
          </p>
          {files.map((f) => (
            <div
              key={f.id}
              className={`cm-upload cm-selection-row ${
                f.error ? "cm-upload--error" : ""
              }`}
            >
              <Icon name={f.error ? "alert" : "file"} size={16} />
              <div className="cm-grow">
                <strong>{f.name}</strong>
                <p>
                  {f.type || "Unknown type"} · {formatBytes(f.size)}
                </p>
                {f.error ? (
                  <small role="alert">{f.error}</small>
                ) : (
                  <small>Ready for simulated upload</small>
                )}
                {f.imageUrl && (
                  <FileImage
                    src={f.imageUrl}
                    name={`Selected ${f.name}`}
                    className="cm-selected-photo"
                  />
                )}
              </div>
              <button
                type="button"
                disabled={busy}
                aria-label={`Remove ${f.name} from selection`}
                onClick={() => {
                  if (f.imageUrl) {
                    URL.revokeObjectURL(f.imageUrl)
                    urls.current.delete(f.imageUrl)
                  }
                  setFiles((old) => old.filter((x) => x.id !== f.id))
                }}
              >
                <Icon name="x" size={16} />
              </button>
            </div>
          ))}
          <FormField
            label="Description (optional)"
            htmlFor={`upload-description-${subject.scope}-${subject.targetId}`}
          >
            <textarea
              id={`upload-description-${subject.scope}-${subject.targetId}`}
              className="cm-input"
              rows={2}
              value={description}
              disabled={busy}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>
          <FormField
            label="Demo upload outcome"
            htmlFor={`upload-outcome-${subject.scope}-${subject.targetId}`}
            help="Development control only; no server request is made."
          >
            <select
              id={`upload-outcome-${subject.scope}-${subject.targetId}`}
              className="cm-input"
              disabled={busy}
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
            >
              <option value="success">Simulated completion</option>
              <option value="failure">Simulated failure</option>
            </select>
          </FormField>
          {phase === "uploading" && (
            <div
              className="cm-progress"
              role="progressbar"
              aria-label="Simulated upload progress"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <i style={{ width: `${progress}%` }} />
            </div>
          )}
          <div className="cm-row-actions">
            <Btn
              disabled={busy || !files.length || files.some((f) => !!f.error)}
              icon="upload"
              onClick={upload}
            >
              {phase === "failed"
                ? "Retry simulated upload"
                : "Simulate upload"}
            </Btn>
            <Btn variant="secondary" onClick={cancel}>
              Cancel selection
            </Btn>
          </div>
        </>
      )}
      {error && <Banner tone="danger">{error}</Banner>}
    </section>
  )
}
