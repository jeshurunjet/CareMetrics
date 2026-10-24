"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { PageHead, Panel, KV, Pill, useAdmin } from "../ui/core"
import { Field, SelectField, useAdminFormGuard } from "../ui/Form"
import { Banner, Btn, Empty } from "../../staff/ui"
import ConfirmDialog from "../workforce/ConfirmDialog"
import {
  saveNotice,
  withdrawNotice,
  audienceLabel,
  validateNotice,
  type NoticeInput,
} from "../governance/adapter"
import type {
  NoticeAudience,
  NoticeCategory,
  NoticePriority,
} from "../../staff/notifications/types"
import { projectStaffSnapshot } from "../../staff/data/projection"
import { visibleNotices } from "../../staff/data/selectors"
import { formatDateTime } from "@/lib/time"
export default function NoticeEditor({ id }: { id?: string }) {
  const { data: s, role, update } = useAdmin(),
    router = useRouter(),
    n = s.notices.find((n) => n.id === id)
  const initial: NoticeInput = {
    title: n?.title ?? "",
    body: n?.body ?? "",
    category: n?.category ?? "staff",
    priority: n?.priority ?? "Normal",
    relatedId: n?.relatedId,
    targetAudience: n?.targetAudience ?? { kind: "organisation" },
  }
  const [f, setF] = useState<NoticeInput>(initial),
    [saved, setSaved] = useState(JSON.stringify(initial)),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [confirm, setConfirm] = useState<"publish" | "withdraw" | null>(null)
  const locked = n && n.status !== "Draft",
    dirty = !locked && JSON.stringify(f) !== saved
  const canLeave = useAdminFormGuard(dirty)
  const set = (p: Partial<NoticeInput>) => {
    setF((old) => ({ ...old, ...p }))
    setMessage("")
  }
  if (id && !n) return <Empty title="Notification unavailable" />
  function save(status: "Draft" | "Published") {
    try {
      const newId = id ?? crypto.randomUUID()
      const next = saveNotice(
        s,
        role,
        newId,
        f,
        status,
        new Date().toISOString(),
      )
      update(next)
      setSaved(JSON.stringify(f))
      setConfirm(null)
      setError("")
      setMessage(
        status === "Published"
          ? "Published in development state only; no real employees were notified."
          : "Draft saved for this development session only.",
      )
      if (!id) router.replace(`/admin/notifications/${newId}/edit`)
    } catch (e) {
      setConfirm(null)
      setError((e as Error).message)
    }
  }
  function publish() {
    try {
      validateNotice(s, f)
      setError("")
      setConfirm("publish")
    } catch (e) {
      setError((e as Error).message)
    }
  }
  const provisional = {
    ...f,
    id: id ?? "preview",
    status: "Published" as const,
    date: s.now,
    publisher: "Development preview",
    publisherId: "preview",
  }
  const recipients = s.staff.filter(
    (e) =>
      e.status !== "Inactive" &&
      visibleNotices(
        projectStaffSnapshot({ ...s, meId: e.id, notices: [provisional] }),
      ).length,
  ).length
  const a = f.targetAudience
  const changeCategory = (category: string) =>
    set({
      category: category as NoticeCategory,
      relatedId: undefined,
      targetAudience:
        category === "staff"
          ? { kind: "organisation" }
          : category === "client"
            ? { kind: "client", clientId: "" }
            : { kind: "house", houseId: "" },
    })
  const changeSubject = (id: string) =>
    set({
      relatedId: id,
      targetAudience:
        f.category === "client"
          ? { kind: "client", clientId: id }
          : { kind: "house", houseId: id },
    })
  return (
    <div className="ad-stack" data-diary-editor>
      <PageHead
        title={n ? n.title : "New notification"}
        crumbs={[
          { label: "Notifications & Concerns", to: { page: "notices" } },
          { label: n ? n.title : "New notification" },
        ]}
        sub={
          n && (
            <span className="ad-chips">
              <Pill s={n.status} />
              <span>
                {n.publisher} · {formatDateTime(n.date)}
              </span>
            </span>
          )
        }
        actions={
          locked ? (
            n?.status === "Published" && (
              <Btn variant="secondary" onClick={() => setConfirm("withdraw")}>
                Withdraw notice
              </Btn>
            )
          ) : (
            <>
              <Btn variant="secondary" onClick={() => save("Draft")}>
                Save draft
              </Btn>
              <Btn icon="megaphone" onClick={publish}>
                Publish
              </Btn>
            </>
          )
        }
      />
      {error && (
        <p className="cm-banner cm-banner--danger" role="alert">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {locked && (
        <Banner tone="info">
          {n?.status === "Published"
            ? "Published notices are read-only. Withdraw this development notice and create a separate notice to change its message."
            : "Withdrawn — hidden from Staff feeds; original content and change metadata retained."}
        </Banner>
      )}
      <div className="ad-grid-main">
        <Panel title="Message">
          <fieldset className="ad-fieldset" disabled={!!locked}>
            <div className="ad-form-row">
              <SelectField
                label="Type"
                value={f.category}
                onChange={changeCategory}
                options={[
                  { value: "staff", label: "Staff notice" },
                  { value: "house", label: "House notice" },
                  { value: "client", label: "Client notice" },
                ]}
              />
              {f.category !== "staff" && (
                <SelectField
                  label={f.category === "client" ? "Client" : "House"}
                  value={f.relatedId ?? ""}
                  onChange={changeSubject}
                  options={[
                    { value: "", label: "Select…" },
                    ...(f.category === "client" ? s.clients : s.houses)
                      .filter((x) => x.status !== "Inactive")
                      .map((x) => ({ value: x.id, label: x.name })),
                  ]}
                />
              )}
            </div>
            <SelectField
              label="Target audience"
              value={a.kind}
              onChange={(kind) =>
                set({
                  targetAudience:
                    kind === "organisation"
                      ? { kind }
                      : kind === "employee"
                        ? { kind, employeeId: "" }
                        : kind === "house"
                          ? {
                              kind,
                              houseId:
                                f.category === "house"
                                  ? (f.relatedId ?? "")
                                  : "",
                            }
                          : kind === "client"
                            ? { kind, clientId: f.relatedId ?? "" }
                            : { kind: "role", role: "" },
                })
              }
              options={
                locked
                  ? [{ value: a.kind, label: audienceLabel(s, f) }]
                  : f.category === "staff"
                    ? [
                        { value: "organisation", label: "Organisation staff" },
                        { value: "employee", label: "Specific employee" },
                        { value: "house", label: "Assigned house staff" },
                        { value: "role", label: "Staff role" },
                      ]
                    : [
                        {
                          value: f.category,
                          label:
                            f.category === "client"
                              ? "Authorised client staff"
                              : "Assigned house staff",
                        },
                        {
                          value: "employee",
                          label: "Specific authorised employee",
                        },
                      ]
              }
            />
            {a.kind === "employee" && (
              <SelectField
                label="Employee audience"
                value={a.employeeId}
                onChange={(employeeId) =>
                  set({ targetAudience: { kind: "employee", employeeId } })
                }
                options={[
                  { value: "", label: "Select employee…" },
                  ...s.staff
                    .filter((e) => e.status !== "Inactive")
                    .map((e) => ({ value: e.id, label: e.name })),
                ]}
              />
            )}
            {a.kind === "house" && f.category === "staff" && (
              <SelectField
                label="Audience house"
                value={a.houseId}
                onChange={(houseId) =>
                  set({ targetAudience: { kind: "house", houseId } })
                }
                options={[
                  { value: "", label: "Select house…" },
                  ...s.houses
                    .filter((h) => h.status !== "Inactive")
                    .map((h) => ({ value: h.id, label: h.name })),
                ]}
              />
            )}
            {a.kind === "role" && (
              <SelectField
                label="Audience role"
                value={a.role}
                onChange={(role) =>
                  set({
                    targetAudience: { kind: "role", role } as NoticeAudience,
                  })
                }
                options={[
                  { value: "", label: "Select role…" },
                  ...Array.from(new Set(s.staff.map((e) => e.role))).map(
                    (value) => ({ value, label: value }),
                  ),
                ]}
              />
            )}
            <Field
              label="Title"
              required
              value={f.title}
              onChange={(title) => set({ title })}
            />
            <Field
              label="Message"
              required
              rows={7}
              type="textarea"
              value={f.body}
              onChange={(body) => set({ body })}
            />
            <SelectField
              label="Priority"
              value={f.priority}
              onChange={(priority) =>
                set({ priority: priority as NoticePriority })
              }
              options={["Normal", "Important", "Urgent"].map((value) => ({
                value,
                label: value,
              }))}
            />
            <p className="ad-faint">
              Secure new notice attachments are Future Development. Existing
              attached public demonstration metadata remains available in Staff.
            </p>
          </fieldset>
        </Panel>
        <div className="ad-stack">
          <Panel title="Staff preview">
            <div className="ad-notice-preview">
              <Pill s={f.priority} />
              <b>{f.title || "Notification title"}</b>
              <p>{f.body || "Your message will appear here."}</p>
              <small>Fictional in-app feed preview</small>
            </div>
          </Panel>
          <Panel title="Audience preview">
            <KV
              cols={1}
              items={[
                ["Audience", audienceLabel(s, f)],
                ...(n
                  ? [
                      [
                        "Original author",
                        s.staff.find((e) => e.id === n.createdById)?.name ??
                          "Not supplied (legacy notice)",
                      ],
                      [
                        "Created",
                        n.createdAt
                          ? formatDateTime(n.createdAt)
                          : "Not supplied (legacy notice)",
                      ],
                    ] as Array<[string, string]>
                  : []),
                ["Eligible fictional employees", recipients],
                ["Channel", "Development in-app feed only"],
              ]}
            />
            <p className="ad-faint">
              Content, association and audience are revalidated before
              publication. No push, email, SMS or real-time delivery.
            </p>
          </Panel>
        </div>
      </div>
      {n?.history?.length ? (
        <Panel title="Development change history">
          <ul className="ad-mini-list">
            {n.history.map((e) => (
              <li key={e.id}>
                <div>
                  <b>
                    {e.action} · {e.actorName}
                  </b>
                  <p>{formatDateTime(e.at)}</p>
                  {e.previous && (
                    <details>
                      <summary>Previous state · {e.previous.status}</summary>
                      <p>{e.previous.title}</p>
                      <p className="ad-pre">{e.previous.body}</p>
                      <small>{audienceLabel(s, e.previous)}</small>
                    </details>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
      <Btn
        variant="secondary"
        onClick={() => {
          if (canLeave()) router.push("/admin/notifications")
        }}
      >
        Back to notifications
      </Btn>
      {confirm && (
        <ConfirmDialog
          title={
            confirm === "publish"
              ? "Publish notification?"
              : "Withdraw notification?"
          }
          text={
            confirm === "publish"
              ? `${recipients} eligible fictional employees can see this in the current development session. Published content is read-only. No real delivery occurs.`
              : "Hide this notice from Staff feeds in this session. Preserve original content, audience and withdrawal metadata. No hard deletion."
          }
          confirm={
            confirm === "publish" ? "Confirm publication" : "Confirm withdrawal"
          }
          tone={confirm === "withdraw" ? "danger" : "primary"}
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            if (confirm === "publish") save("Published")
            else {
              try {
                update(withdrawNotice(s, role, id!, new Date().toISOString()))
                setConfirm(null)
                setError("")
              } catch (e) {
                setError((e as Error).message)
                setConfirm(null)
              }
            }
          }}
        />
      )}
    </div>
  )
}
