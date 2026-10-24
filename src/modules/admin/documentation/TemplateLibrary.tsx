"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import type { CareTemplate } from "../../staff/care/types"
import { Btn, Modal, Banner } from "../../staff/ui"
import { Field, SelectField } from "../ui/Form"
import {
  useAdmin,
  DataTable,
  Filters,
  SearchInput,
  Select,
  Pill,
} from "../ui/core"
import { createTemplate, archiveTemplate } from "./adapter"
import ConfirmDialog from "../workforce/ConfirmDialog"
import { formatDateTime } from "@/lib/time"
export const templateHref = (id: string, tab = "builder") =>
  `/admin/documentation/templates/${encodeURIComponent(id)}?tab=${tab}`
export default function TemplateLibrary({ kind }: { kind: "care" | "chart" }) {
  const { data, role, update } = useAdmin(),
    router = useRouter(),
    [q, setQ] = useState(""),
    [status, setStatus] = useState("all"),
    [creating, setCreating] = useState(false),
    [archive, setArchive] = useState<CareTemplate | null>(null),
    [error, setError] = useState("")
  const state = (t: CareTemplate) =>
    t.archived ? "Archived" : t.versions.length ? "Published" : "Draft"
  return (
    <>
      <Filters>
        <SearchInput value={q} onChange={setQ} placeholder="Search templates" />
        <Select
          label="Status"
          value={status}
          onChange={setStatus}
          options={["all", "Draft", "Published", "Archived"].map((v) => ({
            value: v,
            label: v === "all" ? "All statuses" : v,
          }))}
        />
        <span className="ad-push" />
        <Btn icon="plus" onClick={() => setCreating(true)}>
          Create Template
        </Btn>
      </Filters>
      {error && <p role="alert">{error}</p>}
      {kind === "care" && (
        <Banner tone="info">
          Medication templates document receipt/check-in only. CareMetrics does
          not support prescribing or medication administration.
        </Banner>
      )}
      <DataTable
        rows={data.careTemplates.filter(
          (t) =>
            t.kind === kind &&
            (status === "all" ||
              state(t) === status ||
              (status === "Draft" && !!t.draft)) &&
            `${t.draft?.name || t.name} ${t.description}`
              .toLowerCase()
              .includes(q.toLowerCase()),
        )}
        onRow={(t) => router.push(templateHref(t.id))}
        cols={[
          {
            key: "name",
            label: "Template",
            sort: (t) => t.name,
            render: (t) => (
              <>
                <b>{t.draft?.name || t.name}</b>
                <small className="ad-block ad-faint">{t.description}</small>
                {t.documentationOnly && <small>Documentation only</small>}
              </>
            ),
          },
          {
            key: "kind",
            label: "Category",
            render: () => (kind === "care" ? "Care Plan" : "Charting"),
          },
          {
            key: "version",
            label: "Latest version",
            render: (t) =>
              t.versions.length
                ? `v${Math.max(...t.versions.map((v) => v.version))}`
                : "—",
          },
          {
            key: "status",
            label: "Status",
            render: (t) => (
              <span className="ad-chips">
                <Pill s={state(t)} />
                {t.draft && !!t.versions.length && (
                  <Pill s="Draft" label="Draft changes" />
                )}
              </span>
            ),
          },
          {
            key: "count",
            label: "Clients",
            render: (t) =>
              data.careAssignments.filter(
                (a) => a.templateId === t.id && a.status === "active",
              ).length,
          },
          {
            key: "date",
            label: "Last updated",
            render: (t) => (
              <>
                {t.updatedAt ? formatDateTime(t.updatedAt) : "Not supplied"}
                <small className="ad-block ad-faint">
                  {data.staff.find((e) => e.id === t.updatedBy)?.name}
                </small>
              </>
            ),
          },
          {
            key: "actions",
            label: "Actions",
            render: (t) => (
              <span className="ad-row-actions">
                <Btn
                  size="sm"
                  variant="ghost"
                  onClick={() => router.push(templateHref(t.id))}
                >
                  {t.draft ? "Edit draft" : "Open"}
                </Btn>
                <Btn
                  size="sm"
                  variant="ghost"
                  onClick={() => router.push(templateHref(t.id, "preview"))}
                >
                  Preview
                </Btn>
                <Btn
                  size="sm"
                  variant="ghost"
                  onClick={() => router.push(templateHref(t.id, "versions"))}
                >
                  Versions
                </Btn>
                {!!t.versions.length && (
                  <Btn
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(templateHref(t.id, "assign"))}
                  >
                    Assign
                  </Btn>
                )}
                {!t.archived && (
                  <Btn size="sm" variant="ghost" onClick={() => setArchive(t)}>
                    Archive
                  </Btn>
                )}
              </span>
            ),
          },
        ]}
      />
      {creating && (
        <CreateTemplate kind={kind} onClose={() => setCreating(false)} />
      )}
      {archive && (
        <ConfirmDialog
          title={`Archive ${archive.name}?`}
          text="Deactivate all assignments first. Versions and historical records remain preserved; new entries will be unavailable."
          confirm="Archive template"
          tone="danger"
          onClose={() => setArchive(null)}
          onConfirm={() => {
            try {
              update(archiveTemplate(data, role, archive.id, true))
              setArchive(null)
            } catch (e) {
              setError((e as Error).message)
              setArchive(null)
            }
          }}
        />
      )}
    </>
  )
}
export function CreateTemplate({
  kind,
  onClose,
}: {
  kind: "care" | "chart"
  onClose: () => void
}) {
  const { data, role, update } = useAdmin(),
    router = useRouter(),
    [name, setName] = useState(""),
    [description, setDescription] = useState(""),
    [type, setType] = useState(kind),
    [error, setError] = useState("")
  const close = () => {
    if (
      (!name && !description) ||
      window.confirm("Discard unsaved template details?")
    )
      onClose()
  }
  return (
    <Modal
      title="Create Template"
      onClose={close}
      footer={
        <>
          <Btn variant="secondary" onClick={close}>
            Cancel
          </Btn>
          <Btn
            onClick={() => {
              try {
                const result = createTemplate(
                  data,
                  role,
                  name,
                  description,
                  type,
                )
                update(result.data)
                onClose()
                router.push(templateHref(result.id))
              } catch (e) {
                setError((e as Error).message)
              }
            }}
          >
            Create draft
          </Btn>
        </>
      }
    >
      {error && <p role="alert">{error}</p>}
      <Field label="Template name" value={name} required onChange={setName} />
      <Field
        label="Description"
        type="textarea"
        value={description}
        onChange={setDescription}
      />
      <SelectField
        label="Documentation type"
        value={type}
        onChange={(v) => setType(v as "care" | "chart")}
        options={[
          { value: "care", label: "Care Plan" },
          { value: "chart", label: "Charting" },
        ]}
      />
      <p className="ad-faint">
        Creates a draft in this development session. It is not published or
        assigned automatically. Creator and creation time are recorded as
        preview metadata.
      </p>
    </Modal>
  )
}
