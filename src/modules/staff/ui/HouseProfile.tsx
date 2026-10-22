"use client"
import { useState } from "react"
import { useStaffData } from "../data/context"
import { staffQueries } from "../data/queries"
import { visibleNotices } from "../data/selectors"
import { PageHeader, Card, Btn, Icon, Avatar, Empty, useNav } from "./index"
import Tabs from "./Tabs"
import SourcePhoto from "./SourcePhoto"
import DiaryHistoryList from "../diary/DiaryHistoryList"
import FeaturePlaceholder from "./FeaturePlaceholder"
import ProfilePhotoPicker, {
  useTemporaryProfilePhoto,
} from "../files/ProfilePhotoPicker"
import Gallery from "../files/Gallery"
import type { HouseTab } from "../data/sections"
export default function HouseProfile({
  id,
  tab,
}: {
  id: string
  tab: HouseTab
}) {
  const s = useStaffData()
  const nav = useNav()
  const temporaryPhoto = useTemporaryProfilePhoto()
  const h = staffQueries.getHouse(s, id)
  const [action, setAction] = useState<string | null>(null)
  if (!h)
    return (
      <Empty
        icon="lock"
        title="House unavailable"
        text="This house could not be found or is not assigned to you."
      />
    )
  const clients = staffQueries.getClientsByHouse(s, h.id)
  const houses = staffQueries.getHouses(s)
  const setTab = (t: string) => nav.go({ page: "house", id: h.id, tab: t })
  return (
    <>
      <PageHeader
        back
        crumbs={[
          { label: "Houses", route: { page: "houses" } },
          { label: h.name },
        ]}
        title={h.name}
        subtitle={h.address}
        actions={
          <select
            className="cm-inline-select cm-switch"
            value={h.id}
            onChange={(e) => nav.go({ page: "house", id: e.target.value, tab })}
            aria-label="Switch house"
          >
            {houses.map((x) => (
              <option key={x.id} value={x.id}>
                Switch: {x.name}
              </option>
            ))}
          </select>
        }
      />
      <div className="cm-house-banner">
        <SourcePhoto
          key={temporaryPhoto.url ?? h.id}
          src={temporaryPhoto.url ?? h.photo}
          alt={`${h.name} exterior`}
        />
        <div className="cm-house-banner-info">
          {h.phone ? (
            <a href={`tel:${h.phone.replace(/\s/g, "")}`}>
              <Icon name="phone" size={15} />
              {h.phone}
            </a>
          ) : (
            <span>
              <Icon name="phone" size={15} />
              Telephone not recorded
            </span>
          )}
          {h.email ? (
            <a href={`mailto:${h.email}`}>
              <Icon name="mail" size={15} />
              {h.email}
            </a>
          ) : (
            <span>Email not recorded</span>
          )}
          <span>
            <Icon name="user" size={15} />
            Manager: {h.manager}
          </span>
        </div>
      </div>
      <Tabs
        label="House sections"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "overview", label: "Overview", icon: "house" },
          { id: "diary", label: "House diary", icon: "book" },
          { id: "files", label: "Documents", icon: "image" },
          { id: "concerns", label: "Notifications & concerns", icon: "flag" },
        ]}
      />
      <div role="tabpanel" aria-label={`House ${tab}`}>
        {tab === "overview" && (
          <div className="cm-stack">
            {visibleNotices(s)
              .filter((n) => n.category === "house" && n.relatedId === h.id)
              .slice(0, 1)
              .map((n) => (
                <div key={n.id} className="cm-notice-card cm-notice-card--hl">
                  <div>
                    <strong>{n.title}</strong>
                    <span>{n.publisher}</span>
                  </div>
                  <p>{n.body}</p>
                </div>
              ))}
            {h.description && <p className="cm-body">{h.description}</p>}
            <h2 className="cm-h3">
              Clients at {h.name}{" "}
              <span className="cm-faint">({clients.length})</span>
            </h2>
            <div className="cm-client-grid">
              {clients.map((c) => (
                <Card
                  key={c.id}
                  className="cm-client-card"
                  onClick={() => nav.go({ page: "client", id: c.id })}
                >
                  <Avatar
                    name={c.name}
                    tone={c.tone}
                    size={44}
                    photo={c.photo}
                  />
                  <div className="cm-grow">
                    <strong>{c.name}</strong>
                    <span>Prefers &quot;{c.preferred}&quot;</span>
                  </div>
                  <span className="sr-only">Open profile</span>
                  <Icon name="chevron" size={16} />
                </Card>
              ))}
            </div>
            {clients.length === 0 && (
              <Empty icon="user" title="No clients at this house" />
            )}
            <div className="cm-row-actions">
              <Btn
                variant="secondary"
                icon="image"
                onClick={() => setAction("Update house photo · preview")}
              >
                Update house photo
              </Btn>
              <Btn
                variant="secondary"
                icon="flag"
                onClick={() => setTab("concerns")}
              >
                Submit house concern
              </Btn>
            </div>
          </div>
        )}
        {tab === "diary" && (
          <>
            <p className="cm-muted cm-mb">
              Operational updates for the house. Client care notes belong in
              each client&apos;s diary.
            </p>
            <DiaryHistoryList subject={{ scope: "house", targetId: id }} />
          </>
        )}
        {tab === "files" && (
          <Gallery subject={{ scope: "house", targetId: id }} />
        )}
        {tab === "concerns" && (
          <FeaturePlaceholder
            title="House notifications & concerns"
            icon="flag"
          />
        )}
      </div>
      {temporaryPhoto.url && (
        <p role="status" className="cm-hint">
          Temporary photo preview only; leaving or reloading this profile resets
          it.
        </p>
      )}
      {action && (
        <ProfilePhotoPicker
          name={h.name}
          onClose={() => setAction(null)}
          onApply={(file) => {
            temporaryPhoto.apply(file)
            setAction(null)
          }}
        />
      )}
    </>
  )
}
