"use client"
import { useState } from "react"
import Link from "next/link"
import { useStaffData } from "../data/context"
import { getAssignedCareTemplate, queryCareHistory } from "./adapter"
import { Icon, Empty } from "../ui"
import SearchInput from "../ui/SearchInput"
import Select from "../ui/Select"
import Pagination from "../ui/Pagination"
import AssessmentRecordCard from "./AssessmentRecordCard"
import { careListHref, careFormHref } from "./navigation"
import { AssessmentPreviewNotice, UnavailableAssessment } from "./shared"
export default function AssessmentHistory({
  clientId,
  templateId,
}: {
  clientId: string
  templateId: string
}) {
  const s = useStaffData(),
    [query, setQuery] = useState(""),
    [range, setRange] = useState("all"),
    [page, setPage] = useState(1)
  const assigned = getAssignedCareTemplate(s, clientId, templateId)
  if (!assigned) return <UnavailableAssessment clientId={clientId} />
  const { template, version } = assigned,
    history = queryCareHistory(s, clientId, templateId, {
      query,
      days: range === "all" ? undefined : Number(range),
      page,
    })
  return (
    <div className="cm-stack">
      <div className="cm-subheader">
        <Link className="cm-back" href={careListHref(clientId)}>
          <Icon name="back" size={16} />
          All assessments
        </Link>
        <div className="cm-row-between">
          <div>
            <h2 className="cm-h2">{template.name}</h2>
            <p className="cm-muted">
              {template.description} · Template v{version.version}
            </p>
          </div>
          <Link
            className="cm-btn cm-btn--primary cm-btn--md"
            href={careFormHref(clientId, templateId)}
          >
            <Icon name="plus" size={17} />
            New assessment
          </Link>
        </div>
      </div>
      <AssessmentPreviewNotice />
      <div className="cm-toolbar">
        <SearchInput
          label="Search assessment records"
          value={query}
          onChange={(v) => {
            setQuery(v)
            setPage(1)
          }}
          placeholder="Search records"
        />
        <Select
          label="Date range"
          value={range}
          onChange={(v) => {
            setRange(v)
            setPage(1)
          }}
          options={[
            { value: "all", label: "Any date" },
            { value: "1", label: "Last 24 hours" },
            { value: "7", label: "Last 7 days" },
            { value: "30", label: "Last 30 days" },
          ]}
        />
      </div>
      {history.total === 0 ? (
        <Empty
          icon="clipboard"
          title="No records yet"
          text={
            query || range !== "all"
              ? "Try adjusting your search or filters."
              : "Complete the first assessment for this category."
          }
        />
      ) : (
        <div className="cm-list" key={`${query}-${range}-${history.page}`}>
          {history.items.map((record, i) => (
            <AssessmentRecordCard
              key={record.id}
              record={record}
              template={template}
              defaultOpen={history.page === 1 && i === 0}
            />
          ))}
        </div>
      )}
      <Pagination
        page={history.page}
        total={history.total}
        per={6}
        onChange={setPage}
      />
    </div>
  )
}
