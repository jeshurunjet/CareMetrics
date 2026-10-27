"use client"
import dynamic from "next/dynamic"
import { Component, memo, useState, type ReactNode } from "react"
import { Btn, Banner, Empty, Status } from "@/modules/staff/ui"
import { positionProblem, type PositionPolicy } from "./foreground-location"
import {
  assessDemoReference,
  type GoogleMapsDemoConfiguration,
} from "./demo-reference"
import type useLiveLocation from "./useLiveLocation"
const Map = memo(
  dynamic(() => import("./RecordedLocationMap"), {
    ssr: false,
    loading: () => <p>Loading map…</p>,
  }),
)
const GoogleMap = dynamic(() => import("./GoogleLocationMap"), {
  ssr: false,
  loading: () => <p>Loading Google Maps…</p>,
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
      <p role="status">
        Map unavailable. Your current coordinates and accuracy remain available.
      </p>
    ) : (
      this.props.children
    )
  }
}
interface Props {
  live: ReturnType<typeof useLiveLocation>
  enabled: boolean
  policy?: PositionPolicy
  googleDemo?: GoogleMapsDemoConfiguration
}
export default function LiveLocationPanel({
  live,
  enabled,
  policy,
  googleDemo,
}: Props) {
  const [recenter, setRecenter] = useState(0),
    p = live.position,
    assessment =
      p && googleDemo ? assessDemoReference(p, googleDemo.reference) : null,
    problem = p ? positionProblem(p, policy, live.now) : ""
  return (
    <section
      className="cm-map-card cm-panel cm-stack"
      aria-label="Your Current Location"
    >
      <h2 className="cm-h3">Your Current Location</h2>
      <p>
        {googleDemo
          ? "GPS detection starts here when location permission is already granted. Otherwise, choose Show Live Location. Returning from the background requires an explicit restart."
          : "Enable live location to see your current position before recording attendance."}
      </p>
      <p className="cm-muted">
        {googleDemo
          ? "No-billing Google Maps evaluation. Google receives the displayed map/location data. Preview stays in memory; only Clock In saves attendance. Glenfield Mall is the public demo reference, not a real care-house address. The 10-metre area is advisory, not an enforced geofence."
          : "Foreground preview only: positions stay in memory and do not record attendance. Showing the map sends tile requests revealing an approximate area to OpenStreetMap. Exact coordinates are not included in provider query parameters. No offline map cache is created."}
      </p>
      {googleDemo && (
        <MapBoundary>
          <GoogleMap
            configuration={googleDemo}
            position={live.active ? p : null}
            recenter={recenter}
          />
        </MapBoundary>
      )}
      {assessment && live.active && (
        <Banner tone={assessment.status === "within" ? "info" : "warning"}>
          Reported distance to the Glenfield Mall demo point:{" "}
          {Math.round(assessment.distanceMetres)} m.
          {assessment.status === "outside"
            ? " Outside the proposed 10-metre demo area. Demo clock-in remains allowed, subject to shift and GPS checks."
            : assessment.status === "uncertain"
              ? " GPS accuracy overlaps the 10-metre boundary. This is not verified presence; demo clock-in remains allowed."
              : " Within the proposed demo area based on reported accuracy. This is not verified presence."}
        </Banner>
      )}
      <div role="status" aria-live="polite">
        {live.active && <Status tone="brand">Live Location</Status>}
        {live.message && live.message !== "Live Location" && (
          <p>{live.message}</p>
        )}
      </div>
      {!enabled && (
        <Banner tone="info">
          No eligible clock-in is available here. Review My Shifts or contact
          management. You can continue to Dashboard.
        </Banner>
      )}
      {live.active ? (
        <Btn variant="secondary" onClick={() => live.stop()}>
          Stop Live Location
        </Btn>
      ) : (
        <Btn disabled={!enabled} onClick={live.start}>
          Show Live Location
        </Btn>
      )}
      {p && live.active ? (
        <>
          {problem && <Banner tone="warning">{problem}</Banner>}
          <dl className="cm-dl">
            <div>
              <dt>Latitude</dt>
              <dd>{p.latitude.toFixed(7)}</dd>
            </div>
            <div>
              <dt>Longitude</dt>
              <dd>{p.longitude.toFixed(7)}</dd>
            </div>
            <div>
              <dt>Reported accuracy</dt>
              <dd>
                {p.accuracyMetres.toLocaleString("en-NZ", {
                  maximumFractionDigits: 1,
                })}{" "}
                m
              </dd>
            </div>
            <div>
              <dt>Last location update</dt>
              <dd>
                <time dateTime={new Date(p.measuredAt).toISOString()}>
                  {new Intl.DateTimeFormat("en-NZ", {
                    timeZone: "Pacific/Auckland",
                    dateStyle: "medium",
                    timeStyle: "medium",
                    hour12: false,
                  }).format(new Date(p.measuredAt))}
                </time>
              </dd>
            </div>
          </dl>
          <Btn
            variant="secondary"
            onClick={() => setRecenter((value) => value + 1)}
          >
            Recenter
          </Btn>
          {!googleDemo && (
            <MapBoundary>
              <Map
                latitude={p.latitude}
                longitude={p.longitude}
                live
                recenter={recenter}
              />
            </MapBoundary>
          )}
        </>
      ) : !googleDemo ? (
        <div className="cm-map">
          <Empty
            icon="pin"
            title="No live position shown"
            text="Choose Show Live Location when you are ready."
          />
        </div>
      ) : null}
    </section>
  )
}
