"use client"
import { Panel, KV } from "../ui/core"
import type { House } from "@/modules/staff/data/types"
import PreviewMap from "@/modules/staff/ui/PreviewMap"
export default function HouseLocation({ house }: { house: House }) {
  return (
    <Panel title="Location & GPS configuration">
      <div className="ad-loc">
        <div className="ad-loc-map">
          {house.locationSet !== false && house.lat && house.lng ? (
            <PreviewMap house={house} />
          ) : (
            <p className="ad-empty-inline">Location not configured</p>
          )}
        </div>
        <div className="ad-loc-fields">
          <KV
            cols={1}
            items={[
              ["Address", house.address],
              [
                "Latitude",
                house.locationSet === false ? "Not configured" : house.lat,
              ],
              [
                "Longitude",
                house.locationSet === false ? "Not configured" : house.lng,
              ],
              [
                "Provisional radius",
                house.geofence
                  ? `${house.geofence} m · not an approved policy`
                  : "To be confirmed by the organisation",
              ],
              [
                "GPS verification",
                "Unavailable · no device location requested",
              ],
            ]}
          />
          <p className="ad-faint">
            Fictional configured coordinates only. Map tiles do not verify an
            address or attendance. No geofencing, continuous tracking or
            approved clock-out policy is implemented.
          </p>
        </div>
      </div>
    </Panel>
  )
}
