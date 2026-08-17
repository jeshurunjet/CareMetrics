import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix Leaflet's default icon path issue with bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Auckland-area house locations (real coordinates, fictional addresses)
const HOUSES = [
  { id: 'sunrise', name: 'Sunrise House', lat: -36.8509, lng: 174.7645, address: '12 Sunrise Cres, Mt Eden' },
  { id: 'oaklands', name: 'Oaklands Service', lat: -36.8689, lng: 174.7512, address: '34 Oak Ave, Onehunga' },
  { id: 'riverside', name: 'Riverside Lodge', lat: -36.8340, lng: 174.7100, address: '8 Riverside Dr, New Lynn' },
  { id: 'cedar', name: 'Cedar Hill', lat: -36.8950, lng: 174.7800, address: '5 Cedar Hill Rd, Otahuhu' },
]

// Clock-in positions — some on-site, some drifted (simulate GPS accuracy)
const STAFF_CLOCKINS = [
  { name: 'Aroha Ngata', house: 'sunrise', clockLat: -36.8510, clockLng: 174.7647, time: '07:02', status: 'on-site' as const },
  { name: 'Priya Sharma', house: 'sunrise', clockLat: -36.8514, clockLng: 174.7643, time: '07:31', status: 'on-site' as const },
  { name: 'Lena Costa', house: 'oaklands', clockLat: -36.8690, clockLng: 174.7515, time: '07:02', status: 'on-site' as const },
  { name: 'Marcus Bell', house: 'oaklands', clockLat: -36.8700, clockLng: 174.7530, time: '07:05', status: 'on-site' as const },
  { name: 'Jamie Taufa', house: 'riverside', clockLat: -36.8342, clockLng: 174.7102, time: '08:04', status: 'on-site' as const },
  { name: 'Sam Wilson', house: 'cedar', clockLat: -36.8820, clockLng: 174.7650, time: '09:18', status: 'off-site' as const },
  { name: 'Daniel Park', house: 'cedar', clockLat: -36.8951, clockLng: 174.7802, time: '08:02', status: 'on-site' as const },
]

function makeHouseIcon(color: string) {
  return L.divIcon({
    html: `<div style="
      width: 36px; height: 36px; border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      background: ${color};
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.35);
      display: flex; align-items: center; justify-content: center;
    "><div style="transform: rotate(45deg); font-size: 14px;">🏠</div></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -38],
    className: '',
  })
}

function makeStaffIcon(status: 'on-site' | 'off-site') {
  const color = status === 'on-site' ? '#2a9d6f' : '#dc3545'
  return L.divIcon({
    html: `<div style="
      width: 22px; height: 22px; border-radius: 50%;
      background: ${color};
      border: 3px solid white;
      box-shadow: 0 1px 6px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -14],
    className: '',
  })
}

interface Props {
  selectedHouse: string | null
  onSelectHouse: (id: string | null) => void
}

export default function ClockInMap({ selectedHouse, onSelectHouse }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return

    const map = L.map(mapRef.current, {
      center: [-36.863, 174.745],
      zoom: 12,
      zoomControl: false,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CartoDB',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // House markers with radius circles
    HOUSES.forEach(house => {
      const circle = L.circle([house.lat, house.lng], {
        radius: 80,
        color: '#1a6b7a',
        fillColor: '#1a6b7a',
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: '4 3',
      }).addTo(map)

      const marker = L.marker([house.lat, house.lng], {
        icon: makeHouseIcon('#1a6b7a'),
      }).addTo(map)

      marker.bindPopup(`
        <div style="font-family: system-ui, sans-serif; min-width: 160px;">
          <div style="font-weight: 700; font-size: 14px; color: #1a1f2e; margin-bottom: 3px;">${house.name}</div>
          <div style="font-size: 12px; color: #6b7685;">${house.address}</div>
        </div>
      `, { offset: [0, -36] })

      marker.on('click', () => onSelectHouse(house.id))
    })

    // Staff clock-in markers
    STAFF_CLOCKINS.forEach(staff => {
      const house = HOUSES.find(h => h.id === staff.house)
      const marker = L.marker([staff.clockLat, staff.clockLng], {
        icon: makeStaffIcon(staff.status),
      }).addTo(map)

      const statusLabel = staff.status === 'on-site'
        ? '<span style="color: #2a9d6f; font-weight: 700;">✓ On-site</span>'
        : '<span style="color: #dc3545; font-weight: 700;">⚠ Off-site</span>'

      marker.bindPopup(`
        <div style="font-family: system-ui, sans-serif; min-width: 170px;">
          <div style="font-weight: 700; font-size: 14px; color: #1a1f2e; margin-bottom: 2px;">${staff.name}</div>
          <div style="font-size: 12px; color: #6b7685; margin-bottom: 4px;">${house?.name ?? ''} · ${staff.time}</div>
          <div style="font-size: 12px;">${statusLabel}</div>
          ${staff.status === 'off-site' ? '<div style="font-size: 11px; color: #dc3545; margin-top: 4px;">GPS location does not match house address</div>' : ''}
        </div>
      `, { offset: [0, -14] })
    })

    leafletMap.current = map
    return () => { map.remove(); leafletMap.current = null }
  }, [])

  // Fly to selected house
  useEffect(() => {
    if (!leafletMap.current) return
    if (selectedHouse) {
      const house = HOUSES.find(h => h.id === selectedHouse)
      if (house) leafletMap.current.flyTo([house.lat, house.lng], 15, { duration: 0.8 })
    } else {
      leafletMap.current.flyTo([-36.863, 174.745], 12, { duration: 0.8 })
    }
  }, [selectedHouse])

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
}
