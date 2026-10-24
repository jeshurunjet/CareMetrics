"use client"
import { useState } from "react"
import Link from "next/link"
import type { CareTemplate } from "../../staff/care/types"
import { Btn } from "../../staff/ui"
import {
  useAdmin,
  Filters,
  Select,
  SearchInput,
  DataTable,
  Pill,
} from "../ui/core"
import ConfirmDialog from "../workforce/ConfirmDialog"
import { assignTemplate } from "./adapter"
export default function Assignments({ template }: { template?: CareTemplate }) {
  const { data, role, update } = useAdmin(),
    [templateId, setTemplate] = useState(template?.id ?? ""),
    [version, setVersion] = useState(""),
    [house, setHouse] = useState("all"),
    [q, setQ] = useState(""),
    [selected, setSelected] = useState<string[]>([]),
    [confirm, setConfirm] = useState<{
      ids: string[]
      action: "assign" | "update" | "deactivate"
    } | null>(null),
    [message, setMessage] = useState("")
  const t = template ?? data.careTemplates.find((t) => t.id === templateId),
    versions = t?.versions.filter((v) => v.published) ?? [],
    versionNumber = Number(
      version || Math.max(0, ...versions.map((v) => v.version)),
    )
  const clients = data.clients.filter(
    (c) =>
      (house === "all" || c.houseId === house) &&
      `${c.name} ${c.preferred}`.toLowerCase().includes(q.toLowerCase()),
  )
  const assignment = (id: string) =>
    data.careAssignments.find(
      (a) => a.clientId === id && a.templateId === t?.id,
    )
  return (
    <>
      <p className="ad-faint">
        Assign a published version explicitly. Publishing a newer version never
        changes assignments or migrates old drafts/records.
      </p>
      <Filters>
        {!template && (
          <Select
            label="Template"
            value={templateId}
            onChange={(v) => {
              setTemplate(v)
              setVersion("")
              setSelected([])
            }}
            options={[
              { value: "", label: "Choose template" },
              ...data.careTemplates
                .filter((t) => t.versions.length && !t.archived)
                .map((t) => ({
                  value: t.id,
                  label: `${t.name} · ${
                    t.kind === "care" ? "Care Plan" : "Charting"
                  }`,
                })),
            ]}
          />
        )}
        <Select
          label="Published version"
          value={String(versionNumber || "")}
          onChange={setVersion}
          options={versions.map((v) => ({
            value: String(v.version),
            label: `v${v.version}`,
          }))}
        />
        <Select
          label="House"
          value={house}
          onChange={(v) => {
            setHouse(v)
            setSelected([])
          }}
          options={[
            { value: "all", label: "All houses" },
            ...data.houses.map((h) => ({ value: h.id, label: h.name })),
          ]}
        />
        <SearchInput value={q} onChange={setQ} placeholder="Search clients" />
      </Filters>
      {message && <p role="status">{message}</p>}
      {t ? (
        <>
          <div className="ad-inline ad-mb">
            <span>
              {selected.length} selected ·{" "}
              {t.kind === "care" ? "Care Plan" : "Charting"}
            </span>
            <Btn
              disabled={!selected.length || !versionNumber || !!t.archived}
              onClick={() => setConfirm({ ids: selected, action: "assign" })}
            >
              Assign selected clients
            </Btn>
          </div>
          <DataTable
            rows={clients}
            cols={[
              {
                key: "select",
                label: "Select",
                render: (c) => (
                  <input
                    type="checkbox"
                    aria-label={`Select ${c.name}`}
                    checked={selected.includes(c.id)}
                    disabled={
                      c.status === "Inactive" ||
                      assignment(c.id)?.status === "active" ||
                      !!t.archived
                    }
                    onChange={(e) =>
                      setSelected((ids) =>
                        e.target.checked
                          ? [...ids, c.id]
                          : ids.filter((id) => id !== c.id),
                      )
                    }
                  />
                ),
              },
              {
                key: "client",
                label: "Client",
                render: (c) => (
                  <Link
                    href={`/admin/clients/${encodeURIComponent(c.id)}?tab=${t.kind}`}
                  >
                    {c.name}
                  </Link>
                ),
              },
              {
                key: "house",
                label: "House",
                render: (c) =>
                  data.houses.find((h) => h.id === c.houseId)?.name,
              },
              {
                key: "status",
                label: "Assignment",
                render: (c) => (
                  <Pill
                    s={
                      assignment(c.id)?.status === "active"
                        ? "Active"
                        : assignment(c.id)
                          ? "Paused"
                          : "Inactive"
                    }
                    label={
                      assignment(c.id)?.status === "active"
                        ? "Active"
                        : assignment(c.id)
                          ? "Deactivated"
                          : "Not assigned"
                    }
                  />
                ),
              },
              {
                key: "version",
                label: "Assigned version",
                render: (c) =>
                  assignment(c.id) ? `v${assignment(c.id)!.version}` : "—",
              },
              {
                key: "records",
                label: "Records",
                render: (c) =>
                  data.careRecords.filter(
                    (r) => r.clientId === c.id && r.templateId === t.id,
                  ).length,
              },
              {
                key: "actions",
                label: "Actions",
                render: (c) =>
                  assignment(c.id)?.status === "active" ? (
                    <span className="ad-row-actions">
                      <Btn
                        size="sm"
                        variant="ghost"
                        disabled={
                          assignment(c.id)?.version === versionNumber ||
                          !!t.archived
                        }
                        onClick={() =>
                          setConfirm({ ids: [c.id], action: "update" })
                        }
                      >
                        Update to v{versionNumber}
                      </Btn>
                      <Btn
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setConfirm({ ids: [c.id], action: "deactivate" })
                        }
                      >
                        Deactivate assignment
                      </Btn>
                    </span>
                  ) : (
                    <Btn
                      size="sm"
                      variant="ghost"
                      disabled={c.status === "Inactive" || !!t.archived}
                      onClick={() =>
                        setConfirm({ ids: [c.id], action: "assign" })
                      }
                    >
                      Assign v{versionNumber}
                    </Btn>
                  ),
              },
            ]}
          />
        </>
      ) : (
        <p className="ad-empty-inline">
          Choose a published template to manage client assignments.
        </p>
      )}
      {confirm && t && (
        <ConfirmDialog
          title={
            confirm.action === "deactivate"
              ? "Deactivate assignment?"
              : confirm.action === "update"
                ? "Update assigned version?"
                : "Assign published template?"
          }
          confirm={
            confirm.action === "deactivate"
              ? "Confirm deactivation"
              : confirm.action === "update"
                ? "Confirm version update"
                : "Confirm assignment"
          }
          text={
            <>
              <p>
                {t.name} · {confirm.ids.length} client(s)
                {confirm.action !== "deactivate" ? ` · v${versionNumber}` : ""}
              </p>
              <p>
                Existing records and old-version drafts are preserved. Active
                assignments permit old-version drafts to continue under their
                original version. Deactivation blocks new entries and draft
                submission while historical submitted records remain readable
                within current house scope.
              </p>
            </>
          }
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            try {
              const next = confirm.ids.reduce(
                (s, id) =>
                  assignTemplate(
                    s,
                    role,
                    t.id,
                    id,
                    versionNumber,
                    confirm.action,
                  ),
                data,
              )
              update(next)
              setMessage(
                "Assignment changes saved in this development session.",
              )
              setSelected([])
              setConfirm(null)
            } catch (e) {
              setMessage((e as Error).message)
              setConfirm(null)
            }
          }}
        />
      )}
    </>
  )
}
