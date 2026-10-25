"use client"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { PageHead, Panel, KV, SubTabs, Pill } from "../ui/core"
import { Btn, Empty } from "@/modules/staff/ui"
import type { clientEditor } from "@/server/admin/read"
import { clientPresentation } from "./ManagementForms"
import { ContactsDialog, TransferDialog } from "./ManagementDialogs"
import { Confirmation, Deferred } from "./ManagementFeedback"
interface ClientProps {
  data: Awaited<ReturnType<typeof clientEditor>>
  tab: string
}
export default function ClientDetails({ data, tab }: ClientProps) {
  const router = useRouter(),
    row = data.client,
    client = clientPresentation(data),
    [editContacts, setEditContacts] = useState(false),
    [transfer, setTransfer] = useState(false)
  if (!row || !client) return <Empty title="Client unavailable" />
  return (
    <>
      <PageHead
        title={row.name}
        sub={`${row.reference} · ${row.house.name}`}
        crumbs={[
          { label: "Clients", to: { page: "clients" } },
          { label: row.name },
        ]}
        actions={
          <Btn
            variant="secondary"
            onClick={() => router.push(`/admin/clients/${row.id}/edit`)}
          >
            Edit client
          </Btn>
        }
      />
      <Confirmation />
      <SubTabs
        value={tab}
        onChange={(t) => router.push(`/admin/clients/${row.id}?tab=${t}`)}
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "contacts", label: "Contacts / NOK" },
          { id: "house", label: "House assignment" },
          { id: "diary", label: "Client diary" },
          { id: "care", label: "Care Plan" },
          { id: "chart", label: "Charting" },
          { id: "files", label: "Gallery" },
          { id: "notices", label: "Notifications" },
          { id: "activity", label: "Activity" },
        ]}
      />
      {tab === "overview" ? (
        <Panel title="Client details">
          <Pill s={row.active ? "Active" : "Inactive"} />
          <KV
            items={[
              ["Full name", row.name],
              ["Preferred name", row.preferredName],
              ["Client reference", row.reference],
              ["Date of birth", row.dateOfBirth],
              [
                "Current house",
                <Link key="house" href={`/admin/houses/${row.houseId}`}>
                  {row.house.name}
                </Link>,
              ],
              ["Profile summary", row.summary],
            ]}
          />
        </Panel>
      ) : tab === "contacts" ? (
        <Panel
          title="Contacts / Next of kin"
          actions={
            <Btn onClick={() => setEditContacts(true)}>Edit contacts</Btn>
          }
        >
          {row.contacts.map((c) => (
            <section key={c.id} className="ad-contact-row">
              <h3>{c.name}</h3>
              <KV
                items={[
                  ["Relationship", c.relationship],
                  ["Phone", c.phone],
                  ["Email", c.email],
                  ["Primary contact", c.isPrimary ? "Yes" : "No"],
                  ["Emergency contact", c.isEmergency ? "Yes" : "No"],
                ]}
              />
            </section>
          ))}
          {!row.contacts.length && <p>No contacts recorded.</p>}
        </Panel>
      ) : tab === "house" ? (
        <Panel
          title="Current house"
          actions={<Btn onClick={() => setTransfer(true)}>Transfer client</Btn>}
        >
          <Link href={`/admin/houses/${row.houseId}`}>{row.house.name}</Link>
          <p className="ad-faint">
            One current house. Transfers change current Staff visibility and
            retain the client ID, contacts and historical references.
          </p>
        </Panel>
      ) : tab === "activity" ? (
        <Panel title="Persistent audit foundation">
          <p>
            Management mutations create minimal append-only audit events. Full
            Reports & Audit, retention and compliance tooling remain
            unavailable.
          </p>
        </Panel>
      ) : (
        <Deferred />
      )}
      {editContacts && (
        <ContactsDialog
          clientId={row.id}
          original={client.contacts}
          version={row.updatedAt}
          onClose={() => setEditContacts(false)}
        />
      )}{" "}
      {transfer && (
        <TransferDialog
          clients={[row]}
          houses={data.houses.filter((h) => h.status !== "Inactive")}
          clientId={row.id}
          onClose={() => setTransfer(false)}
        />
      )}
    </>
  )
}
