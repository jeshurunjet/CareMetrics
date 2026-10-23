"use client"
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
  DataTable,
  useAdmin,
} from "../ui/core"
import { SelectField } from "../ui/Form"
import AssignHouses from "../employees/AssignHouses"
import TransferClient from "../clients/TransferClient"
import HouseLocation from "./HouseLocation"
export default function HouseDetail({
  id,
  tab = "overview",
}: {
  id: string
  tab?: string
}) {
  const nav = useAdmin(),
    s = nav.data,
    h = s.houses.find((h) => h.id === id),
    [pick, setPick] = useState(false),
    [employee, setEmployee] = useState(""),
    [assign, setAssign] = useState<string>(),
    [transfer, setTransfer] = useState(false)
  if (!h)
    return (
      <Empty
        title="House unavailable"
        text="This record is missing or was created in a previous development session."
      />
    )
  const staff = s.staff.filter((e) =>
      s.assignments.some((a) => a.employeeId === e.id && a.houseId === id),
    ),
    clients = s.clients.filter((c) => c.houseId === id)
  return (
    <>
      <PageHead
        title={
          <span className="ad-title-user">
            <Image
              unoptimized
              width={1080}
              height={720}
              className="ad-thumb ad-thumb--lg"
              src={h.photo}
              alt=""
            />
            <SessionFeedback entity="House record" />
            <span>
              {h.name}
              <small>
                {h.code} · {h.address}
              </small>
            </span>
            <Pill s={h.status ?? "Active"} />
          </span>
        }
        crumbs={[
          { label: "Houses", to: { page: "houses" } },
          { label: h.name },
        ]}
        actions={
          <Btn icon="edit" onClick={() => nav.go({ page: "house-form", id })}>
            Edit house
          </Btn>
        }
      />
      <SubTabs
        value={tab}
        onChange={(tab) => nav.go({ page: "house", id, tab })}
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "employees", label: "Employees", count: staff.length },
          { id: "clients", label: "Clients", count: clients.length },
          { id: "location", label: "Location / GPS" },
          { id: "diary", label: "House diary" },
          { id: "files", label: "Files & photos" },
          { id: "notices", label: "Notifications" },
        ]}
      />
      {tab === "overview" && (
        <div className="ad-grid-main">
          <Panel title="House profile">
            <Image
              unoptimized
              width={1080}
              height={720}
              className="ad-banner-img"
              src={h.photo}
              alt={h.name}
            />
            <KV
              items={[
                ["Address", h.address],
                ["Suburb / city", h.suburb],
                ["Phone", h.phone],
                ["Email", h.email],
                ["Manager", h.manager],
                ["Status", <Pill key="status" s={h.status ?? "Active"} />],
              ]}
            />
            <p className="ad-body">{h.description}</p>
          </Panel>
          <Panel title="Today">
            <KV
              cols={1}
              items={[
                ["Clients", clients.length],
                ["Assigned employees", staff.length],
                [
                  "Location",
                  h.locationSet === false
                    ? "Not configured"
                    : "Fictional configured coordinates",
                ],
                ["GPS verification", "Unavailable"],
              ]}
            />
          </Panel>
        </div>
      )}
      {tab === "location" && <HouseLocation house={h} />}
      {tab === "employees" && (
        <Panel
          title="Assigned employees"
          pad={false}
          actions={
            <Btn size="sm" icon="plus" onClick={() => setPick(true)}>
              Add employee
            </Btn>
          }
        >
          <DataTable
            rows={staff}
            onRow={(e) => nav.go({ page: "employee", id: e.id })}
            cols={[
              {
                key: "name",
                label: "Employee",
                render: (e) => (
                  <span className="ad-cell-user">
                    <Avatar name={e.name} photo={e.photo} size={28} />
                    {e.name}
                  </span>
                ),
              },
              { key: "role", label: "Role", render: (e) => e.role },
              {
                key: "status",
                label: "Status",
                render: (e) => <Pill s={e.status ?? "Active"} />,
              },
              {
                key: "action",
                label: "Actions",
                render: (e) => (
                  <span onClick={(event) => event.stopPropagation()}>
                    <Btn
                      size="sm"
                      variant="ghost"
                      onClick={() => setAssign(e.id)}
                    >
                      Manage / remove assignment
                    </Btn>
                  </span>
                ),
              },
            ]}
          />
        </Panel>
      )}
      {tab === "clients" && (
        <Panel
          title="Clients living here"
          pad={false}
          actions={
            <>
              <Btn
                size="sm"
                onClick={() => nav.go({ page: "client-form", tab: id })}
              >
                Create client here
              </Btn>
              <Btn
                size="sm"
                variant="secondary"
                onClick={() => setTransfer(true)}
              >
                Add existing client
              </Btn>
            </>
          }
        >
          <DataTable
            rows={clients}
            onRow={(c) => nav.go({ page: "client", id: c.id })}
            cols={[
              {
                key: "name",
                label: "Client",
                render: (c) => (
                  <span className="ad-cell-user">
                    <Avatar name={c.name} photo={c.photo} size={28} />
                    {c.name}
                  </span>
                ),
              },
              { key: "ref", label: "Reference", render: (c) => c.ref },
              {
                key: "status",
                label: "Status",
                render: (c) => <Pill s={c.status ?? "Active"} />,
              },
            ]}
            empty={<Empty title="No clients in this house" />}
          />
        </Panel>
      )}
      {["diary", "files", "notices"].includes(tab) && (
        <Panel title="Related development records">
          <p className="ad-faint">
            {tab === "diary"
              ? s.diary.filter((d) => d.scope === "house" && d.targetId === id)
                  .length
              : tab === "files"
                ? s.attachments.filter(
                    (a) =>
                      a.association.scope === "house" &&
                      a.association.targetId === id,
                  ).length
                : s.notices.filter(
                    (n) => n.category === "house" && n.relatedId === id,
                  ).length}{" "}
            shared records. Management editing/review is deferred.
          </p>
          <Link
            className="ad-link"
            href={`/admin/${
              tab === "diary"
                ? "documentation"
                : tab === "files"
                  ? "files"
                  : "notifications"
            }`}
          >
            Open future management module
          </Link>
        </Panel>
      )}
      {pick && (
        <Modal
          title="Add employee to house"
          onClose={() => {
            setPick(false)
            setEmployee("")
          }}
          footer={
            <Btn
              disabled={!employee}
              onClick={() => {
                setAssign(employee)
                setPick(false)
              }}
            >
              Review assignments
            </Btn>
          }
        >
          <SelectField
            label="Employee"
            value={employee}
            onChange={setEmployee}
            options={[
              { value: "", label: "Select employee…" },
              ...s.staff
                .filter((e) => !staff.some((st) => st.id === e.id))
                .map((e) => ({ value: e.id, label: e.name })),
            ]}
          />
        </Modal>
      )}
      {assign && (
        <AssignHouses
          employeeId={assign}
          presetHouse={pick ? undefined : employee === assign ? id : undefined}
          onClose={() => {
            setAssign(undefined)
            setEmployee("")
          }}
        />
      )}
      {transfer && (
        <TransferClient houseId={id} onClose={() => setTransfer(false)} />
      )}
    </>
  )
}
