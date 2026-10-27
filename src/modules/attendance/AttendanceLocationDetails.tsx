"use client"
import dynamic from "next/dynamic"
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { Btn, Status } from "@/modules/staff/ui"
import { attendanceInstant } from "./duration"
import {
  LOCATION_EXPIRED_MESSAGE,
  type AttendanceLocationRead,
} from "./location-types"
const Map = dynamic(() => import("./RecordedLocationMap"), {
  ssr: false,
  loading: () => <p>Loading map…</p>,
})
class MapBoundary extends Component<{ children: ReactNode }, {
  failed: boolean
}> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? (
      <p>Map unavailable. Recorded coordinates remain available above.</p>
    ) : (
      this.props.children
    )
  }
}
function LocationBody({
  attendanceId,
  admin,
}: {
  attendanceId: string
  admin: boolean
}) {
  const [data, setData] = useState<AttendanceLocationRead | null>(null),
    [error, setError] = useState(""),
    [map, setMap] = useState(false),
    deadline = useRef(0),
    request = useRef<AbortController | null>(null)
  const expire = useCallback(() => {
    setMap(false)
    setData((d) =>
      d ? { ...d, status: "expired", coordinates: null, remainingMs: 0 } : null,
    )
  }, [])
  const load = useCallback(async () => {
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setData(null)
    setMap(false)
    setError("")
    const started = performance.now()
    try {
      const response = await fetch(
        `/api/${admin ? "admin/" : ""}attendance/${attendanceId}/location`,
        {
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        },
      )
      if (!response.ok)
        throw new Error(
          "Location details are unavailable. Refresh or contact management.",
        )
      const value = (await response.json()) as AttendanceLocationRead
      if (controller.signal.aborted) return
      const remaining = Math.max(
        0,
        value.remainingMs - (performance.now() - started),
      )
      deadline.current = performance.now() + remaining
      setData(
        value.status === "retained" && remaining === 0
          ? { ...value, status: "expired", coordinates: null, remainingMs: 0 }
          : { ...value, remainingMs: remaining },
      )
    } catch {
      if (!controller.signal.aborted)
        setError(
          "Location details are unavailable. Refresh or contact management.",
        )
    }
  }, [attendanceId, admin])
  useEffect(() => {
    const initial = setTimeout(() => {
      void load()
    }, 0)
    const visible = () => {
      if (document.visibilityState === "visible") void load()
    }
    document.addEventListener("visibilitychange", visible)
    return () => {
      clearTimeout(initial)
      request.current?.abort()
      document.removeEventListener("visibilitychange", visible)
    }
  }, [load])
  useEffect(() => {
    if (data?.status !== "retained") return
    const timer = setTimeout(
      expire,
      Math.max(0, deadline.current - performance.now()),
    )
    return () => clearTimeout(timer)
  }, [data, expire])
  if (error) return <p role="alert">{error}</p>
  if (!data) return <p role="status">Loading location details…</p>
  if (data.status === "not-recorded")
    return <p>No GPS recording is associated with this attendance.</p>
  return (
    <section className="cm-stack" aria-label="Recorded GPS evidence">
      <Status tone="brand">GPS Location Recorded</Status>
      <p>
        Recording only. This location was not verified against the assigned
        house and is not conclusive proof of physical presence.
      </p>
      <dl className="cm-dl">
        <div>
          <dt>Employee</dt>
          <dd>{data.employeeName}</dd>
        </div>
        <div>
          <dt>House</dt>
          <dd>{data.houseName}</dd>
        </div>
        <div>
          <dt>Server clock-in</dt>
          <dd>{attendanceInstant(data.clockIn)}</dd>
        </div>
        <div>
          <dt>Measured</dt>
          <dd>{attendanceInstant(data.measuredAt)}</dd>
        </div>
        <div>
          <dt>Reported accuracy</dt>
          <dd>
            {data.accuracyMetres === null
              ? "Not recorded"
              : `${data.accuracyMetres} m`}
          </dd>
        </div>
        <div>
          <dt>Precise location expires</dt>
          <dd>{attendanceInstant(data.expiresAt)}</dd>
        </div>
        {data.status === "retained" && data.coordinates && (
          <>
            <div>
              <dt>Latitude</dt>
              <dd>{data.coordinates.latitude.toFixed(7)}</dd>
            </div>
            <div>
              <dt>Longitude</dt>
              <dd>{data.coordinates.longitude.toFixed(7)}</dd>
            </div>
          </>
        )}
      </dl>
      {data.status === "expired" ? (
        <p role="status">{LOCATION_EXPIRED_MESSAGE}</p>
      ) : (
        data.coordinates && (
          <>
            <p className="cm-muted">
              Loading the map sends tile requests that reveal an approximate map
              area to OpenStreetMap. Exact coordinates are not included in
              provider query parameters. No offline map cache is created.
            </p>
            {!map ? (
              <Btn
                variant="secondary"
                onClick={() => {
                  if (performance.now() >= deadline.current) expire()
                  else setMap(true)
                }}
              >
                Load location map
              </Btn>
            ) : (
              <MapBoundary>
                <Map
                  latitude={data.coordinates.latitude}
                  longitude={data.coordinates.longitude}
                />
              </MapBoundary>
            )}
          </>
        )
      )}
    </section>
  )
}
export default function AttendanceLocationDetails({
  attendanceId,
  admin = false,
}: {
  attendanceId: string
  admin?: boolean
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="cm-stack">
      <Btn variant="secondary" onClick={() => setOpen((v) => !v)}>
        {open ? "Hide GPS location" : "View GPS location"}
      </Btn>
      {open && <LocationBody attendanceId={attendanceId} admin={admin} />}
    </div>
  )
}
