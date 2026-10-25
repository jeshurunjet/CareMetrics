"use client"
import type { Employee, House } from "@/modules/staff/data/types"
import ConfirmDialog from "./ConfirmDialog"
import { useState } from "react"
import { useAdmin, KV, Pill } from "../ui/core"
import { Btn, Banner, Empty } from "../../staff/ui"
import AdminForm, {
  Field,
  SelectField,
  FormErrors,
  useAdminFormGuard,
} from "../ui/Form"
import { formatDateTime, toNZDateTimeInput } from "@/lib/time"
import { nzDay, durationText } from "../../staff/roster/dates"
import {
  cancelShift,
  saveShift,
  validateShift,
  managementAttendanceStatus,
  type ShiftInput,
} from "./adapter"
import {
  useWorkforceURL,
  EmployeeLink,
  HouseLink,
  ShiftSummary,
} from "./shared"
import Drawer from "./Drawer"
export default function ShiftPanel({ onClose }: { onClose: () => void }) {
  const nav = useAdmin(),
    s = nav.data,
    { q, change } = useWorkforceURL(),
    id = q.get("shiftId") || undefined,
    sh = s.shifts.find((x) => x.id === id),
    edit = q.get("action") === "edit" || q.get("action") === "new"
  const initial: ShiftInput = {
    staffId: sh?.staffId || "",
    houseId: sh?.houseId || q.get("house") || "",
    date: sh ? nzDay(sh.start) : q.get("day") || nzDay(s.now),
    start: sh ? toNZDateTimeInput(sh.start).slice(11) : "07:00",
    end: sh ? toNZDateTimeInput(sh.end).slice(11) : "15:00",
    breakMins: String(sh?.breakMins ?? 0),
    notes: sh?.notes || "",
    status: "scheduled",
  }
  const [f, setF] = useState(initial),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [confirm, setConfirm] = useState(q.get("action") === "cancel"),
    [saved, setSaved] = useState(false)
  const dirty = edit && !saved && JSON.stringify(f) !== JSON.stringify(initial),
    canLeave = useAdminFormGuard(dirty),
    close = () => {
      if (canLeave()) onClose()
    },
    patch = (key: keyof ShiftInput, value: string) =>
      setF({ ...f, [key]: value }),
    blocked = !!sh && s.attendance.some((a) => a.shiftId === sh.id)
  function save() {
    const err = validateShift(s, f, id)
    setErrors(err)
    if (Object.keys(err).length) return
    try {
      const next = saveShift(s, nav.role, f, id)
      nav.update(next)
      setSaved(true)
      change({
        action: "",
        shiftId: id || next.shifts.at(-1)!.id,
        house: "",
        day: "",
      })
    } catch (e) {
      setErrors({
        record: e instanceof Error ? e.message : "Shift unavailable",
      })
    }
  }
  if (id && !sh)
    return (
      <Drawer title="Shift unavailable" onClose={onClose}>
        <Empty
          title="Shift unavailable"
          text="This session record is unavailable after reload."
        />
      </Drawer>
    )
  return (
    <Drawer
      title={edit ? (sh ? "Edit shift" : "Create shift") : "Shift details"}
      sub={
        sh
          ? `${formatDateTime(sh.start)} – ${formatDateTime(sh.end)}`
          : "Assigned by the current development management identity"
      }
      onClose={close}
      footer={
        edit ? (
          <>
            <Btn variant="secondary" onClick={close}>
              Cancel
            </Btn>
            <Btn onClick={save} disabled={blocked}>
              {sh ? "Save changes" : "Publish shift"}
            </Btn>
          </>
        ) : sh && sh.status !== "cancelled" ? (
          <>
            <Btn
              variant="ghost"
              disabled={blocked}
              onClick={() => setConfirm(true)}
            >
              Cancel shift
            </Btn>
            <Btn
              icon="edit"
              disabled={blocked}
              onClick={() => change({ action: "edit" })}
            >
              Edit shift
            </Btn>
          </>
        ) : undefined
      }
    >
      {!edit && (
        <Banner tone="info">
          Showing this shift in the shared development session. Reload restores
          fixtures.
        </Banner>
      )}
      <FormErrors errors={errors} />
      {saved && (
        <Banner tone="success">
          Shift updated in this development session only.
        </Banner>
      )}
      {blocked && (
        <Banner tone="warning">
          Recorded attendance exists. Schedule editing and cancellation are
          restricted to preserve history. Original clock-in/out will not be
          overwritten.
        </Banner>
      )}
      {edit ? (
        <ShiftEditorFields
          f={f}
          patch={patch}
          onSubmit={save}
          employees={s.staff
            .filter((e) => e.status !== "Inactive")
            .map((e) => ({ id: e.id, name: e.name, role: e.role }))}
          houses={s.houses
            .filter((h) => h.status !== "Inactive")
            .map((h) => ({ id: h.id, name: h.name }))}
        />
      ) : (
        sh && (
          <>
            <KV
              items={[
                ["Employee", <EmployeeLink key="e" id={sh.staffId} />],
                ["House", <HouseLink key="h" id={sh.houseId} />],
                ["Shift ID", sh.id],
                ["Assigned by", sh.assignedBy],
                [
                  "Shift status",
                  <Pill
                    key="s"
                    s={sh.status === "cancelled" ? "Cancelled" : "Scheduled"}
                  />,
                ],
                ["Scheduled duration", durationText(sh.start, sh.end)],
                [
                  "Break information",
                  `${sh.breakMins ?? 0} minutes (not deducted)`,
                ],
                ["Notes", sh.notes || "—"],
                [
                  "Attendance",
                  <Pill key="a" s={managementAttendanceStatus(s, sh)} />,
                ],
              ]}
            />
            {s.attendance
              .filter((a) => a.shiftId === sh.id)
              .map((a) => (
                <Btn
                  key={a.id}
                  variant="secondary"
                  onClick={() =>
                    change({
                      shiftId: "",
                      attendanceId: a.id,
                      tab: "timesheets",
                    })
                  }
                >
                  Attendance details
                </Btn>
              ))}
            <Banner tone="info">
              No real attendance or GPS verification occurs in this preview.
            </Banner>
          </>
        )
      )}
      {confirm && sh && (
        <ConfirmDialog
          title="Cancel this shift?"
          text={
            <>
              <ShiftSummary shift={sh} />
              <p>
                The shift is retained as Cancelled. It will no longer be an
                active upcoming assignment or eligible for ordinary clock-in.
                Related history is preserved. Session only.
              </p>
            </>
          }
          confirm="Cancel shift"
          tone="danger"
          onClose={() => setConfirm(false)}
          onConfirm={() => {
            try {
              nav.update(cancelShift(s, nav.role, sh.id, true))
              setConfirm(false)
              change({ action: "" })
            } catch (e) {
              setErrors({
                record:
                  e instanceof Error ? e.message : "Cancellation unavailable",
              })
              setConfirm(false)
            }
          }}
        />
      )}
    </Drawer>
  )
}

