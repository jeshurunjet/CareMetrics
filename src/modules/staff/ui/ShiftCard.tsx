"use client"
import { shiftTime } from "../roster/dates"
import { attendanceStatus } from "../roster/adapter"
import type { Shift } from "../data/types"
import { useStaffData } from "../data/context"
import { shiftStatus } from "../data/selectors"
import { dayNumber, weekday, formatDate } from "@/lib/time"
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
    <ShiftCardView
      shift={sh}
      houseName={h.name}
      status={t}
      attendanceLabel={attendanceStatus(s, sh.id)}
      highlighted={highlighted}
      onClick={onClick}
    />
  )
}
interface CardScheduleStatus {
  tone: import("./Status").Tone
  label: string
}
interface ShiftCardProps {
  shift: Shift
  houseName: string
  status: CardScheduleStatus
  attendanceLabel: string
  highlighted: boolean
  onClick: () => void
}
export function ShiftCardView({
  shift: sh,
  houseName,
  status: t,
  attendanceLabel,
  highlighted,
  onClick,
}: ShiftCardProps) {
  return (
    <div
      data-testid="shift-row"
      data-shift-id={sh.id}
      data-highlighted={highlighted}
    >
      <Card
        className={`cm-shift-row ${highlighted ? "cm-shift-row--hl" : ""}`}
        onClick={onClick}
      >
        <div className="cm-date-chip">
          <b>{dayNumber(sh.start)}</b>
          <span>{weekday(sh.start)}</span>
        </div>
        <div className="cm-grow">
          <strong>{shiftTime(sh.start, sh.end)}</strong>
          <span>{houseName}</span>
          <small>
            {formatDate(sh.start)} · Assigned by {sh.assignedBy}
          </small>
          <small>{attendanceLabel}</small>
        </div>
        <Status tone={t.tone}>{t.label}</Status>
        <Icon name="chevron" size={16} />
      </Card>
    </div>
  )
}
