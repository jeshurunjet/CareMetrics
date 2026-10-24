"use client"
import type { HouseSummary } from "../read/types"
import { useStaffData } from "../data/context"
import { staffQueries } from "../data/queries"
import { highlightedShift, isCurrent } from "../data/selectors"
import { PageHeader, Card, Status, Icon, Empty, useNav } from "./index"
import SourcePhoto from "./SourcePhoto"
export default function HouseList() {
  const s = useStaffData()
  const hl = highlightedShift(s)
  const houses = staffQueries.getHouses(s)
  return (
    <HouseListView
      houses={houses.map((h) => ({
        ...h,
        clientCount: staffQueries.getClientsByHouse(s, h.id).length,
      }))}
      currentHouseId={hl && isCurrent(s, hl) ? hl.houseId : undefined}
    />
  )
}
export function HouseListView({
  houses,
  currentHouseId,
  backend = false,
}: {
  houses: readonly HouseSummary[]
  currentHouseId?: string
  backend?: boolean
}) {
  const nav = useNav()
  return (
    <>
      <PageHeader
        title="My houses"
        subtitle="All supported-living houses you're authorised to access."
      />
      {houses.length === 0 ? (
        <Empty
          icon="house"
          title="No houses assigned"
          text={
            backend
              ? "No houses are assigned to your account. Contact management for assistance."
              : "No houses are available to this fictional employee. Contact management for assistance."
          }
        />
      ) : (
        <div className="cm-house-grid">
          {houses.map((h) => (
            <Card
              key={h.id}
              className="cm-house-card"
              onClick={() => nav.go({ page: "house", id: h.id })}
            >
              <div className="cm-house-photo">
                <SourcePhoto src={h.photo} alt={`${h.name} exterior`} />
                {currentHouseId === h.id && (
                  <Status tone="brand">Your shift today</Status>
                )}
              </div>
              <div className="cm-house-body">
                <strong>{h.name}</strong>
                <span>
                  <Icon name="pin" size={14} />
                  {h.address}
                </span>
                <span>
                  <Icon name="phone" size={14} />
                  {h.phone || "Telephone not recorded"}
                </span>
                <div className="cm-house-foot">
                  <span>
                    <Icon name="users" size={14} />
                    {h.clientCount} clients
                  </span>
                  <b>
                    Open house
                    <Icon name="chevron" size={14} />
                  </b>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
