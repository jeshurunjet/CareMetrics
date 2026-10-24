"use client"
import Link from "next/link"
import { Panel, KV, DataTable } from "../ui/core"
import type {
  getManagementRecords,
  getManagementEmployee,
  getManagementHouse,
  getManagementClient,
} from "@/server/data/admin-read"
type Records = Awaited<ReturnType<typeof getManagementRecords>>
export function AdminReadHeader({ title }: { title: string }) {
  return (
    <header className="ad-head">
      <div className="ad-head-row">
        <div className="ad-head-title">
          <div className="ad-crumbs">
            <Link href="/admin/dashboard">Administration</Link>
          </div>
          <h1>{title}</h1>
          <p>
            Connected fictional development records · Read only. Management
            writes are future development.
          </p>
        </div>
      </div>
    </header>
  )
}
export function AdminRecordsRead({
  data,
  kind,
}: {
  data: Records
  kind: "employees" | "houses" | "clients"
}) {
  const rows = data[kind].map((row) => ({
    id: row.id,
    name: row.name,
    detail:
      "employeeCode" in row
        ? row.employeeCode
        : "address" in row
          ? row.address
          : row.houseName,
  }))
  return (
    <>
      <AdminReadHeader
        title={
          kind === "employees"
            ? "Employees"
            : kind === "houses"
              ? "Houses"
              : "Clients"
        }
      />
      <Panel>
        <DataTable
          rows={rows}
          cols={[
            {
              key: "name",
              label: "Name",
              render: (row) => (
                <Link href={`/admin/${kind}/${row.id}`}>{row.name}</Link>
              ),
            },
            {
              key: "detail",
              label:
                kind === "employees"
                  ? "Employee identifier"
                  : kind === "houses"
                    ? "Address"
                    : "Current house",
              render: (row) => row.detail,
            },
          ]}
          empty="No records available."
        />
      </Panel>
    </>
  )
}
export function AdminEmployeeRead({
  employee,
}: {
  employee: Awaited<ReturnType<typeof getManagementEmployee>>
}) {
  return (
    <>
      <AdminReadHeader title={employee.name} />
      <Panel title="Employee details">
        <KV
          items={[
            ["Identifier", employee.employeeCode],
            ["Email", employee.email],
            ["Role", employee.role],
            ["Account status", employee.status],
            [
              "Assigned houses",
              employee.assignments.length
                ? employee.assignments.map((a) => (
                    <p key={a.house.id}>
                      <Link href={`/admin/houses/${a.house.id}`}>
                        {a.house.name}
                      </Link>
                    </p>
                  ))
                : "No assigned houses",
            ],
          ]}
        />
      </Panel>
    </>
  )
}
export function AdminHouseRead({
  data,
}: {
  data: Awaited<ReturnType<typeof getManagementHouse>>
}) {
  return (
    <>
      <AdminReadHeader title={data.house.name} />
      <Panel title="House details">
        <KV
          items={[
            ["Address", data.house.address],
            ["Phone", data.house.phone],
            ["Email", data.house.email],
          ]}
        />
      </Panel>
      <Panel title="Clients">
        {data.clients.map((c) => (
          <p key={c.id}>
            <Link href={`/admin/clients/${c.id}`}>{c.name}</Link>
          </p>
        ))}
        {!data.clients.length && <p>No clients in this house.</p>}
      </Panel>
    </>
  )
}
export function AdminClientRead({
  client,
}: {
  client: Awaited<ReturnType<typeof getManagementClient>>
}) {
  return (
    <>
      <AdminReadHeader title={client.name} />
      <Panel title="Client details">
        <KV
          items={[
            ["Preferred name", client.preferred],
            [
              "Current house",
              <Link key="house" href={`/admin/houses/${client.houseId}`}>
                {client.houseName}
              </Link>,
            ],
            ["Date of birth", client.dob],
            ["Summary", client.summary],
          ]}
        />
      </Panel>
      <Panel title="Contacts / Next of kin">
        {client.contacts.map((c) => (
          <section key={c.id}>
            <h3>{c.name}</h3>
            <KV
              items={[
                ["Relationship", c.relation],
                ["Phone", c.phone],
                ["Email", c.email],
                ["Primary contact", c.primary ? "Yes" : "No"],
                ["Emergency contact", c.emergency ? "Yes" : "No"],
              ]}
            />
          </section>
        ))}
        {!client.contacts.length && <p>No NOK information available.</p>}
      </Panel>
    </>
  )
}
