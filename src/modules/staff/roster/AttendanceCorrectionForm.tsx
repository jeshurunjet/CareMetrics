"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useStaffData, useUpdateStaffData } from "../data/context"
import type { AttendanceRecord, AttendanceProposal } from "./types"
import {
  getAttendanceCorrections,
  validateAttendanceProposal,
  requestAttendanceCorrection,
} from "./adapter"
import { Banner, Btn, Card, Empty } from "../ui"
import FormField from "../ui/FormField"
import AttendanceMetadata from "./AttendanceMetadata"
import useUnsavedChanges from "../diary/use-unsaved-changes"
export default function AttendanceCorrectionForm({
  attendance: a,
  returnHref,
}: {
  attendance: AttendanceRecord
  returnHref: string
}) {
  const s = useStaffData(),
    update = useUpdateStaffData(),
    router = useRouter()
  const [form, setForm] = useState<AttendanceProposal>({
      clockIn: "",
      clockOut: "",
      reason: "",
    }),
    [tried, setTried] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false)
  const dirty = !!(form.clockIn || form.clockOut || form.reason) && !saved
  useUnsavedChanges(dirty)
  const errors = validateAttendanceProposal(s, a.id, form)
  if (getAttendanceCorrections(s, a.id).some((c) => c.status === "pending"))
    return (
      <Empty
        title="Correction Pending Review"
        text="Development management can review this session request. Original attendance remains unchanged."
      />
    )
  return (
    <div className="cm-form-page" data-diary-editor>
      <h2 className="cm-h3">Request attendance correction</h2>
      <Banner tone="info">
        Development request only · this request resets on reload. Original
        attendance is not overwritten. Production management services and
        payroll processing are not connected.
      </Banner>
      <Card className="cm-panel">
        <h3 className="cm-h3">Original attendance</h3>
        <AttendanceMetadata attendance={a} />
      </Card>
      <form
        noValidate
        className="cm-form"
        onSubmit={(e) => {
          e.preventDefault()
          setTried(true)
          if (Object.keys(errors).length) return
          try {
            const next = requestAttendanceCorrection(
              s,
              a.id,
              form,
              crypto.randomUUID(),
              new Date().toISOString(),
            )
            setSaved(true)
            update(next)
            router.replace(returnHref)
          } catch (e) {
            setError(e instanceof Error ? e.message : "Request unavailable")
          }
        }}
      >
        <p className="cm-muted">
          Propose at least one time. Leave an unchanged time blank. All dates
          and times use Pacific/Auckland; include the next date for an overnight
          clock-out.
        </p>
        {(["clockIn", "clockOut"] as const).map((key) => (
          <FormField
            key={key}
            label={
              key === "clockIn" ? "Proposed clock-in" : "Proposed clock-out"
            }
            htmlFor={`attendance-${key}`}
            error={tried ? errors[key] : undefined}
          >
            <input
              id={`attendance-${key}`}
              className="cm-input"
              type="datetime-local"
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </FormField>
        ))}
        <FormField
          label="Reason for correction"
          htmlFor="attendance-reason"
          required
          error={tried ? errors.reason : undefined}
        >
          <textarea
            id="attendance-reason"
            className="cm-input"
            rows={3}
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />
        </FormField>
        {(error || (tried && errors.record)) && (
          <p className="cm-error" role="alert">
            {error || errors.record}
          </p>
        )}
        <div className="cm-row-actions">
          <Btn
            variant="secondary"
            onClick={() => {
              if (
                !dirty ||
                window.confirm(
                  "Discard changes? Unsaved attendance correction will be lost.",
                )
              ) {
                setSaved(true)
                router.replace(returnHref)
              }
            }}
          >
            Cancel
          </Btn>
          <Btn type="submit">Submit request</Btn>
        </div>
      </form>
    </div>
  )
}
