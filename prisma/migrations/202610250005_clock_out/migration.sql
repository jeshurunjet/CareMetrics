BEGIN;
ALTER TABLE "AttendanceRecord"
 ADD COLUMN "clockOutRequestId" UUID,
 ADD COLUMN "clockOutRequestDigest" TEXT,
 ADD COLUMN "clockOutPolicyVersion" TEXT,
 ADD COLUMN "clockOutPolicySnapshot" JSONB,
 ADD COLUMN "clockOutVerification" TEXT;
CREATE UNIQUE INDEX "AttendanceRecord_clockOutRequestId_key" ON "AttendanceRecord"("clockOutRequestId");
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_clock_out_evidence" CHECK (
 ("clockOutRequestId" IS NULL AND "clockOutRequestDigest" IS NULL AND "clockOutPolicyVersion" IS NULL AND "clockOutPolicySnapshot" IS NULL AND "clockOutVerification" IS NULL)
 OR ("clockOutVerification" IS NOT NULL AND "clockOutVerification"='NO_LOCATION_REQUIRED_TEST' AND "clockOut" IS NOT NULL AND "clockIn" IS NOT NULL AND "clockOut">"clockIn" AND "clockOutRequestId" IS NOT NULL AND "clockOutRequestDigest" IS NOT NULL AND "clockOutRequestDigest" ~ '^[a-f0-9]{64}$' AND "clockOutPolicyVersion" IS NOT NULL AND length("clockOutPolicyVersion") BETWEEN 1 AND 80 AND "clockOutPolicySnapshot" IS NOT NULL AND jsonb_typeof("clockOutPolicySnapshot")='object')
);
CREATE OR REPLACE FUNCTION protect_clock_in_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP = 'DELETE' THEN
  IF OLD.verification IS NOT NULL OR OLD."clockOut" IS NOT NULL THEN RAISE EXCEPTION 'Clock-in evidence is retained'; END IF;
  RETURN OLD;
 END IF;
 IF TG_OP = 'UPDATE' AND OLD."clockIn" IS NOT NULL AND ROW(NEW.id,NEW."organisationId",NEW."employeeId",NEW."shiftId",NEW."houseId",NEW."clockIn",NEW."measuredAt",NEW."accuracyMetres",NEW.verification,NEW."policyVersion",NEW."policySnapshot",NEW."requestId",NEW."requestDigest",NEW."createdAt") IS DISTINCT FROM ROW(OLD.id,OLD."organisationId",OLD."employeeId",OLD."shiftId",OLD."houseId",OLD."clockIn",OLD."measuredAt",OLD."accuracyMetres",OLD.verification,OLD."policyVersion",OLD."policySnapshot",OLD."requestId",OLD."requestDigest",OLD."createdAt") THEN RAISE EXCEPTION 'Clock-in evidence is immutable'; END IF;
 IF TG_OP = 'UPDATE' AND OLD."clockOut" IS NOT NULL AND ROW(NEW."clockOut",NEW."clockOutRequestId",NEW."clockOutRequestDigest",NEW."clockOutPolicyVersion",NEW."clockOutPolicySnapshot",NEW."clockOutVerification") IS DISTINCT FROM ROW(OLD."clockOut",OLD."clockOutRequestId",OLD."clockOutRequestDigest",OLD."clockOutPolicyVersion",OLD."clockOutPolicySnapshot",OLD."clockOutVerification") THEN RAISE EXCEPTION 'Completed attendance is immutable'; END IF;
 IF NEW."houseId" IS NOT NULL AND (TG_OP = 'INSERT' OR ROW(NEW."organisationId",NEW."shiftId",NEW."employeeId",NEW."houseId") IS DISTINCT FROM ROW(OLD."organisationId",OLD."shiftId",OLD."employeeId",OLD."houseId")) AND NOT EXISTS (SELECT 1 FROM "Shift" s WHERE s.id=NEW."shiftId" AND s."organisationId"=NEW."organisationId" AND s."employeeId"=NEW."employeeId" AND s."houseId"=NEW."houseId") THEN RAISE EXCEPTION 'Attendance house must match shift'; END IF;
 RETURN NEW;
END;
$$;

ALTER TABLE "AuditEvent" DROP CONSTRAINT "AuditEvent_action";
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_action" CHECK ("action" IN ('employee.created','employee.updated','employee.status','employee.role','assignments.updated','house.created','house.updated','house.status','client.created','client.updated','client.status','client.transferred','contacts.updated','shift.created','shift.updated','shift.cancelled','attendance.clocked_in','attendance.clocked_out'));
COMMIT;
