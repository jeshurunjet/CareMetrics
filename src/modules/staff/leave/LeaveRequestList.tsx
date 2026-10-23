"use client"
import { useState } from "react"
import { useStaffData } from "../data/context"
import { queryLeaveHistory } from "./adapter"
import { Empty, SectionTitle } from "../ui"
import Select from "../ui/Select"
import SearchInput from "../ui/SearchInput"
import Pagination from "../ui/Pagination"
import LeaveRequestCard from "./LeaveRequestCard"
export default function LeaveRequestList() {
  const s = useStaffData(),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState(""),
    [type, setType] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [page, setPage] = useState(1),
    history = queryLeaveHistory(s, query, status, type, from, to, page)
  return (
    <section className="cm-stack" aria-label="Leave history">
      <SectionTitle title="Request history" count={history.total} />
      <p className="cm-muted">
        Recent requests · newest submission first. Date filters match any
        requested dates in the range.
      </p>
      <div className="cm-toolbar">
        <SearchInput
          label="Search own leave requests"
          placeholder="Search leave type or notes"
          value={query}
          onChange={(v) => {
            setQuery(v)
            setPage(1)
          }}
        />
        <Select
          label="Leave status"
          value={status}
          onChange={(v) => {
            setStatus(v)
            setPage(1)
          }}
          options={[
            { value: "", label: "All statuses" },
            { value: "pending", label: "Pending Review" },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" },
          ]}
        />
        <Select
          label="History leave type"
          value={type}
          onChange={(v) => {
            setType(v)
            setPage(1)
          }}
          options={[
            { value: "", label: "All leave types" },
            ...s.leaveTypes.map((t) => ({ value: t.id, label: t.name })),
          ]}
        />
      </div>
      <div className="cm-toolbar">
        {(["from", "to"] as const).map((key) => (
          <label className="cm-filter cm-leave-date-filter" key={key}>
            {key === "from" ? "From" : "To"}
            <input
              aria-label={`Leave history ${key}`}
              className="cm-input"
              type="date"
              value={key === "from" ? from : to}
              onChange={(e) => {
                ;(key === "from" ? setFrom : setTo)(e.target.value)
                setPage(1)
              }}
            />
          </label>
        ))}
      </div>
      {from && to && from > to && (
        <p className="cm-error" role="alert">
          End date must be on or after start date.
        </p>
      )}
      {!history.total ? (
        <Empty
          icon="umbrella"
          title="No leave requests"
          text="No requests match this employee and these filters."
        />
      ) : (
        <div className="cm-list">
          {history.items.map((r) => (
            <LeaveRequestCard key={r.id} request={r} />
          ))}
        </div>
      )}
      <Pagination
        total={history.total}
        page={history.page}
        per={6}
        onChange={setPage}
      />
    </section>
  )
}
