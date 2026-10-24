"use client"
import { useState } from "react"
import Link from "next/link"
import { useAdmin, PageHead, Panel, KV, Pill } from "../ui/core"
import { managedRecord, type RecordKind } from "./adapter"
import RecordContent from "./RecordContent"
import RecordRevisionHistory from "../../staff/documentation/RecordRevisionHistory"
import { latestRevision } from "../../staff/documentation/revisions"
import { Banner, Btn, Empty } from "../../staff/ui"
import { formatDateTime } from "@/lib/time"
export default function SubmittedRecordDetails({
  id,
  kind,
}: {
  id: string
  kind: RecordKind
}) {
  const nav = useAdmin(),
    s = nav.data,
    r = managedRecord(s, nav.role, kind, id),
    [original, setOriginal] = useState(false)
  if (!r)
    return (
      <Empty
        title="Record unavailable"
        text="The submitted record is missing or outside this preview scope."
      />
    )
  const revision = latestRevision(s, kind, id)
  return (
    <>
      <PageHead
        title={r.title}
        crumbs={[
          { label: "Care Documentation", to: { page: "docs" } },
          { label: "Submitted records", to: { page: "docs", tab: "records" } },
          { label: r.title },
        ]}
        sub={
          <span className="ad-chips">
            <Pill s={revision ? "Corrected" : "Submitted"} />
            <span>
              Read-only · {r.type} ·{" "}
              {original ? "Original submission" : "Effective record"}
            </span>
          </span>
        }
      />
      <div className="ad-grid-main">
        <div className="ad-stack">
          {r.offShiftReason && (
            <Banner tone="info" title="Off-Shift Entry">
              Original reason: {r.offShiftReason}. This does not invalidate the
              record or create attendance.
            </Banner>
          )}
          <Panel
            title={original ? "Original submitted record" : "Effective record"}
            actions={
              <Btn
                variant="secondary"
                size="sm"
                onClick={() => setOriginal(!original)}
              >
                {original ? "View Effective Record" : "View Original Record"}
              </Btn>
            }
          >
            {revision && !original && (
              <p className="ad-faint">
                Corrected · revision {revision.id}. Original author, timestamps
                and version are retained.
              </p>
            )}
            <RecordContent s={s} record={r} original={original} />
          </Panel>
          <Panel title="Correction and revision history">
            <RecordRevisionHistory
              s={s}
              kind={kind}
              record={r.diary ?? r.care!}
            />
          </Panel>
        </div>
        <div className="ad-stack">
          <Panel title="Context">
            <KV
              cols={1}
              items={[
                [
                  r.clientId ? "Client" : "House",
                  <Link
                    key="context"
                    className="ad-link"
                    href={
                      r.clientId
                        ? `/admin/clients/${r.clientId}`
                        : `/admin/houses/${r.houseId}`
                    }
                  >
                    {r.context}
                  </Link>,
                ],
                ...(r.clientId
                  ? [
                      [
                        "Current house",
                        <Link
                          key="house"
                          className="ad-link"
                          href={`/admin/houses/${r.houseId}`}
                        >
                          {s.houses.find((h) => h.id === r.houseId)?.name}
                        </Link>,
                      ] as [string, React.ReactNode],
                    ]
                  : []),
                ["Record identifier", r.id],
                ["Category", r.category],
                [
                  "Author",
                  <Link
                    key="author"
                    className="ad-link"
                    href={`/admin/employees/${r.authorId}`}
                  >
                    {s.staff.find((e) => e.id === r.authorId)?.name}
                  </Link>,
                ],
                ["Covered", formatDateTime(r.coveredAt)],
                ["Created", formatDateTime(r.createdAt)],
                ["Submitted", formatDateTime(r.submittedAt)],
                ...(r.care
                  ? [
                      ["Template identifier", r.care.templateId],
                      [
                        "Original published version",
                        `v${r.care.templateVersion}`,
                      ],
                    ] as [string, string][]
                  : []),
              ]}
            />
          </Panel>
          <Panel title="Record controls">
            <Link
              className="ad-link"
              href="/admin/documentation?tab=corrections"
            >
              View Correction Requests
            </Link>
            <p className="ad-faint">
              Management-controlled logical removal requires a separate
              retention/removal/restoration policy and backend workflow.
            </p>
            <Btn variant="secondary" disabled>
              Controlled removal · unavailable
            </Btn>
          </Panel>
        </div>
      </div>
    </>
  )
}
