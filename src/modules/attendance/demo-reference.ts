import { distanceMetres } from "./geo"
import type { PreviewPosition } from "./foreground-location"
export interface DemoReference {
  id: string
  label: string
  latitude: number
  longitude: number
  proposedRadiusMetres: number
}
// Public point from Glenfield Mall's own Directions link; not a care-house location.
export const GLENFIELD_DEMO_REFERENCE: DemoReference = {
  id: "glenfield-mall-demo-v1",
  label: "Glenfield Mall",
  latitude: -36.7818565,
  longitude: 174.7220871,
  proposedRadiusMetres: 10,
}
export interface GoogleMapsDemoConfiguration {
  browserKey: string
  reference: DemoReference
}
export interface DemoLocationNotice {
  status: "outside" | "within" | "uncertain"
  message: string
  referenceLabel: string
}
export function assessDemoReference(p: PreviewPosition, r: DemoReference) {
  const distance = distanceMetres(
    p.latitude,
    p.longitude,
    r.latitude,
    r.longitude,
  )
  if (
    distance === null ||
    !Number.isFinite(p.accuracyMetres) ||
    p.accuracyMetres < 0
  )
    return null
  const status: DemoLocationNotice["status"] =
    distance - p.accuracyMetres > r.proposedRadiusMetres
      ? "outside"
      : distance + p.accuracyMetres <= r.proposedRadiusMetres
        ? "within"
        : "uncertain"
  return { distanceMetres: distance, status }
}
export function demoLocationNotice(
  p: PreviewPosition,
  r: DemoReference,
): DemoLocationNotice | undefined {
  const a = assessDemoReference(p, r)
  if (!a) return
  return {
    status: a.status,
    referenceLabel: r.label,
    message:
      a.status === "outside"
        ? `You are outside the demonstration house reference (${r.label}). Clock-in accepted for demonstration only.`
        : a.status === "uncertain"
          ? "GPS accuracy overlaps the proposed 10-metre boundary. Clock-in accepted for demonstration only; presence is not verified."
          : "Reported location is within the proposed demonstration area. Clock-in accepted for demonstration only; presence is not verified.",
  }
}
