"use client"
import "leaflet/dist/leaflet.css"
import { useState } from "react"
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet"
import type { House } from "../data/types"
export default function HouseMap({ house }: { house: House }) {
  const [failed, setFailed] = useState(false)
  return (
    <div style={{ height: "100%", position: "relative" }}>
      <MapContainer
        center={[house.lat, house.lng]}
        zoom={16}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          eventHandlers={{ tileerror: () => setFailed(true) }}
        />
        <CircleMarker
          center={[house.lat, house.lng]}
          radius={11}
          pathOptions={{
            color: "#1a6b7a",
            fillColor: "#1a6b7a",
            fillOpacity: 0.9,
            weight: 3,
          }}
        >
          <Tooltip permanent direction="top" offset={[0, -10]}>
            {house.name}
          </Tooltip>
        </CircleMarker>
      </MapContainer>
      {failed && (
        <p className="cm-map-failure" role="status">
          Map tiles unavailable. Demonstration house only; no GPS location.
        </p>
      )}
    </div>
  )
}
