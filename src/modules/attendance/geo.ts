/** Mean Earth radius (IUGG); a calculation constant, never a geofence policy. */
const EARTH_RADIUS_METRES = 6371008.8
export function validCoordinates(
  latitude: unknown,
  longitude: unknown,
): boolean {
  return (
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    Math.abs(latitude) <= 90 &&
    typeof longitude === "number" &&
    Number.isFinite(longitude) &&
    Math.abs(longitude) <= 180
  )
}
export function distanceMetres(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number | null {
  if (!validCoordinates(lat1, lng1) || !validCoordinates(lat2, lng2))
    return null
  const radians = (degrees: number) => (degrees * Math.PI) / 180
  const a =
    Math.sin(radians(lat2 - lat1) / 2) ** 2 +
    Math.cos(radians(lat1)) *
      Math.cos(radians(lat2)) *
      Math.sin(radians(lng2 - lng1) / 2) ** 2
  return (
    2 * EARTH_RADIUS_METRES * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))))
  )
}
