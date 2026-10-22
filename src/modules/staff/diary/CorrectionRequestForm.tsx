"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useStaffData, useUpdateStaffData } from "../data/context"
import { canRequestCorrection, requestCorrection } from "../data/diary-adapter"
import type { DiaryEntry, DiarySubject } from "../data/types"
import { Banner, Btn, Card } from "../ui"
import FormField from "../ui/FormField"
import { diaryEntryHref } from "./navigation"
import { UnavailableDiary } from "./shared"
import useUnsavedChanges from "./use-unsaved-changes"
export default function CorrectionRequestForm({
  subject,
  entry,
}: {
  subject: DiarySubject
  entry: DiaryEntry
}) {
  const s = useStaffData(),
    update = useUpdateStaffData(),
    router = useRouter()
  const [reason, setReason] = useState(""),
    [proposed, setProposed] = useState(""),
    [tried, setTried] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false)
  const dirty = !!(reason || proposed) && !saved
  useUnsavedChanges(dirty)
  if (!canRequestCorrection(s, entry))
    return <UnavailableDiary subject={subject} />
  function cancel() {
    if (
      !dirty ||
      window.confirm(
        "Discard changes? Unsaved correction changes will be lost.",
      )
    ) {
      setSaved(true)
      router.replace(diaryEntryHref(subject, entry.id))
    }
  }
  return (
    <div className="cm-form-page" data-diary-editor>
      <h2 className="cm-h3">Request correction</h2>
      <Banner tone="info">
        Submitted records cannot be edited directly. Management reviews
        correction requests. This development request stays only in this preview
        session.
      </Banner>
      <Card className="cm-panel">
        <h3 className="cm-h3">Original submitted entry · {entry.title}</h3>
        <p className="cm-body cm-diary-text">{entry.body}</p>
      </Card>
      <form
        className="cm-form"
        onSubmit={(e) => {
          e.preventDefault()
          setTried(true)
          if (!reason.trim() || !proposed.trim()) return
          try {
            const next = requestCorrection(
              s,
              subject,
              entry.id,
              reason,
              proposed,
              crypto.randomUUID(),
              new Date().toISOString(),
            )
            setSaved(true)
            update(next)
            router.replace(diaryEntryHref(subject, entry.id))
          } catch (e) {
            setError(e instanceof Error ? e.message : "Request unavailable")
          }
        }}
        noValidate
      >
        <FormField
          label="Reason for correction"
          required
          htmlFor="cr-reason"
          error={
            tried && !reason.trim()
              ? "Please explain why a correction is needed."
              : undefined
          }
        >
          <input
            id="cr-reason"
            className="cm-input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Incorrect time recorded"
          />
        </FormField>
        <FormField
          label="Proposed correction"
          required
          htmlFor="cr-proposed"
          error={
            tried && !proposed.trim()
              ? "Please describe the correct information."
              : undefined
          }
        >
          <textarea
            id="cr-proposed"
            className="cm-input"
            rows={6}
            value={proposed}
            onChange={(e) => setProposed(e.target.value)}
            placeholder="Describe what the record should say"
          />
        </FormField>
        {error && <p role="alert">{error}</p>}
        <div className="cm-row-actions">
          <Btn type="button" variant="secondary" onClick={cancel}>
            Cancel
          </Btn>
          <Btn type="submit" icon="flag">
            Submit request
          </Btn>
        </div>
      </form>
    </div>
  )
}
