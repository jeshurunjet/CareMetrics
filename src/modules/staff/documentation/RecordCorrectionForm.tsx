"use client"
import { useState, type ReactNode } from "react"
import type { FormValue, FormFieldDefinition } from "../../forms/types"
import FormFieldRenderer from "../../forms/FormFieldRenderer"
import { useRouter } from "next/navigation"
import { useStaffData, useUpdateStaffData } from "../data/context"
import type { StaffSnapshot, CorrectionTarget } from "../data/types"
import { Banner, Btn, Card } from "../ui"
import FormField from "../ui/FormField"
import useUnsavedChanges from "../diary/use-unsaved-changes"
export default function RecordCorrectionForm({
  title,
  original,
  allowed,
  unavailable,
  returnHref,
  onRequest,
  proposalHelp,
  targets,
  proposalField,
  proposalValue,
  baselineLabel = "Original submitted entry",
}: {
  baselineLabel?: string
  proposalValue?: (target: CorrectionTarget) => FormValue | undefined
  proposalField?: (target: CorrectionTarget) => FormFieldDefinition
  targets?: readonly {
    label: string
    target: CorrectionTarget
  }[]
  title: string
  original: ReactNode
  allowed: boolean
  unavailable: ReactNode
  returnHref: string
  onRequest: (
    s: StaffSnapshot,
    reason: string,
    proposed: string,
    id: string,
    now: string,
    target?: CorrectionTarget,
    value?: FormValue,
  ) => StaffSnapshot
  proposalHelp?: string
}) {
  const s = useStaffData(),
    update = useUpdateStaffData(),
    router = useRouter()
  const [target, setTarget] = useState("")
  const [typed, setTyped] = useState(false),
    [value, setValue] = useState<FormValue>("")
  const [reason, setReason] = useState(""),
    [proposed, setProposed] = useState(""),
    [tried, setTried] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false)
  const dirty = !!(reason || proposed || target) && !saved
  useUnsavedChanges(dirty)
  if (!allowed) return unavailable
  const cancel = () => {
    if (
      !dirty ||
      window.confirm(
        "Discard changes? Unsaved correction changes will be lost.",
      )
    ) {
      setSaved(true)
      router.replace(returnHref)
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
        <h3 className="cm-h3">
          {baselineLabel} · {title}
        </h3>
        {original}
      </Card>
      <form
        className="cm-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          setTried(true)
          if (!reason.trim() || !proposed.trim()) return
          try {
            const next = onRequest(
              s,
              reason,
              proposed,
              crypto.randomUUID(),
              new Date().toISOString(),
              targets?.find((t) => JSON.stringify(t.target) === target)?.target,
              typed && target ? value : undefined,
            )
            setSaved(true)
            update(next)
            router.replace(returnHref)
          } catch (e) {
            setError(e instanceof Error ? e.message : "Request unavailable")
          }
        }}
      >
        {!!targets?.length && (
          <FormField
            label="Affected field or table cell (optional)"
            htmlFor="cr-target"
            help="Select a stable reference, then describe the intended value below."
          >
            <select
              id="cr-target"
              className="cm-input"
              value={target}
              onChange={(e) => {
                setTarget(e.target.value)
                setValue("")
                setTyped(false)
              }}
            >
              <option value="">Describe changes in text</option>
              {targets.map((t) => (
                <option
                  key={JSON.stringify(t.target)}
                  value={JSON.stringify(t.target)}
                >
                  {t.label}
                </option>
              ))}
            </select>
          </FormField>
        )}
        {target && proposalField && (
          <div className="cm-stack">
            <label>
              <input
                type="checkbox"
                checked={typed}
                onChange={(e) => {
                  setTyped(e.target.checked)
                  if (e.target.checked && target)
                    setValue(proposalValue?.(JSON.parse(target)) ?? "")
                }}
              />{" "}
              Apply a structured value
            </label>
            <p className="cm-hint">
              Only an explicit typed proposal can be approved for structured
              records. Text-only requests remain reviewable. A blank optional
              value proposes clearing it.
            </p>
            {typed && (
              <FormFieldRenderer
                field={{
                  ...proposalField(JSON.parse(target)),
                  id: "correction-value",
                  label: "Proposed answer value",
                }}
                value={value}
                onChange={setValue}
              />
            )}
          </div>
        )}
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
          help={proposalHelp}
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
          <Btn variant="secondary" onClick={cancel}>
            Cancel
          </Btn>
          <Btn type="submit" icon="flag" disabled={saved}>
            Submit request
          </Btn>
        </div>
      </form>
    </div>
  )
}
