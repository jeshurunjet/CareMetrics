"use client"
// A boolean lifecycle guard only: never persist position samples.
/* A denied storage API must not break manual location controls. */
import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import {
  createForegroundWatch,
  type ForegroundLocationState,
} from "./foreground-location"
const stoppedKey = "caremetrics-live-location-stopped"
function rememberStopped(stopped: boolean) {
  try {
    if (stopped) sessionStorage.setItem(stoppedKey, "true")
    else sessionStorage.removeItem(stoppedKey)
  } catch {}
}
function previouslyStopped() {
  try {
    return sessionStorage.getItem(stoppedKey) === "true"
  } catch {
    return true
  }
}
const initial: ForegroundLocationState = {
  active: false,
  position: null,
  message: "",
}
export default function useLiveLocation(
  enabled: boolean,
  autoStartGranted = false,
) {
  const [state, setState] = useState(initial),
    [now, setNow] = useState(0),
    pathname = usePathname(),
    controller = useRef<ReturnType<typeof createForegroundWatch> | null>(null),
    permission = useRef<PermissionStatus | null>(null),
    epoch = useRef(0),
    autoAttempted = useRef(false)
  const removePermission = useCallback(() => {
    if (permission.current) permission.current.onchange = null
    permission.current = null
  }, [])
  const stop = useCallback(
    (message?: string) => {
      epoch.current++
      if (controller.current?.active()) {
        autoAttempted.current = true
        if (autoStartGranted) rememberStopped(true)
      }
      removePermission()
      controller.current?.stop(message)
    },
    [removePermission, autoStartGranted],
  )
  const current = useCallback(() => controller.current?.current() ?? null, [])
  const start = useCallback(() => {
    if (
      !enabled ||
      document.visibilityState !== "visible" ||
      controller.current?.active()
    )
      return
    if (!navigator.onLine) {
      setState({
        active: false,
        position: null,
        message: "Offline. Reconnect, then choose Show Live Location.",
      })
      return
    }
    if (!isSecureContext || !navigator.geolocation) {
      setState({
        active: false,
        position: null,
        message:
          "Location requires a supported browser and secure HTTPS connection.",
      })
      return
    }
    autoAttempted.current = true
    if (autoStartGranted) rememberStopped(false)
    removePermission()
    const token = ++epoch.current
    controller.current ??= createForegroundWatch(
      navigator.geolocation,
      (next) => {
        if (!next.active) {
          epoch.current++
          removePermission()
        }
        setState(next)
        setNow(Date.now())
      },
    )
    controller.current.start()
    void navigator.permissions
      ?.query({ name: "geolocation" })
      .then((status) => {
        if (token !== epoch.current || !controller.current?.active()) return
        permission.current = status
        let granted = status.state === "granted"
        const changed = () => {
          if (
            status.state === "denied" ||
            (granted && status.state !== "granted")
          )
            stop(
              "Location permission is required to record GPS-assisted attendance. Please enable location access and try again.",
            )
          else {
            granted = status.state === "granted"
            setState((previous) =>
              previous.active && !previous.position
                ? {
                    ...previous,
                    message: granted
                      ? "Permission granted. Acquiring GPS signal…"
                      : "Waiting for location permission…",
                  }
                : previous,
            )
          }
        }
        status.onchange = changed
        changed()
      })
      .catch(() => {})
  }, [enabled, autoStartGranted, removePermission, stop])
  useEffect(() => {
    if (!autoStartGranted || !enabled || autoAttempted.current) return
    if (previouslyStopped()) {
      autoAttempted.current = true
      return
    }
    let disposed = false
    void navigator.permissions
      ?.query({ name: "geolocation" })
      .then((permission) => {
        if (disposed || autoAttempted.current) return
        autoAttempted.current = true
        if (
          permission.state === "granted" &&
          document.visibilityState === "visible"
        )
          start()
      })
      .catch(() => {})
    return () => {
      disposed = true
    }
  }, [autoStartGranted, enabled, start])
  useEffect(() => {
    const hidden = () => {
      if (document.visibilityState !== "visible")
        stop(
          "Live location stopped while the app was hidden. Choose Show Live Location to restart.",
        )
    }
    const pagehide = () => stop()
    const offline = () =>
      stop("Offline. Live location stopped. Reconnect and restart explicitly.")
    document.addEventListener("visibilitychange", hidden)
    window.addEventListener("pagehide", pagehide)
    window.addEventListener("offline", offline)
    return () => {
      document.removeEventListener("visibilitychange", hidden)
      window.removeEventListener("pagehide", pagehide)
      window.removeEventListener("offline", offline)
      stop()
    }
  }, [pathname, stop])
  useEffect(() => {
    if (!enabled) stop()
  }, [enabled, stop])
  useEffect(() => {
    if (!state.active || !state.position) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [state.active, state.position])
  return { ...state, now, start, stop, current }
}
