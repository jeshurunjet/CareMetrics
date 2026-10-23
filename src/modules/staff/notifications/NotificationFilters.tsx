"use client"
import SearchInput from "../ui/SearchInput"
import type { NotificationFilters as Filters } from "./adapter"
export default function NotificationFilters({
  value,
  onChange,
  concerns,
  contextLocked = false,
}: {
  value: Filters
  onChange: (f: Filters) => void
  concerns: boolean
  contextLocked?: boolean
}) {
  return (
    <div className="cm-notification-filters cm-mb">
      <SearchInput
        label={concerns ? "Search own concerns" : "Search notifications"}
        placeholder="Search…"
        value={value.search ?? ""}
        onChange={(search) => onChange({ ...value, search })}
      />
      {concerns ? (
        <>
          <label>
            Status
            <select
              className="cm-input"
              aria-label="Concern status"
              value={value.status ?? ""}
              onChange={(e) => onChange({ ...value, status: e.target.value })}
            >
              <option value="">All statuses</option>
              {["Submitted", "Under Review", "Resolved", "Closed"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Context
            <select
              className="cm-input"
              aria-label="History context"
              disabled={contextLocked}
              value={value.context ?? ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  context: e.target.value,
                  targetId: undefined,
                })
              }
            >
              <option value="">All contexts</option>
              <option value="client">Client</option>
              <option value="house">House</option>
            </select>
          </label>
        </>
      ) : (
        <label>
          Read state
          <select
            className="cm-input"
            aria-label="Notification read filter"
            value={value.unread ? "unread" : "all"}
            onChange={(e) =>
              onChange({ ...value, unread: e.target.value === "unread" })
            }
          >
            <option value="all">All notices</option>
            <option value="unread">Unread only</option>
          </select>
        </label>
      )}
      <label>
        From
        <input
          className="cm-input"
          type="date"
          aria-label="Notifications from"
          value={value.from ?? ""}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
        />
      </label>
      <label>
        To
        <input
          className="cm-input"
          type="date"
          aria-label="Notifications to"
          value={value.to ?? ""}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
        />
      </label>
    </div>
  )
}
