"use client"
import { useState } from "react"
import { Avatar, Btn, Empty } from "@/modules/staff/ui"
import {
  PageHead,
  Filters,
  SearchInput,
  Select,
  DataTable,
  Pill,
  useAdmin,
} from "../ui/core"
import { formatDateTime } from "@/lib/time"
export default function ClientDirectory() {
  const nav = useAdmin(),
    s = nav.data,
    [q, setQ] = useState(""),
    [house, setHouse] = useState("all"),
    [status, setStatus] = useState("all")
  const rows = s.clients.filter(
    (c) =>
      (!q ||
        `${c.name} ${c.preferred} ${c.ref}`
          .toLowerCase()
          .includes(q.toLowerCase())) &&
      (house === "all" || c.houseId === house) &&
      (status === "all" || c.status === status),
  )
  const lastDoc = (id: string) =>
    [
      ...s.diary
        .filter((d) => d.scope === "client" && d.targetId === id)
        .map((d) => d.submittedAt),
      ...s.careRecords
        .filter((r) => r.clientId === id)
        .map((r) => r.submittedAt),
    ]
      .filter((v): v is string => !!v)
      .sort()
      .pop()
  return (
    <>
      <PageHead
        title="Clients"
        sub="Client profiles, house assignment and documentation. Sensitive identifiers appear only on detail pages."
        actions={
          <Btn icon="plus" onClick={() => nav.go({ page: "client-form" })}>
            Create client
          </Btn>
        }
      />
      <Filters>
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Search client name or reference"
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
          options={[
            { value: "all", label: "Any status" },
            ...["Active", "Inactive"].map((v) => ({ value: v, label: v })),
          ]}
        />
      </Filters>
      <DataTable
        rows={rows}
        onRow={(c) => nav.go({ page: "client", id: c.id })}
        empty={<Empty title="No clients match" />}
        cols={[
          {
            key: "name",
            label: "Client",
            sort: (c) => c.name,
            render: (c) => (
              <span className="ad-cell-user">
                <Avatar name={c.name} photo={c.photo} tone={c.tone} size={32} />
                <span>
                  <b>{c.name}</b>
                  <small>Prefers “{c.preferred}”</small>
                </span>
              </span>
            ),
          },
          {
            key: "ref",
            label: "Client ref",
            render: (c) => <code className="ad-code">{c.ref}</code>,
          },
          {
            key: "house",
            label: "House",
            render: (c) => s.houses.find((h) => h.id === c.houseId)?.name,
          },
          {
            key: "status",
            label: "Status",
            render: (c) => <Pill s={c.status ?? "Active"} />,
          },
          {
            key: "doc",
            label: "Last documentation",
            render: (c) =>
              lastDoc(c.id) ? formatDateTime(lastDoc(c.id)!) : "None yet",
          },
          {
            key: "actions",
            label: "Actions",
            render: (c) => (
              <span
                className="ad-row-actions"
                onClick={(e) => e.stopPropagation()}
              >
                <Btn
                  size="sm"
                  variant="ghost"
                  onClick={() => nav.go({ page: "client", id: c.id })}
                >
                  View details
                </Btn>
                <Btn
                  size="sm"
                  variant="ghost"
                  onClick={() => nav.go({ page: "client-form", id: c.id })}
                >
                  Edit
                </Btn>
              </span>
            ),
          },
        ]}
      />
    </>
  )
}
