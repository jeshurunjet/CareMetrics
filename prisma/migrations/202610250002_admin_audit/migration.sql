BEGIN;
CREATE TABLE "AuditEvent" (
 "id" UUID NOT NULL,
 "organisationId" UUID NOT NULL,
 "actorId" UUID NOT NULL,
 "action" TEXT NOT NULL,
 "targetType" TEXT NOT NULL,
 "targetId" UUID NOT NULL,
 "summary" JSONB NOT NULL,
 "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "AuditEvent_actor_fkey" FOREIGN KEY ("organisationId", "actorId") REFERENCES "User"("organisationId","id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "AuditEvent_organisation_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "AuditEvent_summary_object" CHECK (jsonb_typeof("summary") = 'object'),
 CONSTRAINT "AuditEvent_target_type" CHECK ("targetType" IN ('employee','house','client','contacts','assignments')),
 CONSTRAINT "AuditEvent_action" CHECK ("action" IN ('employee.created','employee.updated','employee.status','employee.role','assignments.updated','house.created','house.updated','house.status','client.created','client.updated','client.status','client.transferred','contacts.updated'))
);
CREATE INDEX "AuditEvent_organisationId_createdAt_id_idx" ON "AuditEvent"("organisationId","createdAt","id");
CREATE INDEX "AuditEvent_organisationId_targetType_targetId_idx" ON "AuditEvent"("organisationId","targetType","targetId");
CREATE FUNCTION protect_audit_event() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Audit events are append only'; END;
$$;
CREATE TRIGGER immutable_audit BEFORE UPDATE OR DELETE ON "AuditEvent" FOR EACH ROW EXECUTE FUNCTION protect_audit_event();
CREATE UNIQUE INDEX "ClientContact_one_primary" ON "ClientContact"("organisationId","clientId") WHERE "isPrimary";
CREATE OR REPLACE FUNCTION invalidate_employee_sessions() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD."passwordHash" IS DISTINCT FROM NEW."passwordHash" OR OLD.status IS DISTINCT FROM NEW.status OR OLD.role IS DISTINCT FROM NEW.role THEN
  NEW."sessionVersion" := OLD."sessionVersion" + 1;
 END IF;
 RETURN NEW;
END;
$$;
COMMIT;
