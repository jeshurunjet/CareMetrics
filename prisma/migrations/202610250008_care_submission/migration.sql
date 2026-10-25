BEGIN;
ALTER TABLE "CareRecord" ADD COLUMN "houseId" UUID, ADD COLUMN "requestId" UUID, ADD COLUMN "requestDigest" TEXT, ADD COLUMN "documentationContext" JSONB;
ALTER TABLE "CareRecord" ADD CONSTRAINT "CareRecord_organisationId_houseId_fkey" FOREIGN KEY ("organisationId","houseId") REFERENCES "House"("organisationId",id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "CareRecord_requestId_key" ON "CareRecord"("requestId");
ALTER TABLE "CareRecord" ADD CONSTRAINT "Care_submission_metadata" CHECK (
 ("houseId" IS NULL AND "requestId" IS NULL AND "requestDigest" IS NULL AND "documentationContext" IS NULL)
 OR COALESCE(("houseId" IS NOT NULL AND "requestId" IS NOT NULL AND "requestDigest" IS NOT NULL AND "requestDigest" ~ '^[a-f0-9]{64}$' AND status='SUBMITTED' AND "coveredAt" <= "submittedAt" AND jsonb_typeof("values")='object' AND ("offShiftReason" IS NULL OR length("offShiftReason") BETWEEN 1 AND 1000) AND "documentationContext" IS NOT NULL AND jsonb_typeof("documentationContext")='object' AND "documentationContext"->>'ruleVersion'='recorded-current-house-v1' AND jsonb_typeof("documentationContext"->'offShift')='boolean' AND (("documentationContext"->>'offShift'='true' AND "offShiftReason" IS NOT NULL AND length(btrim("offShiftReason"))>0) OR ("documentationContext"->>'offShift'='false' AND "documentationContext"->>'attendanceId' IS NOT NULL AND "documentationContext"->>'attendanceId' ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$'))), FALSE)
);
ALTER TABLE "AuditEvent" DROP CONSTRAINT "AuditEvent_action";
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_action" CHECK ("action" IN ('employee.created','employee.updated','employee.status','employee.role','assignments.updated','house.created','house.updated','house.status','client.created','client.updated','client.status','client.transferred','contacts.updated','shift.created','shift.updated','shift.cancelled','attendance.clocked_in','attendance.clocked_out','diary.submitted','care.submitted'));
ALTER TABLE "AuditEvent" DROP CONSTRAINT "AuditEvent_target_type";
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_target_type" CHECK ("targetType" IN ('employee','house','client','contacts','assignments','shift','attendance','clientDiary','careRecord'));
COMMIT;
