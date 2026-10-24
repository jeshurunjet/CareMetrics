"use client"
import { useState } from "react"
import { Filters, SearchInput, Select, useAdmin } from "../ui/core"
import { nzDay } from "../../staff/roster/dates"
export function useFilters() {
  const [query, setQuery] = useState(""),
    [client, setClient] = useState(""),
    [house, setHouse] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState("")
  return {
    query,
    setQuery,
    client,
    setClient,
    house,
    setHouse,
    from,
    setFrom,
    to,
    setTo,
  }
}
export function matches(
  f: ReturnType<typeof useFilters>,
  text: string,
  at: string,
  client?: string,
  house?: string,
) {
  return (
    (!f.query || text.toLowerCase().includes(f.query.trim().toLowerCase())) &&
    (!f.client || f.client === client) &&
    (!f.house || f.house === house) &&
    (!f.from || nzDay(at) >= f.from) &&
    (!f.to || nzDay(at) <= f.to) &&
    (!f.from || !f.to || f.from <= f.to)
  )
}
export default function ContextFilters({
  f,
  label,
  children,
}: {
  f: ReturnType<typeof useFilters>
  label: string
  children?: React.ReactNode
}) {
  const { data: s } = useAdmin()
  return (
    <>
      <Filters>
        <SearchInput
          label={label}
          placeholder={label}
          value={f.query}
          onChange={f.setQuery}
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
        <Select
          label="Client"
          value={f.client}
          onChange={f.setClient}
          options={[
            { value: "", label: "All clients" },
            ...s.clients
              .filter((c) => !f.house || c.houseId === f.house)
              .map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
        {children}
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
