"use client"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader, Avatar, Banner, Btn, Modal } from "../staff/ui"
import FormField from "../staff/ui/FormField"
import DynamicFormRenderer from "../forms/DynamicFormRenderer"
import { initialFormValues, validateForm } from "../forms/engine"
import useUnsavedChanges from "../staff/diary/use-unsaved-changes"
import { toNZDateTimeInput } from "../../lib/time"
import type { FormValues } from "../forms/types"
import type { CareFormRead } from "./types"
interface Attempt {
  requestId: string
  templateId: string
  templateVersion: number
  coveredAt: string
  offShiftReason: string
  values: FormValues
}
export default function CarePlanForm({ data }: { data: CareFormRead }) {
  const router = useRouter(),
    baseline = initialFormValues(data.form),
    [values, setValues] = useState(baseline),
    [covered, setCovered] = useState(toNZDateTimeInput(data.now)),
    [reason, setReason] = useState(""),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false),
    [busy, setBusy] = useState(false),
    [cancel, setCancel] = useState(false),
    [uncertain, setUncertain] = useState(false),
    attempt = useRef<Attempt | null>(null),
    inFlight = useRef(false)
  const history = `/clients/${data.clientId}?tab=care&sub=${data.templateId}`,
    dirty =
      !saved &&
      JSON.stringify([values, covered, reason]) !==
        JSON.stringify([baseline, toNZDateTimeInput(data.now), ""]),
    offShift = data.offShift || !!errors.offShiftReason
  useUnsavedChanges(dirty)
  function leave() {
    setSaved(true)
    router.replace(history)
  }
  async function submit() {
    if (inFlight.current || saved) return
    if (!attempt.current) {
      const issues = validateForm(data.form, values)
      if (Object.keys(issues).length) {
        setErrors(issues)
        return
      }
    }
    inFlight.current = true
    setBusy(true)
    setErrors({})
    setError("")
    try {
      attempt.current ??= {
        requestId: crypto.randomUUID(),
        templateId: data.templateId,
        templateVersion: data.form.version,
        coveredAt: covered,
        offShiftReason: reason,
        values: structuredClone(values),
      }
      const response = await fetch(
          `/api/clients/${data.clientId}/care-records`,
          {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(attempt.current),
          },
        ),
        result = await response.json().catch(() => null)
      if (!response.ok) {
        if (response.status < 500) attempt.current = null
        setErrors(result?.fields ?? {})
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
    } catch (failure) {
      setUncertain(!!attempt.current)
      setError(
        failure instanceof Error && failure.message !== "Failed to fetch"
          ? failure.message
          : "Submission could not be confirmed. Retry the same request or check history.",
      )
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  return (
    <>
      <PageHeader
        back
        eyebrow="Care Plan / Assessment"
        title={data.templateName}
        crumbs={[
          {
            label: data.clientName,
            route: { page: "client", id: data.clientId },
          },
          {
            label: "Care Plan",
            route: { page: "client", id: data.clientId, tab: "care" },
          },
          { label: data.templateName },
          { label: "New assessment" },
        ]}
      />
      <div data-diary-editor>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <div className="cm-form-page">
            <fieldset
              disabled={busy || uncertain || saved}
              style={{
                border: 0,
                margin: 0,
                padding: 0,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                gap: "inherit",
              }}
            >
              <div className="cm-context">
                <Avatar name={data.clientName} size={38} />
                <div>
                  <strong>{data.clientName}</strong>
                  <span>
                    Template v{data.form.version} · Author: {data.authorName}
                  </span>
                  <span>{data.houseName}</span>
                </div>
              </div>
              <Banner tone="info">
                Connected development Care Plan · fictional data only.
                Submission retains this exact published version. Draft saving
                and uploads are unavailable.
              </Banner>
              {offShift ? (
                <div className="cm-offshift">
                  <Banner tone="warning" title="Off-Shift Entry">
                    Documentation outside eligible recorded attendance for this
                    house is allowed with a reason.
                  </Banner>
                  <FormField
                    label="Reason for off-shift documentation"
                    required
                    htmlFor="care-reason"
                    error={errors.offShiftReason}
                  >
                    <input
                      id="care-reason"
                      className="cm-input"
                      value={reason}
                      maxLength={1000}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </FormField>
                </div>
              ) : (
                <Banner tone="info">
                  Eligible recorded attendance was found. The server checks
                  again when submitting.
                </Banner>
              )}
              <div className="cm-form">
                <FormField
                  label="Date and time observed"
                  required
                  htmlFor="care-covered"
                  error={errors.coveredAt}
                  help="Pacific/Auckland event time; server submission time is recorded separately."
                >
                  <input
                    id="care-covered"
                    className="cm-input"
                    type="datetime-local"
                    value={covered}
                    onChange={(e) => setCovered(e.target.value)}
                  />
                </FormField>
              </div>
              <DynamicFormRenderer
                version={data.form}
                values={values}
                onChange={setValues}
                errors={errors}
              />
              {!offShift && (
                <FormField
                  label="Off-shift reason (optional)"
                  htmlFor="care-optional-reason"
                >
                  <input
                    id="care-optional-reason"
                    className="cm-input"
                    maxLength={1000}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </FormField>
              )}
            </fieldset>
            {error && (
              <div role="alert">
                <Banner tone="danger" title="Submission not confirmed">
                  {error}
                </Banner>
              </div>
            )}
            {errors.values && (
              <p className="cm-error" role="alert">
                {errors.values}
              </p>
            )}
            {uncertain && (
              <p className="cm-hint">
                The exact attempt is retained. Retry it unchanged or check
                history before creating another entry.
              </p>
            )}
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
                  : "Submit assessment"}
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
            Unsaved answers will be lost. A request already sent may have
            committed; check history before submitting again.
          </p>
        </Modal>
      )}
    </>
  )
}
