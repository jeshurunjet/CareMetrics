"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Btn, Empty, Banner } from "@/modules/staff/ui"
import { PageHead, Panel, useAdmin, Locked } from "../ui/core"
import AdminForm, {
  Field,
  SelectField,
  FormErrors,
  useAdminFormGuard,
} from "../ui/Form"
import PhotoSelection from "../ui/PhotoSelection"
import { useTemporaryProfilePhoto } from "@/modules/staff/files/ProfilePhotoPicker"
import {
  employeeHouses,
  roles,
  saveEmployee,
  validateEmployee,
} from "../data/adapter"
import type { EmployeeInput, Errors } from "../data/types"
import { HousePickerView } from "./HousePicker"
import type { EmployeeFormData, SaveFeedback } from "../manage/form-types"
export default function EmployeeForm({ id }: { id?: string }) {
  const nav = useAdmin()
  const employee = nav.data.staff.find((e) => e.id === id)
  return (
    <EmployeeFormView
      id={id}
      employee={employee}
      houseIds={id ? employeeHouses(nav.data, id) : []}
      houses={nav.data.houses.map((h) => ({
        ...h,
        clientCount: nav.data.clients.filter((c) => c.houseId === h.id).length,
      }))}
      actorRole={nav.role}
      onSave={async (f, file) => {
        const errors = validateEmployee(nav.data, nav.role, f, id)
        if (Object.keys(errors).length)
          throw Object.assign(new Error("Check the highlighted information."), {
            fields: errors,
          })
        const result = saveEmployee(nav.data, nav.role, f, id)
        nav.update(result.data)
        if (file) nav.photo("employee", result.id, file)
        return { id: result.id }
      }}
    />
  )
}
export function EmployeeFormView({
  employee: x,
  id,
  houseIds,
  houses,
  actorRole,
  roleOptions = roles,
  backend = false,
  onSave,
}: EmployeeFormData) {
  const router = useRouter()
  const [first = "", ...last] = (x?.name ?? "").split(" ")
  const initial: EmployeeInput = {
    first,
    last: last.join(" "),
    preferred: x?.preferred ?? "",
    employeeId: x?.employeeId ?? "",
    email: x?.email ?? "",
    phone: x?.phone ?? "",
    address: x?.address ?? "",
    emergency: x?.emergency ?? "",
    role: x?.role ?? "Support Worker",
    status: x?.status ?? "Invited",
    started: x?.started ?? "",
    houses: houseIds,
  }
  const [f, setF] = useState(initial),
    [errors, setErrors] = useState<Errors>({}),
    [saved, setSaved] = useState(false),
    [saving, setSaving] = useState(false),
    [file, setFile] = useState<File>(),
    photo = useTemporaryProfilePhoto()
  const dirty =
      !saved && (JSON.stringify(f) !== JSON.stringify(initial) || !!file),
    discard = useAdminFormGuard(dirty)
  const set = (k: keyof EmployeeInput, v: string) => setF({ ...f, [k]: v })
  if (id && !x) return <Empty title="Employee unavailable" />
  if (x?.role === "Administrator" && actorRole !== "Administrator")
    return (
      <Locked text="Administrator accounts can only be edited by an Administrator." />
    )
  const save = async () => {
    if (saving || saved) return
    setErrors({})
    setSaving(true)
    try {
      const result = await onSave(f, file)
      setSaved(true)
      router.replace(`/admin/employees/${result.id}?saved=1`)
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
        title={x ? `Edit ${x.name}` : "Create employee"}
        crumbs={[
          { label: "Employees", to: { page: "employees" } },
          { label: x?.name ?? "Create employee" },
        ]}
        actions={
          <>
            <Btn
              variant="secondary"
              onClick={() => {
                if (discard())
                  router.push(
                    id ? `/admin/employees/${id}` : "/admin/employees",
                  )
              }}
            >
              Cancel
            </Btn>
            <Btn type="submit" icon="check" disabled={saved || saving}>
              {saving ? "Saving…" : x ? "Save changes" : "Create employee"}
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
              photo={photo.url ?? x?.photo}
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
                ["employeeId", "Employee ID"],
                ["email", "Work email"],
                ["phone", "Phone"],
                ["address", "Home address"],
                ["emergency", "Emergency contact"],
              ] as const).map(([k, label]) => (
                <Field
                  key={k}
                  label={label}
                  value={f[k]}
                  onChange={(v) => set(k, v)}
                  type={
                    k === "email" ? "email" : k === "phone" ? "tel" : "text"
                  }
                  required={["first", "last", "employeeId", "email"].includes(
                    k,
                  )}
                  error={errors[k]}
                  disabled={
                    backend &&
                    ["preferred", "phone", "address", "emergency"].includes(k)
                  }
                  help={
                    backend &&
                    ["preferred", "phone", "address", "emergency"].includes(k)
                      ? "Future Development · not stored"
                      : undefined
                  }
                />
              ))}
            </div>
          </Panel>
          <Panel title="House assignments">
            <HousePickerView
              houses={houses}
              value={f.houses}
              onChange={(houses) => setF({ ...f, houses })}
            />
            {errors.houses && <p role="alert">{errors.houses}</p>}
          </Panel>
        </div>
        <div className="ad-form-side">
          <Panel title="Account">
            <SelectField
              label="Role"
              value={f.role}
              onChange={(v) => set("role", v)}
              options={roleOptions.map((r) => ({
                value: r,
                label: r,
                disabled:
                  backend && actorRole !== "Administrator"
                    ? ["Administrator", "Manager"].includes(r) && r !== f.role
                    : r === "Administrator" && actorRole !== "Administrator",
              }))}
              error={errors.role}
              disabled={backend && !!id && actorRole !== "Administrator"}
              help={
                backend
                  ? "Only Administrators can change existing roles."
                  : "Only Administrators can grant the Administrator role."
              }
            />
            <SelectField
              label="Account status"
              disabled={backend && !id}
              value={f.status}
              onChange={(v) => set("status", v)}
              options={["Active", "Invited", "Inactive"].map((r) => ({
                value: r,
                label: r,
              }))}
            />
            <Field
              label="Start date"
              disabled={backend}
              help={backend ? "Future Development · not stored" : undefined}
              value={f.started}
              onChange={(v) => set("started", v)}
              type="date"
              error={errors.started}
            />
            <Banner
              tone="info"
              title={
                backend
                  ? "Separate credential activation required"
                  : "Development record only"
              }
            >
              {backend
                ? "Creating an employee does not create working login credentials. New records remain Invited. Secure credential provisioning, invitation and recovery are separate; no password or email is issued here."
                : "Invitation email, account credentials, password reset and real access changes are unavailable. No email is sent. Invited is a fictional record state."}
            </Banner>
          </Panel>
        </div>
      </div>
    </AdminForm>
  )
}
