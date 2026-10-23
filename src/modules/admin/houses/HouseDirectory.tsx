"use client"
import Image from "next/image"
import { useState } from "react"
import { Btn, Empty, Icon } from "@/modules/staff/ui"
import {
  PageHead,
  Filters,
  SearchInput,
  Select,
  DataTable,
  Pill,
  useAdmin,
} from "../ui/core"
export default function HouseDirectory() {
  const nav = useAdmin(),
    s = nav.data,
    [q, setQ] = useState(""),
    [status, setStatus] = useState("all"),
    [view, setView] = useState("cards"),
    [page, setPage] = useState(1)
  const rows = s.houses.filter(
      (h) =>
        (!q ||
          `${h.name} ${h.address} ${h.code}`
            .toLowerCase()
            .includes(q.toLowerCase())) &&
        (status === "all" || h.status === status),
    ),
    count = (id: string) => s.assignments.filter((a) => a.houseId === id).length
  return (
    <>
      <PageHead
        title="Houses"
        sub="Supported-living houses, their locations and assignments."
        actions={
          <Btn icon="plus" onClick={() => nav.go({ page: "house-form" })}>
            Create house
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
          placeholder="Search houses"
        />
        <Select
          label="Status"
          value={status}
          onChange={(v) => {
            setStatus(v)
            setPage(1)
          }}
          options={[
            { value: "all", label: "Any status" },
            ...["Active", "Inactive"].map((v) => ({ value: v, label: v })),
          ]}
        />
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
      </Filters>
      {!rows.length ? (
        <Empty
          title="No houses found"
          text="Adjust your search or create a development house."
        />
      ) : view === "cards" ? (
        <>
          <div className="ad-card-grid ad-card-grid--3">
            {rows.slice((page - 1) * 9, page * 9).map((h) => (
              <button
                key={h.id}
                className="ad-house-card"
                onClick={() => nav.go({ page: "house", id: h.id })}
              >
                <div className="ad-house-card-img">
                  <Image
                    unoptimized
                    width={1080}
                    height={720}
                    src={h.photo}
                    alt=""
                  />
                  <Pill s={h.status ?? "Active"} />
                </div>
                <div className="ad-house-card-body">
                  <span className="ad-code">{h.code}</span>
                  <strong>{h.name}</strong>
                  <span>{h.address}</span>
                  <div className="ad-house-card-meta">
                    <span>
                      <Icon name="user" size={13} />
                      {s.clients.filter((c) => c.houseId === h.id).length}{" "}
                      clients
                    </span>
                    <span>
                      <Icon name="users" size={13} />
                      {count(h.id)} staff
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
          {rows.length > 9 && (
            <div className="ad-row-actions">
              <Btn disabled={page === 1} onClick={() => setPage(page - 1)}>
                Previous houses
              </Btn>
              <span>Page {page}</span>
              <Btn
                disabled={page * 9 >= rows.length}
                onClick={() => setPage(page + 1)}
              >
                Next houses
              </Btn>
            </div>
          )}
        </>
      ) : (
        <DataTable
          rows={rows}
          onRow={(h) => nav.go({ page: "house", id: h.id })}
          cols={[
            {
              key: "name",
              label: "House",
              sort: (h) => h.name,
              render: (h) => (
                <span className="ad-cell-user">
                  <Image
                    unoptimized
                    width={1080}
                    height={720}
                    className="ad-thumb"
                    src={h.photo}
                    alt=""
                  />
                  <span>
                    <b>{h.name}</b>
                    <small>{h.code}</small>
                  </span>
                </span>
              ),
            },
            { key: "address", label: "Address", render: (h) => h.address },
            {
              key: "clients",
              label: "Clients",
              render: (h) => s.clients.filter((c) => c.houseId === h.id).length,
            },
            { key: "staff", label: "Employees", render: (h) => count(h.id) },
            {
              key: "status",
              label: "Status",
              render: (h) => <Pill s={h.status ?? "Active"} />,
            },
            {
              key: "actions",
              label: "Actions",
              render: (h) => (
                <span
                  className="ad-row-actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Btn
                    size="sm"
                    variant="ghost"
                    onClick={() => nav.go({ page: "house", id: h.id })}
                  >
                    View details
                  </Btn>
                  <Btn
                    size="sm"
                    variant="ghost"
                    onClick={() => nav.go({ page: "house-form", id: h.id })}
                  >
                    Edit
                  </Btn>
                </span>
              ),
            },
          ]}
        />
      )}
    </>
  )
}
