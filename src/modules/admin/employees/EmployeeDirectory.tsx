"use client"
import { useState } from "react"
import { Avatar, Btn, Empty } from "@/modules/staff/ui"
import {
  PageHead,
  DataTable,
  Filters,
  SearchInput,
  Select,
  Pill,
  useAdmin,
} from "../ui/core"
import { employeeHouses, roles } from "../data/adapter"
import AssignHouses from "./AssignHouses"
export default function EmployeeDirectory() {
  const nav = useAdmin(),
    s = nav.data
  const [q, setQ] = useState(""),
    [role, setRole] = useState("all"),
    [house, setHouse] = useState("all"),
    [status, setStatus] = useState("all"),
    [assign, setAssign] = useState<string>()
  const invalid =
    (role !== "all" && !roles.includes(role)) ||
    (house !== "all" && !s.houses.some((h) => h.id === house)) ||
    !["all", "Active", "Inactive", "Invited"].includes(status)
  const rows = invalid
    ? []
    : s.staff.filter(
        (e) =>
          (!q ||
            `${e.name} ${e.email} ${e.employeeId}`
              .toLowerCase()
              .includes(q.toLowerCase())) &&
          (role === "all" || e.role === role) &&
          (house === "all" || employeeHouses(s, e.id).includes(house)) &&
          (status === "all" || (e.status ?? "Active") === status),
      )
  return (
    <>
      <PageHead
        title="Employees"
        sub={`${s.staff.length} development records · no real accounts or invitations are created.`}
        actions={
          <Btn icon="plus" onClick={() => nav.go({ page: "employee-form" })}>
            Create employee
          </Btn>
        }
      />
      <Filters>
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Search name, email or employee ID"
        />
        <Select
          label="Role"
          value={role}
          onChange={setRole}
          options={[
            { value: "all", label: "All roles" },
            ...roles.map((r) => ({ value: r, label: r })),
          ]}
        />
        <Select
          label="House"
          value={house}
          onChange={setHouse}
          options={[
            { value: "all", label: "All houses" },
            ...s.houses.map((h) => ({ value: h.id, label: h.name })),
          ]}
        />
        <Select
          label="Status"
          value={status}
          onChange={setStatus}
          options={["all", "Active", "Invited", "Inactive"].map((r) => ({
            value: r,
            label: r === "all" ? "Any status" : r,
          }))}
        />
      </Filters>
      {invalid && <p role="alert">Invalid filter state. Clear the filters.</p>}
      <DataTable
        rows={rows}
        onRow={(r) => nav.go({ page: "employee", id: r.id })}
        empty={
          <Empty
            title={
              s.staff.length
                ? "No employees match your filters"
                : "No employees"
            }
            action={
              <Btn
                variant="secondary"
                onClick={() => {
                  setQ("")
                  setRole("all")
                  setHouse("all")
                  setStatus("all")
                }}
              >
                Clear filters
              </Btn>
            }
          />
        }
        cols={[
          {
            key: "name",
            label: "Employee",
            sort: (r) => r.name,
            render: (r) => (
              <span className="ad-cell-user">
                <Avatar name={r.name} photo={r.photo} size={32} />
                <span>
                  <b>{r.name}</b>
                  <small>{r.email}</small>
                </span>
              </span>
            ),
          },
          {
            key: "id",
            label: "Employee ID",
            sort: (r) => r.employeeId,
            render: (r) => <code className="ad-code">{r.employeeId}</code>,
          },
          { key: "role", label: "Role", render: (r) => r.role },
          {
            key: "houses",
            label: "Assigned houses",
            render: (r) => (
              <span className="ad-chips">
                {employeeHouses(s, r.id).map((id) => (
                  <span className="ad-chip" key={id}>
                    {s.houses.find((h) => h.id === id)?.name}
                  </span>
                ))}
              </span>
            ),
          },
          {
            key: "status",
            label: "Status",
            render: (r) => <Pill s={r.status ?? "Active"} />,
          },
          {
            key: "actions",
            label: "Actions",
            render: (r) => (
              <span
                className="ad-row-actions"
                onClick={(e) => e.stopPropagation()}
              >
                <Btn
                  size="sm"
                  variant="ghost"
                  onClick={() => nav.go({ page: "employee", id: r.id })}
                >
                  View details
                </Btn>
                <Btn
                  size="sm"
                  variant="ghost"
                  disabled={
                    nav.role !== "Administrator" && r.role === "Administrator"
                  }
                  onClick={() => nav.go({ page: "employee-form", id: r.id })}
                >
                  Edit
                </Btn>
                <Btn size="sm" variant="ghost" onClick={() => setAssign(r.id)}>
                  Houses
                </Btn>
              </span>
            ),
          },
        ]}
      />
      {assign && (
        <AssignHouses
          employeeId={assign}
          onClose={() => setAssign(undefined)}
        />
      )}
    </>
  )
}
