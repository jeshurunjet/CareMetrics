"use client"
import Link from "next/link"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Btn, Banner, Modal } from "@/modules/staff/ui"
import { attendanceInstant } from "./duration"
import type { ClockInConfirmation, ClockOutAvailability } from "./types"
interface Props {
  attendanceId: string
  availability: ClockOutAvailability
  onCompleted?: (attendance: ClockInConfirmation) => void
}
export default function ClockOutControl({
  attendanceId,
  availability,
  onCompleted,
}: Props) {
  const router = useRouter(),
    [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [uncertain, setUncertain] = useState(false),
    [saved, setSaved] = useState<ClockInConfirmation | null>(null),
    pending = useRef<string | null>(null),
    inFlight = useRef(false)
  async function save() {
    if (inFlight.current || !availability.available) return
    inFlight.current = true
    setBusy(true)
    setError("")
    try {
      pending.current ??= crypto.randomUUID()
      const response = await fetch("/api/attendance/clock-out", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendanceId, requestId: pending.current }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        if (response.status < 500 || data?.code) pending.current = null
        throw new Error(
          data?.error ??
            "Unable to confirm clock-out. Retry the same request or refresh. Contact Management if needed.",
        )
      }
      if (
        data?.attendance?.id !== attendanceId ||
        !Number.isFinite(Date.parse(data.attendance.clockOut))
      )
        throw new Error(
          "Unable to confirm clock-out. Refresh before starting again or Contact Management.",
        )
      pending.current = null
      setUncertain(false)
      setSaved(data.attendance)
      setOpen(false)
      onCompleted?.(data.attendance)
      router.refresh()
    } catch (failure) {
      setUncertain(!!pending.current)
      setError(
        failure instanceof Error && failure.message !== "Failed to fetch"
          ? failure.message
          : "Unable to confirm clock-out. Retry the same request or refresh before starting again. Contact Management if needed.",
      )
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  if (saved)
    return (
      <Banner tone="success">
        Clock-out recorded {attendanceInstant(saved.clockOut)}.{" "}
        <Link href={`/roster?tab=timesheets&attendanceId=${attendanceId}`}>
          View attendance history
        </Link>
      </Banner>
    )
  if (availability.code === "CLOCKED_OUT") return null
  if (!availability.available)
    return <p className="cm-hint">{availability.message}</p>
  return (
    <>
      <Btn block size="lg" icon="clock" onClick={() => setOpen(true)}>
        Clock Out
      </Btn>
      {open && (
        <Modal
          title="Clock out of this attendance?"
          onClose={() => {
            if (!busy) setOpen(false)
          }}
          footer={
            <>
              <Btn
                variant="secondary"
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                Cancel
              </Btn>
              <Btn
                disabled={busy || !availability.available}
                onClick={() => void save()}
              >
                {busy
                  ? "Saving…"
                  : uncertain
                    ? "Retry previous request"
                    : "Confirm clock out"}
              </Btn>
            </>
          }
        >
          <p>
            This completes your existing attendance using server time. The
            original clock-in is retained. Recorded elapsed time is not an
            approved payroll timesheet.
          </p>
          <Banner tone="warning">
            {availability.demoRecording
              ? "Fictional demonstration: no location is required or collected for clock-out."
              : "Development test policy only: no location is required or collected for clock-out."}
          </Banner>
          {error && (
            <Banner tone="danger" title="Clock-out not confirmed">
              {error}
            </Banner>
          )}
          {error && (
            <Btn
              variant="secondary"
              disabled={busy}
              onClick={() => router.refresh()}
            >
              Refresh attendance
            </Btn>
          )}
          <p>Contact Management if you cannot complete clock-out.</p>
        </Modal>
      )}
    </>
  )
}
