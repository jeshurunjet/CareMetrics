"use client"
import type { Shift } from "../data/types"
import { useStaffData } from "../data/context"
import { shiftStatus } from "../data/selectors"
import { formatTime, dayNumber, weekday, formatDate } from "@/lib/time"
import { Card, Status, Icon } from "./index"
export default function ShiftCard({
  shift: sh,
  highlighted,
  onClick,
}: {
  shift: Shift
  highlighted: boolean
  onClick: () => void
}) {
  const s = useStaffData()
  const h = s.houses.find((x) => x.id === sh.houseId)!
  const t = shiftStatus(s, sh)
  return (
    <div data-testid="shift-row" data-highlighted={highlighted}>
      <Card
        className={`cm-shift-row ${highlighted ? "cm-shift-row--hl" : ""}`}
        onClick={onClick}
      >
        <div className="cm-date-chip">
          <b>{dayNumber(sh.start)}</b>
          <span>{weekday(sh.start)}</span>
        </div>
        <div className="cm-grow">
          <strong>
            {formatTime(sh.start)} – {formatTime(sh.end)}
          </strong>
          <span>{h.name}</span>
          <small>
            {formatDate(sh.start)} · Assigned by {sh.assignedBy}
          </small>
        </div>
        <Status tone={t.tone}>{t.label}</Status>
        <Icon name="chevron" size={16} />
      </Card>
    </div>
  )
}
