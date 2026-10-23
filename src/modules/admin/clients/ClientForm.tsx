"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import type { ClientContact } from "@/modules/staff/data/types"
import { Btn, Empty } from "@/modules/staff/ui"
import { PageHead, Panel, useAdmin } from "../ui/core"
import AdminForm, {
  Field,
  SelectField,
  FormErrors,
  useAdminFormGuard,
} from "../ui/Form"
import type { ClientInput, Errors } from "../data/types"
import { saveClient, validateClient, validateContacts } from "../data/adapter"
import ContactsEditor from "./ContactsEditor"
import PhotoSelection from "../ui/PhotoSelection"
import { useTemporaryProfilePhoto } from "@/modules/staff/files/ProfilePhotoPicker"
export default function ClientForm({
  id,
  houseId,
}: {
  id?: string
  houseId?: string
}) {
  const nav = useAdmin(),
    router = useRouter(),
    c = nav.data.clients.find((c) => c.id === id),
    [first = "", ...last] = (c?.name ?? "").split(" ")
  const initial: ClientInput = {
    first,
    last: last.join(" "),
    preferred: c?.preferred ?? "",
    dob: c?.dob ?? "",
    ref: c?.ref ?? "",
    nhi: c?.nhi ?? "",
    houseId: c?.houseId ?? houseId ?? "",
    summary: c?.summary ?? "",
    status: c?.status ?? "Active",
    alerts: c?.alerts.join("\n") ?? "",
  }
  const [f, setF] = useState(initial),
    [contacts, setContacts] = useState<ClientContact[]>(c?.contacts ?? []),
    [errors, setErrors] = useState<Errors>({}),
    [saved, setSaved] = useState(false),
    [file, setFile] = useState<File>(),
    photo = useTemporaryProfilePhoto()
  const discard = useAdminFormGuard(
    !saved &&
      (JSON.stringify(f) !== JSON.stringify(initial) ||
        JSON.stringify(contacts) !== JSON.stringify(c?.contacts ?? []) ||
        !!file),
  )
  const set = (key: keyof ClientInput, value: string) =>
    setF({ ...f, [key]: value })
  if (id && !c) return <Empty title="Client unavailable" />
  const save = () => {
    const errs = {
      ...validateClient(nav.data, nav.role, f, id),
      ...validateContacts(contacts),
    }
    setErrors(errs)
    if (Object.keys(errs).length) return
    try {
      const result = saveClient(nav.data, nav.role, f, contacts, id)
      nav.update(result.data)
      if (file) nav.photo("client", result.id, file)
      setSaved(true)
      router.replace(`/admin/clients/${result.id}?saved=1`)
    } catch (e) {
      setErrors({ form: (e as Error).message })
    }
  }
  return (
    <AdminForm onSubmit={save}>
      <PageHead
        title={c ? `Edit ${c.name}` : "Create client"}
        crumbs={[
          { label: "Clients", to: { page: "clients" } },
          { label: c?.name ?? "Create client" },
        ]}
        actions={
          <>
            <Btn
              variant="secondary"
              onClick={() => {
                if (discard())
                  router.push(id ? `/admin/clients/${id}` : "/admin/clients")
              }}
            >
              Cancel
            </Btn>
            <Btn type="submit" icon="check" disabled={saved}>
              Save client
            </Btn>
          </>
        }
      />
      <FormErrors errors={errors} />
      <div className="ad-form-layout">
        <div className="ad-form-main">
          <Panel title="Personal information">
            <PhotoSelection
              name={`${f.first} ${f.last}`}
              photo={photo.url ?? c?.photo}
              onSelect={(file) => {
                setFile(file)
                photo.apply(file)
              }}
            />
            <div className="ad-grid-3">
              {([
                ["first", "First name"],
                ["last", "Last name"],
                ["preferred", "Preferred name"],
                ["dob", "Date of birth"],
                ["ref", "Client reference"],
                ["nhi", "NHI number"],
              ] as const).map(([key, label]) => (
                <Field
                  key={key}
                  label={label}
                  value={f[key]}
                  type={key === "dob" ? "date" : "text"}
                  onChange={(v) =>
                    set(key, key === "nhi" ? v.toUpperCase() : v)
                  }
                  required={["first", "last", "ref"].includes(key)}
                  error={errors[key]}
                  help={
                    key === "nhi"
                      ? "Optional restricted prototype format · fictional data only"
                      : undefined
                  }
                />
              ))}
            </div>
            <Field
              type="textarea"
              label="Profile summary"
              value={f.summary}
              onChange={(v) => set("summary", v)}
            />
            <Field
              type="textarea"
              label="Important alerts (one per line)"
              value={f.alerts}
              onChange={(v) => set("alerts", v)}
            />
          </Panel>
          <Panel title="Contacts / next of kin">
            <ContactsEditor contacts={contacts} onChange={setContacts} />
          </Panel>
        </div>
        <div className="ad-form-side">
          <Panel title="House assignment">
            <SelectField
              label="Current house"
              value={f.houseId}
              disabled={!!id}
              onChange={(v) => set("houseId", v)}
              options={[
                { value: "", label: "Select house…" },
                ...nav.data.houses
                  .filter((h) => h.status !== "Inactive" || h.id === c?.houseId)
                  .map((h) => ({ value: h.id, label: h.name })),
              ]}
              error={errors.houseId}
              help={
                id
                  ? "To change house, use the confirmed transfer on Client Details → House assignment."
                  : "Exactly one current house is required."
              }
            />
          </Panel>
          <Panel title="Status">
            <SelectField
              label="Client status"
              value={f.status}
              onChange={(v) => set("status", v)}
              options={["Active", "Inactive"].map((v) => ({
                value: v,
                label: v,
              }))}
            />
            <p className="ad-faint">
              Inactive profiles are unavailable to Staff. History is retained.
              Development changes reset on reload.
            </p>
          </Panel>
        </div>
      </div>
    </AdminForm>
  )
}
