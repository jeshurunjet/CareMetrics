BEGIN;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMINISTRATOR', 'MANAGER', 'SENIOR_STAFF', 'STAFF');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'INVITED');

-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('SCHEDULED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('DRAFT', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "TemplateKind" AS ENUM ('CARE', 'CHART');

-- CreateTable
CREATE TABLE "Organisation" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "organisationId" UUID NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STAFF',
    "status" "AccountStatus" NOT NULL DEFAULT 'INVITED',
    "passwordHash" TEXT,
    "sessionVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "House" (
    "id" UUID NOT NULL,
    "organisationId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "House_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeHouseAssignment" (
    "organisationId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "houseId" UUID NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "EmployeeHouseAssignment_pkey" PRIMARY KEY ("organisationId","employeeId","houseId")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" UUID NOT NULL,
    "organisationId" UUID NOT NULL,
    "houseId" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "preferredName" TEXT,
    "dateOfBirth" DATE,
    "summary" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientContact" (
    "id" UUID NOT NULL,
    "organisationId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isEmergency" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ClientContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" UUID NOT NULL,
    "organisationId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "houseId" UUID NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "status" "ShiftStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" UUID NOT NULL,
    "organisationId" UUID NOT NULL,
    "shiftId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "clockIn" TIMESTAMPTZ(3),
    "clockOut" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareTemplate" (
    "id" UUID NOT NULL,
    "organisationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "TemplateKind" NOT NULL DEFAULT 'CARE',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "CareTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareTemplateVersion" (
    "id" UUID NOT NULL,
    "organisationId" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "definition" JSONB NOT NULL,
    "publishedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareTemplateVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientTemplateAssignment" (
    "organisationId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ClientTemplateAssignment_pkey" PRIMARY KEY ("organisationId","clientId","templateId")
);

-- CreateTable
CREATE TABLE "ClientDiaryEntry" (
    "id" UUID NOT NULL,
    "organisationId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "houseId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "coveredAt" TIMESTAMPTZ(3) NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'DRAFT',
    "offShiftReason" TEXT,
    "submittedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ClientDiaryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareRecord" (
    "id" UUID NOT NULL,
    "organisationId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "templateVersion" INTEGER NOT NULL,
    "values" JSONB NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'DRAFT',
    "coveredAt" TIMESTAMPTZ(3) NOT NULL,
    "offShiftReason" TEXT,
    "submittedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "CareRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "key" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_organisationId_status_role_idx" ON "User"("organisationId", "status", "role");

-- CreateIndex
CREATE UNIQUE INDEX "User_organisationId_id_key" ON "User"("organisationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "User_organisationId_employeeCode_key" ON "User"("organisationId", "employeeCode");

-- CreateIndex
CREATE INDEX "House_organisationId_active_idx" ON "House"("organisationId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "House_organisationId_id_key" ON "House"("organisationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "House_organisationId_code_key" ON "House"("organisationId", "code");

-- CreateIndex
CREATE INDEX "EmployeeHouseAssignment_organisationId_houseId_active_idx" ON "EmployeeHouseAssignment"("organisationId", "houseId", "active");

-- CreateIndex
CREATE INDEX "Client_organisationId_houseId_active_idx" ON "Client"("organisationId", "houseId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Client_organisationId_id_key" ON "Client"("organisationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Client_organisationId_reference_key" ON "Client"("organisationId", "reference");

-- CreateIndex
CREATE INDEX "ClientContact_organisationId_clientId_idx" ON "ClientContact"("organisationId", "clientId");

-- CreateIndex
CREATE INDEX "Shift_organisationId_employeeId_startsAt_idx" ON "Shift"("organisationId", "employeeId", "startsAt");

-- CreateIndex
CREATE INDEX "Shift_organisationId_houseId_startsAt_idx" ON "Shift"("organisationId", "houseId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Shift_organisationId_id_employeeId_key" ON "Shift"("organisationId", "id", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_shiftId_key" ON "AttendanceRecord"("shiftId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_organisationId_employeeId_createdAt_idx" ON "AttendanceRecord"("organisationId", "employeeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_organisationId_shiftId_employeeId_key" ON "AttendanceRecord"("organisationId", "shiftId", "employeeId");

-- CreateIndex
CREATE INDEX "CareTemplate_organisationId_kind_archived_idx" ON "CareTemplate"("organisationId", "kind", "archived");

-- CreateIndex
CREATE UNIQUE INDEX "CareTemplate_organisationId_id_key" ON "CareTemplate"("organisationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "CareTemplateVersion_organisationId_templateId_version_key" ON "CareTemplateVersion"("organisationId", "templateId", "version");

-- CreateIndex
CREATE INDEX "ClientTemplateAssignment_organisationId_templateId_version_idx" ON "ClientTemplateAssignment"("organisationId", "templateId", "version");

-- CreateIndex
CREATE INDEX "ClientDiaryEntry_organisationId_clientId_submittedAt_id_idx" ON "ClientDiaryEntry"("organisationId", "clientId", "submittedAt", "id");

-- CreateIndex
CREATE INDEX "ClientDiaryEntry_organisationId_authorId_status_idx" ON "ClientDiaryEntry"("organisationId", "authorId", "status");

-- CreateIndex
CREATE INDEX "CareRecord_organisationId_clientId_submittedAt_id_idx" ON "CareRecord"("organisationId", "clientId", "submittedAt", "id");

-- CreateIndex
CREATE INDEX "CareRecord_organisationId_authorId_status_idx" ON "CareRecord"("organisationId", "authorId", "status");

-- CreateIndex
CREATE INDEX "LoginAttempt_expiresAt_idx" ON "LoginAttempt"("expiresAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "House" ADD CONSTRAINT "House_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeHouseAssignment" ADD CONSTRAINT "EmployeeHouseAssignment_organisationId_employeeId_fkey" FOREIGN KEY ("organisationId", "employeeId") REFERENCES "User"("organisationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeHouseAssignment" ADD CONSTRAINT "EmployeeHouseAssignment_organisationId_houseId_fkey" FOREIGN KEY ("organisationId", "houseId") REFERENCES "House"("organisationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_organisationId_houseId_fkey" FOREIGN KEY ("organisationId", "houseId") REFERENCES "House"("organisationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientContact" ADD CONSTRAINT "ClientContact_organisationId_clientId_fkey" FOREIGN KEY ("organisationId", "clientId") REFERENCES "Client"("organisationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_organisationId_employeeId_fkey" FOREIGN KEY ("organisationId", "employeeId") REFERENCES "User"("organisationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_organisationId_houseId_fkey" FOREIGN KEY ("organisationId", "houseId") REFERENCES "House"("organisationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_organisationId_shiftId_employeeId_fkey" FOREIGN KEY ("organisationId", "shiftId", "employeeId") REFERENCES "Shift"("organisationId", "id", "employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareTemplate" ADD CONSTRAINT "CareTemplate_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareTemplateVersion" ADD CONSTRAINT "CareTemplateVersion_organisationId_templateId_fkey" FOREIGN KEY ("organisationId", "templateId") REFERENCES "CareTemplate"("organisationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientTemplateAssignment" ADD CONSTRAINT "ClientTemplateAssignment_organisationId_clientId_fkey" FOREIGN KEY ("organisationId", "clientId") REFERENCES "Client"("organisationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientTemplateAssignment" ADD CONSTRAINT "ClientTemplateAssignment_organisationId_templateId_version_fkey" FOREIGN KEY ("organisationId", "templateId", "version") REFERENCES "CareTemplateVersion"("organisationId", "templateId", "version") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientDiaryEntry" ADD CONSTRAINT "ClientDiaryEntry_organisationId_clientId_fkey" FOREIGN KEY ("organisationId", "clientId") REFERENCES "Client"("organisationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientDiaryEntry" ADD CONSTRAINT "ClientDiaryEntry_organisationId_houseId_fkey" FOREIGN KEY ("organisationId", "houseId") REFERENCES "House"("organisationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientDiaryEntry" ADD CONSTRAINT "ClientDiaryEntry_organisationId_authorId_fkey" FOREIGN KEY ("organisationId", "authorId") REFERENCES "User"("organisationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareRecord" ADD CONSTRAINT "CareRecord_organisationId_clientId_fkey" FOREIGN KEY ("organisationId", "clientId") REFERENCES "Client"("organisationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareRecord" ADD CONSTRAINT "CareRecord_organisationId_authorId_fkey" FOREIGN KEY ("organisationId", "authorId") REFERENCES "User"("organisationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareRecord" ADD CONSTRAINT "CareRecord_organisationId_templateId_templateVersion_fkey" FOREIGN KEY ("organisationId", "templateId", "templateVersion") REFERENCES "CareTemplateVersion"("organisationId", "templateId", "version") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Domain checks not expressible in Prisma schema syntax.
ALTER TABLE "User" ADD CONSTRAINT "User_email_normalised" CHECK (email = lower(btrim(email)) AND length(email) <= 254);
ALTER TABLE "User" ADD CONSTRAINT "User_sessionVersion_positive" CHECK ("sessionVersion" > 0);
ALTER TABLE "House" ADD CONSTRAINT "House_coordinates" CHECK (
  (latitude IS NULL AND longitude IS NULL) OR
  (latitude IS NOT NULL AND longitude IS NOT NULL AND latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180));
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_time_order" CHECK ("endsAt" > "startsAt");
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "Attendance_time_order" CHECK ("clockOut" IS NULL OR ("clockIn" IS NOT NULL AND "clockOut" >= "clockIn"));
ALTER TABLE "CareTemplateVersion" ADD CONSTRAINT "Template_version_definition" CHECK (version > 0 AND jsonb_typeof(definition) = 'object');
ALTER TABLE "ClientDiaryEntry" ADD CONSTRAINT "Diary_submission_time" CHECK ((status = 'DRAFT' AND "submittedAt" IS NULL) OR (status = 'SUBMITTED' AND "submittedAt" IS NOT NULL));
ALTER TABLE "CareRecord" ADD CONSTRAINT "Care_submission_time" CHECK ((status = 'DRAFT' AND "submittedAt" IS NULL) OR (status = 'SUBMITTED' AND "submittedAt" IS NOT NULL));
ALTER TABLE "LoginAttempt" ADD CONSTRAINT "Login_attempts_positive" CHECK (attempts > 0);

-- Published versions cannot be edited or deleted; seed must not overwrite history.
CREATE FUNCTION protect_published_template() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Published template versions are immutable' USING ERRCODE = '23514'; END;
$$;
CREATE TRIGGER immutable_template BEFORE UPDATE OR DELETE ON "CareTemplateVersion"
FOR EACH ROW EXECUTE FUNCTION protect_published_template();

CREATE FUNCTION protect_submitted_record() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'SUBMITTED' THEN
    RAISE EXCEPTION 'Submitted originals are immutable' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER immutable_diary BEFORE UPDATE OR DELETE ON "ClientDiaryEntry" FOR EACH ROW EXECUTE FUNCTION protect_submitted_record();
CREATE TRIGGER immutable_care BEFORE UPDATE OR DELETE ON "CareRecord" FOR EACH ROW EXECUTE FUNCTION protect_submitted_record();

CREATE FUNCTION invalidate_employee_sessions() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD."passwordHash" IS DISTINCT FROM NEW."passwordHash" OR OLD.status IS DISTINCT FROM NEW.status THEN
    NEW."sessionVersion" := OLD."sessionVersion" + 1;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER employee_security_change BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION invalidate_employee_sessions();
CREATE FUNCTION invalidate_organisation_sessions() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.active IS DISTINCT FROM NEW.active THEN
    UPDATE "User" SET "sessionVersion" = "sessionVersion" + 1 WHERE "organisationId" = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER organisation_security_change AFTER UPDATE ON "Organisation" FOR EACH ROW EXECUTE FUNCTION invalidate_organisation_sessions();

COMMIT;
