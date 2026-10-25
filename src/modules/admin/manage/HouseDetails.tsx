"use client"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { PageHead, Panel, KV, SubTabs, Pill } from "../ui/core"
import { Btn, Modal, Banner, Empty } from "@/modules/staff/ui"
import { SelectField } from "../ui/Form"
import type { houseEditor, managementDirectory } from "@/server/admin/read"
import { AssignmentDialog, TransferDialog } from "./ManagementDialogs"
import { Confirmation, Deferred } from "./ManagementFeedback"
interface HouseProps {
  data: Awaited<ReturnType<typeof houseEditor>>
  directory: Awaited<ReturnType<typeof managementDirectory>>
  tab: string
}
export default function HouseDetails({ data, directory, tab }: HouseProps) {
  const router = useRouter(),
    row = data.house,
    [employee, setEmployee] = useState(""),
    [showAssign, setShowAssign] = useState(false),
    [showTransfer, setShowTransfer] = useState(false)
  if (!row) return <Empty title="House unavailable" />
  const employees = directory.employees.filter((e) =>
      e.assignments.some((a) => a.house.id === row.id),
    ),
    clients = directory.clients.filter((c) => c.houseId === row.id),
    chosen = directory.employees.find((e) => e.id === employee)
  const go = (t: string) => router.push(`/admin/houses/${row.id}?tab=${t}`)
  return (
    <>
      <PageHead
        title={row.name}
        sub={row.address}
        crumbs={[
          { label: "Houses", to: { page: "houses" } },
          { label: row.name },
        ]}
        actions={
          <Btn
            variant="secondary"
            onClick={() => router.push(`/admin/houses/${row.id}/edit`)}
          >
            Edit house
          </Btn>
        }
      />
      <Confirmation />
      <SubTabs
        value={tab}
        onChange={go}
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "employees", label: "Employees" },
          { id: "clients", label: "Clients" },
          { id: "location", label: "Location" },
          { id: "diary", label: "House diary" },
          { id: "files", label: "Documents" },
          { id: "notices", label: "Notifications" },
        ]}
      />
      {tab === "overview" ? (
        <Panel title="House details">
          <Pill s={row.active ? "Active" : "Inactive"} />
          <KV
            items={[
              ["House code", row.code],
              ["Address", row.address],
              ["Phone", row.phone],
              ["Email", row.email],
              ["Active clients", row._count.clients],
              ["Active assignments", row._count.assignments],
            ]}
          />
        </Panel>
      ) : tab === "location" ? (
        <Panel title="Location & GPS configuration">
          <KV
            items={[
              ["Latitude", row.latitude],
              ["Longitude", row.longitude],
              ["Verification", "Provisional / unverified"],
              ["Geofence policy", "Not configured"],
            ]}
          />
          <Banner tone="warning">
            Coordinates are configuration only. No live geocoding, GPS check or
            geofence radius is activated.
          </Banner>
        </Panel>
      ) : tab === "employees" ? (
        <Panel
          title="Employees"
          actions={
            <Btn disabled={!row.active} onClick={() => setShowAssign(true)}>
              Assign employee
            </Btn>
          }
        >
          {employees.map((e) => (
            <p key={e.id}>
              <Link href={`/admin/employees/${e.id}?tab=houses`}>{e.name}</Link>
            </p>
          ))}
          {!employees.length && <p>No employees assigned.</p>}
        </Panel>
      ) : tab === "clients" ? (
        <Panel
          title="Clients"
          actions={
            <>
              <Btn
                disabled={!row.active}
                onClick={() =>
                  router.push(`/admin/clients/new?house=${row.id}`)
                }
              >
                Create client
              </Btn>
              <Btn
                disabled={!row.active}
                variant="secondary"
                onClick={() => setShowTransfer(true)}
              >
                Add existing client
              </Btn>
            </>
          }
        >
          {clients.map((c) => (
            <p key={c.id}>
              <Link href={`/admin/clients/${c.id}`}>{c.name}</Link>
              {!c.active && " · Inactive"}
            </p>
          ))}
          {!clients.length && <p>No clients at this house.</p>}
        </Panel>
      ) : (
        <Deferred />
      )}
      {showAssign && !chosen && (
        <Modal
          title="Choose employee to assign"
          onClose={() => setShowAssign(false)}
          footer={
            <Btn variant="secondary" onClick={() => setShowAssign(false)}>
              Close
            </Btn>
          }
        >
          <SelectField
            label="Employee"
            value={employee}
            onChange={setEmployee}
            options={[
              { value: "", label: "Select employee…" },
              ...directory.employees
                .filter(
                  (e) =>
                    data.actor.role === "ADMINISTRATOR" ||
                    e.role !== "ADMINISTRATOR",
                )
                .map((e) => ({ value: e.id, label: e.name })),
            ]}
          />
        </Modal>
      )}
      {showAssign && chosen && (
        <AssignmentDialog
          employeeId={chosen.id}
          name={chosen.name}
          original={chosen.assignments.map((a) => a.house.id)}
          houses={directory.houses
            .filter((h) => h.active)
            .map((h) => ({
              id: h.id,
              name: h.name,
              address: h.address,
              clientCount: h._count.clients,
            }))}
          version={chosen.updatedAt}
          onClose={() => {
            setShowAssign(false)
            setEmployee("")
          }}
        />
      )}
      {showTransfer && (
        <TransferDialog
          clients={directory.clients.filter((c) => c.houseId !== row.id)}
          houses={directory.houses.filter((h) => h.active)}
          presetHouse={row.id}
          onClose={() => setShowTransfer(false)}
        />
      )}
    </>
  )
}
