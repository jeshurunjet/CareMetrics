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
import ReadOnlyFormValues from "../../forms/ReadOnlyFormValues"
import { formatDateTime } from "@/lib/time"
import { careDetailHref, careFormHref, careHistoryHref } from "./navigation"
import { AssessmentPreviewNotice, UnavailableAssessment } from "./shared"
export default function AssessmentDetails({
  clientId,
  templateId,
  id,
}: {
  clientId: string
  templateId: string
  id: string
}) {
  const s = useStaffData(),
    params = useSearchParams(),
    record = getCareRecord(s, clientId, templateId, id),
    assigned = getAssignedCareTemplate(s, clientId, templateId)
  if (!record || !assigned) return <UnavailableAssessment clientId={clientId} />
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
        unavailable={<UnavailableAssessment clientId={clientId} />}
        returnHref={careDetailHref(clientId, templateId, id)}
        proposalHelp="Identify each affected field and its intended value. The original version and answers remain unchanged."
        onRequest={(snapshot, reason, proposed, requestId, now) =>
          requestCareCorrection(
            snapshot,
            clientId,
            templateId,
            id,
            reason,
            proposed,
            requestId,
            now,
          )
        }
      />
    )
  return (
    <div className="cm-stack">
      <Link href={careHistoryHref(clientId, templateId)}>
        Back to assessment history
      </Link>
      <AssessmentPreviewNotice />
      {params.get("result") === "submitted" && (
        <Banner
          tone="success"
          title="Assessment submitted in development preview"
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
              href={careDetailHref(clientId, templateId, id, true)}
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
          <p className="cm-hint">
            Management review is not implemented. Original assessment values are
            unchanged.
          </p>
        </Card>
      ))}
    </div>
  )
}
