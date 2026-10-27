"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Btn, Banner, Modal, Status } from "@/modules/staff/ui"
import { formatDateTime } from "@/lib/time"
import ClockOutControl from "./ClockOutControl"
import { attendanceInstant, formatElapsed } from "./duration"
import Link from "next/link"
import { capturePosition, LocationCaptureError } from "./browser"
import { positionProblem, type PreviewPosition } from "./foreground-location"
import type { ClockInConfirmation, ClockInState } from "./types"
interface LocationPreview {
  current: () => PreviewPosition | null
  stop: () => void
}
interface Props {
  shiftId: string
  houseName: string
  preview?: LocationPreview
  state?: ClockInState
}
interface PendingRequest {
  shiftId: string
  requestId: string
  latitude: number
  longitude: number
  accuracyMetres: number
  measuredAt: number
}
export default function ClockInControl({
  shiftId,
  houseName,
  state,
  preview,
}: Props) {
  const router = useRouter(),
    [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [uncertain, setUncertain] = useState(false),
    [error, setError] = useState(""),
    [recorded, setRecorded] = useState<ClockInConfirmation | null>(null),
    pending = useRef<PendingRequest | null>(null),
    active = useRef(false),
    inFlight = useRef(false)
  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
    }
  }, [])
  const demo =
    state?.mode === "GPS_LOCATION_RECORDED_DEMO" ||
    recorded?.verification === "GPS_LOCATION_RECORDED_DEMO"
  const attendance = recorded?.clockOut
    ? recorded
    : (state?.attendance ?? recorded)
  async function submit() {
    if (inFlight.current || !state?.available) return
    inFlight.current = true
    setBusy(true)
    setError("")
    try {
      if (!pending.current) {
        if (document.visibilityState !== "visible" || !navigator.onLine)
          throw new Error(
            "Keep Clock In visible and reconnect before recording attendance.",
          )
        const candidate = preview?.current() ?? null
        const position =
          candidate &&
          !positionProblem(candidate, state.positionPolicy, Date.now())
            ? candidate
            : await capturePosition()
        if (document.visibilityState !== "visible")
          throw new Error(
            "Clock-in paused while the app was hidden. Return and retry.",
          )
        if (state.positionPolicy) {
          const problem = positionProblem(
            position,
            state.positionPolicy,
            Date.now(),
          )
          if (problem) throw new Error(problem)
        }
        if (!active.current) return
        pending.current = {
          shiftId,
          requestId: crypto.randomUUID(),
          ...position,
        }
      }
      const response = await fetch("/api/attendance/clock-in", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(pending.current),
      })
      const result = await response.json().catch(() => null)
      if (!active.current) return
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) preview?.stop()
        if (response.status < 500 || result?.code) pending.current = null
        throw new Error(
          result?.error ??
            "Unable to confirm clock-in. Retry the same request or refresh. Contact Management if this continues.",
        )
      }
      if (
        !result?.attendance ||
        result.attendance.shiftId !== shiftId ||
        typeof result.attendance.id !== "string" ||
        !Number.isFinite(Date.parse(result.attendance.clockIn))
      )
        throw new Error(
          "Unable to confirm clock-in. Refresh before starting another request or Contact Management.",
        )
      pending.current = null
      preview?.stop()
      setUncertain(false)
      setRecorded(result.attendance)
      setOpen(false)
      router.refresh()
    } catch (failure) {
      if (active.current) setUncertain(!!pending.current)
      if (active.current)
        setError(
          failure instanceof LocationCaptureError
            ? failure.message
            : failure instanceof Error && failure.message !== "Failed to fetch"
              ? failure.message
              : "Unable to confirm clock-in. Retry the same request or refresh before starting again. Contact Management if needed.",
        )
    } finally {
      inFlight.current = false
      if (active.current) setBusy(false)
    }
  }
  if (attendance)
    return (
      <div className="cm-stack" aria-live="polite">
        <Status tone="success">
          {attendance.clockOut
            ? "Clocked Out"
            : attendance.verification === "GPS_LOCATION_RECORDED_DEMO"
              ? "Clocked in — GPS location recorded."
              : "Clocked In"}
        </Status>
        <p>
          Recorded {formatDateTime(attendance.clockIn)} · {houseName}
        </p>
        {attendance.verification === "GPS_LOCATION_RECORDED_DEMO" && (
          <Banner tone="info">
            GPS location recorded for this fictional demonstration. This is not
            verification at the assigned house. Precise coordinates expire after
            seven days.
          </Banner>
        )}
        {attendance.verification === "GPS_LOCATION_RECORDED_DEMO" && (
          <Link
            className="cm-btn cm-btn--secondary"
            href={`/roster?tab=timesheets&attendanceId=${attendance.id}`}
          >
            View GPS location and attendance
          </Link>
        )}
        {attendance.verification === "SERVER_VALIDATED_LOCATION_TEST" && (
          <Banner tone="warning">
            Development test policy. Browser location checks are not conclusive
            proof of physical presence.
          </Banner>
        )}
        {attendance.clockOut ? (
          <>
            <p>
              Clock-out {attendanceInstant(attendance.clockOut)} ·{" "}
              {formatElapsed(attendance.elapsedMilliseconds)} recorded elapsed
            </p>
            <Link
              className="cm-btn cm-btn--secondary"
              href={`/roster?tab=timesheets&attendanceId=${attendance.id}`}
            >
              View attendance history
            </Link>
          </>
        ) : (
          <ClockOutControl
            attendanceId={attendance.id}
            availability={attendance.clockOutAvailability}
            onCompleted={setRecorded}
          />
        )}
      </div>
    )
  return (
    <>
      <Banner tone={state?.available ? "info" : "warning"}>
        {state?.message ??
          "Attendance configuration requires management attention. Contact Management."}
      </Banner>
      <Btn
        size="lg"
        block
        icon="clock"
        disabled={!state?.available || busy}
        onClick={() => setOpen(true)}
      >
        {state?.available ? "Clock In" : "Clock in unavailable"}
      </Btn>
      {open && (
        <Modal
          title="Use your current location?"
          subtitle={houseName}
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
                disabled={busy || !state?.available}
                onClick={() => void submit()}
              >
                {busy
                  ? "Checking location…"
                  : uncertain
                    ? "Retry previous request"
                    : "Use current location"}
              </Btn>
            </>
          }
        >
          <p>
            {demo
              ? "A fresh, accurate live preview reading is used, or a fresh position is requested, to record GPS-assisted attendance for this fictional demonstration. Latitude, longitude, accuracy and measurement time are recorded. Precise coordinates are retained for seven days. Distance from the assigned house is not checked. No background tracking is used."
              : "Your current location is requested once to check this clock-in against the assigned house. No background tracking is used. We retain the recorded time, accuracy and validation result; raw coordinates are not stored."}
          </p>
          <p>
            Browser location can use GPS, Wi-Fi or network positioning and may
            be inaccurate or manipulated. Permission alone does not approve
            attendance. You can continue to Dashboard without clocking in.
            Contact Management if location verification cannot be completed.
          </p>
          {state?.testOnly && (
            <Banner tone="warning">
              Development test policy only; this is not approved production
              attendance.
            </Banner>
          )}
          {error && (
            <Banner tone="danger" title="Clock-in not confirmed">
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
        </Modal>
      )}
    </>
  )
}
