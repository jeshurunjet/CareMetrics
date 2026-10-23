"use client"
import Link from "next/link"
import type { AttendanceRecord } from "./types"
import { useStaffData } from "../data/context"
import { getAttendanceCorrections } from "./adapter"
import { formatDateTime } from "@/lib/time"
import { Modal, Banner, Status } from "../ui"
import AttendanceMetadata from "./AttendanceMetadata"
export default function AttendanceDetails({
  attendance: a,
  onClose,
}: {
  attendance: AttendanceRecord
  onClose: () => void
}) {
  const s = useStaffData(),
    requests = getAttendanceCorrections(s, a.id),
    pending = requests.some((c) => c.status === "pending")
  return (
    <Modal
      title="Attendance details"
      subtitle="Fictional development attendance"
      onClose={onClose}
      footer={
        <>
          <Link
            className="cm-btn cm-btn--secondary cm-btn--md"
            href={`/roster?tab=timesheets&shiftId=${a.shiftId}`}
          >
            Related shift
          </Link>
          {!pending && (
            <Link
              className="cm-btn cm-btn--primary cm-btn--md"
              href={`/roster?tab=timesheets&attendanceId=${a.id}&action=correction`}
            >
              Request correction
            </Link>
          )}
        </>
      }
    >
      <Banner tone="info">
        Development fixture only. No real attendance or GPS verification
        occurred. Attendance is not approved for payroll.
      </Banner>
      <AttendanceMetadata attendance={a} />
      <h3 className="cm-h3">Correction requests</h3>
      {!requests.length ? (
        <p className="cm-muted">No correction requested.</p>
      ) : (
        requests.map((c) => (
          <section className="cm-panel" key={c.id}>
            <Status
              tone={
                c.status === "pending"
                  ? "warning"
                  : c.status === "approved"
                    ? "success"
                    : "danger"
              }
            >
              {c.status === "pending"
                ? "Pending Review"
                : c.status === "approved"
                  ? "Approved · historical fixture"
                  : "Rejected · historical fixture"}
            </Status>
            <p>{c.reason}</p>
            <p>
              Proposed clock-in:{" "}
              {c.proposedClockIn
                ? formatDateTime(c.proposedClockIn)
                : "Unchanged"}
            </p>
            <p>
              Proposed clock-out:{" "}
              {c.proposedClockOut
                ? formatDateTime(c.proposedClockOut)
                : "Unchanged"}
            </p>
            <small>
              {formatDateTime(c.requestedAt)} ·{" "}
              {s.staff.find((e) => e.id === c.requestingEmployeeId)?.name}
            </small>
            <p className="cm-muted">
              Original attendance retained. Management review, corrected
              versions and durable audit are not connected.
            </p>
          </section>
        ))
      )}
    </Modal>
  )
}
