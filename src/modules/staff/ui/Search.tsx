"use client"
import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { useStaffData } from "../data/context"
import { staffQueries } from "../data/queries"
import {
  PageHeader,
  Card,
  Avatar,
  Icon,
  SectionTitle,
  Empty,
  useNav,
} from "./index"
import SearchInput from "./SearchInput"
import SourcePhoto from "./SourcePhoto"
export default function Search() {
  const s = useStaffData()
  const nav = useNav()
  const params = useSearchParams()
  const [q, setQ] = useState(params.get("q") ?? "")
  const update = (value: string) => {
    setQ(value)
    const query = new URLSearchParams()
    if (value) query.set("q", value)
    window.history.replaceState(
      null,
      "",
      `/search${query.size ? "?" + query : ""}`,
    )
  }
  const { houses, clients } = staffQueries.search(s, q)
  return (
    <>
      <PageHeader
        title="Search"
        subtitle="Find authorised clients and houses. Searching a house name also lists its clients."
      />
      <div className="cm-search-hero">
        <SearchInput
          value={q}
          onChange={update}
          placeholder="Search by client or house name"
          autoFocus
          label="Search clients and houses"
        />
      </div>
      {!q.trim() ? (
        <div className="cm-stack">
          <SectionTitle title="Quick access" />
          <div className="cm-chip-row">
            {staffQueries.getHouses(s).map((h) => (
              <button
                key={h.id}
                className="cm-chip"
                onClick={() => update(h.name)}
              >
                <Icon name="house" size={14} />
                {h.name}
              </button>
            ))}
            {staffQueries
              .getClients(s)
              .slice(0, 4)
              .map((c) => (
                <button
                  key={c.id}
                  className="cm-chip"
                  onClick={() => update(c.name)}
                >
                  <Icon name="user" size={14} />
                  {c.name}
                </button>
              ))}
          </div>
        </div>
      ) : houses.length + clients.length === 0 ? (
        <div role="status">
          <Empty
            title={`No results for "${q}"`}
            text="Check the spelling, or you may not be assigned to this client or house."
          />
        </div>
      ) : (
        <div
          className="cm-stack"
          aria-live="polite"
          aria-label="Search results"
        >
          {houses.length > 0 && (
            <>
              <SectionTitle title="Houses" count={houses.length} />
              {houses.map((h) => (
                <Card
                  key={h.id}
                  className="cm-result"
                  onClick={() => nav.go({ page: "house", id: h.id })}
                >
                  <SourcePhoto src={h.photo} alt="" className="cm-result-img" />
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
          {clients.length > 0 && (
            <>
              <SectionTitle title="Clients" count={clients.length} />
              {clients.map((c) => (
                <Card
                  key={c.id}
                  className="cm-result"
                  onClick={() => nav.go({ page: "client", id: c.id })}
                >
                  <Avatar
                    name={c.name}
                    tone={c.tone}
                    size={46}
                    photo={c.photo}
                  />
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
          {
            <span className="sr-only">
              {houses.length} houses and {clients.length} clients found
            </span>
          }
        </div>
      )}
    </>
  )
}
