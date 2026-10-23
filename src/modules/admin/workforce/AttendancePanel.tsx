"use client"
import { useAdmin, KV, Pill } from "../ui/core"
import { Banner, Btn, Empty } from "../../staff/ui"
import { formatDateTime } from "@/lib/time"
import { durationText } from "../../staff/roster/dates"
import { effectiveAttendance } from "../../staff/roster/effective"
import { managementAttendanceStatus } from "./adapter"
import { useWorkforceURL, ShiftSummary } from "./shared"
import Drawer from "./Drawer"
export default function AttendancePanel({
  id,
  onClose,
}: {
  id: string
  onClose: () => void
}) {
  const { data: s } = useAdmin(),
    { change } = useWorkforceURL(),
    a = s.attendance.find((a) => a.id === id),
    sh = a && s.shifts.find((sh) => sh.id === a.shiftId),
    time = (v?: string) => (v ? formatDateTime(v) : "Not recorded")
  if (!a || !sh)
    return (
      <Drawer title="Attendance unavailable" onClose={onClose}>
        <Empty title="Attendance unavailable" />
      </Drawer>
    )
  const effective = effectiveAttendance(s, a),
    corrections = s.attendanceCorrections.filter((c) => c.attendanceId === a.id)
  return (
    <Drawer
      title="Attendance details"
      sub={`Timesheet · ${a.id}`}
      onClose={onClose}
    >
      <ShiftSummary shift={sh} />
      <Banner tone="info">
        Fictional events only. Original event values remain immutable. Reviewed
        effective values are not GPS verification or payroll-approved time.
      </Banner>
      <KV
        items={[
          ["Scheduled", `${time(sh.start)} – ${time(sh.end)}`],
          ["Scheduled duration", durationText(sh.start, sh.end)],
          ["Original clock-in", time(a.clockIn)],
          ["Original clock-out", time(a.clockOut)],
          ["Original duration", durationText(a.clockIn, a.clockOut)],
          ["Effective clock-in", time(effective.clockIn)],
          ["Effective clock-out", time(effective.clockOut)],
          [
            "Effective recorded duration",
            durationText(effective.clockIn, effective.clockOut),
          ],
          [
            "Attendance status",
            <Pill key="s" s={managementAttendanceStatus(s, sh)} />,
          ],
          ["Original location demonstration", a.location || "Not recorded"],
          [
            "Effective location demonstration",
            effective.location || "Not recorded",
          ],
          ["Issues / notes", a.notes || "—"],
        ]}
      />
      <h3 className="ad-drawer-h">Correction history</h3>
      {!corrections.length ? (
        <p>No corrections.</p>
      ) : (
        corrections.map((c) => (
          <section key={c.id}>
            <Pill
              s={
                c.status === "pending"
                  ? "Pending Review"
                  : c.status === "approved"
                    ? "Approved"
                    : "Rejected"
              }
            />
            <p>{c.reason}</p>
            <p>
              {c.decision
                ? `${c.decision.reviewerName} · ${time(c.decision.decidedAt)} · ${c.decision.notes || "No review notes"}`
                : "No management decision"}
            </p>
            <Btn
              variant="secondary"
              onClick={() =>
                change({
                  attendanceId: "",
                  correctionId: c.id,
                  tab: "corrections",
                })
              }
            >
              Review correction {c.id}
            </Btn>
          </section>
        ))
      )}
    </Drawer>
  )
}
