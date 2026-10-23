import { useStaffData } from "../data/context"
import type { AttendanceRecord } from "./types"
import { effectiveAttendance, latestAttendanceDecision } from "./effective"
import { getOwnShift, attendanceStatus } from "./adapter"
import { durationText, shiftTime } from "./dates"
import { formatDateTime } from "@/lib/time"
export default function AttendanceMetadata({
  attendance: original,
}: {
  attendance: AttendanceRecord
}) {
  const s = useStaffData(),
    a = effectiveAttendance(s, original),
    reviewed = latestAttendanceDecision(s, original.id),
    sh = getOwnShift(s, a.shiftId)!
  return (
    <dl className="cm-dl">
      <div>
        <dt>Employee</dt>
        <dd>{s.staff.find((e) => e.id === a.employeeId)?.name}</dd>
      </div>
      <div>
        <dt>House</dt>
        <dd>{s.houses.find((h) => h.id === sh.houseId)?.name}</dd>
      </div>
      <div className="cm-dl-full">
        <dt>Scheduled shift · Pacific/Auckland</dt>
        <dd>
          {formatDateTime(sh.start)} – {formatDateTime(sh.end)} (
          {durationText(sh.start, sh.end)})
        </dd>
      </div>
      {reviewed && (
        <div className="cm-dl-full">
          <dt>Original events retained</dt>
          <dd>
            Clock-in:{" "}
            {original.clockIn
              ? formatDateTime(original.clockIn)
              : "Not recorded"}{" "}
            · Clock-out:{" "}
            {original.clockOut
              ? formatDateTime(original.clockOut)
              : "Not recorded"}
            . Values below are effective manual corrections, not GPS
            verification.
          </dd>
        </div>
      )}
      <div>
        <dt>Recorded clock-in</dt>
        <dd>{a.clockIn ? formatDateTime(a.clockIn) : "Not recorded"}</dd>
      </div>
      <div>
        <dt>Recorded clock-out</dt>
        <dd>{a.clockOut ? formatDateTime(a.clockOut) : "Not recorded"}</dd>
      </div>
      <div>
        <dt>Recorded duration</dt>
        <dd>{durationText(a.clockIn, a.clockOut)}</dd>
      </div>
      <div>
        <dt>Attendance state</dt>
        <dd>{attendanceStatus(s, sh.id)}</dd>
      </div>
      <div className="cm-dl-full">
        <dt>Location demonstration</dt>
        <dd>
          {a.location === "fictional-verified"
            ? "Fictional verified event · no real GPS check"
            : a.location === "fictional-unverified"
              ? "Fictional unverified event"
              : "No location information recorded"}
          . No continuous tracking.
        </dd>
      </div>
      <div className="cm-dl-full">
        <dt>Notes</dt>
        <dd>
          {a.notes || "Fictional attendance fixture; not approved for payroll."}
        </dd>
      </div>
      <div className="cm-dl-full">
        <dt>Roster time</dt>
        <dd>{shiftTime(sh.start, sh.end)}</dd>
      </div>
    </dl>
  )
}
