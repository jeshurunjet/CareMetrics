"use client"
import { useStaffData } from "../data/context"
import { myHouses } from "../data/selectors"
import { Card, Btn, Empty, useNav } from "../ui"
export default function AssignedHouses() {
  const s = useStaffData(),
    houses = myHouses(s),
    nav = useNav()
  return (
    <Card className="cm-panel">
      <h2 className="cm-h3">Assigned houses</h2>
      {houses.length === 0 ? (
        <Empty
          icon="house"
          title="No assigned houses"
          text="Contact management about house access."
        />
      ) : (
        <div className="cm-stack">
          {houses.map((h) => (
            <div className="cm-notice-card" key={h.id}>
              <strong>{h.name}</strong>
              <span>{h.address}</span>
              <Btn
                size="sm"
                variant="ghost"
                onClick={() => nav.go({ page: "house", id: h.id })}
              >
                Open {h.name}
              </Btn>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
