"use client"
import { formatDateOnly } from "@/lib/time"
import SessionFeedback from "../ui/SessionFeedback"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Avatar, Btn, Empty, Modal } from "@/modules/staff/ui"
import {
  PageHead,
  Panel,
  SubTabs,
  KV,
  Pill,
  Locked,
  useAdmin,
} from "../ui/core"
import { employeeHouses, setEmployeeStatus } from "../data/adapter"
import AssignHouses from "./AssignHouses"
import StaffPreviewLink from "../ui/StaffPreviewLink"
export default function EmployeeDetail({
  id,
  tab = "overview",
}: {
  id: string
  tab?: string
}) {
  const nav = useAdmin(),
    s = nav.data,
    x = s.staff.find((e) => e.id === id),
    [assign, setAssign] = useState(false),
    [confirm, setConfirm] = useState(false),
    [message, setMessage] = useState("")
  if (!x)
    return (
      <Empty
        title="Employee unavailable"
        text="This record is missing or was created in a previous development session."
      />
    )
  const houses = employeeHouses(s, id),
    locked = nav.role !== "Administrator" && x.role === "Administrator"
  return (
    <>
      <PageHead
        title={
          <span className="ad-title-user">
            <Avatar name={x.name} size={52} photo={x.photo} />
            <span>
              {x.name}
              <small>
                {x.role} · {x.employeeId}
              </small>
            </span>
            <Pill s={x.status ?? "Active"} />
          </span>
        }
        crumbs={[
          { label: "Employees", to: { page: "employees" } },
          { label: x.name },
        ]}
        actions={
          <>
            <StaffPreviewLink employeeId={id} />
            <Btn
              icon="edit"
              disabled={locked}
              onClick={() => nav.go({ page: "employee-form", id })}
            >
              Edit employee
            </Btn>
          </>
        }
      />
      <SessionFeedback entity="Employee record" />
      {message && <p role="status">{message}</p>}
      <SubTabs
        value={tab}
        onChange={(tab) => nav.go({ page: "employee", id, tab })}
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "houses", label: "House assignments", count: houses.length },
          { id: "roster", label: "Roster" },
          { id: "attendance", label: "Attendance" },
          { id: "leave", label: "Leave" },
          { id: "account", label: "Account & permissions" },
        ]}
      />
      {tab === "overview" && (
        <div className="ad-grid-2">
          <Panel title="Personal & contact details">
            <KV
              items={[
                ["Full name", x.name],
                ["Preferred name", x.preferred],
                ["Work email", x.email],
                ["Phone", x.phone],
                ["Home address", x.address],
                ["Emergency contact", x.emergency],
                [
                  "Start date",
                  x.started ? formatDateOnly(x.started) : undefined,
                ],
              ]}
            />
          </Panel>
          <Panel title="At a glance">
            <KV
              items={[
                [
                  "Assigned houses",
                  houses
                    .map((id) => s.houses.find((h) => h.id === id)?.name)
                    .join(", ") || "None",
                ],
                [
                  "Upcoming shifts",
                  s.shifts.filter(
                    (sh) =>
                      sh.staffId === id &&
                      sh.status !== "cancelled" &&
                      sh.end > s.now,
                  ).length,
                ],
                [
                  "Pending leave",
                  s.leaveRequests.filter(
                    (l) => l.employeeId === id && l.status === "pending",
                  ).length,
                ],
                [
                  "Account status",
                  <Pill key="status" s={x.status ?? "Active"} />,
                ],
              ]}
            />
          </Panel>
        </div>
      )}
      {tab === "houses" && (
        <Panel
          title="Assigned houses"
          actions={
            <Btn size="sm" disabled={locked} onClick={() => setAssign(true)}>
              Manage assignments
            </Btn>
          }
        >
          {houses.length ? (
            <div className="ad-card-grid">
              {houses.map((id) => {
                const h = s.houses.find((h) => h.id === id)!
                return (
                  <Link
                    className="ad-house-tile"
                    key={id}
                    href={`/admin/houses/${id}`}
                  >
                    <Image
                      unoptimized
                      width={1080}
                      height={720}
                      src={h.photo}
                      alt=""
                    />
                    <div>
                      <strong>{h.name}</strong>
                      <span>{h.address}</span>
                      <small>View house</small>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <Empty
              title="No houses assigned"
              text="This employee has no current house/client visibility."
            />
          )}
        </Panel>
      )}
      {tab === "account" && (
        <div className="ad-grid-2">
          <Panel title="Account actions">
            <div className="ad-action-list">
              <div>
                <div>
                  <strong>Invitation and password reset</strong>
                  <span>
                    Unavailable until trusted authentication and delivery
                    services are implemented.
                  </span>
                </div>
                <Btn disabled variant="secondary">
                  Unavailable
                </Btn>
              </div>
              <div>
                <div>
                  <strong>
                    {x.status === "Inactive" ? "Reactivate" : "Deactivate"}{" "}
                    development record
                  </strong>
                  <span>
                    Fictional status only. This does not invalidate credentials
                    or real sessions. Historical records and assignments are
                    retained.
                  </span>
                </div>
                {locked ? (
                  <Locked text="Administrator only" />
                ) : (
                  <Btn variant="secondary" onClick={() => setConfirm(true)}>
                    {x.status === "Inactive" ? "Reactivate" : "Deactivate"}
                  </Btn>
                )}
              </div>
              <div>
                <div>
                  <strong>Permanent deletion unavailable</strong>
                  <span>Referenced records are preserved.</span>
                </div>
              </div>
            </div>
          </Panel>
          <Panel title="Role & permissions">
            <KV
              items={[
                ["Role", x.role],
                ["Status", x.status ?? "Active"],
                [
                  "Prototype access",
                  x.role === "Administrator"
                    ? "Broad core management"
                    : x.role === "Manager"
                      ? "Operational management"
                      : "Staff application only",
                ],
              ]}
            />
            {nav.role === "Administrator" ? (
              <Btn onClick={() => nav.go({ page: "employee-form", id })}>
                Change role
              </Btn>
            ) : (
              <Locked text="Role escalation to Administrator is unavailable to Managers." />
            )}
          </Panel>
        </div>
      )}
      {["roster", "attendance", "leave"].includes(tab) && (
        <Panel title={`${tab[0].toUpperCase() + tab.slice(1)} preview`}>
          <p className="ad-faint">
            Related shared records:{" "}
            {tab === "roster"
              ? s.shifts.filter((x) => x.staffId === id).length
              : tab === "attendance"
                ? s.attendance.filter((x) => x.employeeId === id).length
                : s.leaveRequests.filter((x) => x.employeeId === id).length}
            . Management workflows are deferred.
          </p>
          <Link
            className="ad-link"
            href={`/admin/${tab === "leave" ? "leave" : "roster"}`}
          >
            Open future management module
          </Link>
        </Panel>
      )}
      {assign && (
        <AssignHouses
          employeeId={id}
          onClose={() => {
            setAssign(false)
            setMessage(
              "Assignment dialog closed. Current shared assignments are shown above.",
            )
          }}
        />
      )}
      {confirm && (
        <Modal
          title={`${
            x.status === "Inactive" ? "Reactivate" : "Deactivate"
          } ${x.name}?`}
          onClose={() => setConfirm(false)}
          footer={
            <>
              <Btn variant="secondary" onClick={() => setConfirm(false)}>
                Cancel
              </Btn>
              <Btn
                onClick={() => {
                  try {
                    nav.update(
                      setEmployeeStatus(
                        s,
                        nav.role,
                        id,
                        x.status === "Inactive" ? "Active" : "Inactive",
                      ),
                    )
                    setMessage(
                      "Development account status updated. No real credentials or sessions changed.",
                    )
                    setConfirm(false)
                  } catch (e) {
                    setMessage((e as Error).message)
                  }
                }}
              >
                Confirm status change
              </Btn>
            </>
          }
        >
          <p>
            Only the development record status changes. History, shifts and
            assignments remain intact. No real account security or durable audit
            is connected.
          </p>
        </Modal>
      )}
    </>
  )
}
