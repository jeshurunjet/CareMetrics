"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Btn, Modal, Banner } from "@/modules/staff/ui"
import { HousePickerView } from "../employees/HousePicker"
import ContactsEditor from "../clients/ContactsEditor"
import { SelectField, useAdminFormGuard } from "../ui/Form"
import type { employeeEditor } from "@/server/admin/read"
import type { ClientContact } from "@/modules/staff/data/types"
import { command, contactCommands } from "./client"
type EmployeeData = Awaited<ReturnType<typeof employeeEditor>>
interface AssignmentProps {
  employeeId: string
  name: string
  original: string[]
  houses: EmployeeData["houses"]
  version: string
  onClose: () => void
}
export function AssignmentDialog({
  employeeId,
  name,
  original,
  houses,
  version,
  onClose,
}: AssignmentProps) {
  const router = useRouter(),
    [value, setValue] = useState(original),
    [saving, setSaving] = useState(false),
    [saved, setSaved] = useState(false),
    [error, setError] = useState("")
  const discard = useAdminFormGuard(
    !saved && JSON.stringify(original) !== JSON.stringify(value),
  )
  const close = () => {
    if (!saving && discard()) onClose()
  }
  return (
    <Modal
      title={`Assign houses — ${name}`}
      subtitle="Changes persist and affect current Staff access."
      onClose={close}
      footer={
        <>
          <Btn variant="secondary" disabled={saving} onClick={close}>
            Cancel
          </Btn>
          <Btn
            disabled={saving}
            onClick={() => {
              setSaving(true)
              setError("")
              void command(
                `/api/admin/employees/${employeeId}/assignments`,
                "PUT",
                { houseIds: value, expectedUpdatedAt: version },
              )
                .then(() => {
                  setSaved(true)
                  onClose()
                  router.refresh()
                })
                .catch((e) => setError((e as Error).message))
                .finally(() => setSaving(false))
            }}
          >
            {saving ? "Saving…" : "Save changes"}
          </Btn>
        </>
      }
    >
      <div inert={saving}>
        <HousePickerView value={value} onChange={setValue} houses={houses} />
      </div>
      {original.some((id) => !value.includes(id)) && (
        <Banner tone="warning">
          Removing an assignment removes current access. Scheduled shift
          dependencies are checked on the server; history is retained.
        </Banner>
      )}
      {error && <p role="alert">{error}</p>}
    </Modal>
  )
}
interface ContactsProps {
  clientId: string
  original: ClientContact[]
  version: string
  onClose: () => void
}
export function ContactsDialog({
  clientId,
  original,
  version,
  onClose,
}: ContactsProps) {
  const router = useRouter(),
    [contacts, setContacts] = useState(original),
    [saving, setSaving] = useState(false),
    [saved, setSaved] = useState(false),
    [error, setError] = useState("")
  const discard = useAdminFormGuard(
    !saved && JSON.stringify(original) !== JSON.stringify(contacts),
  )
  const close = () => {
    if (!saving && discard()) onClose()
  }
  return (
    <Modal
      title="Edit contacts / next of kin"
      onClose={close}
      wide
      footer={
        <>
          <Btn variant="secondary" disabled={saving} onClick={close}>
            Cancel
          </Btn>
          <Btn
            disabled={saving}
            onClick={() => {
              setSaving(true)
              setError("")
              void command(`/api/admin/clients/${clientId}/contacts`, "PUT", {
                contacts: contactCommands(contacts, original),
                confirmedRemovalIds: original
                  .filter((c) => !contacts.some((o) => o.id === c.id))
                  .map((c) => c.id),
                expectedUpdatedAt: version,
              })
                .then(() => {
                  setSaved(true)
                  onClose()
                  router.refresh()
                })
                .catch((e) => setError((e as Error).message))
                .finally(() => setSaving(false))
            }}
          >
            {saving ? "Saving…" : "Save contacts"}
          </Btn>
        </>
      }
    >
      <div inert={saving}>
        <ContactsEditor backend contacts={contacts} onChange={setContacts} />
      </div>
      {error && <p role="alert">{error}</p>}
    </Modal>
  )
}
interface TransferOption {
  id: string
  name: string
  houseId: string
  updatedAt: string
}
interface HouseChoice {
  id: string
  name: string
}
interface TransferProps {
  clients: TransferOption[]
  houses: HouseChoice[]
  clientId?: string
  presetHouse?: string
  onClose: () => void
}
export function TransferDialog({
  clients,
  houses,
  clientId,
  presetHouse,
  onClose,
}: TransferProps) {
  const router = useRouter(),
    [selected, setSelected] = useState(clientId ?? ""),
    [target, setTarget] = useState(presetHouse ?? ""),
    [confirm, setConfirm] = useState(false),
    [saving, setSaving] = useState(false),
    [saved, setSaved] = useState(false),
    [error, setError] = useState("")
  const row = clients.find((c) => c.id === selected),
    discard = useAdminFormGuard(
      !saved &&
        (selected !== (clientId ?? "") || target !== (presetHouse ?? "")),
    )
  const close = () => {
    if (!saving && discard()) onClose()
  }
  return (
    <Modal
      title="Transfer client to another house"
      onClose={close}
      footer={
        <>
          <Btn variant="secondary" disabled={saving} onClick={close}>
            Cancel
          </Btn>
          <Btn
            disabled={saving || !row || !target || target === row.houseId}
            onClick={() => {
              if (!confirm) {
                setConfirm(true)
                return
              }
              if (!row) return
              setSaving(true)
              setError("")
              void command(`/api/admin/clients/${row.id}/transfer`, "POST", {
                houseId: target,
                confirmed: true,
                expectedUpdatedAt: row.updatedAt,
              })
                .then(() => {
                  setSaved(true)
                  onClose()
                  router.refresh()
                })
                .catch((e) => setError((e as Error).message))
                .finally(() => setSaving(false))
            }}
          >
            {saving
              ? "Saving…"
              : confirm
                ? "Confirm transfer"
                : "Review transfer"}
          </Btn>
        </>
      }
    >
      <div inert={saving}>
        {!clientId && (
          <SelectField
            label="Client"
            value={selected}
            onChange={(v) => {
              setSelected(v)
              setConfirm(false)
            }}
            options={[
              { value: "", label: "Select client…" },
              ...clients.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        )}
        <SelectField
          label="New house"
          value={target}
          disabled={!!presetHouse}
          onChange={(v) => {
            setTarget(v)
            setConfirm(false)
          }}
          options={[
            { value: "", label: "Select house…" },
            ...houses.map((h) => ({ value: h.id, label: h.name })),
          ]}
        />
      </div>
      {confirm && row && (
        <Banner tone="warning" title="Confirm the change in staff visibility">
          {row.name} will move from{" "}
          {houses.find((h) => h.id === row.houseId)?.name ??
            "the current house"}{" "}
          to {houses.find((h) => h.id === target)?.name}. Staff access changes
          immediately. Contacts and historical records/author IDs are retained.
        </Banner>
      )}
      {error && <p role="alert">{error}</p>}
    </Modal>
  )
}
