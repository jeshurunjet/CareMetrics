"use client"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useStaffData } from "../data/context"
import { queryDiaryHistory, getCategories } from "../data/diary-adapter"
import type { DiarySubject } from "../data/types"
import SearchInput from "../ui/SearchInput"
import Select from "../ui/Select"
import Pagination from "../ui/Pagination"
import { Empty, Icon } from "../ui"
import DiaryEntryCard from "./DiaryEntryCard"
import DiaryEntryDetails from "./DiaryEntryDetails"
import { diaryFormHref } from "./navigation"
import { DiaryPreviewNotice } from "./shared"
export default function DiaryHistoryList({
  subject,
}: {
  subject: DiarySubject
}) {
  const s = useStaffData(),
    router = useRouter(),
    params = useSearchParams()
  const [q, setQ] = useState(""),
    [category, setCategory] = useState("all"),
    [range, setRange] = useState("all"),
    [page, setPage] = useState(1)
  const id = params.get("item")
  if (id)
    return (
      <DiaryEntryDetails
        subject={subject}
        id={id}
        correction={params.get("action") === "correction"}
      />
    )
  const cats = getCategories(s, subject.scope)
  const history = queryDiaryHistory(s, subject, {
    query: q,
    categoryId: category === "all" ? undefined : category,
    days: range === "all" ? undefined : Number(range),
    page,
  })
  const current = history.page
  return (
    <div className="cm-stack">
      <DiaryPreviewNotice />
      <div className="cm-toolbar">
        <SearchInput
          label="Search diary entries"
          value={q}
          onChange={(v) => {
            setQ(v)
            setPage(1)
          }}
          placeholder="Search diary entries"
        />
        <Select
          label="Category"
          value={category}
          onChange={(v) => {
            setCategory(v)
            setPage(1)
          }}
          options={[
            { value: "all", label: "All categories" },
            ...cats.map((c) => ({ value: c.id, label: c.name })),
          ]}
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
        <Link
          className="cm-btn cm-btn--primary cm-btn--md"
          href={diaryFormHref(subject)}
        >
          <Icon name="plus" size={17} />
          New entry
        </Link>
      </div>
      {history.total === 0 ? (
        <Empty
          icon="book"
          title="No diary entries found"
          text={
            q || category !== "all" || range !== "all"
              ? "Try adjusting your search or filters."
              : "Create the first entry for this diary."
          }
        />
      ) : (
        <div className="cm-list" key={`${q}-${category}-${range}-${current}`}>
          {history.items.map((entry, i) => (
            <DiaryEntryCard
              key={entry.id}
              entry={entry}
              defaultOpen={current === 1 && i === 0}
            />
          ))}
        </div>
      )}
      <Pagination
        page={current}
        total={history.total}
        per={6}
        onChange={(v) => {
          setPage(v)
          router.replace(`${window.location.pathname}?tab=diary`, {
            scroll: false,
          })
        }}
      />
    </div>
  )
}
