"use client"
import { useId, useState } from "react"
import { useStaffData, useUpdateStaffData } from "../data/context"
import { me } from "../data/selectors"
import type { LeaveInput } from "./types"
import {
  createLeaveRequest,
  findLeaveOverlaps,
  getLeaveTypes,
  validateLeaveInput,
} from "./adapter"
import { Modal, Btn, Banner } from "../ui"
import FormField from "../ui/FormField"
import LeaveRosterContext from "./LeaveRosterContext"
import useUnsavedChanges from "../diary/use-unsaved-changes"
export default function LeaveRequestForm({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (id: string) => void
}) {
  const s = useStaffData(),
    update = useUpdateStaffData(),
    formId = useId(),
    types = getLeaveTypes(s)
  const initial: LeaveInput = {
    typeId: types[0]?.id || "",
    start: "",
    end: "",
    notes: "",
  }
  const [form, setForm] = useState(initial),
    [tried, setTried] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false)
  const dirty =
    !saved &&
    !!(form.start || form.end || form.notes || form.typeId !== initial.typeId)
  useUnsavedChanges(dirty)
  const errors = validateLeaveInput(s, form),
    overlaps = findLeaveOverlaps(s, form.start, form.end)
  const cancel = () => {
    if (
      !dirty ||
      window.confirm("Discard changes? Unsaved leave request will be lost.")
    ) {
      setSaved(true)
      onClose()
    }
  }
  return (
    <Modal
      title="Request leave"
      subtitle="Development preview · whole-day requests"
      onClose={cancel}
      footer={
        <>
          <Btn variant="secondary" onClick={cancel}>
            Cancel
          </Btn>
          <Btn type="submit" form={formId}>
            Submit request
          </Btn>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        className="cm-form"
        data-diary-editor
        onSubmit={(e) => {
          e.preventDefault()
          setTried(true)
          if (Object.keys(errors).length) return
          try {
            const id = crypto.randomUUID()
            const next = createLeaveRequest(
              s,
              form,
              id,
              new Date().toISOString(),
            )
            setSaved(true)
            update(next)
            onCreated(id)
          } catch (e) {
            setError(e instanceof Error ? e.message : "Request unavailable")
          }
        }}
      >
        <Banner tone="info">
          Development only · fictional request, not sent to a manager or saved
          permanently. Reload resets new requests. Do not enter real personal or
          health information.
        </Banner>
        <FormField label="Employee" htmlFor="leave-employee" required>
          <input
            id="leave-employee"
            className="cm-input"
            readOnly
            value={me(s).name}
          />
        </FormField>
        <FormField
          label="Leave type"
          htmlFor="leave-type"
          required
          error={tried ? errors.typeId : undefined}
        >
          <select
            id="leave-type"
            className="cm-input"
            value={form.typeId}
            onChange={(e) => setForm({ ...form, typeId: e.target.value })}
          >
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </FormField>
        <div className="cm-grid-2">
          <FormField
            label="Start date"
            htmlFor="leave-start"
            required
            error={tried ? errors.start : undefined}
          >
            <input
              id="leave-start"
              className="cm-input"
              type="date"
              value={form.start}
              onChange={(e) => setForm({ ...form, start: e.target.value })}
            />
          </FormField>
          <FormField
            label="End date"
            htmlFor="leave-end"
            required
            error={tried ? errors.end : undefined}
          >
            <input
              id="leave-end"
              className="cm-input"
              type="date"
              value={form.end}
              onChange={(e) => setForm({ ...form, end: e.target.value })}
            />
          </FormField>
        </div>
        <FormField
          label="Reason / notes"
          htmlFor="leave-notes"
          help="Optional fictional notes. No supporting files are uploaded in this preview."
        >
          <textarea
            id="leave-notes"
            className="cm-input"
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </FormField>
        {overlaps.length > 0 && (
          <div role="status">
            <Banner tone="warning">
              This period overlaps {overlaps.length} existing pending or
              approved request(s). This is an advisory warning; you may still
              submit for management review.
            </Banner>
          </div>
        )}
        {form.start && form.end && !errors.start && !errors.end && (
          <LeaveRosterContext start={form.start} end={form.end} />
        )}
        {(error || (tried && errors.employee)) && (
          <p className="cm-error" role="alert">
            {error || errors.employee}
          </p>
        )}
        <Banner tone="info">
          Approved leave cannot be cancelled here. Withdrawal of submitted
          pending requests is not connected; contact management about changes.
          Partial-day leave and entitlement calculations are not implemented.
        </Banner>
      </form>
    </Modal>
  )
}
