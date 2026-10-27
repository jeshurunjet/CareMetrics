"use client"
import { ScheduleSummary } from "@/modules/scheduling/StaffSchedule"
import type { StaffSchedule } from "@/modules/scheduling/types"
import Link from "next/link"
import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { StaffShellView } from "@/components/layout/StaffShell"
import {
  PageHeader,
  Card,
  Btn,
  Icon,
  Avatar,
  Status,
  SectionTitle,
  Empty,
  useNav,
} from "../ui"
import HouseCard from "../ui/HouseCard"
import ClientCard from "../ui/ClientCard"
import { HouseListView } from "../ui/HouseList"
import { ClientContactsView } from "../ui/ClientContacts"
import SourcePhoto from "../ui/SourcePhoto"
import SearchInput from "../ui/SearchInput"
import Tabs from "../ui/Tabs"
import { formatDateOnly } from "@/lib/time"
import type {
  EmployeeIdentity,
  StaffOverview,
  HouseSummary,
  ClientSummary,
  ClientProfileRead,
  StaffSearch,
} from "./types"

export function StaffReadShell({
  employee,
  children,
}: {
  employee: EmployeeIdentity
  children: React.ReactNode
}) {
  const [failed, setFailed] = useState(false)
  return (
    <>
      <StaffShellView
        backend
        fictionalDemo={employee.fictionalDemo}
        user={employee}
        houseCount={employee.assignedHouses.length}
        unread={0}
        onLogout={() => {
          setFailed(false)
          void signOut({ redirectTo: "/login" }).catch(() => setFailed(true))
        }}
      >
        {children}
      </StaffShellView>
      {failed && <p role="alert">Sign-out unavailable. Please retry.</p>}
    </>
  )
}
export function FutureRead({
  title = "Future Development",
}: {
  title?: string
}) {
  return (
    <Card className="cm-panel">
      <h2 className="cm-h3">{title}</h2>
      {title !== "Future Development" && <strong>Future Development</strong>}
      <p className="cm-muted">
        This feature is not available in the current CareMetrics version.
      </p>
    </Card>
  )
}
function EmployeeCard({ employee }: { employee: EmployeeIdentity }) {
  const nav = useNav()
  return (
    <Card className="cm-me-card" onClick={() => nav.go({ page: "profile" })}>
      <Avatar name={employee.name} recordId={employee.id} size={48} />
      <div className="cm-grow">
        <strong>{employee.name}</strong>
        <span>
          {employee.role} · {employee.employeeId}
        </span>
        <small>{employee.email}</small>
      </div>
      <span className="cm-me-cta">
        View profile
        <Icon name="chevron" size={14} />
      </span>
    </Card>
  )
}
interface DashboardProps {
  data: StaffOverview
  schedule: StaffSchedule
}
export function DashboardRead({ data, schedule }: DashboardProps) {
  const nav = useNav()
  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome back, ${data.employee.name.split(" ")[0]}`}
        subtitle={`${data.houses.length} authorised houses · ${data.clients.length} clients`}
        actions={<EmployeeCard employee={data.employee} />}
      />
      <div className="cm-dash-grid">
        <div className="cm-stack">
          <SectionTitle
            title="My houses"
            count={data.houses.length}
            action="All houses"
            onAction={() => nav.go({ page: "houses" })}
          />
          {data.houses.length ? (
            <div className="cm-house-strip">
              {data.houses.map((h) => (
                <HouseCard key={h.id} h={h} />
              ))}
            </div>
          ) : (
            <Empty
              icon="house"
              title="No houses assigned"
              text="Contact management if you need access."
            />
          )}
          <SectionTitle
            title="My clients"
            count={data.clients.length}
            action="Search"
            onAction={() => nav.go({ page: "search" })}
          />
          {data.clients.length ? (
            <div className="cm-client-grid">
              {data.clients.map((c) => (
                <ClientCard key={c.id} c={c} houseName={c.houseName} />
              ))}
            </div>
          ) : (
            <Empty icon="user" title="No clients available" />
          )}
        </div>
        <div className="cm-stack">
          <ScheduleSummary data={schedule} />
          <FutureRead title="My Leave" />
          <FutureRead title="Notifications" />
        </div>
      </div>
    </>
  )
}
export function HousesRead({ houses }: { houses: HouseSummary[] }) {
  return <HouseListView backend houses={houses} />
}
const houseTabs = [
  { id: "overview", label: "Overview", icon: "house" },
  { id: "diary", label: "House diary", icon: "book" },
  { id: "files", label: "Documents", icon: "image" },
  { id: "concerns", label: "Notifications & concerns", icon: "flag" },
]
const clientTabs = [
  { id: "overview", label: "Overview", icon: "user" },
  { id: "diary", label: "Diary", icon: "book" },
  { id: "care", label: "Care Plan", icon: "clipboard" },
  { id: "charting", label: "Charting", icon: "chart" },
  { id: "files", label: "Gallery", icon: "image" },
]
export function HouseRead({
  house,
  clients,
  houses,
  tab,
}: {
  house: HouseSummary
  clients: ClientSummary[]
  houses: HouseSummary[]
  tab: string
}) {
  const nav = useNav()
  return (
    <>
      <PageHeader
        back
        crumbs={[
          { label: "Houses", route: { page: "houses" } },
          { label: house.name },
        ]}
        title={house.name}
        subtitle={house.address}
        actions={
          <select
            className="cm-inline-select cm-switch"
            aria-label="Switch house"
            value={house.id}
            onChange={(e) => nav.go({ page: "house", id: e.target.value })}
          >
            {houses.map((h) => (
              <option value={h.id} key={h.id}>
                Switch: {h.name}
              </option>
            ))}
          </select>
        }
      />
      <div className="cm-house-banner">
        <SourcePhoto
          src={house.photo}
          alt="Illustrative residential exterior; not the fictional address"
        />
        <div className="cm-house-banner-info">
          {house.phone ? (
            <a href={`tel:${house.phone.replace(/\s/g, "")}`}>
              <Icon name="phone" size={15} />
              {house.phone}
            </a>
          ) : (
            <span>Telephone not recorded</span>
          )}
          {house.email ? (
            <a href={`mailto:${house.email}`}>
              <Icon name="mail" size={15} />
              {house.email}
            </a>
          ) : (
            <span>Email not recorded</span>
          )}
        </div>
      </div>
      <Tabs
        label="House sections"
        tabs={houseTabs}
        value={tab}
        onChange={(t) => nav.go({ page: "house", id: house.id, tab: t })}
      />
      <div role="tabpanel" aria-label={`House ${tab}`}>
        {tab === "overview" ? (
          <div className="cm-stack">
            <h2 className="cm-h3">
              Clients at {house.name}{" "}
              <span className="cm-faint">({clients.length})</span>
            </h2>
            {clients.length ? (
              <div className="cm-client-grid">
                {clients.map((c) => (
                  <ClientCard key={c.id} c={c} houseName={c.houseName} />
                ))}
              </div>
            ) : (
              <Empty icon="user" title="No clients at this house" />
            )}
            <div className="cm-row-actions">
              <Btn
                variant="secondary"
                icon="image"
                disabled
                title="Future Development"
              >
                Update house photo
              </Btn>
              <Btn
                variant="secondary"
                icon="flag"
                disabled
                title="Future Development"
              >
                Submit house concern
              </Btn>
            </div>
          </div>
        ) : (
          <FutureRead />
        )}
      </div>
    </>
  )
}
export function ClientRead({
  client,
  tab,
  diary,
  care,
}: {
  client: ClientProfileRead
  tab: string
  diary?: React.ReactNode
  care?: React.ReactNode
}) {
  const nav = useNav()
  const primary = client.contacts.find((k) => k.primary)
  const anchor = `contacts-${client.id}`
  useEffect(() => {
    if (tab === "overview" && window.location.hash === `#${anchor}`) {
      const frame = requestAnimationFrame(() => {
        const el = document.getElementById(anchor)
        el?.scrollIntoView({ block: "start" })
        el?.focus({ preventScroll: true })
      })
      return () => cancelAnimationFrame(frame)
    }
  }, [anchor, tab])
  return (
    <>
      <PageHeader
        back
        title=""
        crumbs={[
          { label: "Houses", route: { page: "houses" } },
          {
            label: client.houseName,
            route: { page: "house", id: client.houseId },
          },
          { label: client.name },
        ]}
      />
      <section className="cm-profile-head">
        <div className="cm-photo-edit">
          <Avatar name={client.name} recordId={client.id} size={76} />
          <button
            className="cm-photo-control"
            disabled
            aria-label="Change client photo unavailable"
            title="Future Development"
          >
            <Icon name="image" size={15} />
          </button>
        </div>
        <div className="cm-grow">
          <h1>{client.name}</h1>
          <p>
            Prefers &quot;{client.preferred}&quot; ·{" "}
            <Link className="cm-link" href={`/houses/${client.houseId}`}>
              {client.houseName}
            </Link>
          </p>
          <p>
            <Link
              className="cm-link"
              href={`/clients/${client.id}?tab=overview#${anchor}`}
            >
              View contacts & next of kin
            </Link>
          </p>
        </div>
        {primary?.phone && (
          <a
            className="cm-call"
            href={`tel:${primary.phone.replace(/\s/g, "")}`}
            aria-label={`Call next of kin ${primary.name}`}
          >
            <Icon name="phone" size={17} />
            <span>
              <small>Next of kin</small>
              {primary.name} · {primary.phone}
            </span>
          </a>
        )}
      </section>
      <Tabs
        label="Client sections"
        tabs={clientTabs}
        value={tab}
        onChange={(t) => nav.go({ page: "client", id: client.id, tab: t })}
      />
      <div role="tabpanel" aria-label={`Client ${tab}`}>
        {tab === "overview" ? (
          <div className="cm-two-col">
            <div className="cm-stack">
              <Card className="cm-panel">
                <div className="cm-row-between">
                  <h2 className="cm-h3">About {client.preferred}</h2>
                  <Btn
                    size="sm"
                    variant="secondary"
                    icon="edit"
                    disabled
                    title="Future Development"
                  >
                    Edit profile
                  </Btn>
                </div>
                <p className="cm-body">
                  {client.summary || "No profile information recorded."}
                </p>
                <dl className="cm-dl cm-dl--inline">
                  <div>
                    <dt>Date of birth</dt>
                    <dd>
                      {client.dob ? formatDateOnly(client.dob) : "Not recorded"}
                    </dd>
                  </div>
                  <div>
                    <dt>House</dt>
                    <dd>
                      <Link
                        className="cm-link"
                        href={`/houses/${client.houseId}`}
                      >
                        {client.houseName}
                      </Link>
                    </dd>
                  </div>
                  <div>
                    <dt>NHI</dt>
                    <dd>Restricted</dd>
                  </div>
                </dl>
              </Card>
              <div className="cm-doc-shortcuts">
                {clientTabs.slice(1).map((t) => (
                  <Card
                    key={t.id}
                    className="cm-doc-tile"
                    onClick={() =>
                      nav.go({ page: "client", id: client.id, tab: t.id })
                    }
                  >
                    <span>
                      <Icon name={t.icon} size={20} />
                    </span>
                    <strong>{t.label}</strong>
                    <small>
                      {t.id === "diary"
                        ? "Submitted history"
                        : t.id === "care"
                          ? "Assigned forms"
                          : "Future Development"}
                    </small>
                  </Card>
                ))}
              </div>
            </div>
            <ClientContactsView
              clientId={client.id}
              contacts={client.contacts}
            />
          </div>
        ) : tab === "diary" && diary ? (
          diary
        ) : tab === "care" && care ? (
          care
        ) : (
          <FutureRead />
        )}
      </div>
    </>
  )
}
export function ProfileRead({ employee }: { employee: EmployeeIdentity }) {
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
          <Avatar name={employee.name} recordId={employee.id} size={84} />
          <button
            className="cm-photo-control"
            disabled
            aria-label="Change profile photo"
            title="Future Development"
          >
            <Icon name="image" size={15} />
          </button>
        </div>
        <div className="cm-grow">
          <h2 className="cm-staff-name">{employee.name}</h2>
          <p>
            {employee.role} · {employee.employeeId}
          </p>
          <div className="cm-alert-list">
            {employee.assignedHouses.map((h) => (
              <Status key={h.id} tone="brand" dot={false}>
                {h.name}
              </Status>
            ))}
          </div>
        </div>
        <Btn
          variant="secondary"
          icon="edit"
          disabled
          title="Future Development"
        >
          Edit profile
        </Btn>
      </section>
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
                ["Full name", employee.name],
                ["Employee ID", employee.employeeId],
                ["Role", employee.role],
                ["Work email", employee.email],
                ["Account status", employee.status],
                [
                  "Assigned houses",
                  employee.assignedHouses.map((h) => h.name).join(", ") ||
                    "None assigned",
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card className="cm-panel">
            <h2 className="cm-h3">Assigned houses</h2>
            {employee.assignedHouses.length ? (
              employee.assignedHouses.map((h) => (
                <p key={h.id}>
                  <Link className="cm-link" href={`/houses/${h.id}`}>
                    {h.name}
                  </Link>
                </p>
              ))
            ) : (
              <p>No houses assigned.</p>
            )}
          </Card>
        </div>
        <Card className="cm-panel">
          <h2 className="cm-h3">Contact details</h2>
          <dl className="cm-dl">
            <div>
              <dt>Work email</dt>
              <dd>{employee.email}</dd>
            </div>
          </dl>
          <p className="cm-hint">
            Profile editing and account recovery are not connected here.
          </p>
        </Card>
      </div>
    </div>
  )
}
export function SearchRead({ data }: { data: StaffSearch }) {
  const nav = useNav(),
    router = useRouter()
  const [input, setInput] = useState({ query: data.query, value: data.query })
  const value = input.query === data.query ? input.value : data.query
  if (input.query !== data.query)
    setInput({ query: data.query, value: data.query })
  const setValue = (value: string) => setInput({ query: data.query, value })
  const [pending, startTransition] = useTransition()
  useEffect(() => {
    if (value === data.query) return
    const timer = setTimeout(
      () =>
        startTransition(() =>
          router.replace(
            `/search${value ? "?q=" + encodeURIComponent(value) : ""}`,
          ),
        ),
      250,
    )
    return () => clearTimeout(timer)
  }, [value, data.query, router])
  return (
    <>
      <PageHeader
        title="Search"
        subtitle="Find authorised clients and houses. Searching a house name also lists its clients."
      />
      <div className="cm-search-hero">
        <SearchInput
          value={value}
          onChange={setValue}
          placeholder="Search by client or house name"
          autoFocus
          label="Search clients and houses"
        />
      </div>
      {pending && <p role="status">Searching…</p>}
      <div
        className="cm-stack"
        aria-busy={pending}
        aria-live="polite"
        aria-label="Search results"
      >
        {!data.query ? (
          <>
            <SectionTitle title="Quick access" />
            <div className="cm-chip-row">
              {data.houses.map((h) => (
                <button
                  className="cm-chip"
                  key={h.id}
                  onClick={() => setValue(h.name)}
                >
                  <Icon name="house" size={14} />
                  {h.name}
                </button>
              ))}
              {data.clients.slice(0, 4).map((c) => (
                <button
                  className="cm-chip"
                  key={c.id}
                  onClick={() => setValue(c.name)}
                >
                  <Icon name="user" size={14} />
                  {c.name}
                </button>
              ))}
            </div>
          </>
        ) : !data.houses.length && !data.clients.length ? (
          <Empty
            title={`No results for "${data.query}"`}
            text="Check the spelling, or you may not be assigned to this client or house."
          />
        ) : (
          <>
            {data.houses.length > 0 && (
              <>
                <SectionTitle title="Houses" count={data.houses.length} />
                {data.houses.map((h) => (
                  <Card
                    key={h.id}
                    className="cm-result"
                    onClick={() => nav.go({ page: "house", id: h.id })}
                  >
                    <SourcePhoto
                      src={h.photo}
                      alt="Illustrative residential exterior"
                      className="cm-result-img"
                    />
                    <div className="cm-grow">
                      <strong>{h.name}</strong>
                      <span>{h.address}</span>
                      <small>{h.clientNames.join(", ")}</small>
                    </div>
                    <span className="cm-result-cta">
                      Open house
                      <Icon name="chevron" size={14} />
                    </span>
                  </Card>
                ))}
              </>
            )}
            {data.clients.length > 0 && (
              <>
                <SectionTitle title="Clients" count={data.clients.length} />
                {data.clients.map((c) => (
                  <Card
                    key={c.id}
                    className="cm-result"
                    onClick={() => nav.go({ page: "client", id: c.id })}
                  >
                    <Avatar name={c.name} recordId={c.id} size={46} />
                    <div className="cm-grow">
                      <strong>{c.name}</strong>
                      <span>{c.houseName}</span>
                      <small>Prefers &quot;{c.preferred}&quot;</small>
                    </div>
                    <span className="cm-result-cta">
                      Open profile
                      <Icon name="chevron" size={14} />
                    </span>
                  </Card>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </>
  )
}
