"use client"
import Link from "next/link"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  PageHead,
  SubTabs,
  DataTable,
  Pill,
  Filters,
  SearchInput,
  Select,
  KV,
} from "@/modules/admin/ui/core"
import { Btn, Banner } from "@/modules/staff/ui"
import { RosterCalendarView } from "@/modules/admin/workforce/RosterCalendar"
import Drawer from "@/modules/admin/workforce/Drawer"
import ConfirmDialog from "@/modules/admin/workforce/ConfirmDialog"
import { ShiftEditorFields } from "@/modules/admin/workforce/ShiftPanel"
import { FormErrors, useAdminFormGuard } from "@/modules/admin/ui/Form"
import type { ShiftInput } from "@/modules/admin/workforce/adapter"
import { command } from "@/modules/admin/manage/client"
import {
  addDays,
  nzDay,
  shiftTime,
  durationText,
} from "@/modules/staff/roster/dates"
import { toNZDateTimeInput, formatDate } from "@/lib/time"
import { shiftPresentation } from "./presentation"
import type { AdminSchedule } from "./types"
interface Props {
  data: AdminSchedule
  tab: string
  action: string
}
export default function AdminScheduleView({ data, tab, action }: Props) {
  const router = useRouter(),
    params = useSearchParams(),
    [q, setQ] = useState(""),
    [employee, setEmployee] = useState(""),
    [house, setHouse] = useState(""),
    [status, setStatus] = useState(""),
    [notice, setNotice] = useState("")
  const change = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params.toString())
    for (const [key, value] of Object.entries(patch))
      if (value) next.set(key, value)
      else next.delete(key)
    router.push("/admin/roster" + (next.size ? "?" + next.toString() : ""))
  }
  const rows = data.shifts.filter(
    (row) =>
      (!q ||
        `${row.id} ${row.employeeName}`
          .toLowerCase()
          .includes(q.toLowerCase())) &&
      (!employee || row.employeeId === employee) &&
      (!house || row.houseId === house) &&
      (!status || row.status === status),
  )
  const calendar = {
    now: data.now,
    shifts: data.shifts.map(shiftPresentation),
    staff: data.employees.map((e) => ({ id: e.id, name: e.name })),
    houses: data.houses.map((h) => ({
      id: h.id,
      name: h.name,
      status: h.active ? "Active" as const : "Inactive" as const,
    })),
  }
  return (
    <>
      <PageHead
        title="Rosters & Attendance"
        sub="View and manage scheduled shifts · Pacific/Auckland."
        actions={
          <Btn
            icon="plus"
            onClick={() => change({ action: "new", shiftId: "" })}
          >
            Create shift
          </Btn>
        }
      />
      {notice && <Banner tone="success">{notice}</Banner>}
      <SubTabs
        value={tab}
        onChange={(t) => router.push(`/admin/roster?tab=${t}`)}
        tabs={[
          { id: "calendar", label: "Roster calendar" },
          { id: "shifts", label: "Shift list" },
          { id: "attendance", label: "Attendance monitor" },
          { id: "timesheets", label: "Timesheets" },
          { id: "corrections", label: "Attendance corrections" },
        ]}
      />
      <Banner tone="info">
        Scheduling and basic attendance are connected. Manual overrides,
        corrections, Leave and payroll approval remain unavailable.
      </Banner>
      {tab === "calendar" ? (
        <RosterCalendarView
          data={calendar}
          anchorDay={data.day}
          onAnchorChange={(day) => change({ day, month: day.slice(0, 7) })}
          change={change}
          attendanceLabel={(shift) =>
            data.shifts.find((row) => row.id === shift.id)?.hasAttendance
              ? "Attendance history recorded"
              : "No attendance recorded"
          }
        />
      ) : tab === "shifts" ? (
        <>
          <Filters>
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder="Search employee or shift ID"
            />
            <Select
              label="Employee"
              value={employee}
              onChange={setEmployee}
              options={[
                { value: "", label: "All employees" },
                ...data.employees.map((e) => ({ value: e.id, label: e.name })),
              ]}
            />
            <Select
              label="House"
              value={house}
              onChange={setHouse}
              options={[
                { value: "", label: "All houses" },
                ...data.houses.map((h) => ({ value: h.id, label: h.name })),
              ]}
            />
            <Select
              label="Shift status"
              value={status}
              onChange={setStatus}
              options={[
                { value: "", label: "All statuses" },
                { value: "SCHEDULED", label: "Scheduled" },
                { value: "CANCELLED", label: "Cancelled" },
              ]}
            />
            <label>
              Month{" "}
              <input
                className="cm-input"
                type="month"
                aria-label="Schedule month"
                value={data.month}
                onChange={(e) =>
                  change({ month: e.target.value, day: e.target.value + "-01" })
                }
              />
            </label>
          </Filters>
          <div className="ad-workforce-table">
            <DataTable
              rows={rows}
              onRow={(r) => change({ shiftId: r.id })}
              cols={[
                {
                  key: "date",
                  label: "Date",
                  sort: (r) => r.startsAt,
                  render: (r) => <b>{formatDate(r.startsAt)}</b>,
                },
                {
                  key: "employee",
                  label: "Employee",
                  render: (r) => (
                    <Link href={`/admin/employees/${r.employeeId}`}>
                      {r.employeeName}
                    </Link>
                  ),
                },
                {
                  key: "house",
                  label: "House",
                  render: (r) => (
                    <Link href={`/admin/houses/${r.houseId}`}>
                      {r.houseName}
                    </Link>
                  ),
                },
                {
                  key: "time",
                  label: "Start / end",
                  render: (r) => shiftTime(r.startsAt, r.endsAt),
                },
                {
                  key: "assigned",
                  label: "Assigned by",
                  render: (r) => r.assignedBy ?? "Not recorded",
                },
                {
                  key: "status",
                  label: "Shift status",
                  render: (r) => (
                    <Pill
                      s={r.status === "CANCELLED" ? "Cancelled" : "Scheduled"}
                    />
                  ),
                },
                {
                  key: "attendance",
                  label: "Attendance",
                  render: (r) =>
                    r.hasAttendance
                      ? "Recorded · history protected"
                      : "No attendance recorded",
                },
                {
                  key: "actions",
                  label: "Actions",
                  render: (r) => (
                    <div className="ad-inline">
                      <Btn
                        size="sm"
                        variant="ghost"
                        onClick={() => change({ shiftId: r.id })}
                      >
                        View
                      </Btn>
                      {r.status !== "CANCELLED" && (
                        <>
                          <Btn
                            size="sm"
                            variant="ghost"
                            disabled={r.hasAttendance}
                            onClick={() =>
                              change({ shiftId: r.id, action: "edit" })
                            }
                          >
                            Edit
                          </Btn>
                          <Btn
                            size="sm"
                            variant="ghost"
                            disabled={r.hasAttendance}
                            onClick={() =>
                              change({ shiftId: r.id, action: "cancel" })
                            }
                          >
                            Cancel shift
                          </Btn>
                        </>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </>
      ) : (
        <Banner tone="warning" title="Future Development">
          Attendance corrections, approvals and payroll services remain
          unavailable.
        </Banner>
      )}
      {(data.detail || action === "new") && (
        <ShiftDrawer
          key={`${data.detail?.id}:${data.detail?.updatedAt}:${action}`}
          data={data}
          action={action}
          onSaved={setNotice}
          onClose={() => change({ shiftId: "", action: "" })}
          change={change}
        />
      )}
    </>
  )
}
interface DrawerProps {
  data: AdminSchedule
  action: string
  onClose: () => void
  onSaved: (message: string) => void
  change: (value: Record<string, string>) => void
}
function ShiftDrawer({ data, action, onClose, onSaved, change }: DrawerProps) {
  const router = useRouter(),
    row = data.detail,
    edit = action === "new" || action === "edit",
    params = useSearchParams()
  const initial: ShiftInput = {
    staffId: row?.employeeId ?? "",
    houseId: row?.houseId ?? params.get("house") ?? "",
    date: row ? nzDay(row.startsAt) : data.day,
    start: row ? toNZDateTimeInput(row.startsAt).slice(11) : "07:00",
    end: row ? toNZDateTimeInput(row.endsAt).slice(11) : "15:00",
    breakMins: "0",
    notes: row?.notes ?? "",
    status: "scheduled",
  }
  const [f, setF] = useState(initial),
    [endDate, setEndDate] = useState(row ? nzDay(row.endsAt) : ""),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [saving, setSaving] = useState(false),
    [saved, setSaved] = useState(false),
    [confirm, setConfirm] = useState(action === "cancel")
  const discard = useAdminFormGuard(
    edit &&
      !saved &&
      (JSON.stringify(f) !== JSON.stringify(initial) ||
        endDate !== (row ? nzDay(row.endsAt) : "")),
  )
  const close = () => {
    if (!saving && discard()) onClose()
  }
  async function save() {
    if (saving) return
    setSaving(true)
    setErrors({})
    try {
      const result = await command(
        `/api/admin/shifts${row ? "/" + row.id : ""}`,
        row ? "PATCH" : "POST",
        {
          employeeId: f.staffId,
          houseId: f.houseId,
          startsLocal: `${f.date}T${f.start}`,
          endsLocal: `${endDate || addDays(f.date, f.end < f.start ? 1 : 0)}T${f.end}`,
          notes: f.notes,
          status: "SCHEDULED",
          ...(row ? { expectedUpdatedAt: row.updatedAt } : {}),
        },
      )
      setSaved(true)
      onSaved(row ? "Shift changes saved." : "Shift created.")
      change({
        shiftId: result.id,
        action: "",
        day: f.date,
        month: f.date.slice(0, 7),
      })
      router.refresh()
    } catch (error) {
      const e = error as Error & { fields?: Record<string, string> }
      setErrors(e.fields ?? { record: e.message })
    } finally {
      setSaving(false)
    }
  }
  return (
    <Drawer
      title={edit ? (row ? "Edit shift" : "Create shift") : "Shift details"}
      sub={
        row
          ? shiftTime(row.startsAt, row.endsAt)
          : "Assigned by your authenticated management identity"
      }
      onClose={close}
      footer={
        edit ? (
          <>
            <Btn variant="secondary" disabled={saving} onClick={close}>
              Cancel
            </Btn>
            <Btn
              disabled={saving || !!row?.hasAttendance}
              onClick={() => void save()}
            >
              {saving ? "Saving…" : row ? "Save changes" : "Publish shift"}
            </Btn>
          </>
        ) : row?.status === "SCHEDULED" ? (
          <>
            <Btn
              variant="ghost"
              disabled={row.hasAttendance}
              onClick={() => setConfirm(true)}
            >
              Cancel shift
            </Btn>
            <Btn
              icon="edit"
              disabled={row.hasAttendance}
              onClick={() => change({ action: "edit" })}
            >
              Edit shift
            </Btn>
          </>
        ) : undefined
      }
    >
      <FormErrors errors={errors} />
      {saved && <Banner tone="success">Shift saved.</Banner>}
      {row?.hasAttendance && (
        <Banner tone="warning">
          Recorded attendance exists. Editing/cancellation is blocked to
          preserve history.
        </Banner>
      )}
      {edit ? (
        <div inert={saving}>
          <ShiftEditorFields
            backend
            f={f}
            patch={(key, value) => setF({ ...f, [key]: value })}
            onSubmit={() => void save()}
            endDate={endDate}
            onEndDateChange={setEndDate}
            employees={data.employees
              .filter((e) => e.active)
              .map((e) => ({ id: e.id, name: e.name, role: e.role }))}
            houses={data.houses.filter((h) => h.active)}
          />
        </div>
      ) : (
        row && (
          <>
            <KV
              items={[
                [
                  "Employee",
                  <Link key="e" href={`/admin/employees/${row.employeeId}`}>
                    {row.employeeName}
                  </Link>,
                ],
                [
                  "House",
                  <Link key="h" href={`/admin/houses/${row.houseId}`}>
                    {row.houseName}
                  </Link>,
                ],
                ["Shift ID", row.id],
                ["Assigned by", row.assignedBy ?? "Not recorded"],
                [
                  "Shift status",
                  row.status === "CANCELLED" ? "Cancelled" : "Scheduled",
                ],
                ["Scheduled duration", durationText(row.startsAt, row.endsAt)],
                ["Notes", row.notes],
                [
                  "Attendance",
                  row.hasAttendance
                    ? "History recorded · protected from schedule changes"
                    : "No attendance recorded",
                ],
              ]}
            />
            <Banner tone="info">
              Recorded attendance is retained. Manual overrides and timesheet
              approval remain unavailable.
            </Banner>
          </>
        )
      )}
      {confirm && row && (
        <ConfirmDialog
          title="Cancel this shift?"
          text={
            <p>
              The shift is retained as Cancelled. No attendance or historical
              record is rewritten.
            </p>
          }
          confirm={saving ? "Saving…" : "Cancel shift"}
          tone="danger"
          onClose={() => {
            if (!saving) setConfirm(false)
          }}
          onConfirm={() => {
            if (saving) return
            setSaving(true)
            setErrors({})
            void command(`/api/admin/shifts/${row.id}/cancel`, "POST", {
              confirmed: true,
              expectedUpdatedAt: row.updatedAt,
            })
              .then(() => {
                setSaved(true)
                onSaved("Shift cancelled; the record is retained.")
                setConfirm(false)
                change({ action: "" })
                router.refresh()
              })
              .catch((e) => setErrors({ record: (e as Error).message }))
              .finally(() => setSaving(false))
          }}
        />
      )}
    </Drawer>
  )
}
