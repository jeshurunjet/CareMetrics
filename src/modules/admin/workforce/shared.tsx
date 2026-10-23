"use client"
import Link from "next/link"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAdmin, Filters, Select, SearchInput, Pill } from "../ui/core"
import { formatDateTime } from "@/lib/time"
import { shiftStatus } from "../../staff/data/selectors"
import type { Shift } from "../../staff/data/types"
export const workforceTabs = [
  "calendar",
  "shifts",
  "attendance",
  "timesheets",
  "corrections",
]
export function useWorkforceURL(base = "/admin/roster") {
  const q = useSearchParams(),
    router = useRouter()
  return {
    q,
    change: (patch: Record<string, string>) => {
      const next = new URLSearchParams(q.toString())
      Object.entries(patch).forEach(([k, v]) =>
        v ? next.set(k, v) : next.delete(k),
      )
      router.push(`${base}?${next}`)
    },
  }
}
export function useWorkforceFilters(initialDay = "", initialStatus = "") {
  const [employee, setEmployee] = useState(""),
    [house, setHouse] = useState(""),
    [from, setFrom] = useState(initialDay),
    [to, setTo] = useState(initialDay),
    [status, setStatus] = useState(initialStatus),
    [query, setQuery] = useState("")
  return {
    employee,
    setEmployee,
    house,
    setHouse,
    from,
    setFrom,
    to,
    setTo,
    status,
    setStatus,
    query,
    setQuery,
  }
}
export type WorkforceFilters = ReturnType<typeof useWorkforceFilters>
export function FilterBar({
  f,
  statuses = [],
}: {
  f: WorkforceFilters
  statuses?: string[]
}) {
  const { data: s } = useAdmin()
  return (
    <>
      <Filters>
        <SearchInput
          value={f.query}
          onChange={f.setQuery}
          placeholder="Search employee or ID"
        />
        <Select
          label="Employee"
          value={f.employee}
          onChange={f.setEmployee}
          options={[
            { value: "", label: "All employees" },
            ...s.staff.map((e) => ({ value: e.id, label: e.name })),
          ]}
        />
        <Select
          label="House"
          value={f.house}
          onChange={f.setHouse}
          options={[
            { value: "", label: "All houses" },
            ...s.houses.map((h) => ({ value: h.id, label: h.name })),
          ]}
        />
        {statuses.length > 0 && (
          <Select
            label="Status"
            value={f.status}
            onChange={f.setStatus}
            options={[
              { value: "", label: "All statuses" },
              ...statuses.map((v) => ({ value: v, label: v })),
            ]}
          />
        )}
        <label className="ad-date-filter">
          From
          <input
            className="cm-input"
            type="date"
            value={f.from}
            onChange={(e) => f.setFrom(e.target.value)}
          />
        </label>
        <label className="ad-date-filter">
          To
          <input
            className="cm-input"
            type="date"
            value={f.to}
            onChange={(e) => f.setTo(e.target.value)}
          />
        </label>
      </Filters>
      {f.from && f.to && f.from > f.to && (
        <p role="alert">End date must be on or after start date.</p>
      )}
    </>
  )
}
export function EmployeeLink({ id }: { id: string }) {
  const { data: s } = useAdmin()
  return (
    <Link className="ad-link" href={`/admin/employees/${id}`}>
      {s.staff.find((e) => e.id === id)?.name || "Unavailable employee"}
    </Link>
  )
}
export function HouseLink({ id }: { id: string }) {
  const { data: s } = useAdmin()
  return (
    <Link className="ad-link" href={`/admin/houses/${id}`}>
      {s.houses.find((h) => h.id === id)?.name || "Unavailable house"}
    </Link>
  )
}
export function ShiftSummary({ shift: sh }: { shift: Shift }) {
  const { data: s } = useAdmin()
  return (
    <>
      <EmployeeLink id={sh.staffId} />
      <HouseLink id={sh.houseId} />
      <p>
        {formatDateTime(sh.start)} – {formatDateTime(sh.end)} · Pacific/Auckland
      </p>
      <Pill
        s={shiftStatus(s, sh).label}
        label={`Schedule: ${shiftStatus(s, sh).label}`}
      />
    </>
  )
}
export function matchesEmployee(
  f: WorkforceFilters,
  id: string,
  name: string,
  recordId: string,
) {
  return (
    (!f.employee || f.employee === id) &&
    (!f.query ||
      `${name} ${recordId}`.toLowerCase().includes(f.query.toLowerCase()))
  )
}
