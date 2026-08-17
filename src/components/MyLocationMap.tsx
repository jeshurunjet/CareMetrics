import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Jamie Taufa's assigned house — Riverside Lodge
const HOUSE = { name: 'Riverside Lodge', lat: -36.8340, lng: 174.7100, address: '8 Riverside Dr, New Lynn' }

// Simulated current GPS position (on-site)
const ME = { lat: -36.8342, lng: 174.7102 }

interface Props {
  clockedIn: boolean
}

export default function MyLocationMap({ clockedIn }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const myMarkerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [HOUSE.lat, HOUSE.lng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)

    L.control.attribution({ position: 'bottomright', prefix: '© OpenStreetMap © CartoDB' }).addTo(map)

    // Geofence circle
    L.circle([HOUSE.lat, HOUSE.lng], {
      radius: 80,
      color: '#1a6b7a',
      fillColor: '#1a6b7a',
      fillOpacity: 0.08,
      weight: 1.5,
      dashArray: '5 4',
    }).addTo(map)

    // House pin
    const houseIcon = L.divIcon({
      html: `<div style="
        width:38px;height:38px;border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        background:#1a6b7a;border:3px solid white;
        box-shadow:0 2px 10px rgba(0,0,0,0.3);
        display:flex;align-items:center;justify-content:center;
      "><span style="transform:rotate(45deg);font-size:15px;line-height:1">🏠</span></div>`,
      iconSize: [38, 38],
      iconAnchor: [19, 38],
      className: '',
    })

    L.marker([HOUSE.lat, HOUSE.lng], { icon: houseIcon }).addTo(map)
      .bindTooltip(`<strong>${HOUSE.name}</strong><br>${HOUSE.address}`, { direction: 'top', offset: [0, -40] })

    // My position dot
    const myIcon = (active: boolean) => L.divIcon({
      html: `<div style="
        width:22px;height:22px;border-radius:50%;
        background:${active ? '#2a9d6f' : '#94a3b8'};
        border:3px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.35);
      "></div>
      ${active ? `<div style="
        position:absolute;top:0;left:0;
        width:22px;height:22px;border-radius:50%;
        background:rgba(42,157,111,0.25);
        animation:pulse 2s infinite;
      "></div>` : ''}`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
      className: '',
    })

    const myMarker = L.marker([ME.lat, ME.lng], { icon: myIcon(clockedIn), zIndexOffset: 200 }).addTo(map)
    myMarker.bindTooltip(clockedIn ? '✓ You — clocked in' : 'Your location', { direction: 'top', offset: [0, -14] })
    myMarkerRef.current = myMarker

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null; myMarkerRef.current = null }
  }, [])

  // Update dot color when clock-in state changes
  useEffect(() => {
    if (!myMarkerRef.current) return
    const color = clockedIn ? '#2a9d6f' : '#94a3b8'
    myMarkerRef.current.setIcon(L.divIcon({
      html: `<div style="
        width:22px;height:22px;border-radius:50%;
        background:${color};border:3px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.35);
      "></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
      className: '',
    }))
  }, [clockedIn])

  return (
    <>
      <style>{`@keyframes pulse { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(2.2);opacity:0} }`}</style>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </>
  )
}
