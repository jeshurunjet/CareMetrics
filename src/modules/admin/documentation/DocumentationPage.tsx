"use client"
import { useState } from "react"
import { useAdmin, PageHead, SubTabs, Stat, Panel } from "../ui/core"
import { Btn } from "../../staff/ui"
import Categories from "./Categories"
import TemplateLibrary, { CreateTemplate } from "./TemplateLibrary"
import Assignments from "./Assignments"
import { formatDateTime } from "@/lib/time"
export default function DocumentationPage() {
  const nav = useAdmin(),
    s = nav.data,
    tab = nav.route.tab ?? "overview",
    [creating, setCreating] = useState<"care" | "chart" | null>(null)
  const go = (tab: string) => nav.replace({ page: "docs", tab })
  return (
    <>
      <PageHead
        title="Care Documentation"
        sub="Diary categories and Care Templates. Care Plan and Charting share the Staff configurable form engine."
      />
      <SubTabs
        value={tab}
        onChange={go}
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "categories", label: "Diary categories" },
          { id: "care", label: "Care Plan templates" },
          { id: "chart", label: "Charting templates" },
          { id: "assignments", label: "Template assignments" },
          { id: "records", label: "Submitted records · Phase 1E.4" },
          { id: "corrections", label: "Correction requests · Phase 1E.4" },
        ]}
      />
      {tab === "overview" && (
        <>
          <div className="ad-stats ad-stats--4">
            <Stat
              icon="book"
              label="Active diary categories"
              value={s.diaryCategories.filter((c) => c.active).length}
              onClick={() => go("categories")}
            />
            <Stat
              icon="clipboard"
              label="Published Care Plan templates"
              value={
                s.careTemplates.filter(
                  (t) =>
                    t.kind === "care" &&
                    !t.archived &&
                    t.versions.some((v) => v.published),
                ).length
              }
              onClick={() => go("care")}
            />
            <Stat
              icon="layers"
              label="Published Charting templates"
              value={
                s.careTemplates.filter(
                  (t) =>
                    t.kind === "chart" &&
                    !t.archived &&
                    t.versions.some((v) => v.published),
                ).length
              }
              onClick={() => go("chart")}
            />
            <Stat
              icon="edit"
              label="Draft templates"
              value={
                s.careTemplates.filter((t) => t.draft && !t.archived).length
              }
              onClick={() => go("care")}
            />
          </div>
          <div className="ad-grid-2">
            <Panel title="How documentation reaches staff">
              <ol className="ad-steps">
                <li>
                  <b>Configure</b> sections, questions, options and tables.
                </li>
                <li>
                  <b>Validate and publish</b> an immutable version.
                </li>
                <li>
                  <b>Assign</b> a published version explicitly to clients.
                </li>
                <li>
                  Staff use the same version-aware renderer. Record review
                  follows in Phase 1E.4.
                </li>
              </ol>
              <p>
                {s.careAssignments.filter((a) => a.status === "active").length}{" "}
                active template/client assignments
              </p>
              <div className="ad-inline">
                <Btn variant="secondary" onClick={() => go("categories")}>
                  Manage Diary Categories
                </Btn>
                <Btn variant="secondary" onClick={() => setCreating("care")}>
                  Create Care Plan Template
                </Btn>
                <Btn variant="secondary" onClick={() => setCreating("chart")}>
                  Create Charting Template
                </Btn>
                <Btn variant="ghost" onClick={() => go("assignments")}>
                  View Template Assignments
                </Btn>
              </div>
            </Panel>
            <Panel title="Recent configuration changes">
              <p className="ad-faint">
                Session metadata only; no production audit trail.
              </p>
              {[...s.diaryCategories, ...s.careTemplates]
                .filter((x) => x.updatedAt)
                .sort((a, b) => b.updatedAt!.localeCompare(a.updatedAt!))
                .slice(0, 8)
                .map((x) => (
                  <p key={x.id}>
                    <b>{x.name}</b>
                    <small className="ad-block ad-faint">
                      {formatDateTime(x.updatedAt!)} ·{" "}
                      {s.staff.find((e) => e.id === x.updatedBy)?.name ??
                        x.updatedBy}
                    </small>
                  </p>
                ))}
              {![...s.diaryCategories, ...s.careTemplates].some(
                (x) => x.updatedAt,
              ) && (
                <p className="ad-empty-inline">
                  No configuration changes in this session.
                </p>
              )}
            </Panel>
          </div>
        </>
      )}
      {tab === "categories" && <Categories />}
      {(tab === "care" || tab === "chart") && (
        <TemplateLibrary key={tab} kind={tab} />
      )}
      {tab === "assignments" && <Assignments />}
      {["records", "corrections"].includes(tab) && (
        <Panel title="Phase 1E.4 — not implemented">
          <p>
            Submitted-record review and correction approvals are outside this
            phase. Staff historical records remain available through their
            existing scoped views.
          </p>
        </Panel>
      )}
      {creating && (
        <CreateTemplate kind={creating} onClose={() => setCreating(null)} />
      )}
    </>
  )
}
