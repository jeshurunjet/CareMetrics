"use client"
import Link from "next/link"
import { shiftTime, durationText } from "../roster/dates"
import { attendanceForShift, attendanceStatus } from "../roster/adapter"
import type { Shift } from "../data/types"
import { useStaffData } from "../data/context"
import { shiftStatus } from "../data/selectors"
import { formatDate, formatDateTime } from "@/lib/time"
import { Modal, Btn, Status, useNav } from "./index"
export default function ShiftDetail({
  shift,
  onClose,
}: {
  shift: Shift
  onClose: () => void
}) {
  const s = useStaffData()
  const nav = useNav()
  const h = s.houses.find((h) => h.id === shift.houseId)!
  const t = shiftStatus(s, shift)
  const attendance = attendanceForShift(s, shift.id)
  const coworkers = s.shifts.filter(
    (sh) =>
      sh.houseId === shift.houseId &&
      sh.status !== "cancelled" &&
      sh.staffId !== s.meId &&
      Date.parse(sh.start) < Date.parse(shift.end) &&
      Date.parse(sh.end) > Date.parse(shift.start),
  )
  return (
    <Modal
      title="Shift details"
      subtitle={`${formatDate(shift.start)} · ${shiftTime(shift.start, shift.end)}`}
      onClose={onClose}
      footer={
        <Btn
          variant="secondary"
          onClick={() => {
            onClose()
            nav.go({ page: "house", id: h.id })
          }}
        >
          Open house
        </Btn>
      }
    >
      <dl className="cm-dl">
        <div>
          <dt>Employee</dt>
          <dd>{s.staff.find((e) => e.id === shift.staffId)?.name}</dd>
        </div>
        <div>
          <dt>Scheduled duration</dt>
          <dd>{durationText(shift.start, shift.end)}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <Status tone={t.tone}>{t.label}</Status>
          </dd>
        </div>
        <div>
          <dt>House</dt>
          <dd>{h.name}</dd>
        </div>
        <div>
          <dt>Address</dt>
          <dd>{h.address}</dd>
        </div>
        <div>
          <dt>Assigned by</dt>
          <dd>{shift.assignedBy}</dd>
        </div>
        <div>
          <dt>Clock in / out</dt>
          <dd>
            {attendance?.clockIn
              ? `${formatDateTime(attendance.clockIn)} / ${
                  attendance.clockOut
                    ? formatDateTime(attendance.clockOut)
                    : "Not recorded"
                }`
              : "Not recorded · development preview"}
          </dd>
        </div>
        <div>
          <dt>Coworkers</dt>
          <dd>
            {coworkers
              .map((sh) => s.staff.find((e) => e.id === sh.staffId)?.name)
              .join(", ") || "None scheduled"}
          </dd>
        </div>
        <div>
          <dt>Attendance status</dt>
          <dd>{attendanceStatus(s, shift.id)}</dd>
        </div>
        {shift.notes && (
          <div className="cm-dl-full">
            <dt>Shift notes</dt>
            <dd>{shift.notes}</dd>
          </div>
        )}
      </dl>
      {attendance && (
        <Link
          className="cm-btn cm-btn--secondary cm-btn--md"
          href={`/roster?tab=timesheets&attendanceId=${attendance.id}`}
        >
          View attendance
        </Link>
      )}
    </Modal>
  )
}
