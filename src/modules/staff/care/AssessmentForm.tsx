"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useStaffData, useUpdateStaffData } from "../data/context"
import {
  getAssignedCareTemplate,
  getCareRecord,
  saveCareRecord,
  validateCareInput,
} from "./adapter"
import { isDemoOnShift } from "../data/diary-adapter"
import { initialFormValues } from "../../forms/engine"
import DynamicFormRenderer from "../../forms/DynamicFormRenderer"
import { PageHeader, Avatar, Banner, Btn, Modal } from "../ui"
import FormField from "../ui/FormField"
import useUnsavedChanges from "../diary/use-unsaved-changes"
import { fromNZDateTimeInput, toNZDateTimeInput } from "@/lib/time"
import { careDetailHref, careHistoryHref } from "./navigation"
import { AssessmentPreviewNotice, UnavailableAssessment } from "./shared"
export default function AssessmentForm({
  clientId,
  templateId,
  draftId,
  kind = "care",
}: {
  clientId: string
  templateId: string
  kind?: "care" | "chart"
  draftId?: string
}) {
  const s = useStaffData(),
    update = useUpdateStaffData(),
    router = useRouter()
  const assigned = getAssignedCareTemplate(s, clientId, templateId, kind),
    existing = draftId
      ? getCareRecord(s, clientId, templateId, draftId)
      : undefined
  const version = assigned?.template.versions.find(
      (v) =>
        v.version === (existing?.templateVersion ?? assigned.version.version),
    ),
    client = s.clients.find((c) => c.id === clientId)
  const baseline = version ? initialFormValues(version, existing?.values) : {}
  const [values, setValues] = useState(baseline),
    [covered, setCovered] = useState(
      toNZDateTimeInput(existing?.coveredAt ?? s.now),
    ),
    [reason, setReason] = useState(existing?.offShiftReason ?? ""),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false),
    [cancel, setCancel] = useState(false)
  const dirty =
    !saved &&
    JSON.stringify([values, covered, reason]) !==
      JSON.stringify([
        baseline,
        toNZDateTimeInput(existing?.coveredAt ?? s.now),
        existing?.offShiftReason ?? "",
      ])
  useUnsavedChanges(dirty)
  if (
    !assigned ||
    !version ||
    !client ||
    (draftId &&
      (!existing ||
        existing.status !== "draft" ||
        existing.authorId !== s.meId))
  )
    return <UnavailableAssessment clientId={clientId} kind={kind} />
  const offShift = !isDemoOnShift(s) || !!errors.offShiftReason
  const leave = () => {
    setSaved(true)
    router.replace(careHistoryHref(clientId, templateId, kind))
  }
  function save(status: "draft" | "submitted") {
    if (!version) return
    const now = new Date().toISOString(),
      input = {
        values,
        coveredAt: fromNZDateTimeInput(covered),
        offShiftReason: reason,
      }
    const errs: Record<string, string> = validateCareInput(
      { ...s, now },
      clientId,
      templateId,
      version.version,
      input,
      status,
    )
    if (covered && !input.coveredAt)
      errs.coveredAt = "Choose a valid, unambiguous Pacific/Auckland time."
    setErrors(errs)
    if (Object.keys(errs).length) {
      document
        .querySelector("[data-diary-editor]")
        ?.scrollIntoView({ block: "start" })
      return
    }
    try {
      const id = existing?.id ?? crypto.randomUUID(),
        next = saveCareRecord(
          s,
          clientId,
          templateId,
          input,
          status,
          id,
          now,
          draftId,
        )
      setSaved(true)
      update(next)
      router.replace(
        careDetailHref(clientId, templateId, id, false, kind) +
          (status === "submitted" ? "&result=submitted" : ""),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assessment unavailable")
    }
  }
  return (
    <>
      <PageHeader
        back
        eyebrow={
          kind === "chart" ? "Charting / Entry" : "Care Plan / Assessment"
        }
        title={
          existing
            ? `Continue draft — ${assigned.template.name}`
            : assigned.template.name
        }
        subtitle={assigned.template.description}
        crumbs={[
          { label: client.name, route: { page: "client", id: clientId } },
          {
            label: kind === "chart" ? "Charting" : "Care Plan",
            route: {
              page: "client",
              id: clientId,
              tab: kind === "chart" ? "charting" : "care",
            },
          },
          {
            label: assigned.template.name,
            route: {
              page: "client",
              id: clientId,
              tab: kind === "chart" ? "charting" : "care",
              sub: templateId,
            },
          },
          {
            label: existing
              ? "Continue draft"
              : kind === "chart"
                ? "Add entry"
                : "New assessment",
          },
        ]}
      />
      <div data-diary-editor>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            save("submitted")
          }}
        >
          <div className="cm-form-page">
            <div className="cm-context">
              <Avatar name={client.name} tone={client.tone} size={38} />
              <div>
                <strong>{client.name}</strong>
                <span>
                  Template v{version.version} · Author:{" "}
                  {s.staff.find((e) => e.id === s.meId)?.name}
                </span>
                <span>
                  {s.houses.find((h) => h.id === client.houseId)?.name}
                </span>
              </div>
            </div>
            <AssessmentPreviewNotice kind={kind} />
            {assigned.template.documentationOnly && (
              <Banner tone="info">
                Documentation only. This record does not replace the medication
                administration system. No prescribing, administration or dosage
                calculation is provided.
              </Banner>
            )}
            {offShift ? (
              <div className="cm-offshift">
                <Banner
                  tone="warning"
                  title="Off-Shift Entry · You're not clocked in"
                >
                  Documentation outside an active shift is allowed, but a reason
                  must be recorded.
                </Banner>
                <FormField
                  label="Reason for off-shift documentation"
                  required
                  htmlFor="offshift"
                  error={errors.offShiftReason}
                >
                  <input
                    id="offshift"
                    className="cm-input"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Completing notes after shift handover"
                  />
                </FormField>
              </div>
            ) : (
              <Banner tone="info">
                Demo active attendance · UI only; no verified GPS or real
                attendance. An off-shift reason is optional.
              </Banner>
            )}
            <div className="cm-form">
              <FormField
                label="Date and time observed"
                required
                htmlFor="r-covered"
                help="Pacific/Auckland. Covers the events being documented; creation and submission are recorded separately."
                error={errors.coveredAt}
              >
                <input
                  id="r-covered"
                  type="datetime-local"
                  className="cm-input"
                  value={covered}
                  onChange={(e) => setCovered(e.target.value)}
                />
              </FormField>
            </div>
            <DynamicFormRenderer
              version={version}
              values={values}
              onChange={setValues}
              errors={errors}
            />
            {!offShift && (
              <FormField
                label="Off-shift reason (optional)"
                htmlFor="optional-reason"
              >
                <input
                  id="optional-reason"
                  className="cm-input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </FormField>
            )}
            {error && <p role="alert">{error}</p>}
          </div>
          <div className="cm-form-actions">
            <Btn
              variant="ghost"
              onClick={() => (dirty ? setCancel(true) : leave())}
            >
              Cancel
            </Btn>
            <Btn
              variant="secondary"
              disabled={saved}
              onClick={() => save("draft")}
            >
              Save draft
            </Btn>
            <Btn type="submit" icon="check" disabled={saved}>
              {kind === "chart" ? "Submit entry" : "Submit assessment"}
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
          <p className="cm-muted">Unsaved answers will be lost.</p>
        </Modal>
      )}
    </>
  )
}
