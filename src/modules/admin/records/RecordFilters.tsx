"use client"
import { useState } from "react"
import { useAdmin, Filters, Select, SearchInput } from "../ui/core"
import type { SubmittedRecord } from "./adapter"
import { nzDay } from "../../staff/roster/dates"
export function useRecordFilters() {
  const [type, setType] = useState(""),
    [house, setHouse] = useState(""),
    [client, setClient] = useState(""),
    [author, setAuthor] = useState(""),
    [category, setCategory] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState("")
  return {
    type,
    setType,
    house,
    setHouse,
    client,
    setClient,
    author,
    setAuthor,
    category,
    setCategory,
    from,
    setFrom,
    to,
    setTo,
    query,
    setQuery,
    status,
    setStatus,
  }
}
export type RecordFilters = ReturnType<typeof useRecordFilters>
export function matchesRecord(
  r: SubmittedRecord,
  f: RecordFilters,
  text: string,
  at = r.coveredAt,
) {
  return (
    (!f.type || r.type === f.type) &&
    (!f.house || r.houseId === f.house) &&
    (!f.client || r.clientId === f.client) &&
    (!f.author || r.authorId === f.author) &&
    (!f.category || r.categoryKey === f.category) &&
    (!f.query || text.toLowerCase().includes(f.query.trim().toLowerCase())) &&
    (!f.from || nzDay(at) >= f.from) &&
    (!f.to || nzDay(at) <= f.to) &&
    (!f.from || !f.to || f.from <= f.to)
  )
}
export default function RecordFilterBar({
  f,
  records,
  requests = false,
}: {
  f: RecordFilters
  records: SubmittedRecord[]
  requests?: boolean
}) {
  const { data: s } = useAdmin()
  const options = (
    label: string,
    rows: Array<{
      id: string
      name: string
    }>,
  ) => [
    { value: "", label },
    ...rows.map((x) => ({ value: x.id, label: x.name })),
  ]
  const categories = Array.from(
    new Map(
      records.map((r) => [
        r.categoryKey,
        { id: r.categoryKey, name: r.category },
      ]),
    ).values(),
  )
  return (
    <>
      <Filters>
        <SearchInput
          label={
            requests ? "Search correction requests" : "Search submitted records"
          }
          placeholder={requests ? "Search requests" : "Search records"}
          value={f.query}
          onChange={f.setQuery}
        />
        <Select
          label="Record type"
          value={f.type}
          onChange={f.setType}
          options={[
            { value: "", label: "All types" },
            ...["Client Diary", "House Diary", "Care Plan", "Charting"].map(
              (value) => ({ value, label: value }),
            ),
          ]}
        />
        <Select
          label="House"
          value={f.house}
          onChange={f.setHouse}
          options={options("All houses", s.houses)}
        />
        <Select
          label="Client"
          value={f.client}
          onChange={f.setClient}
          options={options(
            "All clients",
            s.clients.filter((c) => !f.house || c.houseId === f.house),
          )}
        />
        <Select
          label={requests ? "Requesting employee" : "Author"}
          value={f.author}
          onChange={f.setAuthor}
          options={options(
            "All authors",
            s.staff.filter((e) => records.some((r) => r.authorId === e.id)),
          )}
        />
        {!requests && (
          <>
            <Select
              label="Category / template"
              value={f.category}
              onChange={f.setCategory}
              options={options("All categories / templates", categories)}
            />
            <Select
              label="Correction status"
              value={f.status}
              onChange={f.setStatus}
              options={[
                "",
                "None",
                "Pending Review",
                "Approved",
                "Rejected",
              ].map((value) => ({
                value,
                label: value || "Any correction status",
              }))}
            />
          </>
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
      <p className="ad-faint">
        Dates filter {requests ? "request" : "covered"} time in
        Pacific/Auckland.
      </p>
      {f.from && f.to && f.from > f.to && (
        <p role="alert">End date must be on or after start date.</p>
      )}
    </>
  )
}
