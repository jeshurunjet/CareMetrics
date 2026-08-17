import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { STAFF_LOCATIONS } from '../data/staffLocations'

const HOUSES = [
  { id: 'sunrise', name: 'Sunrise House', lat: -36.8509, lng: 174.7645, address: '12 Sunrise Cres, Mt Eden' },
  { id: 'oaklands', name: 'Oaklands Service', lat: -36.8689, lng: 174.7512, address: '34 Oak Ave, Onehunga' },
  { id: 'riverside', name: 'Riverside Lodge', lat: -36.8340, lng: 174.7100, address: '8 Riverside Dr, New Lynn' },
  { id: 'cedar', name: 'Cedar Hill', lat: -36.8950, lng: 174.7800, address: '5 Cedar Hill Rd, Otahuhu' },
]


function staffDot(status: 'on-site' | 'off-site', selected: boolean) {
  const color = status === 'off-site' ? '#dc3545' : '#2a9d6f'
  const size = selected ? 28 : 20
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,${selected ? 0.45 : 0.28});
      transition:all 0.2s;
      ${selected ? 'outline:3px solid ' + color + '55;' : ''}
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
    className: '',
  })
}

function houseDot() {
  return L.divIcon({
    html: `<div style="
      width:14px;height:14px;border-radius:3px;
      background:#1a6b7a;border:2px solid white;
      box-shadow:0 1px 5px rgba(0,0,0,0.3);
      transform:rotate(45deg);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
    className: '',
  })
}

interface Props {
  selectedStaff: string | null
  onSelectStaff: (name: string) => void
}

export default function StaffLocationMap({ selectedStaff, onSelectStaff }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Record<string, L.Marker>>({})

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [-36.863, 174.745],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)

    L.control.attribution({ position: 'bottomleft', prefix: '© OpenStreetMap © CartoDB' }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // House markers (subtle diamonds)
    HOUSES.forEach(h => {
      L.marker([h.lat, h.lng], { icon: houseDot(), zIndexOffset: 0 })
        .addTo(map)
        .bindTooltip(h.name, { direction: 'top', offset: [0, -10], className: '' })
      L.circle([h.lat, h.lng], {
        radius: 80, color: '#1a6b7a', fillColor: '#1a6b7a',
        fillOpacity: 0.07, weight: 1, dashArray: '4 3',
      }).addTo(map)
    })

    // Staff markers
    STAFF_LOCATIONS.forEach(s => {
      const marker = L.marker([s.lat, s.lng], {
        icon: staffDot(s.status, false),
        zIndexOffset: 100,
      }).addTo(map)

      marker.on('click', () => onSelectStaff(s.name))
      markersRef.current[s.name] = marker
    })

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null; markersRef.current = {} }
  }, [])

  // Update marker styles and fly to selected
  useEffect(() => {
    if (!mapRef.current) return
    STAFF_LOCATIONS.forEach(s => {
      const m = markersRef.current[s.name]
      if (!m) return
      const isSelected = selectedStaff === s.name
      m.setIcon(staffDot(s.status, isSelected))
      if (isSelected) {
        mapRef.current!.flyTo([s.lat, s.lng], 15, { duration: 0.7 })
        m.setZIndexOffset(200)
      } else {
        m.setZIndexOffset(100)
      }
    })
  }, [selectedStaff])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
