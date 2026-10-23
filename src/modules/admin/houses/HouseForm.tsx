"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Btn, Empty } from "@/modules/staff/ui"
import { PageHead, Panel, useAdmin } from "../ui/core"
import AdminForm, {
  Field,
  SelectField,
  FormErrors,
  useAdminFormGuard,
} from "../ui/Form"
import { saveHouse, validateHouse } from "../data/adapter"
import type { HouseInput, Errors } from "../data/types"
import PhotoSelection from "../ui/PhotoSelection"
import { useTemporaryProfilePhoto } from "@/modules/staff/files/ProfilePhotoPicker"
import PreviewMap from "@/modules/staff/ui/PreviewMap"
export default function HouseForm({ id }: { id?: string }) {
  const nav = useAdmin(),
    router = useRouter(),
    h = nav.data.houses.find((h) => h.id === id)
  const initial: HouseInput = {
    name: h?.name ?? "",
    code: h?.code ?? "",
    address: h?.address ?? "",
    suburb: h?.suburb ?? "",
    phone: h?.phone ?? "",
    email: h?.email ?? "",
    description: h?.description ?? "",
    manager: h?.manager ?? "",
    status: h?.status ?? "Active",
    lat: h && h.locationSet !== false ? String(h.lat) : "",
    lng: h && h.locationSet !== false ? String(h.lng) : "",
    geofence: h?.geofence ? String(h.geofence) : "",
  }
  const [f, setF] = useState(initial),
    [errors, setErrors] = useState<Errors>({}),
    [saved, setSaved] = useState(false),
    [file, setFile] = useState<File>(),
    photo = useTemporaryProfilePhoto(),
    discard = useAdminFormGuard(
      !saved && (JSON.stringify(f) !== JSON.stringify(initial) || !!file),
    )
  const set = (key: keyof HouseInput, value: string) =>
    setF({ ...f, [key]: value })
  if (id && !h) return <Empty title="House unavailable" />
  const save = () => {
    const errs = validateHouse(nav.data, nav.role, f, id)
    setErrors(errs)
    if (Object.keys(errs).length) return
    try {
      const result = saveHouse(nav.data, nav.role, f, id)
      nav.update(result.data)
      if (file) nav.photo("house", result.id, file)
      setSaved(true)
      router.replace(`/admin/houses/${result.id}?saved=1`)
    } catch (e) {
      setErrors({ form: (e as Error).message })
    }
  }
  return (
    <AdminForm onSubmit={save}>
      <PageHead
        title={h ? `Edit ${h.name}` : "Create house"}
        crumbs={[
          { label: "Houses", to: { page: "houses" } },
          { label: h?.name ?? "Create house" },
        ]}
        actions={
          <>
            <Btn
              variant="secondary"
              onClick={() => {
                if (discard())
                  router.push(id ? `/admin/houses/${id}` : "/admin/houses")
              }}
            >
              Cancel
            </Btn>
            <Btn type="submit" icon="check" disabled={saved}>
              Save house
            </Btn>
          </>
        }
      />
      <FormErrors errors={errors} />
      <div className="ad-form-layout">
        <div className="ad-form-main">
          <Panel title="General information">
            <div className="ad-grid-3">
              {([
                ["name", "House name"],
                ["code", "House code"],
                ["status", "Status"],
                ["address", "Street address"],
                ["suburb", "Suburb / city"],
                ["manager", "House manager"],
                ["phone", "Contact phone"],
                ["email", "Contact email"],
              ] as const).map(([key, label]) =>
                key === "status" ? (
                  <SelectField
                    key="status"
                    label="Status"
                    value={f.status}
                    onChange={(v) => set("status", v)}
                    options={["Active", "Inactive"].map((v) => ({
                      value: v,
                      label: v,
                    }))}
                  />
                ) : key === "manager" ? (
                  <SelectField
                    key="manager"
                    label={label}
                    value={f.manager}
                    onChange={(v) => set("manager", v)}
                    options={[
                      { value: "", label: "Not specified" },
                      ...Array.from(
                        new Set([
                          f.manager,
                          ...nav.data.staff
                            .filter(
                              (e) =>
                                e.role === "Manager" ||
                                e.role === "Administrator",
                            )
                            .map((e) => e.name),
                        ]),
                      )
                        .filter(Boolean)
                        .map((name) => ({ value: name, label: name })),
                    ]}
                  />
                ) : (
                  <Field
                    key={key}
                    label={label}
                    value={f[key]}
                    onChange={(v) => set(key, v)}
                    required={["name", "code", "address", "phone"].includes(
                      key,
                    )}
                    type={
                      key === "email"
                        ? "email"
                        : key === "phone"
                          ? "tel"
                          : "text"
                    }
                    error={errors[key]}
                  />
                ),
              )}
            </div>
            <Field
              type="textarea"
              label="Description"
              value={f.description}
              onChange={(v) => set("description", v)}
              error={errors.description}
            />
          </Panel>
          <Panel title="Location & GPS configuration">
            <p className="ad-faint">
              Fictional configured coordinates. Address lookup and device GPS
              verification are unavailable. A radius is provisional and does not
              activate geofencing.
            </p>
            <div className="ad-loc">
              <div className="ad-loc-map">
                {f.lat &&
                f.lng &&
                !errors.lat &&
                Number.isFinite(Number(f.lat)) &&
                Math.abs(Number(f.lat)) <= 90 &&
                Number.isFinite(Number(f.lng)) &&
                Math.abs(Number(f.lng)) <= 180 ? (
                  <PreviewMap
                    house={{
                      id: id ?? "draft",
                      name: f.name,
                      address: f.address,
                      photo: "",
                      phone: f.phone,
                      manager: f.manager,
                      lat: Number(f.lat),
                      lng: Number(f.lng),
                    }}
                  />
                ) : (
                  <p className="ad-empty-inline">
                    Location not configured · enter fictional coordinates.
                  </p>
                )}
              </div>
              <div className="ad-loc-fields">
                <Field
                  label="Address lookup"
                  value="Unavailable in this development phase"
                  onChange={() => {}}
                  disabled
                />
                <div className="ad-grid-2">
                  <Field
                    label="Latitude"
                    value={f.lat}
                    onChange={(v) => set("lat", v)}
                    error={errors.lat}
                  />
                  <Field
                    label="Longitude"
                    value={f.lng}
                    onChange={(v) => set("lng", v)}
                    error={errors.lat}
                  />
                </div>
                <Field
                  label="Provisional radius (metres)"
                  value={f.geofence}
                  onChange={(v) => set("geofence", v)}
                  error={errors.geofence}
                  help="Optional · organisation policy not yet agreed"
                />
              </div>
            </div>
          </Panel>
        </div>
        <div className="ad-form-side">
          <Panel title="House photo">
            <PhotoSelection
              house
              name={f.name}
              photo={photo.url ?? h?.photo ?? "/demo-assets/room-demo.png"}
              onSelect={(file) => {
                setFile(file)
                photo.apply(file)
              }}
            />
          </Panel>
          <Panel title="Staff app effect">
            <p className="ad-faint">
              Assigned staff see updated house information in this development
              session. Reload restores fixtures. No GPS or real attendance
              verification is performed.
            </p>
          </Panel>
        </div>
      </div>
    </AdminForm>
  )
}
