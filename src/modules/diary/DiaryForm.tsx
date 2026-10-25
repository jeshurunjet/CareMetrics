"use client"
// A generic service/network failure may follow commit; preserve the exact attempt.
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader, Avatar, Banner, Btn, Modal } from "../staff/ui"
import FormField from "../staff/ui/FormField"
import useUnsavedChanges from "../staff/diary/use-unsaved-changes"
import { toNZDateTimeInput } from "../../lib/time"
import { clientDiaryCategories } from "./categories"
import type { DiaryEditor } from "./types"
interface Values {
  title: string
  categoryKey: string
  content: string
  coveredAt: string
  offShiftReason: string
}
interface Attempt extends Values {
  requestId: string
}
export default function DiaryForm({ data }: { data: DiaryEditor }) {
  const router = useRouter(),
    initial: Values = {
      title: "",
      categoryKey: "",
      content: "",
      coveredAt: toNZDateTimeInput(data.now),
      offShiftReason: "",
    },
    [values, setValues] = useState(initial),
    [fields, setFields] = useState<Record<string, string>>({}),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false),
    [cancel, setCancel] = useState(false),
    [uncertain, setUncertain] = useState(false),
    attempt = useRef<Attempt | null>(null),
    inFlight = useRef(false)
  const dirty = !saved && JSON.stringify(values) !== JSON.stringify(initial),
    history = `/clients/${data.client.id}?tab=diary`
  useUnsavedChanges(dirty)
  function update(key: keyof Values, value: string) {
    setValues((v) => ({ ...v, [key]: value }))
  }
  function leave() {
    setSaved(true)
    router.replace(history)
  }
  async function submit() {
    if (inFlight.current || saved) return
    inFlight.current = true
    setBusy(true)
    setFields({})
    setError("")
    try {
      attempt.current ??= { ...values, requestId: crypto.randomUUID() }
      const response = await fetch(`/api/clients/${data.client.id}/diary`, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(attempt.current),
        }),
        result = await response.json().catch(() => null)
      if (!response.ok) {
        if (response.status < 500) {
          attempt.current = null
          setUncertain(false)
        }
        setFields(result?.fields ?? {})
        throw new Error(
          result?.error ??
            "Submission unavailable. Retry the same request or check history.",
        )
      }
      if (typeof result?.id !== "string" || !/^[a-f0-9-]{36}$/i.test(result.id))
        throw new Error(
          "Submission could not be confirmed. Check history or retry the same request.",
        )
      attempt.current = null
      setSaved(true)
      router.replace(`${history}&item=${result.id}`)
      router.refresh()
    } catch (e) {
      setUncertain(!!attempt.current)
      setError(
        e instanceof Error && e.message !== "Failed to fetch"
          ? e.message
          : "Submission could not be confirmed. Retry the same request or check history.",
      )
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  const field = (
    key: keyof Values,
    label: string,
    max: number,
    type = "text",
  ) => (
    <FormField
      label={label}
      required={
        key !== "offShiftReason" || data.offShift || !!fields.offShiftReason
      }
      htmlFor={`diary-${key}`}
      error={fields[key]}
    >
      <input
        id={`diary-${key}`}
        className="cm-input"
        type={type}
        value={values[key]}
        maxLength={max}
        disabled={busy || uncertain}
        onChange={(e) => update(key, e.target.value)}
      />
    </FormField>
  )
  return (
    <>
      <PageHeader
        back
        title="New diary entry"
        eyebrow="Client diary"
        crumbs={[
          {
            label: data.client.houseName,
            route: { page: "house", id: data.client.houseId },
          },
          {
            label: data.client.name,
            route: { page: "client", id: data.client.id },
          },
          {
            label: "Diary",
            route: { page: "client", id: data.client.id, tab: "diary" },
          },
          { label: "New entry" },
        ]}
      />
      <div data-diary-editor>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          <div className="cm-form-page">
            <div className="cm-context">
              <Avatar name={data.client.name} size={38} />
              <div>
                <strong>{data.client.name}</strong>
                <span>Author: {data.authorName} · recorded automatically</span>
              </div>
            </div>
            <Banner tone="info">
              Connected development diary · fictional data only. Submission
              saves an immutable record to PostgreSQL. Draft saving and
              attachments are unavailable.
            </Banner>
            {data.offShift ? (
              <div className="cm-offshift">
                <Banner tone="warning" title="Off-Shift Entry">
                  Documentation outside eligible recorded attendance for this
                  house is allowed, but a reason must be recorded.
                </Banner>
                {field(
                  "offShiftReason",
                  "Reason for off-shift documentation",
                  1000,
                )}
              </div>
            ) : (
              <Banner tone="info">
                Eligible recorded attendance for this house was found. The
                server checks again when submitting; a reason may become
                required.
              </Banner>
            )}
            <div className="cm-form">
              {field("title", "Entry title", 160)}
              <FormField
                label="Category"
                required
                htmlFor="diary-category"
                error={fields.categoryKey}
              >
                <select
                  id="diary-category"
                  className="cm-input"
                  value={values.categoryKey}
                  disabled={busy || uncertain}
                  onChange={(e) => update("categoryKey", e.target.value)}
                >
                  <option value="">Select a category…</option>
                  {clientDiaryCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </FormField>
              {field(
                "coveredAt",
                "Date and time covered",
                16,
                "datetime-local",
              )}
              <p className="cm-hint">
                Pacific/Auckland event time. Submission time is recorded
                separately by the server.
              </p>
              <FormField
                label="Diary entry"
                required
                htmlFor="diary-content"
                error={fields.content}
              >
                <textarea
                  id="diary-content"
                  rows={8}
                  className="cm-input"
                  maxLength={10000}
                  disabled={busy || uncertain}
                  value={values.content}
                  onChange={(e) => update("content", e.target.value)}
                  placeholder="Describe what happened, using objective, respectful language."
                />
              </FormField>
              <small className="cm-count">
                {values.content.length} characters
              </small>
              {values.categoryKey === "incident-reports" && (
                <Banner tone="warning" title="Incident reports">
                  Also notify your manager by phone for any injury or safety
                  incident.
                </Banner>
              )}
              {!data.offShift &&
                field(
                  "offShiftReason",
                  fields.offShiftReason
                    ? "Reason for off-shift documentation"
                    : "Off-shift reason (optional)",
                  1000,
                )}
              {error && (
                <div role="alert">
                  <Banner tone="danger" title="Submission not confirmed">
                    {error}
                  </Banner>
                </div>
              )}
              {uncertain && (
                <p className="cm-hint">
                  The exact attempt is retained. Retry it unchanged; check
                  history before creating another entry.
                </p>
              )}
            </div>
          </div>
          <div className="cm-form-actions">
            <Btn
              variant="ghost"
              disabled={busy}
              onClick={() => (dirty ? setCancel(true) : leave())}
            >
              Cancel
            </Btn>
            <Btn
              variant="secondary"
              disabled
              title="Draft persistence is Future Development"
            >
              Save draft
            </Btn>
            <Btn type="submit" icon="check" disabled={busy || saved}>
              {busy
                ? "Submitting…"
                : uncertain
                  ? "Retry previous submission"
                  : "Submit entry"}
            </Btn>
          </div>
        </form>
      </div>
      {cancel && (
        <Modal
          title="Discard changes?"
          onClose={() => setCancel(false)}
          footer={
            <>
              <Btn variant="secondary" onClick={() => setCancel(false)}>
                Keep editing
              </Btn>
              <Btn variant="danger" onClick={leave}>
                Discard
              </Btn>
            </>
          }
        >
          <p className="cm-muted">
            Unsaved changes will be lost. A submission already sent may have
            committed; check history before submitting again.
          </p>
        </Modal>
      )}
    </>
  )
}
