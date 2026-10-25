"use client"
import type { ClientFormData, SaveFeedback } from "../manage/form-types"
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
  const nav = useAdmin()
  return (
    <ClientFormView
      id={id}
      houseId={houseId}
      client={nav.data.clients.find((c) => c.id === id)}
      houses={nav.data.houses.map((h) => ({
        ...h,
        clientCount: nav.data.clients.filter((c) => c.houseId === h.id).length,
      }))}
      onSave={async (f, contacts, file) => {
        const errors = {
          ...validateClient(nav.data, nav.role, f, id),
          ...validateContacts(contacts),
        }
        if (Object.keys(errors).length)
          throw Object.assign(new Error("Check the highlighted information."), {
            fields: errors,
          })
        const result = saveClient(nav.data, nav.role, f, contacts, id)
        nav.update(result.data)
        if (file) nav.photo("client", result.id, file)
        return { id: result.id }
      }}
    />
  )
}
export function ClientFormView({
  client: c,
  id,
  houseId,
  houses,
  backend = false,
  onSave,
}: ClientFormData) {
  const router = useRouter()
  const [first = "", ...last] = (c?.name ?? "").split(" ")
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
    [saving, setSaving] = useState(false),
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
  const save = async () => {
    if (saving || saved) return
    setErrors({})
    setSaving(true)
    try {
      const result = await onSave(f, contacts, file)
      setSaved(true)
      router.replace(`/admin/clients/${result.id}?saved=1`)
      router.refresh()
    } catch (e) {
      const error = e as SaveFeedback
      setErrors(error.fields ?? { form: error.message })
    } finally {
      setSaving(false)
    }
  }
  return (
    <AdminForm onSubmit={() => void save()}>
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
            <Btn type="submit" icon="check" disabled={saved || saving}>
              {saving ? "Saving…" : "Save client"}
            </Btn>
          </>
        }
      />
      <FormErrors errors={errors} />
      {saving && <p role="status">Saving changes…</p>}
      <div className="ad-form-layout" inert={saving}>
        <div className="ad-form-main">
          <Panel title="Personal information">
            <PhotoSelection
              disabled={backend}
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
                  disabled={backend && key === "nhi"}
                  help={
                    backend && key === "nhi"
                      ? "Future Development · restricted identifiers are not stored"
                      : key === "nhi"
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
              disabled={backend}
              help={backend ? "Future Development · not stored" : undefined}
              value={f.alerts}
              onChange={(v) => set("alerts", v)}
            />
          </Panel>
          <Panel title="Contacts / next of kin">
            <ContactsEditor
              backend={backend}
              contacts={contacts}
              onChange={setContacts}
            />
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
                ...houses
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
              {backend
                ? "Inactive profiles are unavailable to Staff. Changes persist; historical records are retained."
                : "Inactive profiles are unavailable to Staff. History is retained. Development changes reset on reload."}
            </p>
          </Panel>
        </div>
      </div>
    </AdminForm>
  )
}
