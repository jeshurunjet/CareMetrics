import { validCoordinates } from "./geo"
export interface PreviewPosition {
  latitude: number
  longitude: number
  accuracyMetres: number
  measuredAt: number
}
export interface PositionPolicy {
  maxAccuracyMetres: number
  maxAgeMs: number
  maxFutureSkewMs: number
}
export function positionProblem(
  p: PreviewPosition | null,
  policy: PositionPolicy | undefined,
  now: number,
): string {
  if (
    !p ||
    !validCoordinates(p.latitude, p.longitude) ||
    !Number.isFinite(p.accuracyMetres) ||
    p.accuracyMetres < 0 ||
    !Number.isFinite(p.measuredAt) ||
    p.measuredAt <= 0 ||
    p.measuredAt > 8640000000000000
  )
    return "Waiting for a valid GPS position."
  if (!policy) return "Location policy is unavailable. Contact Management."
  if (p.accuracyMetres > policy.maxAccuracyMetres)
    return "Poor accuracy. Move to a clearer location or request a fresh position."
  if (p.measuredAt > now + policy.maxFutureSkewMs)
    return "Location time is ahead of your device clock. Check your clock and retry."
  if (now - p.measuredAt > policy.maxAgeMs)
    return "Stale position. Request a fresh position before clocking in."
  return ""
}
export interface ForegroundLocationState {
  active: boolean
  position: PreviewPosition | null
  message: string
}
let stopCurrent: (() => void) | undefined
/** One browser-tab foreground watch, including immediate cleanup on logout. */
export function stopLiveLocation() {
  stopCurrent?.()
}
export function createForegroundWatch(
  geo: Pick<Geolocation, "watchPosition" | "clearWatch">,
  report: (state: ForegroundLocationState) => void,
) {
  let id: number | undefined,
    generation = 0,
    running = false,
    latest: PreviewPosition | null = null
  const stop = (
    message = "Live location stopped. Choose Show Live Location to restart.",
  ) => {
    running = false
    generation++
    if (id !== undefined) geo.clearWatch(id)
    id = undefined
    latest = null
    if (stopCurrent === cancel) stopCurrent = undefined
    report({ active: false, position: null, message })
  }
  const cancel = () => stop()
  return {
    stop,
    current: () => latest,
    active: () => running,
    start() {
      if (running) return
      stopLiveLocation()
      running = true
      stopCurrent = cancel
      const token = ++generation
      report({
        active: true,
        position: null,
        message: "Waiting for permission / acquiring GPS signal…",
      })
      try {
        const created = geo.watchPosition(
          (position) => {
            if (!running || token !== generation) return
            const p = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracyMetres: position.coords.accuracy,
              measuredAt: position.timestamp,
            }
            if (
              !validCoordinates(p.latitude, p.longitude) ||
              !Number.isFinite(p.accuracyMetres) ||
              p.accuracyMetres < 0 ||
              !Number.isFinite(p.measuredAt) ||
              p.measuredAt <= 0 ||
              p.measuredAt > 8640000000000000
            ) {
              stop(
                "Location unavailable: an invalid GPS reading was returned. Retry or Contact Management.",
              )
              return
            }
            if (latest && p.measuredAt < latest.measuredAt) return
            latest = p
            report({ active: true, position: p, message: "Live Location" })
          },
          (error) => {
            if (!running || token !== generation) return
            stop(
              error.code === 1
                ? "Location permission is required to record GPS-assisted attendance. Please enable location access and try again."
                : error.code === 3
                  ? "Location timeout. Choose Show Live Location to retry."
                  : "Location unavailable. Check device location services and retry or Contact Management.",
            )
          },
          { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
        )
        if (running && token === generation) id = created
        else geo.clearWatch(created) // Includes synchronous error callbacks and watcher id zero.
      } catch {
        stop("Location unavailable. Check browser support and retry.")
      }
    },
  }
}
