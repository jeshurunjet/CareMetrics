"use client"
import { formatDateOnly } from "@/lib/time"
import SessionFeedback from "../ui/SessionFeedback"
import Link from "next/link"
import { useState } from "react"
import type { ClientContact } from "@/modules/staff/data/types"
import { Avatar, Btn, Empty, Banner } from "@/modules/staff/ui"
import { PageHead, Panel, SubTabs, KV, Pill, useAdmin } from "../ui/core"
import { FormErrors, useAdminFormGuard } from "../ui/Form"
import type { Errors } from "../data/types"
import { saveContacts } from "../data/adapter"
import ContactsEditor from "./ContactsEditor"
import TransferClient from "./TransferClient"
export default function ClientDetail({
  id,
  tab = "overview",
}: {
  id: string
  tab?: string
}) {
  const nav = useAdmin(),
    s = nav.data,
    c = s.clients.find((c) => c.id === id),
    [editing, setEditing] = useState<ClientContact[] | null>(null),
    [errors, setErrors] = useState<Errors>({}),
    [message, setMessage] = useState(""),
    [transfer, setTransfer] = useState(false)
  const discard = useAdminFormGuard(
    editing !== null && JSON.stringify(editing) !== JSON.stringify(c?.contacts),
  )
  if (!c)
    return (
      <Empty
        title="Client unavailable"
        text="This record is missing or was created in a previous development session."
      />
    )
  const h = s.houses.find((h) => h.id === c.houseId),
    cancel = () => {
      if (discard()) {
        setEditing(null)
        setErrors({})
      }
    }
  return (
    <>
      <PageHead
        title={
          <span className="ad-title-user">
            <Avatar name={c.name} size={52} photo={c.photo} tone={c.tone} />
            <span>
              {c.name}
              <small>
                {c.ref} ·{" "}
                <Link className="ad-link" href={`/admin/houses/${c.houseId}`}>
                  {h?.name}
                </Link>
              </small>
            </span>
            <Pill s={c.status ?? "Active"} />
          </span>
        }
        crumbs={[
          { label: "Clients", to: { page: "clients" } },
          { label: c.name },
        ]}
        actions={
          <Btn icon="edit" onClick={() => nav.go({ page: "client-form", id })}>
            Edit client
          </Btn>
        }
      />
      <SessionFeedback entity="Client record" />
      {message && <Banner tone="info">{message}</Banner>}
      <SubTabs
        value={tab}
        onChange={(tab) => {
          if (editing && !discard()) return
          setEditing(null)
          nav.go({ page: "client", id, tab })
        }}
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "contacts", label: "Contacts / NOK", count: c.contacts.length },
          { id: "house", label: "House assignment" },
          { id: "diary", label: "Diary" },
          { id: "care", label: "Care Plans" },
          { id: "chart", label: "Charting" },
          { id: "files", label: "Gallery / Documents" },
          { id: "notices", label: "Notices / Concerns" },
          { id: "activity", label: "Activity history" },
        ]}
      />
      {tab === "overview" && (
        <div className="ad-grid-main">
          <Panel title="Personal information">
            <KV
              items={[
                ["Full name", c.name],
                ["Preferred name", c.preferred],
                ["Date of birth", c.dob ? formatDateOnly(c.dob) : undefined],
                ["Client reference", c.ref],
                ["NHI (restricted)", c.nhi || "Not provided"],
                [
                  "House",
                  <Link
                    key="house"
                    className="ad-link"
                    href={`/admin/houses/${c.houseId}`}
                  >
                    {h?.name}
                  </Link>,
                ],
                ["Contacts", c.contacts.length],
              ]}
            />
            <p className="ad-body">{c.summary}</p>
          </Panel>
          <Panel title="Alerts">
            {c.alerts.length ? (
              c.alerts.map((a) => (
                <Banner key={a} tone="danger">
                  {a}
                </Banner>
              ))
            ) : (
              <p className="ad-empty-inline">No alerts.</p>
            )}
          </Panel>
        </div>
      )}
      {tab === "contacts" && (
        <div data-diary-editor={editing ? true : undefined}>
          <Panel
            title="Contacts / next of kin"
            actions={
              editing ? (
                <>
                  <Btn variant="secondary" size="sm" onClick={cancel}>
                    Cancel
                  </Btn>
                  <Btn
                    size="sm"
                    onClick={() => {
                      try {
                        nav.update(saveContacts(s, nav.role, id, editing))
                        setEditing(null)
                        setErrors({})
                        setMessage(
                          "Contacts saved in this development session · visible in the Staff Client Profile. No database write.",
                        )
                      } catch (e) {
                        setErrors({ contacts: (e as Error).message })
                      }
                    }}
                  >
                    Save contacts
                  </Btn>
                </>
              ) : (
                <Btn
                  size="sm"
                  icon="edit"
                  onClick={() => setEditing(c.contacts.map((c) => ({ ...c })))}
                >
                  Edit contacts
                </Btn>
              )
            }
          >
            <FormErrors errors={errors} />
            {editing ? (
              <ContactsEditor contacts={editing} onChange={setEditing} />
            ) : c.contacts.length ? (
              <div className="ad-card-grid">
                {c.contacts.map((k) => (
                  <div key={k.id} className="ad-contact-card">
                    <Avatar name={k.name} size={40} />
                    <div>
                      <strong>{k.name}</strong>
                      <span>{k.relation}</span>
                      <span>{k.phone ?? "Phone not provided"}</span>
                      <span>{k.email}</span>
                      <div className="ad-chips">
                        {k.primary && <span className="ad-chip">Primary</span>}
                        {k.emergency && (
                          <span className="ad-chip ad-chip--danger">
                            Emergency
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty title="No contacts" />
            )}
          </Panel>
        </div>
      )}
      {tab === "house" && (
        <Panel title="Current house assignment">
          <KV
            items={[
              ["Current house", h?.name],
              ["Address", h?.address],
              [
                "Current staff audience",
                s.assignments.filter((a) => a.houseId === c.houseId).length,
              ],
            ]}
          />
          <Btn onClick={() => setTransfer(true)}>Change house</Btn>
          <p className="ad-faint">
            Transfers require confirmation and retain this client ID and all
            historical records.
          </p>
        </Panel>
      )}
      {["diary", "care", "chart", "files", "notices", "activity"].includes(
        tab,
      ) && (
        <Panel title="Shared documentation preview">
          {tab === "diary" ? (
            <p>
              {
                s.diary.filter((d) => d.scope === "client" && d.targetId === id)
                  .length
              }{" "}
              diary records
            </p>
          ) : tab === "care" || tab === "chart" ? (
            <>
              <p>
                {
                  s.careRecords.filter(
                    (r) =>
                      r.clientId === id &&
                      s.careTemplates.some(
                        (t) =>
                          t.id === r.templateId &&
                          t.kind === (tab === "care" ? "care" : "chart"),
                      ),
                  ).length
                }{" "}
                care records
              </p>
              <ul>
                {s.careAssignments
                  .filter(
                    (a) =>
                      a.clientId === id &&
                      s.careTemplates.some(
                        (t) =>
                          t.id === a.templateId &&
                          t.kind === (tab === "care" ? "care" : "chart"),
                      ),
                  )
                  .map((a) => (
                    <li key={a.templateId}>
                      {s.careTemplates.find((t) => t.id === a.templateId)?.name}{" "}
                      · v{a.version} · {a.status}
                    </li>
                  ))}
              </ul>
            </>
          ) : tab === "files" ? (
            <p>
              {
                s.attachments.filter(
                  (a) =>
                    a.association.scope === "client" &&
                    a.association.targetId === id,
                ).length
              }{" "}
              available file metadata records
            </p>
          ) : tab === "notices" ? (
            <p>
              {
                s.notices.filter(
                  (n) => n.category === "client" && n.relatedId === id,
                ).length
              }{" "}
              notices ·{" "}
              {
                s.concerns.filter(
                  (n) => n.context === "client" && n.targetId === id,
                ).length
              }{" "}
              concerns
            </p>
          ) : (
            <p>
              No production audit log is connected. Existing records retain
              author and event metadata.
            </p>
          )}
          <p className="ad-faint">
            Read-only summary of existing shared records. Template management,
            approvals, file removal, notice publishing and audit are future
            modules.
          </p>
        </Panel>
      )}
      {transfer && (
        <TransferClient
          clientId={id}
          onClose={() => {
            setTransfer(false)
            setMessage(
              "Current shared house assignment is shown above. History remains unchanged.",
            )
          }}
        />
      )}
    </>
  )
}
