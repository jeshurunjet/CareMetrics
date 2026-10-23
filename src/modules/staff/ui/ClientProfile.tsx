"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useStaffData } from "../data/context"
import { staffQueries } from "../data/queries"
import ContextualNoticeList from "../notifications/ContextualNoticeList"
import type { ClientTab } from "../data/sections"
import { formatDateOnly, ageOnDate } from "@/lib/time"
import {
  PageHeader,
  Card,
  Btn,
  Icon,
  Avatar,
  Status,
  Empty,
  useNav,
} from "./index"
import Tabs from "./Tabs"
import ClientContacts from "./ClientContacts"
import Charting from "../charting/Charting"
import CarePlan from "../care/CarePlan"
import { getAssignedCareTemplates } from "../care/adapter"
import DiaryHistoryList from "../diary/DiaryHistoryList"
import Gallery from "../files/Gallery"
import ProfilePhotoPicker, {
  useTemporaryProfilePhoto,
} from "../files/ProfilePhotoPicker"
import PreviewActionDialog from "./PreviewActionDialog"
export default function ClientProfile({
  id,
  tab,
}: {
  id: string
  tab: ClientTab
}) {
  const s = useStaffData()
  const nav = useNav()
  const temporaryPhoto = useTemporaryProfilePhoto()
  const c = staffQueries.getClient(s, id)
  const [action, setAction] = useState<string | null>(null)
  useEffect(() => {
    if (tab !== "overview" || window.location.hash !== `#contacts-${id}`) return
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById(`contacts-${id}`)
      target?.scrollIntoView({ block: "start" })
      target?.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
  }, [id, tab])
  if (!c)
    return (
      <Empty
        icon="lock"
        title="Client unavailable"
        text="This client could not be found or is not assigned to you."
      />
    )
  const h = staffQueries.getHouse(s, c.houseId)!
  const nok = staffQueries.getClientContacts(s, c.id).find((k) => k.primary)
  const setTab = (t: string) => nav.go({ page: "client", id: c.id, tab: t })
  return (
    <>
      <PageHeader
        back
        crumbs={[
          { label: "Houses", route: { page: "houses" } },
          { label: h.name, route: { page: "house", id: h.id } },
          { label: c.name },
        ]}
        title=""
      />
      <section className="cm-profile-head">
        <div className="cm-photo-edit">
          <Avatar
            name={c.name}
            tone={c.tone}
            size={76}
            photo={temporaryPhoto.url ?? c.photo}
          />
          <button
            type="button"
            className="cm-photo-control"
            aria-label={`Preview photo update for ${c.preferred}`}
            title="Photo update · development preview"
            onClick={() => setAction("Update client photo · preview")}
          >
            <Icon name="image" size={15} />
          </button>
        </div>
        <div className="cm-grow">
          <h1>{c.name}</h1>
          <p>
            Prefers &quot;{c.preferred}&quot;
            {c.dob && <> · {ageOnDate(c.dob, s.now)} yrs</>} ·{" "}
            <button
              className="cm-link"
              onClick={() => nav.go({ page: "house", id: h.id })}
            >
              {h.name}
            </button>
          </p>
          <p>
            <Link
              className="cm-link"
              href={`/clients/${c.id}?tab=overview#contacts-${c.id}`}
            >
              View contacts & next of kin
            </Link>
          </p>
          {c.alerts.length > 0 && (
            <div className="cm-alert-list">
              {c.alerts.map((a) => (
                <Status key={a} tone="danger">
                  {a}
                </Status>
              ))}
            </div>
          )}
        </div>
        {nok &&
          (nok.phone ? (
            <a
              className="cm-call"
              href={`tel:${nok.phone.replace(/\s/g, "")}`}
              aria-label={`Call next of kin ${nok.name}`}
            >
              <Icon name="phone" size={17} />
              <span>
                <small>Next of kin</small>
                {nok.name.split(" ")[0]} · {nok.phone}
              </span>
            </a>
          ) : (
            <Link
              className="cm-call"
              href={`/clients/${c.id}?tab=overview#contacts-${c.id}`}
            >
              <Icon name="user" size={17} />
              <span>
                <small>Primary contact</small>
                {nok.name} · View details
              </span>
            </Link>
          ))}
      </section>
      <Tabs
        label="Client sections"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "overview", label: "Overview", icon: "user" },
          { id: "diary", label: "Diary", icon: "book" },
          {
            id: "care",
            label: "Care Plan",
            icon: "clipboard",
            count: getAssignedCareTemplates(s, id).length,
          },
          {
            id: "charting",
            label: "Charting",
            icon: "chart",
            count: getAssignedCareTemplates(s, id, "chart").length,
          },
          { id: "files", label: "Gallery", icon: "image" },
        ]}
      />
      <div role="tabpanel" aria-label={`Client ${tab}`}>
        {tab === "overview" && (
          <div className="cm-two-col">
            <div className="cm-stack">
              <Card className="cm-panel">
                <div className="cm-row-between">
                  <h2 className="cm-h3">About {c.preferred}</h2>
                  <Btn
                    size="sm"
                    variant="secondary"
                    icon="edit"
                    disabled
                    title="Profile editing will be managed in the Admin CMS"
                  >
                    Edit profile
                  </Btn>
                </div>
                <p className="cm-body">{c.summary}</p>
                <dl className="cm-dl cm-dl--inline">
                  <div>
                    <dt>Date of birth</dt>
                    <dd>{c.dob ? formatDateOnly(c.dob) : "Not recorded"}</dd>
                  </div>
                  <div>
                    <dt>House</dt>
                    <dd>
                      <button
                        className="cm-link"
                        onClick={() => nav.go({ page: "house", id: h.id })}
                      >
                        {h.name}
                      </button>
                    </dd>
                  </div>
                  <div>
                    <dt>NHI</dt>
                    <dd>Restricted — available to management</dd>
                  </div>
                </dl>
              </Card>
              <div className="cm-doc-shortcuts">
                {[
                  ["diary", "book", "Diary", "Progress notes & appointments"],
                  [
                    "care",
                    "clipboard",
                    "Care Plan",
                    `${getAssignedCareTemplates(s, id).length} assessments`,
                  ],
                  [
                    "charting",
                    "chart",
                    "Charting",
                    `${getAssignedCareTemplates(s, id, "chart").length} charts`,
                  ],
                  ["files", "image", "Gallery", "Photos & documents"],
                ].map(([section, icon, label, sub]) => (
                  <Card
                    key={section}
                    className="cm-doc-tile"
                    onClick={() => setTab(section)}
                  >
                    <span>
                      <Icon name={icon} size={20} />
                    </span>
                    <strong>{label}</strong>
                    <small>{sub}</small>
                  </Card>
                ))}
              </div>
              <ContextualNoticeList context="client" targetId={c.id} />
            </div>
            <ClientContacts clientId={c.id} />
          </div>
        )}
        {tab === "diary" && (
          <DiaryHistoryList subject={{ scope: "client", targetId: id }} />
        )}
        {tab === "care" && <CarePlan clientId={id} />}
        {tab === "charting" && <Charting clientId={id} />}
        {tab === "files" && (
          <Gallery subject={{ scope: "client", targetId: id }} />
        )}
      </div>
      {temporaryPhoto.url && (
        <p role="status" className="cm-hint">
          Temporary photo preview only; leaving or reloading this profile resets
          it.
        </p>
      )}
      {action === "Update client photo · preview" ? (
        <ProfilePhotoPicker
          name={c.name}
          onClose={() => setAction(null)}
          onApply={(file) => {
            temporaryPhoto.apply(file)
            setAction(null)
          }}
        />
      ) : (
        action && (
          <PreviewActionDialog title={action} onClose={() => setAction(null)} />
        )
      )}
    </>
  )
}
