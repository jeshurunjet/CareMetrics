"use client"
import { useAdmin, DataTable, Pill } from "../ui/core"
import { formatDateTime } from "@/lib/time"
import { nzDay } from "../../staff/roster/dates"
import {
  useWorkforceFilters,
  FilterBar,
  EmployeeLink,
  HouseLink,
  matchesEmployee,
  useWorkforceURL,
} from "./shared"
export default function CorrectionQueue() {
  const { data: s } = useAdmin(),
    f = useWorkforceFilters(),
    { change } = useWorkforceURL()
  const rows = s.attendanceCorrections.filter((c) => {
    const sh = s.shifts.find((sh) => sh.id === c.shiftId)
    return (
      matchesEmployee(
        f,
        c.requestingEmployeeId,
        s.staff.find((e) => e.id === c.requestingEmployeeId)?.name || "",
        c.id,
      ) &&
      (!f.house || sh?.houseId === f.house) &&
      (!f.status ||
        (c.status === "pending"
          ? "Pending Review"
          : c.status === "approved"
            ? "Approved"
            : "Rejected") === f.status) &&
      (!f.from || nzDay(c.requestedAt) >= f.from) &&
      (!f.to || nzDay(c.requestedAt) <= f.to)
    )
  })
  return (
    <>
      <FilterBar f={f} statuses={["Pending Review", "Approved", "Rejected"]} />
      <div className="ad-workforce-table ad-workforce-table--wide">
        <DataTable
          rows={rows}
          onRow={(c) => change({ correctionId: c.id })}
          cols={[
            {
              key: "id",
              label: "Request",
              render: (c) => (
                <button
                  className="ad-link"
                  onClick={() => change({ correctionId: c.id })}
                >
                  {c.id}
                </button>
              ),
            },
            {
              key: "employee",
              label: "Employee",
              render: (c) => <EmployeeLink id={c.requestingEmployeeId} />,
            },
            {
              key: "shift",
              label: "Related shift",
              render: (c) => (
                <button
                  className="ad-link"
                  onClick={() => change({ shiftId: c.shiftId })}
                >
                  {c.shiftId}
                </button>
              ),
            },
            {
              key: "house",
              label: "House",
              render: (c) => (
                <HouseLink
                  id={
                    s.shifts.find((sh) => sh.id === c.shiftId)?.houseId ||
                    "missing"
                  }
                />
              ),
            },
            {
              key: "date",
              label: "Requested",
              render: (c) => formatDateTime(c.requestedAt),
            },
            {
              key: "proposal",
              label: "Proposed correction",
              render: (c) =>
                `${
                  c.proposedClockIn
                    ? formatDateTime(c.proposedClockIn)
                    : "Clock-in unchanged"
                } / ${
                  c.proposedClockOut
                    ? formatDateTime(c.proposedClockOut)
                    : "Clock-out unchanged"
                }`,
            },
            { key: "reason", label: "Reason", render: (c) => c.reason },
            {
              key: "status",
              label: "Status",
              render: (c) => (
                <Pill
                  s={
                    c.status === "pending"
                      ? "Pending Review"
                      : c.status === "approved"
                        ? "Approved"
                        : "Rejected"
                  }
                />
              ),
            },
            {
              key: "reviewer",
              label: "Reviewer",
              render: (c) => c.decision?.reviewerName || "—",
            },
          ]}
        />
      </div>
    </>
  )
}
