"use client"
import { useState } from "react"
import { Btn, Modal, Banner } from "@/modules/staff/ui"
import type { ClientContact } from "@/modules/staff/data/types"
import { Field } from "../ui/Form"
export default function ContactsEditor({
  contacts,
  onChange,
  backend = false,
}: {
  backend?: boolean
  contacts: ClientContact[]
  onChange: (value: ClientContact[]) => void
}) {
  const [remove, setRemove] = useState<string>()
  const target = contacts.find((c) => c.id === remove)
  const patch = (id: string, change: Partial<ClientContact>) =>
    onChange(
      contacts.map((c) =>
        c.id === id
          ? { ...c, ...change }
          : change.primary
            ? { ...c, primary: false }
            : c,
      ),
    )
  return (
    <div className="ad-contacts">
      {!contacts.length && (
        <p className="ad-empty-inline">No contacts recorded.</p>
      )}
      {contacts.map((c, index) => (
        <section
          key={c.id}
          className="ad-contact-row"
          aria-label={`Contact ${index + 1}`}
        >
          <div className="ad-grid-3">
            {([
              ["name", "Full name"],
              ["relation", "Relationship"],
              ["phone", "Phone"],
              ["email", "Email"],
              ["address", "Address"],
              ["notes", "Notes"],
            ] as const).map(([key, label]) => (
              <Field
                key={key}
                label={label}
                value={c[key] ?? ""}
                onChange={(value) => patch(c.id, { [key]: value })}
                required={["name", "relation"].includes(key)}
                disabled={backend && ["address", "notes"].includes(key)}
                help={
                  backend && ["address", "notes"].includes(key)
                    ? "Future Development · not stored"
                    : undefined
                }
                type={
                  key === "phone" ? "tel" : key === "email" ? "email" : "text"
                }
              />
            ))}
          </div>
          <div className="ad-contact-flags">
            <label className="ad-check">
              <input
                type="checkbox"
                checked={!!c.primary}
                onChange={(e) => patch(c.id, { primary: e.target.checked })}
              />
              Primary contact
            </label>
            <label className="ad-check">
              <input
                type="checkbox"
                checked={!!c.emergency}
                onChange={(e) => patch(c.id, { emergency: e.target.checked })}
              />
              Emergency contact
            </label>
            <Btn
              size="sm"
              variant="ghost"
              icon="trash"
              onClick={() => setRemove(c.id)}
            >
              Remove contact {index + 1}
            </Btn>
          </div>
        </section>
      ))}
      <Btn
        variant="secondary"
        size="sm"
        icon="plus"
        onClick={() =>
          onChange([
            ...contacts,
            {
              id: crypto.randomUUID(),
              name: "",
              relation: "",
              phone: "",
              primary: !contacts.some((c) => c.primary),
            },
          ])
        }
      >
        Add contact
      </Btn>
      {target && (
        <Modal
          title="Remove contact?"
          onClose={() => setRemove(undefined)}
          footer={
            <>
              <Btn variant="secondary" onClick={() => setRemove(undefined)}>
                Keep contact
              </Btn>
              <Btn
                variant="danger"
                onClick={() => {
                  onChange(contacts.filter((c) => c.id !== target.id))
                  setRemove(undefined)
                }}
              >
                Confirm removal
              </Btn>
            </>
          }
        >
          <p>
            {target.name || "This contact"} will be removed only when client
            contacts are saved.
          </p>
          {(target.primary || target.emergency) && (
            <Banner tone="warning">
              This is {target.primary ? "a primary" : "an emergency"} contact
              {target.primary && target.emergency
                ? " and an emergency contact"
                : ""}
              . Review replacement contact arrangements before saving.
            </Banner>
          )}
        </Modal>
      )}
    </div>
  )
}
