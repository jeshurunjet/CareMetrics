"use client"
import SourcePhoto from "@/modules/staff/ui/SourcePhoto"
import { housePhoto } from "@/lib/demo-media"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  PageHead,
  Filters,
  SearchInput,
  Select,
  DataTable,
  Pill,
} from "../ui/core"
import { Btn, Avatar, Empty, Icon } from "@/modules/staff/ui"
import Pagination from "@/modules/staff/ui/Pagination"
import type { managementDirectory } from "@/server/admin/read"
import { roleNames, statusNames } from "./client"
export type DirectoryData = Awaited<ReturnType<typeof managementDirectory>>
interface Props {
  data: DirectoryData
  kind: "employees" | "houses" | "clients"
}
export default function ManagementDirectory({ data, kind }: Props) {
  const router = useRouter(),
    [q, setQ] = useState(""),
    [status, setStatus] = useState("all"),
    [role, setRole] = useState("all"),
    [house, setHouse] = useState("all"),
    [view, setView] = useState("cards"),
    [page, setPage] = useState(1)
  const title =
      kind === "employees"
        ? "Employees"
        : kind === "houses"
          ? "Houses"
          : "Clients",
    singular =
      kind === "employees" ? "employee" : kind === "houses" ? "house" : "client"
  const term = q.trim().toLowerCase()
  const rows = data[kind]
    .map((row) => {
      const employee = "employeeCode" in row,
        location = "address" in row
      return {
        id: row.id,
        name: row.name,
        status: employee
          ? statusNames[row.status]
          : row.active
            ? "Active"
            : "Inactive",
        detail: employee
          ? row.employeeCode
          : location
            ? row.address
            : row.reference,
        email: employee ? row.email : "",
        role: employee ? roleNames[row.role] : "",
        houseIds: employee
          ? row.assignments.map((a) => a.house.id)
          : location
            ? []
            : [row.houseId],
        houseNames: employee
          ? row.assignments.map((a) => a.house.name).join(", ")
          : location
            ? ""
            : row.house.name,
        clients: location ? row._count.clients : 0,
        staff: location ? row._count.assignments : 0,
        code: location ? row.code : "",
        photo: location ? housePhoto(row.imageKey) : undefined,
      }
    })
    .filter(
      (r) =>
        (!term ||
          `${r.name} ${r.detail} ${r.email}`.toLowerCase().includes(term)) &&
        (status === "all" || r.status === status) &&
        (role === "all" || r.role === role) &&
        (house === "all" || r.houseIds.includes(house)),
    )
  return (
    <>
      <PageHead
        title={title}
        sub={
          kind === "houses"
            ? "Supported-living houses, their locations and assignments."
            : kind === "clients"
              ? "Client profiles, house assignment and contacts. Sensitive information is restricted to details."
              : "Employee records, account status and house assignments. New accounts require separate credential activation."
        }
        actions={
          <Btn icon="plus" onClick={() => router.push(`/admin/${kind}/new`)}>
            Create {singular}
          </Btn>
        }
      />
      <Filters>
        <SearchInput
          value={q}
          onChange={(v) => {
            setQ(v)
            setPage(1)
          }}
          placeholder={
            kind === "employees"
              ? "Search name, email or employee ID"
              : kind === "houses"
                ? "Search houses"
                : "Search client name or reference"
          }
        />
        {kind === "employees" && (
          <Select
            label="Role"
            value={role}
            onChange={setRole}
            options={[
              { value: "all", label: "All roles" },
              ...Object.values(roleNames).map((r) => ({ value: r, label: r })),
            ]}
          />
        )}
        {kind !== "houses" && (
          <Select
            label="House"
            value={house}
            onChange={setHouse}
            options={[
              { value: "all", label: "All houses" },
              ...data.houses.map((h) => ({ value: h.id, label: h.name })),
            ]}
          />
        )}
        <Select
          label="Status"
          value={status}
          onChange={(v) => {
            setStatus(v)
            setPage(1)
          }}
          options={[
            { value: "all", label: "Any status" },
            ...[
              "Active",
              "Inactive",
              ...(kind === "employees" ? ["Invited"] : []),
            ].map((s) => ({ value: s, label: s })),
          ]}
        />
        {kind === "houses" && (
          <div className="ad-seg" role="group" aria-label="View">
            <button
              className={view === "cards" ? "active" : ""}
              onClick={() => setView("cards")}
            >
              <Icon name="layers" size={14} />
              Cards
            </button>
            <button
              className={view === "list" ? "active" : ""}
              onClick={() => setView("list")}
            >
              <Icon name="menu" size={14} />
              List
            </button>
          </div>
        )}
      </Filters>
      {kind === "houses" && view === "cards" ? (
        <>
          <div className="ad-card-grid ad-card-grid--3">
            {rows.slice((page - 1) * 9, page * 9).map((r) => (
              <button
                className="ad-house-card"
                key={r.id}
                onClick={() => router.push(`/admin/houses/${r.id}`)}
              >
                <div className="ad-house-card-img">
                  <SourcePhoto
                    src={r.photo}
                    alt="Illustrative residential exterior; not the fictional address"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <Pill s={r.status} />
                </div>
                <div className="ad-house-card-body">
                  <span className="ad-code">{r.code}</span>
                  <strong>{r.name}</strong>
                  <span>{r.detail}</span>
                  <div className="ad-house-card-meta">
                    <span>{r.clients} clients</span>
                    <span>{r.staff} staff</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
          {!rows.length && <Empty title="No houses found" />}
          <Pagination
            page={page}
            total={rows.length}
            per={9}
            onChange={setPage}
          />
        </>
      ) : (
        <DataTable
          rows={rows}
          onRow={(r) => router.push(`/admin/${kind}/${r.id}`)}
          empty={<Empty title={`No ${kind} match`} />}
          cols={[
            {
              key: "name",
              label: singular.charAt(0).toUpperCase() + singular.slice(1),
              sort: (r) => r.name,
              render: (r) => (
                <span className="ad-cell-user">
                  <Avatar
                    name={r.name}
                    recordId={kind === "houses" ? undefined : r.id}
                    size={32}
                  />
                  <span>
                    <Link href={`/admin/${kind}/${r.id}`}>
                      <b>{r.name}</b>
                    </Link>
                    {r.email && <small>{r.email}</small>}
                  </span>
                </span>
              ),
            },
            {
              key: "identifier",
              label:
                kind === "employees"
                  ? "Employee ID"
                  : kind === "clients"
                    ? "Client ref"
                    : "Address",
              render: (r) => (
                <span className={kind === "houses" ? "" : "ad-code"}>
                  {r.detail}
                </span>
              ),
            },
            ...(kind === "employees"
              ? [
                  {
                    key: "role",
                    label: "Role",
                    render: (r: typeof rows[number]) => r.role,
                  },
                ]
              : []),
            {
              key: "house",
              label:
                kind === "houses" ? "Clients / Staff" : "House assignments",
              render: (r) =>
                kind === "houses"
                  ? `${r.clients} clients · ${r.staff} staff`
                  : r.houseNames || "Unassigned",
            },
            {
              key: "status",
              label: "Status",
              render: (r) => <Pill s={r.status} />,
            },
            {
              key: "actions",
              label: "Actions",
              render: (r) => (
                <Btn
                  size="sm"
                  variant="ghost"
                  onClick={() => router.push(`/admin/${kind}/${r.id}`)}
                >
                  View
                </Btn>
              ),
            },
          ]}
        />
      )}
    </>
  )
}
