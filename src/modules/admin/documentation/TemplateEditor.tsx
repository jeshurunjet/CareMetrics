"use client"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAdmin, PageHead, SubTabs, Pill, DataTable, Panel } from "../ui/core"
import { Btn, Empty, Modal, Banner } from "../../staff/ui"
import { formatDateTime } from "@/lib/time"
import type { ConfigurableFormVersion } from "../../forms/types"
import { allFields } from "../../forms/engine"
import { newDraftVersion } from "./adapter"
import FormBuilder from "./FormBuilder"
import StaffFormPreview from "./StaffFormPreview"
import Assignments from "./Assignments"
import { templateHref } from "./TemplateLibrary"
export default function TemplateEditor({ id }: { id: string }) {
  const { data, role, update } = useAdmin(),
    router = useRouter(),
    q = useSearchParams(),
    tab = q.get("tab") ?? "builder",
    t = data.careTemplates.find((t) => t.id === id),
    [error, setError] = useState(""),
    [preview, setPreview] = useState<ConfigurableFormVersion | null>(null),
    [previewNumber, setPreviewNumber] = useState("draft")
  if (!t)
    return (
      <Empty
        title="Template unavailable"
        text="This development-session template may have reset on reload."
      />
    )
  const latest = t.versions.at(-1),
    currentPreview =
      previewNumber === "draft"
        ? (t.draft?.form ?? latest)
        : (t.versions.find((v) => v.version === Number(previewNumber)) ??
          latest)
  const createDraft = (v?: number) => {
    try {
      update(newDraftVersion(data, role, id, v))
      router.push(templateHref(id))
      setError("")
    } catch (e) {
      setError((e as Error).message)
    }
  }
  return (
    <>
      <PageHead
        title={t.draft?.name || t.name}
        crumbs={[
          { label: "Care Documentation", to: { page: "docs" } },
          {
            label:
              t.kind === "care" ? "Care Plan templates" : "Charting templates",
            to: { page: "docs", tab: t.kind },
          },
          { label: t.draft?.name || t.name },
        ]}
        sub={
          <>
            <span className="ad-chips">
              <Pill
                s={t.archived ? "Archived" : t.draft ? "Draft" : "Published"}
              />
              {latest && <span>Published v{latest.version}</span>}
              <span>
                {
                  data.careAssignments.filter(
                    (a) => a.templateId === id && a.status === "active",
                  ).length
                }{" "}
                client assignments
              </span>
            </span>
            {t.createdAt && (
              <span className="ad-block">
                Created {formatDateTime(t.createdAt)} ·{" "}
                {data.staff.find((e) => e.id === t.createdBy)?.name ??
                  t.createdBy}
              </span>
            )}
            <span className="ad-block">
              {t.updatedAt
                ? `Updated ${formatDateTime(t.updatedAt)} · ${data.staff.find((e) => e.id === t.updatedBy)?.name ?? t.updatedBy}`
                : "Legacy fixture metadata not supplied"}
            </span>
          </>
        }
      />
      <SubTabs
        value={tab}
        onChange={(tab) => router.push(templateHref(id, tab))}
        tabs={[
          { id: "builder", label: "Form builder" },
          { id: "preview", label: "Preview" },
          {
            id: "versions",
            label: "Version history",
            count: t.versions.length,
          },
          { id: "assign", label: "Assign to clients" },
        ]}
      />
      {error && <p role="alert">{error}</p>}
      {tab === "builder" &&
        (t.draft && !t.archived ? (
          <FormBuilder
            key={`${id}-${t.draft.form.version}`}
            id={id}
            kind={t.kind}
            initial={t.draft}
          />
        ) : (
          <>
            <Banner tone="info" title="Published versions are locked">
              Create a new draft to make changes. Existing records and
              assignments retain their version.
            </Banner>
            {!t.archived && (
              <Btn icon="plus" onClick={() => createDraft()}>
                Create New Version
              </Btn>
            )}
            <Panel title="Published structure">
              {latest?.sections.map((s) => (
                <div key={s.id}>
                  <h3>{s.title}</h3>
                  <ul>
                    {s.fields.map((f) => (
                      <li key={f.id}>
                        {f.label} · {f.type}
                        {f.required ? " · required" : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </Panel>
          </>
        ))}
      {tab === "preview" && (
        <>
          <label>
            Preview version
            <select
              className="cm-input"
              value={previewNumber}
              onChange={(e) => setPreviewNumber(e.target.value)}
            >
              <option value="draft">
                {t.draft
                  ? `Draft v${t.draft.form.version}`
                  : "Latest published"}
              </option>
              {t.versions.map((v) => (
                <option value={v.version} key={v.version}>
                  Published v{v.version}
                </option>
              ))}
            </select>
          </label>
          {currentPreview && (
            <StaffFormPreview
              key={`${id}-${previewNumber}`}
              version={currentPreview}
              name={
                previewNumber === "draft" && t.draft
                  ? t.draft.name || t.name
                  : (currentPreview.name ?? t.legacyMetadata?.name ?? t.name)
              }
            />
          )}
        </>
      )}
      {tab === "versions" && (
        <DataTable
          rows={t.versions.map((v) => ({ ...v, id: String(v.version) }))}
          empty={
            <Empty
              title="No published versions"
              text="Save and validate your draft before publishing."
            />
          }
          cols={[
            {
              key: "version",
              label: "Version",
              render: (v) => `v${v.version}`,
            },
            {
              key: "summary",
              label: "Summary",
              render: (v) => v.summary || "No summary supplied",
            },
            {
              key: "fields",
              label: "Fields",
              render: (v) => allFields(v).length,
            },
            {
              key: "records",
              label: "Records",
              render: (v) =>
                data.careRecords.filter(
                  (r) => r.templateId === id && r.templateVersion === v.version,
                ).length,
            },
            {
              key: "assigned",
              label: "Clients",
              render: (v) =>
                data.careAssignments.filter(
                  (a) =>
                    a.templateId === id &&
                    a.version === v.version &&
                    a.status === "active",
                ).length,
            },
            {
              key: "status",
              label: "Status",
              render: () => (
                <Pill s="Published" label="Published · immutable" />
              ),
            },
            {
              key: "date",
              label: "Published",
              render: (v) => (
                <>
                  {v.publishedAt
                    ? formatDateTime(v.publishedAt)
                    : "Not supplied"}
                  <small className="ad-block">
                    {data.staff.find((e) => e.id === v.publishedBy)?.name}
                  </small>
                </>
              ),
            },
            {
              key: "actions",
              label: "Actions",
              render: (v) => (
                <span className="ad-row-actions">
                  <Btn size="sm" variant="ghost" onClick={() => setPreview(v)}>
                    Preview Version
                  </Btn>
                  {!t.draft && !t.archived && (
                    <Btn
                      size="sm"
                      variant="ghost"
                      onClick={() => createDraft(v.version)}
                    >
                      Create New Version
                    </Btn>
                  )}
                </span>
              ),
            },
          ]}
        />
      )}
      {tab === "assign" &&
        (t.versions.length ? (
          <Assignments key={id} template={t} />
        ) : (
          <Empty title="Publish a version before assigning" />
        ))}
      {preview && (
        <Modal
          title={`${preview.name ?? t.legacyMetadata?.name ?? t.name} · v${preview.version}`}
          wide
          onClose={() => setPreview(null)}
        >
          <StaffFormPreview
            version={preview}
            name={preview.name ?? t.legacyMetadata?.name ?? t.name}
          />
        </Modal>
      )}
    </>
  )
}
