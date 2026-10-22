"use client"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useStaffData } from "../data/context"
import {
  getAssignedCareTemplate,
  getCareRecord,
  canRequestCareCorrection,
  requestCareCorrection,
} from "./adapter"
import { recordCorrections } from "../data/correction-service"
import { Card, Banner } from "../ui"
import { RecordStatus, RecordMetadata } from "../diary/shared"
import RecordCorrectionForm from "../documentation/RecordCorrectionForm"
import { allFields, isTableRows } from "../../forms/engine"
import ReadOnlyFormValues from "../../forms/ReadOnlyFormValues"
import { formatDateTime } from "@/lib/time"
import { careDetailHref, careFormHref, careHistoryHref } from "./navigation"
import { AssessmentPreviewNotice, UnavailableAssessment } from "./shared"
export default function AssessmentDetails({
  clientId,
  templateId,
  id,
  kind = "care",
}: {
  clientId: string
  templateId: string
  id: string
  kind?: "care" | "chart"
}) {
  const s = useStaffData(),
    params = useSearchParams(),
    record = getCareRecord(s, clientId, templateId, id),
    assigned = getAssignedCareTemplate(s, clientId, templateId, kind)
  if (!record || !assigned)
    return <UnavailableAssessment clientId={clientId} kind={kind} />
  const version = assigned.template.versions.find(
    (v) => v.version === record.templateVersion,
  )!
  const answers = (
    <ReadOnlyFormValues version={version} values={record.values} />
  )
  if (params.get("action") === "correction")
    return (
      <RecordCorrectionForm
        key={id}
        title={assigned.template.name}
        original={answers}
        allowed={canRequestCareCorrection(s, record)}
        unavailable={<UnavailableAssessment clientId={clientId} kind={kind} />}
        returnHref={careDetailHref(clientId, templateId, id, false, kind)}
        targets={
          kind === "chart"
            ? allFields(version).flatMap((f) => {
                const value = record.values[f.id]
                return f.type === "repeatingTable" && isTableRows(value)
                  ? value.flatMap((row, i) =>
                      f.columns.map((c) => ({
                        label: `${f.label} · Row ${i + 1} · ${c.label}`,
                        target: {
                          fieldId: f.id,
                          rowId: row.id,
                          columnId: c.id,
                        },
                      })),
                    )
                  : [{ label: f.label, target: { fieldId: f.id } }]
              })
            : undefined
        }
        proposalHelp="Identify each affected field and its intended value. The original version and answers remain unchanged."
        onRequest={(snapshot, reason, proposed, requestId, now, target) =>
          requestCareCorrection(
            snapshot,
            clientId,
            templateId,
            id,
            reason,
            proposed,
            requestId,
            now,
            target,
          )
        }
      />
    )
  return (
    <div className="cm-stack">
      <Link href={careHistoryHref(clientId, templateId, kind)}>
        Back to {kind === "chart" ? "chart" : "assessment"} history
      </Link>
      <AssessmentPreviewNotice kind={kind} />
      {params.get("result") === "submitted" && (
        <Banner
          tone="success"
          title={
            kind === "chart"
              ? "Chart entry submitted in development preview"
              : "Assessment submitted in development preview"
          }
        >
          This session-only record is read-only and resets on reload.
        </Banner>
      )}
      <Card className="cm-panel">
        <h2 className="cm-h2">{assigned.template.name}</h2>
        <p className="cm-muted">
          Template v{record.templateVersion} ·{" "}
          {s.clients.find((c) => c.id === clientId)?.name}
        </p>
        <div className="cm-chip-row">
          <RecordStatus entry={record} recordType="care" />
        </div>
        {answers}
        <RecordMetadata entry={record} />
        <div className="cm-row-actions">
          {record.status === "draft" ? (
            <Link
              className="cm-btn cm-btn--primary cm-btn--md"
              href={careFormHref(clientId, templateId, id)}
            >
              Continue draft
            </Link>
          ) : canRequestCareCorrection(s, record) ? (
            <Link
              className="cm-btn cm-btn--secondary cm-btn--md"
              href={careDetailHref(clientId, templateId, id, true, kind)}
            >
              Request correction
            </Link>
          ) : (
            <p className="cm-hint">
              Submitted content is read-only. Corrections require management
              review.
            </p>
          )}
        </div>
      </Card>
      {recordCorrections(s, "care", id).map((c) => (
        <Card key={c.id} className="cm-panel">
          <h3 className="cm-h3">
            Correction {c.status === "pending" ? "pending review" : c.status}
          </h3>
          <dl className="cm-dl">
            <div>
              <dt>Reason</dt>
              <dd>{c.reason}</dd>
            </div>
            <div>
              <dt>Proposed correction</dt>
              <dd className="cm-diary-text">{c.proposed}</dd>
            </div>
            <div>
              <dt>Requested</dt>
              <dd>{formatDateTime(c.requestedAt)}</dd>
            </div>
          </dl>
          {c.targets?.map((t) => (
            <p className="cm-hint" key={JSON.stringify(t)}>
              Reference: field {t.fieldId}
              {t.rowId ? ` · row ${t.rowId} · column ${t.columnId}` : ""}
            </p>
          ))}
          <p className="cm-hint">
            Management review is not implemented. Original assessment values are
            unchanged.
          </p>
        </Card>
      ))}
    </div>
  )
}
