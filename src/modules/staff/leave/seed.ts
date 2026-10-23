import type { LeaveType, LeaveRequest, LeaveBalance } from "./types"
import { addDays, nzDay } from "../roster/dates"
export const leaveTypes: LeaveType[] = [
  { id: "annual", name: "Annual leave", active: true },
  { id: "sick", name: "Sick leave", active: true },
  { id: "bereavement", name: "Bereavement leave", active: true },
  { id: "alternative", name: "Alternative holiday", active: true },
  { id: "unpaid", name: "Unpaid leave", active: true },
  { id: "legacy", name: "Other leave (archived)", active: false },
]
export function seedLeave(now: string) {
  const day = nzDay(now),
    date = (offset: number) => addDays(day, offset),
    submitted = (hours: number) =>
      new Date(Date.parse(now) + hours * 3600000).toISOString()
  const requests: LeaveRequest[] = [
    {
      id: "leave-pending",
      employeeId: "s1",
      typeId: "annual",
      start: date(7),
      end: date(9),
      notes:
        "Fictional request awaiting review. No manager has received this development request.",
      submittedAt: submitted(-1),
      status: "pending",
    },
    {
      id: "leave-approved",
      employeeId: "s1",
      typeId: "annual",
      start: date(1),
      end: date(2),
      notes: "Fictional upcoming absence. Scheduled shifts remain unchanged.",
      submittedAt: submitted(-48),
      status: "approved",
      decision: {
        reviewerName: "Mere Walker (demo)",
        decidedAt: submitted(-24),
        notes: "Fictional approval fixture for UI review only.",
      },
    },
    {
      id: "leave-rejected",
      employeeId: "s1",
      typeId: "unpaid",
      start: date(4),
      end: date(4),
      notes: "Fictional example of a rejected request.",
      submittedAt: submitted(-72),
      status: "rejected",
      decision: {
        reviewerName: "Mere Walker (demo)",
        decidedAt: submitted(-25),
        notes:
          "Fictional management response: please discuss alternative dates. This is not a real staffing decision.",
      },
    },
    ...Array.from(
      { length: 5 },
      (_, i): LeaveRequest => ({
        id: `leave-history-${i + 1}`,
        employeeId: "s1",
        typeId: i === 4 ? "legacy" : i % 2 ? "sick" : "annual",
        start: date(-15 - i * 3),
        end: date(-14 - i * 3),
        notes:
          i === 0
            ? "Long fictional note for responsive review. ".repeat(12)
            : "Fictional historical leave request.",
        submittedAt: submitted(-120 - i * 24),
        status: i % 2 ? "rejected" : "approved",
        decision: {
          reviewerName: "Mere Walker (demo)",
          decidedAt: submitted(-96 - i * 24),
          notes: "Historical demonstration decision; not payroll verified.",
        },
      }),
    ),
    {
      id: "leave-other-employee",
      employeeId: "s2",
      typeId: "sick",
      start: date(3),
      end: date(3),
      notes: "Private coworker leave example",
      submittedAt: submitted(-2),
      status: "pending",
    },
    {
      id: "leave-restricted",
      employeeId: "s4",
      typeId: "annual",
      start: date(5),
      end: date(6),
      notes: "Restricted leave history example",
      submittedAt: submitted(-3),
      status: "approved",
    },
  ]
  const balances: LeaveBalance[] = [
    { employeeId: "s1", typeId: "annual", value: 12, unit: "days", asOf: now },
    { employeeId: "s1", typeId: "sick", value: 8, unit: "days", asOf: now },
    { employeeId: "s2", typeId: "annual", value: 6.5, unit: "days", asOf: now },
  ]
  return { requests, balances }
}
