export interface GooglePoint {
  lat: number
  lng: number
}
export interface GoogleMapInstance {
  setCenter: (p: GooglePoint) => void
  panTo: (p: GooglePoint) => void
}
export interface GoogleMarkerInstance extends HTMLElement {
  position: GooglePoint | null
  map: GoogleMapInstance | null
}
export interface GoogleMapRuntime {
  Map: new (
    element: HTMLElement,
    options: Record<string, unknown>,
  ) => GoogleMapInstance
  Circle: new (
    options: Record<string, unknown>,
  ) => { setMap: (map: GoogleMapInstance | null) => void }
  marker: {
    AdvancedMarkerElement: new (
      options: Record<string, unknown>,
    ) => GoogleMarkerInstance
  }
  event: { clearInstanceListeners: (instance: unknown) => void }
}
declare global {
  interface Window {
    google?: { maps: GoogleMapRuntime }
    cmGoogleMapsReady?: () => void
    gm_authFailure?: () => void
  }
}
let loading: Promise<GoogleMapRuntime> | undefined,
  loadedKey: string | undefined
const failures = new Set<() => void>()
export function onGoogleMapsFailure(listener: () => void) {
  failures.add(listener)
  return () => {
    failures.delete(listener)
  }
}
export function loadGoogleMaps(browserKey: string): Promise<GoogleMapRuntime> {
  if (loading)
    return loadedKey === browserKey
      ? loading
      : Promise.reject(Error("Reload to change the map configuration."))
  loadedKey = browserKey
  loading = new Promise((resolve, reject) => {
    const script = document.createElement("script")
    const fail = () => {
      for (const f of failures) f()
      reject(
        Error(
          "Google Maps unavailable. Coordinates and attendance remain available.",
        ),
      )
    }
    const timeout = setTimeout(fail, 15000)
    window.gm_authFailure = () => {
      clearTimeout(timeout)
      fail()
    }
    window.cmGoogleMapsReady = () => {
      clearTimeout(timeout)
      if (window.google?.maps.marker) resolve(window.google.maps)
      else fail()
    }
    script.id = "caremetrics-google-maps-demo"
    script.async = true
    script.referrerPolicy = "strict-origin-when-cross-origin"
    script.src =
      "https://maps.googleapis.com/maps/api/js?" +
      new URLSearchParams({
        key: browserKey,
        callback: "cmGoogleMapsReady",
        libraries: "maps,marker",
        loading: "async",
        v: "quarterly",
        auth_referrer_policy: "origin",
      })
    script.onerror = () => {
      clearTimeout(timeout)
      fail()
    }
    document.head.append(script)
  })
  return loading
}
