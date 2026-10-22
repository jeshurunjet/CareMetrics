"use client"
import type { Shift } from "../data/types"
import { useStaffData } from "../data/context"
import { shiftStatus } from "../data/selectors"
import { formatDate, formatTime } from "@/lib/time"
import { Modal, Btn, Status, useNav } from "./index"
export default function ShiftDetail({
  shift,
  onClose,
}: {
  shift: Shift
  onClose: () => void
}) {
  const s = useStaffData()
  const nav = useNav()
  const h = s.houses.find((h) => h.id === shift.houseId)!
  const t = shiftStatus(s, shift)
  const coworkers = s.shifts.filter(
    (sh) =>
      sh.houseId === shift.houseId &&
      sh.staffId !== s.meId &&
      Date.parse(sh.start) < Date.parse(shift.end) &&
      Date.parse(sh.end) > Date.parse(shift.start),
  )
  return (
    <Modal
      title="Shift details"
      subtitle={`${formatDate(shift.start)} · ${formatTime(shift.start)} – ${formatTime(shift.end)}`}
      onClose={onClose}
      footer={
        <Btn
          variant="secondary"
          onClick={() => {
            onClose()
            nav.go({ page: "house", id: h.id })
          }}
        >
          Open house
        </Btn>
      }
    >
      <dl className="cm-dl">
        <div>
          <dt>Status</dt>
          <dd>
            <Status tone={t.tone}>{t.label}</Status>
          </dd>
        </div>
        <div>
          <dt>House</dt>
          <dd>{h.name}</dd>
        </div>
        <div>
          <dt>Address</dt>
          <dd>{h.address}</dd>
        </div>
        <div>
          <dt>Assigned by</dt>
          <dd>{shift.assignedBy}</dd>
        </div>
        <div>
          <dt>Clock in / out</dt>
          <dd>Not recorded · development preview</dd>
        </div>
        <div>
          <dt>Coworkers</dt>
          <dd>
            {coworkers
              .map((sh) => s.staff.find((e) => e.id === sh.staffId)?.name)
              .join(", ") || "None scheduled"}
          </dd>
        </div>
      </dl>
    </Modal>
  )
}
