"use client"
import { useState } from "react"
import type { DiaryCategory } from "../../staff/data/types"
import { Btn, Modal, Empty } from "../../staff/ui"
import { formatDateTime } from "@/lib/time"
import { useAdmin, Filters, Select, DataTable, Pill } from "../ui/core"
import { Field, SelectField } from "../ui/Form"
import { saveCategory, type CategoryInput } from "./adapter"
export default function Categories() {
  const { data, role, update } = useAdmin(),
    [edit, setEdit] = useState<DiaryCategory | "new" | null>(null),
    [scope, setScope] = useState("all"),
    [records, setRecords] = useState<DiaryCategory | null>(null),
    [error, setError] = useState("")
  return (
    <>
      <Filters>
        <Select
          label="Applies to"
          value={scope}
          onChange={setScope}
          options={[
            { value: "all", label: "Client & house" },
            { value: "client", label: "Client diary" },
            { value: "house", label: "House diary" },
          ]}
        />
        <span className="ad-push" />
        <Btn icon="plus" onClick={() => setEdit("new")}>
          Add category
        </Btn>
      </Filters>
      {error && <p role="alert">{error}</p>}
      <DataTable
        rows={data.diaryCategories.filter(
          (c) => scope === "all" || c.scope === scope,
        )}
        cols={[
          {
            key: "name",
            label: "Category",
            sort: (c) => c.name,
            render: (c) => (
              <>
                <b>{c.name}</b>
                <small className="ad-block ad-faint">{c.description}</small>
              </>
            ),
          },
          {
            key: "scope",
            label: "Applies to",
            render: (c) => `${c.scope === "client" ? "Client" : "House"} diary`,
          },
          {
            key: "status",
            label: "Status",
            render: (c) => <Pill s={c.active ? "Active" : "Inactive"} />,
          },
          {
            key: "records",
            label: "Records",
            render: (c) =>
              data.diary.filter((d) => d.categoryId === c.id).length,
          },
          {
            key: "by",
            label: "Created by",
            render: (c) => (
              <>
                {data.staff.find((e) => e.id === c.createdBy)?.name ??
                  "Not supplied"}
                {c.createdAt && (
                  <small className="ad-block ad-faint">
                    {formatDateTime(c.createdAt)}
                  </small>
                )}
              </>
            ),
          },
          {
            key: "date",
            label: "Last updated",
            render: (c) => (
              <>
                {c.updatedAt ? formatDateTime(c.updatedAt) : "Not supplied"}
                {c.updatedBy && (
                  <small className="ad-block ad-faint">
                    {data.staff.find((e) => e.id === c.updatedBy)?.name ??
                      c.updatedBy}
                  </small>
                )}
              </>
            ),
          },
          {
            key: "actions",
            label: "Actions",
            render: (c) => (
              <span className="ad-row-actions">
                <Btn variant="ghost" size="sm" onClick={() => setEdit(c)}>
                  Edit
                </Btn>
                <Btn
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    try {
                      update(
                        saveCategory(
                          data,
                          role,
                          {
                            name: c.name,
                            description: c.description ?? "",
                            scope: c.scope,
                            active: !c.active,
                          },
                          c.id,
                        ),
                      )
                      setError("")
                    } catch (e) {
                      setError((e as Error).message)
                    }
                  }}
                >
                  {c.active ? "Deactivate" : "Activate"}
                </Btn>
                <Btn variant="ghost" size="sm" onClick={() => setRecords(c)}>
                  View records
                </Btn>
              </span>
            ),
          },
        ]}
      />
      <p className="ad-faint">
        Deactivate categories to hide them from new entries. Historical records
        retain their category ID and submitted name.
      </p>
      {edit && (
        <CategoryModal
          cat={edit === "new" ? undefined : edit}
          onClose={() => setEdit(null)}
        />
      )}
      {records && (
        <Modal
          title={`Related records · ${records.name}`}
          onClose={() => setRecords(null)}
        >
          {data.diary.filter((d) => d.categoryId === records.id).length ? (
            <ul>
              {data.diary
                .filter((d) => d.categoryId === records.id)
                .map((d) => (
                  <li key={d.id}>
                    {d.title} · {d.categoryName ?? records.name} · {d.status} ·{" "}
                    {formatDateTime(d.coveredAt)}
                  </li>
                ))}
            </ul>
          ) : (
            <Empty title="No related records" />
          )}
          <p className="ad-faint">
            Read-only session preview. Record review is reserved for Phase 1E.4.
          </p>
        </Modal>
      )}
    </>
  )
}
function CategoryModal({
  cat,
  onClose,
}: {
  cat?: DiaryCategory
  onClose: () => void
}) {
  const { data, role, update } = useAdmin(),
    [f, setF] = useState<CategoryInput>({
      name: cat?.name ?? "",
      description: cat?.description ?? "",
      scope: cat?.scope ?? "client",
      active: cat?.active ?? true,
    }),
    [error, setError] = useState("")
  const dirty =
      JSON.stringify(f) !==
      JSON.stringify({
        name: cat?.name ?? "",
        description: cat?.description ?? "",
        scope: cat?.scope ?? "client",
        active: cat?.active ?? true,
      }),
    close = () => {
      if (!dirty || window.confirm("Discard unsaved category changes?"))
        onClose()
    }
  return (
    <Modal
      title={cat ? "Edit diary category" : "Add diary category"}
      onClose={close}
      footer={
        <>
          <Btn variant="secondary" onClick={close}>
            Cancel
          </Btn>
          <Btn
            onClick={() => {
              try {
                update(saveCategory(data, role, f, cat?.id))
                onClose()
              } catch (e) {
                setError((e as Error).message)
              }
            }}
          >
            Save category
          </Btn>
        </>
      }
    >
      {error && <p role="alert">{error}</p>}
      <Field
        label="Category name"
        required
        value={f.name}
        onChange={(name) => setF({ ...f, name })}
      />
      <Field
        label="Description"
        value={f.description}
        onChange={(description) => setF({ ...f, description })}
      />
      <SelectField
        label="Applies to"
        disabled={!!cat}
        value={f.scope}
        options={[
          { value: "client", label: "Client diary" },
          { value: "house", label: "House diary" },
        ]}
        onChange={(scope) => setF({ ...f, scope: scope as "client" | "house" })}
      />
      <SelectField
        label="Status"
        value={String(f.active)}
        options={[
          { value: "true", label: "Active" },
          { value: "false", label: "Inactive" },
        ]}
        onChange={(v) => setF({ ...f, active: v === "true" })}
      />
    </Modal>
  )
}
