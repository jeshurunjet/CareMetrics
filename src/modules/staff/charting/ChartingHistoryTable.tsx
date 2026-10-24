"use client"
import { effectiveCare } from "../documentation/revisions"
import { useState } from "react"
import Link from "next/link"
import { useStaffData } from "../data/context"
import {
  getAssignedCareTemplate,
  getReadableCareTemplate,
  getCareRecords,
} from "../care/adapter"
import { careListHref, careFormHref, careDetailHref } from "../care/navigation"
import { AssessmentPreviewNotice, UnavailableAssessment } from "../care/shared"
import { RecordStatus } from "../diary/shared"
import { allFields, isTableRows } from "../../forms/engine"
import { display } from "../../forms/ReadOnlyFormValues"
import { Icon, Empty } from "../ui"
import SearchInput from "../ui/SearchInput"
import Select from "../ui/Select"
import Pagination from "../ui/Pagination"
import ChartHistoryVisualisation from "./ChartHistoryVisualisation"
import { formatDateTime } from "@/lib/time"
export default function ChartingHistoryTable({
  clientId,
  templateId,
}: {
  clientId: string
  templateId: string
}) {
  const s = useStaffData(),
    [query, setQuery] = useState(""),
    [range, setRange] = useState("all"),
    [author, setAuthor] = useState("all"),
    [page, setPage] = useState(1)
  const assigned = getReadableCareTemplate(s, clientId, templateId, "chart")
  if (!assigned)
    return <UnavailableAssessment clientId={clientId} kind="chart" />
  const { template, version } = assigned,
    all = getCareRecords(s, clientId, templateId).map((r) =>
      effectiveCare(s, r),
    )
  const list = all.filter(
    (r) =>
      (!query ||
        `${JSON.stringify(r.values)} ${s.staff.find((e) => e.id === r.authorId)?.name}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())) &&
      (author === "all" || r.authorId === author) &&
      (range === "all" ||
        (Date.parse(s.now) - Date.parse(r.coveredAt) >= 0 &&
          Date.parse(s.now) - Date.parse(r.coveredAt) <=
            Number(range) * 86400000)),
  )
  const current = Math.max(1, Math.min(page, Math.ceil(list.length / 6) || 1))
  const columns = (template.history?.columns ?? [])
    .map((id) => allFields(version).find((f) => f.id === id))
    .filter((f) => f !== undefined)
  return (
    <div className="cm-stack">
      <div className="cm-subheader">
        <Link className="cm-back" href={careListHref(clientId, "chart")}>
          <Icon name="back" size={16} />
          All charts
        </Link>
        <div className="cm-row-between">
          <div>
            <h2 className="cm-h2">{template.name}</h2>
            <p className="cm-muted">
              {template.description} · Template v{version.version}
            </p>
          </div>
          {getAssignedCareTemplate(s, clientId, templateId, template.kind) && (
            <Link
              className="cm-btn cm-btn--primary cm-btn--md"
              href={careFormHref(clientId, templateId)}
            >
              <Icon name="plus" size={17} />
              Add entry
            </Link>
          )}
        </div>
      </div>
      <AssessmentPreviewNotice kind="chart" />
      <div className="cm-toolbar">
        <SearchInput
          label="Search chart records"
          placeholder="Search entries"
          value={query}
          onChange={(v) => {
            setQuery(v)
            setPage(1)
          }}
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
        <Select
          label="Author"
          value={author}
          onChange={(v) => {
            setAuthor(v)
            setPage(1)
          }}
          options={[
            { value: "all", label: "All staff" },
            ...s.staff
              .filter((e) => all.some((r) => r.authorId === e.id))
              .map((e) => ({ value: e.id, label: e.name })),
          ]}
        />
      </div>
      <ChartHistoryVisualisation template={template} records={list} />
      {!list.length ? (
        <Empty
          icon="chart"
          title="No entries"
          text="Add the first entry or adjust your search and filters."
        />
      ) : (
        <>
          <p className="cm-hint">
            Read-only history. Scroll horizontally to see all columns; select
            View details to open a record.
          </p>
          <div
            className="cm-table-wrap cm-chart-history"
            role="region"
            aria-label={`${template.name} history`}
            tabIndex={0}
          >
            <table className="cm-table">
              <caption className="sr-only">
                {template.name} ·{" "}
                {s.clients.find((c) => c.id === clientId)?.name}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Date / time</th>
                  {columns.map((f) => (
                    <th scope="col" key={f.id}>
                      {f.label}
                    </th>
                  ))}
                  <th scope="col">Author</th>
                  <th scope="col">Status / version</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.slice((current - 1) * 6, current * 6).map((r) => (
                  <tr key={r.id}>
                    <th scope="row">{formatDateTime(r.coveredAt)}</th>
                    {columns.map((column) => {
                      const original = template.versions.find(
                          (v) => v.version === r.templateVersion,
                        ),
                        field =
                          original &&
                          allFields(original).find((f) => f.id === column.id)
                      return (
                        <td key={column.id}>
                          {field?.type === "repeatingTable"
                            ? `${
                                isTableRows(r.values[field.id])
                                  ? (r.values[
                                      field.id
                                    ] as import("../../forms/types").CareTableRow[])
                                      .length
                                  : 0
                              } equipment rows`
                            : field
                              ? display(field, r.values[field.id])
                              : "—"}
                        </td>
                      )
                    })}
                    <td>{s.staff.find((e) => e.id === r.authorId)?.name}</td>
                    <td>
                      <RecordStatus entry={r} recordType="care" />
                      <span>v{r.templateVersion}</span>
                    </td>
                    <td>
                      <Link
                        className="cm-link"
                        href={careDetailHref(
                          clientId,
                          templateId,
                          r.id,
                          false,
                          "chart",
                        )}
                      >
                        {r.status === "draft" ? "View draft" : "View details"}
                        <span className="sr-only">
                          {" "}
                          · {formatDateTime(r.coveredAt)}
                        </span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <Pagination
        page={current}
        total={list.length}
        per={6}
        onChange={setPage}
      />
    </div>
  )
}
