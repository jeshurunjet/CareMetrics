"use client"
import { useEffect, useRef, useState } from "react"
import { useStaffData, useUpdateStaffData } from "../data/context"
import { Btn } from "../ui"
import FormField from "../ui/FormField"
import { getMyProfile, updateMyProfile, validateProfileInput } from "./adapter"
import type { ProfileInput } from "./types"
import useUnsavedChanges from "../diary/use-unsaved-changes"
export default function ProfileEditForm({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: () => void
}) {
  const s = useStaffData(),
    update = useUpdateStaffData(),
    u = getMyProfile(s)!
  const initial = {
    phone: u.phone ?? "",
    address: u.address ?? "",
    emergency: u.emergency ?? "",
  }
  const [form, setForm] = useState<ProfileInput>(initial),
    [tried, setTried] = useState(false),
    [saved, setSaved] = useState(false),
    [error, setError] = useState("")
  const first = useRef<HTMLInputElement>(null)
  useEffect(() => first.current?.focus(), [])
  const dirty =
    !saved &&
    (form.phone !== initial.phone ||
      form.address !== initial.address ||
      form.emergency !== initial.emergency)
  useUnsavedChanges(dirty)
  const errors = validateProfileInput(form)
  const cancel = () => {
    if (saved) return
    if (
      !dirty ||
      window.confirm(
        "Discard changes? Unsaved profile contact details will be lost.",
      )
    ) {
      setSaved(true)
      onClose()
    }
  }
  return (
    <form
      className="cm-form"
      noValidate
      data-diary-editor
      aria-label="Edit contact details"
      onSubmit={(e) => {
        e.preventDefault()
        if (saved) return
        setTried(true)
        if (Object.keys(errors).length) return
        try {
          const next = updateMyProfile(s, form)
          setSaved(true)
          update(next)
          onSaved()
        } catch {
          setError(
            "Profile changes unavailable. Your details have not been saved.",
          )
        }
      }}
    >
      <p className="cm-hint">
        Development session only · no employee account is updated. Use fictional
        contact information.
      </p>
      <FormField
        label="Mobile phone"
        htmlFor="p-phone"
        required
        error={tried ? errors.phone : undefined}
      >
        <input
          ref={first}
          id="p-phone"
          className="cm-input"
          type="tel"
          autoComplete="off"
          maxLength={32}
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </FormField>
      <FormField
        label="Home address"
        htmlFor="p-addr"
        error={tried ? errors.address : undefined}
        help="Optional · up to 240 characters."
      >
        <input
          id="p-addr"
          className="cm-input"
          autoComplete="off"
          maxLength={240}
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
      </FormField>
      <FormField
        label="Emergency contact"
        htmlFor="p-em"
        error={tried ? errors.emergency : undefined}
        help="Optional · up to 160 characters. This does not contact anyone."
      >
        <input
          id="p-em"
          className="cm-input"
          autoComplete="off"
          maxLength={160}
          value={form.emergency}
          onChange={(e) => setForm({ ...form, emergency: e.target.value })}
        />
      </FormField>
      {error && (
        <p role="alert" className="cm-error">
          {error}
        </p>
      )}
      <div className="cm-row-actions">
        <Btn variant="secondary" disabled={saved} onClick={cancel}>
          Cancel
        </Btn>
        <Btn type="submit" disabled={saved}>
          {saved ? "Saving session details…" : "Save changes"}
        </Btn>
      </div>
    </form>
  )
}
