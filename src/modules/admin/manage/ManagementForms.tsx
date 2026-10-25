"use client"
import { EmployeeFormView } from "../employees/EmployeeForm"
import { HouseFormView } from "../houses/HouseForm"
import { ClientFormView } from "../clients/ClientForm"
import type {
  employeeEditor,
  houseEditor,
  clientEditor,
} from "@/server/admin/read"
import {
  command,
  contactCommands,
  roleNames,
  roleCodes,
  statusNames,
} from "./client"
import type { Employee, House, Client } from "@/modules/staff/data/types"
import { Locked } from "../ui/core"
type EmployeeData = Awaited<ReturnType<typeof employeeEditor>>
type HouseData = Awaited<ReturnType<typeof houseEditor>>
export type ClientData = Awaited<ReturnType<typeof clientEditor>>
export function EmployeeEditor({ data }: { data: EmployeeData }) {
  const row = data.employee
  if (row?.role === "ADMINISTRATOR" && data.actor.role !== "ADMINISTRATOR")
    return (
      <Locked text="Administrator accounts can only be edited by an Administrator." />
    )
  const employee: Employee | undefined = row
    ? {
        id: row.id,
        name: row.name,
        employeeId: row.employeeCode,
        email: row.email,
        role: roleNames[row.role],
        status: statusNames[row.status],
      }
    : undefined
  return (
    <EmployeeFormView
      key={row?.updatedAt ?? "new"}
      backend
      id={row?.id}
      employee={employee}
      actorRole={roleNames[data.actor.role]}
      roleOptions={Object.values(roleNames)}
      houseIds={row?.houseIds ?? []}
      houses={data.houses}
      onSave={async (f) =>
        command(
          `/api/admin/employees${row ? "/" + row.id : ""}`,
          row ? "PATCH" : "POST",
          {
            name: `${f.first.trim()} ${f.last.trim()}`,
            employeeCode: f.employeeId,
            email: f.email,
            role: roleCodes[f.role],
            status: f.status.toUpperCase(),
            houseIds: f.houses,
            ...(row ? { expectedUpdatedAt: row.updatedAt } : {}),
          },
        )
      }
    />
  )
}
function coordinate(value: string, field: string): number | null {
  if (!value.trim()) return null
  const number = Number(value)
  if (!Number.isFinite(number))
    throw Object.assign(new Error("Enter valid coordinates."), {
      fields: { [field]: "Enter a finite coordinate." },
    })
  return number
}
export function HouseEditor({ data }: { data: HouseData }) {
  const row = data.house
  const house: House | undefined = row
    ? {
        id: row.id,
        name: row.name,
        code: row.code,
        address: row.address,
        phone: row.phone ?? "",
        email: row.email ?? "",
        status: row.active ? "Active" : "Inactive",
        lat: row.latitude ?? 0,
        lng: row.longitude ?? 0,
        locationSet: row.latitude !== null && row.longitude !== null,
        manager: "",
        photo: "",
      }
    : undefined
  return (
    <HouseFormView
      key={row?.updatedAt ?? "new"}
      backend
      id={row?.id}
      house={house}
      managers={[]}
      onSave={async (f) =>
        command(
          `/api/admin/houses${row ? "/" + row.id : ""}`,
          row ? "PATCH" : "POST",
          {
            name: f.name,
            code: f.code,
            address: f.address,
            phone: f.phone,
            email: f.email,
            active: f.status === "Active",
            latitude: coordinate(f.lat, "lat"),
            longitude: coordinate(f.lng, "lat"),
            ...(row ? { expectedUpdatedAt: row.updatedAt } : {}),
          },
        )
      }
    />
  )
}
export function clientPresentation(data: ClientData): Client | undefined {
  const row = data.client
  return row
    ? {
        id: row.id,
        name: row.name,
        preferred: row.preferredName ?? row.name,
        ref: row.reference,
        dob: row.dateOfBirth,
        summary: row.summary ?? "",
        houseId: row.houseId,
        status: row.active ? "Active" : "Inactive",
        tone: "var(--color-brand)",
        alerts: [],
        contacts: row.contacts.map((c) => ({
          id: c.id,
          name: c.name,
          relation: c.relationship,
          phone: c.phone ?? "",
          email: c.email ?? "",
          primary: c.isPrimary,
          emergency: c.isEmergency,
        })),
      }
    : undefined
}
export function ClientEditor({
  data,
  houseId,
}: {
  data: ClientData
  houseId?: string
}) {
  const row = data.client,
    client = clientPresentation(data)
  return (
    <ClientFormView
      key={row?.updatedAt ?? "new"}
      backend
      id={row?.id}
      client={client}
      houseId={houseId}
      houses={data.houses}
      onSave={async (f, contacts) =>
        command(
          `/api/admin/clients${row ? "/" + row.id : ""}`,
          row ? "PATCH" : "POST",
          {
            name: `${f.first.trim()} ${f.last.trim()}`,
            preferredName: f.preferred,
            reference: f.ref,
            dateOfBirth: f.dob,
            summary: f.summary,
            houseId: f.houseId,
            active: f.status === "Active",
            contacts: contactCommands(contacts, client?.contacts ?? []),
            confirmedRemovalIds: (client?.contacts ?? [])
              .filter((c) => !contacts.some((o) => o.id === c.id))
              .map((c) => c.id),
            ...(row ? { expectedUpdatedAt: row.updatedAt } : {}),
          },
        )
      }
    />
  )
}
