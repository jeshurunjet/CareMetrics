BEGIN;
ALTER TABLE "AttendanceRecord"
 ADD COLUMN "houseId" UUID,
 ADD COLUMN "measuredAt" TIMESTAMPTZ(3),
 ADD COLUMN "accuracyMetres" DOUBLE PRECISION,
 ADD COLUMN "verification" TEXT,
 ADD COLUMN "policyVersion" TEXT,
 ADD COLUMN "policySnapshot" JSONB,
 ADD COLUMN "requestId" UUID,
 ADD COLUMN "requestDigest" TEXT;
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_organisationId_houseId_fkey" FOREIGN KEY ("organisationId","houseId") REFERENCES "House"("organisationId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "AttendanceRecord_requestId_key" ON "AttendanceRecord"("requestId");
CREATE UNIQUE INDEX "AttendanceRecord_one_open_employee" ON "AttendanceRecord"("organisationId","employeeId") WHERE "clockIn" IS NOT NULL AND "clockOut" IS NULL;
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_gps_evidence" CHECK (
 ("verification" IS NULL AND "houseId" IS NULL AND "measuredAt" IS NULL AND "accuracyMetres" IS NULL AND "policyVersion" IS NULL AND "policySnapshot" IS NULL AND "requestId" IS NULL AND "requestDigest" IS NULL)
 OR ("verification" IS NOT NULL AND "verification" = 'SERVER_VALIDATED_LOCATION_TEST' AND "clockIn" IS NOT NULL AND "houseId" IS NOT NULL AND "measuredAt" IS NOT NULL AND "accuracyMetres" IS NOT NULL AND "accuracyMetres" >= 0 AND "accuracyMetres" < 'Infinity'::float8 AND "policyVersion" IS NOT NULL AND length("policyVersion") BETWEEN 1 AND 80 AND "policySnapshot" IS NOT NULL AND jsonb_typeof("policySnapshot") = 'object' AND "requestId" IS NOT NULL AND "requestDigest" IS NOT NULL AND "requestDigest" ~ '^[a-f0-9]{64}$')
);
CREATE FUNCTION protect_clock_in_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP = 'DELETE' THEN
  IF OLD.verification IS NOT NULL THEN RAISE EXCEPTION 'Clock-in evidence is retained'; END IF;
  RETURN OLD;
 END IF;
 IF TG_OP = 'UPDATE' AND OLD.verification IS NOT NULL AND ROW(NEW.id,NEW."organisationId",NEW."employeeId",NEW."shiftId",NEW."houseId",NEW."clockIn",NEW."measuredAt",NEW."accuracyMetres",NEW.verification,NEW."policyVersion",NEW."policySnapshot",NEW."requestId",NEW."requestDigest",NEW."createdAt") IS DISTINCT FROM ROW(OLD.id,OLD."organisationId",OLD."employeeId",OLD."shiftId",OLD."houseId",OLD."clockIn",OLD."measuredAt",OLD."accuracyMetres",OLD.verification,OLD."policyVersion",OLD."policySnapshot",OLD."requestId",OLD."requestDigest",OLD."createdAt") THEN RAISE EXCEPTION 'Clock-in evidence is immutable'; END IF;
 IF NEW."houseId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Shift" s WHERE s.id=NEW."shiftId" AND s."organisationId"=NEW."organisationId" AND s."employeeId"=NEW."employeeId" AND s."houseId"=NEW."houseId") THEN RAISE EXCEPTION 'Attendance house must match shift'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER immutable_clock_in BEFORE INSERT OR UPDATE OR DELETE ON "AttendanceRecord" FOR EACH ROW EXECUTE FUNCTION protect_clock_in_evidence();
ALTER TABLE "AuditEvent" DROP CONSTRAINT "AuditEvent_target_type";
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_target_type" CHECK ("targetType" IN ('employee','house','client','contacts','assignments','shift','attendance'));
ALTER TABLE "AuditEvent" DROP CONSTRAINT "AuditEvent_action";
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_action" CHECK ("action" IN ('employee.created','employee.updated','employee.status','employee.role','assignments.updated','house.created','house.updated','house.status','client.created','client.updated','client.status','client.transferred','contacts.updated','shift.created','shift.updated','shift.cancelled','attendance.clocked_in'));
COMMIT;
