"use client"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { PageHead, Panel, KV, SubTabs, Pill } from "../ui/core"
import { Avatar, Btn, Modal, Banner, Empty } from "@/modules/staff/ui"
import type { employeeEditor } from "@/server/admin/read"
import { AssignmentDialog } from "./ManagementDialogs"
import { Confirmation, Deferred } from "./ManagementFeedback"
import { command, roleNames, statusNames } from "./client"
interface EmployeeProps {
  data: Awaited<ReturnType<typeof employeeEditor>>
  tab: string
}
export default function EmployeeDetails({ data, tab }: EmployeeProps) {
  const router = useRouter(),
    row = data.employee,
    [assign, setAssign] = useState(false),
    [change, setChange] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("")
  if (!row) return <Empty title="Employee unavailable" />
  const canEdit =
    data.actor.role === "ADMINISTRATOR" || row.role !== "ADMINISTRATOR"
  const go = (t: string) => router.push(`/admin/employees/${row.id}?tab=${t}`)
  return (
    <>
      <PageHead
        title={row.name}
        sub={`${row.employeeCode} · ${roleNames[row.role]}`}
        crumbs={[
          { label: "Employees", to: { page: "employees" } },
          { label: row.name },
        ]}
        actions={
          <>
            <Btn
              variant="secondary"
              disabled={!canEdit}
              onClick={() => router.push(`/admin/employees/${row.id}/edit`)}
            >
              Edit employee
            </Btn>
            <Btn
              variant={row.status === "ACTIVE" ? "danger" : "secondary"}
              disabled={!canEdit || row.id === data.actor.id}
              onClick={() => setChange(true)}
            >
              {row.status === "ACTIVE" ? "Deactivate" : "Activate"}
            </Btn>
          </>
        }
      />
      <Confirmation />
      {message && <p role="status">{message}</p>}
      <SubTabs
        value={tab}
        onChange={go}
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "houses", label: "House assignments" },
          { id: "roster", label: "Roster" },
          { id: "attendance", label: "Attendance" },
          { id: "leave", label: "Leave" },
          { id: "account", label: "Account & permissions" },
        ]}
      />
      {["overview", "account"].includes(tab) ? (
        <Panel
          title={
            tab === "account" ? "Account & permissions" : "Employee details"
          }
        >
          <div className="ad-cell-user">
            <Avatar name={row.name} size={64} />
            <Pill s={statusNames[row.status]} />
          </div>
          <KV
            items={[
              ["Full name", row.name],
              ["Employee ID", row.employeeCode],
              ["Work email", row.email],
              ["Role", roleNames[row.role]],
              ["Account status", statusNames[row.status]],
              [
                "Credential activation",
                row.hasCredentials
                  ? "Credentials provisioned"
                  : "Separate secure provisioning required",
              ],
              [
                "Assigned houses",
                row.assignedHouses.length
                  ? row.assignedHouses.map((h) => (
                      <p key={h.id}>
                        <Link href={`/admin/houses/${h.id}`}>{h.name}</Link>
                      </p>
                    ))
                  : "Unassigned",
              ],
            ]}
          />
          <p className="ad-faint">
            Role and account changes revoke affected sessions. Credentials,
            invitations and recovery are not issued here.
          </p>
        </Panel>
      ) : tab === "houses" ? (
        <Panel
          title="House assignments"
          actions={
            <Btn disabled={!canEdit} onClick={() => setAssign(true)}>
              Assign houses
            </Btn>
          }
        >
          {row.assignedHouses.map((h) => (
            <p key={h.id}>
              <Link href={`/admin/houses/${h.id}`}>{h.name}</Link>
            </p>
          ))}
          {!row.houseIds.length && <p>No houses assigned.</p>}
        </Panel>
      ) : (
        <Deferred />
      )}
      {assign && (
        <AssignmentDialog
          employeeId={row.id}
          name={row.name}
          original={row.houseIds}
          houses={data.houses}
          version={row.updatedAt}
          onClose={() => setAssign(false)}
        />
      )}{" "}
      {change && (
        <Modal
          title={
            row.status === "ACTIVE"
              ? "Deactivate employee?"
              : "Activate employee?"
          }
          onClose={() => {
            if (!saving) setChange(false)
          }}
          footer={
            <>
              <Btn
                variant="secondary"
                disabled={saving}
                onClick={() => setChange(false)}
              >
                Cancel
              </Btn>
              <Btn
                disabled={saving}
                variant="danger"
                onClick={() => {
                  setSaving(true)
                  setError("")
                  void command(
                    `/api/admin/employees/${row.id}/status`,
                    "POST",
                    {
                      status: row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                      expectedUpdatedAt: row.updatedAt,
                    },
                  )
                    .then(() => {
                      setChange(false)
                      setMessage(
                        "Account status saved. Affected sessions have been revoked.",
                      )
                      router.refresh()
                    })
                    .catch((e) => setError((e as Error).message))
                    .finally(() => setSaving(false))
                }}
              >
                {saving ? "Saving…" : "Confirm status change"}
              </Btn>
            </>
          }
        >
          <p>
            Access changes immediately. Assignments, historical attendance and
            documentation are retained; existing shifts are not cancelled.
          </p>
          {!row.hasCredentials && (
            <Banner tone="warning">
              Activation requires separate secure credential provisioning.
            </Banner>
          )}
          {error && <p role="alert">{error}</p>}
        </Modal>
      )}
    </>
  )
}
