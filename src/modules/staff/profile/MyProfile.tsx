"use client"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useStaffData, useApplyStaffPhoto } from "../data/context"
import { myHouses } from "../data/selectors"
import { formatDateOnly } from "@/lib/time"
import { PageHeader, Card, Btn, Avatar, Status, Icon, Empty } from "../ui"
import { getMyProfile } from "./adapter"
import ProfileEditForm from "./ProfileEditForm"
import AssignedHouses from "./AssignedHouses"
import ProfilePhotoPicker from "../files/ProfilePhotoPicker"
export default function MyProfile() {
  const s = useStaffData(),
    router = useRouter(),
    q = useSearchParams(),
    applyPhoto = useApplyStaffPhoto(),
    u = getMyProfile(s),
    action = q.get("action")
  const [message, setMessage] = useState("")
  if (!u)
    return (
      <Empty
        icon="user"
        title="Profile unavailable"
        text="The current employee profile could not be found."
      />
    )
  const close = () => router.replace("/profile")
  return (
    <div className="cm-staff-profile">
      <PageHeader
        title="My profile"
        back
        crumbs={[
          { label: "Dashboard", route: { page: "home" } },
          { label: "My profile" },
        ]}
      />
      <section className="cm-profile-head" aria-label="Current employee">
        <div className="cm-photo-edit">
          <span role="img" aria-label={`Profile photo for ${u.name}`}>
            <Avatar name={u.name} size={84} photo={u.photo} />
          </span>
          <button
            type="button"
            className="cm-photo-control"
            aria-label="Change profile photo"
            onClick={() => router.push("/profile?action=photo")}
          >
            <Icon name="image" size={15} />
          </button>
        </div>
        <div className="cm-grow">
          <h2 className="cm-staff-name">{u.name}</h2>
          <p>
            {u.role} · {u.employeeId}
          </p>
          {u.preferred && <p>Preferred name: {u.preferred}</p>}
          <div className="cm-alert-list">
            {myHouses(s).map((h) => (
              <Status key={h.id} tone="brand" dot={false}>
                {h.name}
              </Status>
            ))}
          </div>
        </div>
        <Btn
          variant="secondary"
          icon="edit"
          disabled={action === "edit"}
          onClick={() => router.push("/profile?action=edit")}
        >
          Edit profile
        </Btn>
      </section>
      {message && (
        <p role="status" className="cm-hint">
          {message}
        </p>
      )}
      <div className="cm-two-col">
        <div className="cm-stack">
          <Card className="cm-panel">
            <h2 className="cm-h3">Employee information</h2>
            <p className="cm-faint cm-mb">
              Managed by your employer. Contact management to change these
              details.
            </p>
            <dl className="cm-dl">
              {[
                ["Full name", u.name],
                ["Employee ID", u.employeeId],
                ["Role", u.role],
                ["Work email", u.email],
                [
                  "Start date",
                  u.started ? formatDateOnly(u.started) : "Not recorded",
                ],
                [
                  "Assigned houses",
                  myHouses(s)
                    .map((h) => h.name)
                    .join(", ") || "None assigned",
                ],
                [
                  "Account status",
                  u.status
                    ? `${u.status} · fictional account fixture`
                    : "Not recorded",
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <p className="cm-hint">
              Authentication, password reset and two-factor security are not
              connected. No security settings can be changed here.
            </p>
          </Card>
          <AssignedHouses />
        </div>
        <Card className="cm-panel">
          <div className="cm-row-between">
            <h2 className="cm-h3">Contact details</h2>
            {action !== "edit" && (
              <Btn
                size="sm"
                variant="secondary"
                icon="edit"
                aria-label="Edit contact details"
                onClick={() => router.push("/profile?action=edit")}
              >
                Edit
              </Btn>
            )}
          </div>
          <p className="cm-faint cm-mb">
            You can update these fields in this development session.
          </p>
          {action === "edit" ? (
            <ProfileEditForm
              onClose={close}
              onSaved={() => {
                setMessage(
                  "Contact details updated in this development session only. No employee account was updated; reload restores the fixtures.",
                )
                close()
              }}
            />
          ) : (
            <dl className="cm-dl">
              {[
                ["Mobile phone", u.phone],
                ["Home address", u.address],
                ["Emergency contact", u.emergency],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value || "Not recorded"}</dd>
                </div>
              ))}
            </dl>
          )}
        </Card>
      </div>
      {action === "photo" && (
        <ProfilePhotoPicker
          lifetime="session"
          name={u.name}
          onClose={close}
          onApply={(file) => {
            applyPhoto(file)
            setMessage(
              "Temporary photo updated across this development session. No upload or permanent storage; reload or sign-out resets it.",
            )
            close()
          }}
        />
      )}
    </div>
  )
}
