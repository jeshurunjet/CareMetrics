"use client"
import { useEffect, useRef, useState } from "react"
import {
  loadGoogleMaps,
  onGoogleMapsFailure,
  type GoogleMapInstance,
  type GoogleMarkerInstance,
} from "./google-maps-loader"
import type { GoogleMapsDemoConfiguration } from "./demo-reference"
import type { PreviewPosition } from "./foreground-location"
interface Props {
  configuration: GoogleMapsDemoConfiguration
  position: PreviewPosition | null
  recenter: number
}
export default function GoogleLocationMap({
  configuration,
  position,
  recenter,
}: Props) {
  const element = useRef<HTMLDivElement>(null),
    map = useRef<GoogleMapInstance | null>(null),
    staff = useRef<GoogleMarkerInstance | null>(null),
    latest = useRef(position),
    centred = useRef(false),
    [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false)
  useEffect(() => {
    latest.current = position
  }, [position])
  useEffect(() => {
    let disposed = false
    const container = element.current
    const ref = configuration.reference
    const remove = onGoogleMapsFailure(() => {
      if (!disposed) setFailed(true)
    })
    let referenceMarker: GoogleMarkerInstance | undefined,
      circle: { setMap: (map: GoogleMapInstance | null) => void } | undefined,
      runtime: Awaited<ReturnType<typeof loadGoogleMaps>> | undefined
    void loadGoogleMaps(configuration.browserKey)
      .then((api) => {
        if (disposed || !container) return
        runtime = api
        const instance = new api.Map(container, {
          center: { lat: ref.latitude, lng: ref.longitude },
          zoom: 17,
          mapId: "DEMO_MAP_ID",
          streetViewControl: false,
          fullscreenControl: false,
          mapTypeControl: false,
          gestureHandling: "cooperative",
        })
        map.current = instance
        referenceMarker = new api.marker.AdvancedMarkerElement({
          map: instance,
          position: { lat: ref.latitude, lng: ref.longitude },
          title:
            ref.label + " — public demonstration reference, not a care house",
        })
        circle = new api.Circle({
          map: instance,
          center: { lat: ref.latitude, lng: ref.longitude },
          radius: ref.proposedRadiusMetres,
          strokeColor: "#b7791f",
          fillColor: "#b7791f",
          fillOpacity: 0.12,
          strokeWeight: 1,
          clickable: false,
        })
        setReady(true)
      })
      .catch(() => {
        if (!disposed) setFailed(true)
      })
    return () => {
      disposed = true
      remove()
      if (staff.current) {
        staff.current.map = null
        staff.current = null
      }
      if (referenceMarker) referenceMarker.map = null
      circle?.setMap(null)
      if (map.current) runtime?.event.clearInstanceListeners(map.current)
      map.current = null
      centred.current = false
      container?.replaceChildren()
    }
  }, [configuration.browserKey, configuration.reference])
  useEffect(() => {
    const instance = map.current,
      api = window.google?.maps
    if (!ready || !instance || !api) return
    if (!position) {
      if (staff.current) staff.current.map = null
      staff.current = null
      centred.current = false
      instance.setCenter({
        lat: configuration.reference.latitude,
        lng: configuration.reference.longitude,
      })
      return
    }
    const point = { lat: position.latitude, lng: position.longitude }
    if (!staff.current)
      staff.current = new api.marker.AdvancedMarkerElement({
        map: instance,
        position: point,
        title: "Your reported live position — not verified attendance",
      })
    else staff.current.position = point
    if (!centred.current) {
      instance.setCenter(point)
      centred.current = true
    }
  }, [position, ready, configuration.reference])
  useEffect(() => {
    if (recenter && latest.current)
      map.current?.panTo({
        lat: latest.current.latitude,
        lng: latest.current.longitude,
      })
  }, [recenter])
  return (
    <div>
      <div
        ref={element}
        role="region"
        aria-label="Google Maps location preview"
        style={{
          height: 300,
          maxWidth: "100%",
          position: "relative",
          zIndex: 0,
        }}
      />
      {!ready && !failed && <p role="status">Loading Google Maps…</p>}
      {failed && (
        <p role="status">
          Google Maps unavailable or demo quota reached. Your coordinates and
          accuracy remain available; map failure does not record or cancel
          attendance.
        </p>
      )}
      <p className="cm-muted">
        Reference pin: Glenfield Mall. Staff pin appears only after a genuine
        location reading. The 10-metre circle is advisory only.
      </p>
    </div>
  )
}
