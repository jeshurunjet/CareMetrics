"use client"
import { useState } from "react"
import { Modal, Btn, Banner } from "@/modules/staff/ui"
import { useAdmin } from "../ui/core"
import {
  assignHouses,
  assignmentConflict,
  employeeHouses,
} from "../data/adapter"
import HousePicker from "./HousePicker"
import { useAdminFormGuard } from "../ui/Form"
export default function AssignHouses({
  employeeId,
  onClose,
  presetHouse,
}: {
  employeeId: string
  onClose: () => void
  presetHouse?: string
}) {
  const nav = useAdmin(),
    original = employeeHouses(nav.data, employeeId),
    [value, setValue] = useState(
      presetHouse ? [...new Set([...original, presetHouse])] : original,
    ),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false)
  const discard = useAdminFormGuard(
      !saved && JSON.stringify(value) !== JSON.stringify(original),
    ),
    conflict = assignmentConflict(nav.data, employeeId, value)
  return (
    <Modal
      title={`Assign houses — ${nav.data.staff.find((e) => e.id === employeeId)?.name}`}
      subtitle="Development session only. Changes affect Staff house and client visibility."
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
            disabled={conflict}
            onClick={() => {
              try {
                nav.update(assignHouses(nav.data, nav.role, employeeId, value))
                setSaved(true)
                onClose()
              } catch (e) {
                setError((e as Error).message)
              }
            }}
          >
            Save changes
          </Btn>
        </>
      }
    >
      <HousePicker value={value} onChange={setValue} />
      {conflict && (
        <Banner tone="warning">
          This employee has scheduled shifts at this house. Review the roster
          before removing the assignment.
        </Banner>
      )}
      {original.some((h) => !value.includes(h)) && (
        <Banner tone="warning">
          Removing an assignment removes current house/client visibility.
          Historical records and shifts are retained.
        </Banner>
      )}
      {error && <p role="alert">{error}</p>}
    </Modal>
  )
}