interface ShiftEditorProps {
  f: ShiftInput
  patch: (key: keyof ShiftInput, value: string) => void
  onSubmit: () => void
  employees: Array<Pick<Employee, "id" | "name" | "role">>
  houses: Array<Pick<House, "id" | "name">>
  backend?: boolean
  endDate?: string
  onEndDateChange?: (day: string) => void
}
export function ShiftEditorFields({
  f,
  patch,
  onSubmit,
  employees,
  houses,
  backend = false,
  endDate,
  onEndDateChange,
}: ShiftEditorProps) {
  return (
    <AdminForm onSubmit={onSubmit}>
      <SelectField
        label="Employee"
        value={f.staffId}
        onChange={(v) => patch("staffId", v)}
        options={[
          { value: "", label: "Select employee…" },
          ...employees.map((e) => ({
            value: e.id,
            label: `${e.name} — ${e.role}`,
          })),
        ]}
      />
      <SelectField
        label="House"
        value={f.houseId}
        onChange={(v) => patch("houseId", v)}
        help="An existing employee-to-house assignment is required."
        options={[
          { value: "", label: "Select house…" },
          ...houses.map((h) => ({ value: h.id, label: h.name })),
        ]}
      />
      <Field
        label="Shift date"
        type="date"
        value={f.date}
        onChange={(v) => patch("date", v)}
        required
      />
      {backend && (
        <Field
          label="End date (optional)"
          type="date"
          value={endDate ?? ""}
          onChange={(v) => onEndDateChange?.(v)}
          help="Blank uses the shift date, or the next date when End is earlier than Start."
        />
      )}
      <div className="ad-grid-2">
        <Field
          label="Start"
          type="time"
          value={f.start}
          onChange={(v) => patch("start", v)}
          required
        />
        <Field
          label="End"
          type="time"
          value={f.end}
          onChange={(v) => patch("end", v)}
          help={
            f.end < f.start
              ? "Ends the next day (overnight)"
              : "Pacific/Auckland"
          }
          required
        />
      </div>
      <Field
        label="Break (minutes)"
        disabled={backend}
        type="number"
        value={f.breakMins}
        onChange={(v) => patch("breakMins", v)}
        help={
          backend
            ? "Unavailable in this phase; no payroll or break deduction is applied."
            : "Information only; no payroll deduction."
        }
      />
      <Field
        label="Notes"
        type="textarea"
        value={f.notes}
        onChange={(v) => patch("notes", v)}
      />
      <SelectField
        label="Shift status"
        value={f.status}
        onChange={(v) => patch("status", v)}
        options={[{ value: "scheduled", label: "Scheduled" }]}
      />
      <Banner tone="info">
        {backend
          ? "Changes persist only after server validation and commit. Pacific/Auckland DST gaps and repeated wall times are rejected; overlaps are blocked. Attendance and GPS remain unavailable."
          : "Same-session fictional assignment only. Equal start/end is rejected; an earlier end is on the following date. DST gaps and ambiguous times require a different time."}
      </Banner>
    </AdminForm>
  )
}
