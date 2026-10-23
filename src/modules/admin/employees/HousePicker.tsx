"use client"
import { useState } from "react"
import SearchInput from "@/modules/staff/ui/SearchInput"
import { Icon } from "@/modules/staff/ui"
import { useAdmin } from "../ui/core"
export default function HousePicker({
  value,
  onChange,
}: {
  value: string[]
  onChange: (value: string[]) => void
}) {
  const { data: s } = useAdmin(),
    [q, setQ] = useState("")
  const opts = s.houses.filter((h) =>
    h.name.toLowerCase().includes(q.toLowerCase()),
  )
  return (
    <div className="ad-picker">
      <div className="ad-chips">
        {value.length ? (
          value.map((id) => (
            <span className="ad-chip ad-chip--rm" key={id}>
              {s.houses.find((h) => h.id === id)?.name}
              <button
                type="button"
                onClick={() => onChange(value.filter((h) => h !== id))}
                aria-label={`Remove ${s.houses.find((h) => h.id === id)?.name}`}
              >
                <Icon name="x" size={12} />
              </button>
            </span>
          ))
        ) : (
          <span className="ad-faint">No houses assigned</span>
        )}
      </div>
      <SearchInput
        value={q}
        onChange={setQ}
        placeholder="Search houses to assign"
      />
      <div className="ad-picker-list">
        {opts.map((h) => (
          <label key={h.id}>
            <input
              type="checkbox"
              checked={value.includes(h.id)}
              onChange={(e) =>
                onChange(
                  e.target.checked
                    ? [...value, h.id]
                    : value.filter((id) => id !== h.id),
                )
              }
            />
            <span>
              <b>{h.name}</b>
              <small>
                {h.address}
                {h.status === "Inactive" ? " · Inactive" : ""}
              </small>
            </span>
            <span className="ad-faint">
              {s.clients.filter((c) => c.houseId === h.id).length} clients
            </span>
          </label>
        ))}
        {!opts.length && <p>No houses match.</p>}
      </div>
    </div>
  )
}
