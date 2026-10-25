export class LocationCaptureError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message)
  }
}
/** One user-requested measurement. Never used by a page effect or Dashboard. */
export function capturePosition(): Promise<{
  latitude: number
  longitude: number
  accuracyMetres: number
  measuredAt: number
}> {
  if (!globalThis.isSecureContext)
    return Promise.reject(
      new LocationCaptureError(
        "INSECURE_ORIGIN",
        "Location requires a secure HTTPS connection. Contact Management.",
      ),
    )
  if (typeof navigator === "undefined" || !navigator.geolocation)
    return Promise.reject(
      new LocationCaptureError(
        "UNSUPPORTED_BROWSER",
        "This browser does not support location. Contact Management.",
      ),
    )
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMetres: position.coords.accuracy,
          measuredAt: position.timestamp,
        }),
      (error) =>
        reject(
          new LocationCaptureError(
            error.code === 1
              ? "PERMISSION_DENIED"
              : error.code === 3
                ? "POSITION_TIMEOUT"
                : "POSITION_UNAVAILABLE",
            error.code === 1
              ? "Location permission was denied. Check your browser settings or Contact Management."
              : error.code === 3
                ? "The location request timed out. Retry or Contact Management."
                : "Location services are disabled or unavailable. Retry or Contact Management.",
          ),
        ),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    )
  })
}
