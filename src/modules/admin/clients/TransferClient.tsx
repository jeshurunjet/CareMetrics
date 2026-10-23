"use client"
import { useState } from "react"
import { Modal, Btn, Banner } from "@/modules/staff/ui"
import { useAdmin } from "../ui/core"
import { SelectField, useAdminFormGuard } from "../ui/Form"
import { transferClient } from "../data/adapter"
export default function TransferClient({
  clientId,
  houseId,
  onClose,
}: {
  clientId?: string
  houseId?: string
  onClose: () => void
}) {
  const nav = useAdmin(),
    s = nav.data,
    [selected, setSelected] = useState(clientId ?? ""),
    [target, setTarget] = useState(houseId ?? ""),
    [confirm, setConfirm] = useState(false),
    [saved, setSaved] = useState(false),
    [error, setError] = useState("")
  const c = s.clients.find((c) => c.id === selected),
    discard = useAdminFormGuard(
      !saved && (selected !== (clientId ?? "") || target !== (houseId ?? "")),
    )
  return (
    <Modal
      title="Transfer client to another house"
      onClose={() => {
        if (discard()) onClose()
      }}
      footer={
        <>
          <Btn
            variant="secondary"
            onClick={() => {
              if (discard()) onClose()
            }}
          >
            Cancel
          </Btn>
          <Btn
            disabled={!c || !target || target === c.houseId}
            onClick={() => {
              if (!confirm) {
                setConfirm(true)
                return
              }
              try {
                nav.update(transferClient(s, nav.role, selected, target, true))
                setSaved(true)
                onClose()
              } catch (e) {
                setError((e as Error).message)
              }
            }}
          >
            {confirm ? "Confirm transfer" : "Review transfer"}
          </Btn>
        </>
      }
    >
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
            ...s.clients
              .filter((c) => c.houseId !== houseId)
              .map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
      )}
      {c && (
        <p>
          Current house:{" "}
          <strong>{s.houses.find((h) => h.id === c.houseId)?.name}</strong>
        </p>
      )}
      <SelectField
        label="New house"
        value={target}
        disabled={!!houseId}
        onChange={(v) => {
          setTarget(v)
          setConfirm(false)
        }}
        options={[
          { value: "", label: "Select house…" },
          ...s.houses
            .filter((h) => h.status !== "Inactive")
            .map((h) => ({ value: h.id, label: h.name })),
        ]}
      />
      {confirm && c && (
        <Banner tone="warning" title="Confirm the change in staff visibility">
          {c.name} will move from{" "}
          {s.houses.find((h) => h.id === c.houseId)?.name} to{" "}
          {s.houses.find((h) => h.id === target)?.name}. Staff assigned only to
          the former house lose current access. The client ID, diary, care
          records, template versions, files and historical author IDs are
          retained. Historical access policy awaits organisational approval.
        </Banner>
      )}
      {error && <p role="alert">{error}</p>}
    </Modal>
  )
}
