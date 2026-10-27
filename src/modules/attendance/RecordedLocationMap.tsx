"use client"
import "leaflet/dist/leaflet.css"
import { useState } from "react"
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet"
import { divIcon } from "leaflet"
const pin = divIcon({
  className: "",
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  html: '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40"><path fill="#1a6b7a" stroke="white" stroke-width="2" d="M15 39C12 32 1 24 1 15a14 14 0 0 1 28 0c0 9-11 17-14 24Z"/><circle cx="15" cy="15" r="5" fill="white"/></svg>',
})
export default function RecordedLocationMap({
  latitude,
  longitude,
}: {
  latitude: number
  longitude: number
}) {
  const [failed, setFailed] = useState(false)
  return (
    <div>
      <div
        role="region"
        aria-label="Map of the recorded GPS location"
        style={{
          height: 260,
          maxWidth: "100%",
          position: "relative",
          zIndex: 0,
        }}
      >
        <MapContainer
          center={[latitude, longitude]}
          zoom={16}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            referrerPolicy="strict-origin-when-cross-origin"
            eventHandlers={{ tileerror: () => setFailed(true) }}
          />
          <Marker position={[latitude, longitude]} icon={pin}>
            <Popup>
              GPS location recorded. This is not house-location verification.
            </Popup>
          </Marker>
        </MapContainer>
      </div>
      {failed && (
        <p role="status">
          Some map tiles are unavailable. The recorded coordinates remain
          available above.
        </p>
      )}
    </div>
  )
}
