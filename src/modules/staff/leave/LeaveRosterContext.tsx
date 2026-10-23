import Link from "next/link"
import { useStaffData } from "../data/context"
import { getLeaveRosterContext } from "./adapter"
import { formatDate } from "../../../lib/time"
import { shiftTime } from "../roster/dates"
export default function LeaveRosterContext({
  start,
  end,
}: {
  start: string
  end: string
}) {
  const s = useStaffData(),
    shifts = getLeaveRosterContext(s, start, end)
  return (
    <section
      className="cm-stack cm-leave-roster"
      aria-label="Relevant roster context"
    >
      <h3 className="cm-h3">Roster context</h3>
      <p className="cm-muted">
        {shifts.length} scheduled shifts overlap this period. Leave requests do
        not change shifts or attendance. Contact management about roster
        changes.
      </p>
      {shifts.length > 0 && (
        <ul>
          {shifts.map((sh) => (
            <li key={sh.id}>
              <Link href={`/roster?shiftId=${sh.id}`}>
                {formatDate(sh.start)} · {shiftTime(sh.start, sh.end)} ·{" "}
                {s.houses.find((h) => h.id === sh.houseId)?.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
