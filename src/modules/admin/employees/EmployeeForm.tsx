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
import HousePicker from "./HousePicker"
export default function EmployeeForm({ id }: { id?: string }) {
  const nav = useAdmin(),
    router = useRouter(),
    x = nav.data.staff.find((e) => e.id === id),
    [first = "", ...last] = (x?.name ?? "").split(" ")
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
    houses: id ? employeeHouses(nav.data, id) : [],
  }
  const [f, setF] = useState(initial),
    [errors, setErrors] = useState<Errors>({}),
    [saved, setSaved] = useState(false),
    [file, setFile] = useState<File>(),
    photo = useTemporaryProfilePhoto()
  const dirty =
      !saved && (JSON.stringify(f) !== JSON.stringify(initial) || !!file),
    discard = useAdminFormGuard(dirty)
  const set = (k: keyof EmployeeInput, v: string) => setF({ ...f, [k]: v })
  if (id && !x) return <Empty title="Employee unavailable" />
  if (x?.role === "Administrator" && nav.role !== "Administrator")
    return (
      <Locked text="Administrator accounts can only be edited by an Administrator." />
    )
  const save = () => {
    const errs = validateEmployee(nav.data, nav.role, f, id)
    setErrors(errs)
    if (Object.keys(errs).length) return
    try {
      const result = saveEmployee(nav.data, nav.role, f, id)
      nav.update(result.data)
      if (file) nav.photo("employee", result.id, file)
      setSaved(true)
      router.replace(`/admin/employees/${result.id}?saved=1`)
    } catch (e) {
      setErrors({ form: (e as Error).message })
    }
  }
  return (
    <AdminForm onSubmit={save}>
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
            <Btn type="submit" icon="check" disabled={saved}>
              {x ? "Save changes" : "Create employee"}
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
                />
              ))}
            </div>
          </Panel>
          <Panel title="House assignments">
            <HousePicker
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
              options={roles.map((r) => ({
                value: r,
                label: r,
                disabled: r === "Administrator" && nav.role !== "Administrator",
              }))}
              error={errors.role}
              help="Only Administrators can grant the Administrator role."
            />
            <SelectField
              label="Account status"
              value={f.status}
              onChange={(v) => set("status", v)}
              options={["Active", "Invited", "Inactive"].map((r) => ({
                value: r,
                label: r,
              }))}
            />
            <Field
              label="Start date"
              value={f.started}
              onChange={(v) => set("started", v)}
              type="date"
              error={errors.started}
            />
            <Banner tone="info" title="Development record only">
              Invitation email, account credentials, password reset and real
              access changes are unavailable. No email is sent. Invited is a
              fictional record state.
            </Banner>
          </Panel>
        </div>
      </div>
    </AdminForm>
  )
}
