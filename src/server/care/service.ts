import "server-only"
import { createHmac } from "node:crypto"
import { auth } from "../auth"
import { database } from "../db"
import { requireCapability, isManagement, employeeSelect } from "../auth/access"
import { requireClient } from "../data/access"
import { audit, type Tx } from "../admin/transaction"
import { object, text, invalid, ManagementError } from "../admin/validation"
import { AccessError, entityId } from "../errors"
import { eligibleDocumentationAttendance } from "../documentation/context"
import { fromNZDateTimeInput } from "../../lib/time"
import {
  publishedDefinition,
  submittedAnswers,
  storedAnswers,
  canonicalJson,
  FormContractError,
} from "../../modules/forms/submission"
import type { Prisma } from "../../generated/prisma/client"
import type { ConfigurableFormVersion } from "../../modules/forms/types"
import type {
  CareFormRead,
  CarePageRead,
  CareRecordRead,
  CareCategory,
} from "../../modules/care-plan/types"

const recordSelect = {
  id: true,
  clientId: true,
  templateId: true,
  templateVersion: true,
  authorId: true,
  values: true,
  houseId: true,
  coveredAt: true,
  createdAt: true,
  submittedAt: true,
  offShiftReason: true,
  author: { select: { name: true } },
  house: { select: { name: true } },
  version: {
    select: { definition: true, template: { select: { name: true } } },
  },
} as const
function definition(
  raw: unknown,
  version: number,
  name: string,
): ConfigurableFormVersion {
  try {
    return publishedDefinition(raw, version, name)
  } catch {
    throw new AccessError(503)
  }
}
function recordDto(
  row: Prisma.CareRecordGetPayload<{ select: typeof recordSelect }>,
): CareRecordRead {
  const form = definition(
    row.version.definition,
    row.templateVersion,
    row.version.template.name,
  )
  try {
    return {
      id: row.id,
      clientId: row.clientId,
      templateId: row.templateId,
      templateName: form.name ?? row.version.template.name,
      templateVersion: row.templateVersion,
      form,
      values: storedAnswers(form, row.values),
      authorId: row.authorId,
      authorName: row.author.name,
      houseId: row.houseId,
      houseName: row.house?.name ?? null,
      coveredAt: row.coveredAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
      submittedAt: row.submittedAt!.toISOString(),
      offShiftReason: row.offShiftReason,
    }
  } catch {
    throw new AccessError(503)
  }
}
async function actorAndClient(clientId: string, admin = false) {
  const actor = await requireCapability(
      admin ? "admin.carePlanViewing" : "care.assessments",
    ),
    client = await requireClient(clientId)
  return { actor, client }
}
async function assigned(
  tx: Tx,
  organisationId: string,
  clientId: string,
  templateId: string,
) {
  const row = await tx.clientTemplateAssignment.findFirst({
    where: {
      organisationId,
      clientId,
      templateId: entityId(templateId),
      active: true,
      templateVersion: {
        template: { organisationId, kind: "CARE", archived: false },
      },
    },
    select: {
      version: true,
      templateVersion: {
        select: { definition: true, template: { select: { name: true } } },
      },
    },
  })
  if (!row) throw new AccessError(404)
  return {
    form: definition(
      row.templateVersion.definition,
      row.version,
      row.templateVersion.template.name,
    ),
    name: row.templateVersion.template.name,
    version: row.version,
  }
}
export async function careEditor(
  clientId: string,
  templateId: string,
): Promise<CareFormRead> {
  const { actor, client } = await actorAndClient(clientId),
    db = database(),
    current = await assigned(db, actor.organisationId, client.id, templateId),
    now = new Date(),
    house = await db.house.findFirstOrThrow({
      where: { id: client.houseId, organisationId: actor.organisationId },
      select: { name: true },
    }),
    attendance = await eligibleDocumentationAttendance(
      db,
      actor.organisationId,
      actor.id,
      client.houseId,
      now,
    )
  return {
    clientId: client.id,
    clientName: client.name,
    houseId: client.houseId,
    houseName: house.name,
    templateId,
    templateName: current.form.name ?? current.name,
    form: current.form,
    authorName: actor.name,
    now: now.toISOString(),
    offShift: !attendance,
  }
}
function submissionInput(value: unknown) {
  const p = object(value, [
    "requestId",
    "templateId",
    "templateVersion",
    "coveredAt",
    "offShiftReason",
    "values",
  ])
  const coveredAt = fromNZDateTimeInput(text(p, "coveredAt", 16, true))
  if (!coveredAt)
    invalid(
      "coveredAt",
      "Choose a valid, unambiguous Pacific/Auckland date and time.",
    )
  if (
    !Number.isInteger(p.templateVersion) ||
    Number(p.templateVersion) < 1 ||
    Number(p.templateVersion) > 2147483647
  )
    invalid("templateVersion", "Choose a valid assigned version.")
  return {
    requestId: entityId(p.requestId),
    templateId: entityId(p.templateId),
    templateVersion: Number(p.templateVersion),
    coveredAt,
    offShiftReason: text(p, "offShiftReason", 1000),
    values: p.values,
  }
}
export async function submitCare(clientId: string, value: unknown) {
  const receivedAt = new Date(Date.now()),
    initial = await requireCapability("care.assessments"),
    session = await auth(),
    input = submissionInput(value),
    id = entityId(clientId)
  if (!session?.user) throw new AccessError(401)
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new AccessError(503)
  try {
    return await database().$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Organisation" WHERE id = ${initial.organisationId}::uuid FOR UPDATE`
        await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${initial.id}::uuid FOR UPDATE`
        const actor = await tx.user.findFirst({
          where: {
            id: initial.id,
            organisationId: initial.organisationId,
            sessionVersion: session.user.sessionVersion,
            status: "ACTIVE",
            organisation: { active: true },
          },
          select: employeeSelect,
        })
        if (!actor) throw new AccessError(401)
        const client = await tx.client.findFirst({
          where: {
            id,
            organisationId: actor.organisationId,
            active: true,
            house: {
              organisationId: actor.organisationId,
              active: true,
              ...(!isManagement(actor.role)
                ? {
                    assignments: {
                      some: { employeeId: actor.id, active: true },
                    },
                  }
                : {}),
            },
          },
          select: { id: true, houseId: true },
        })
        if (!client) throw new AccessError(404)
        const previous = await tx.careRecord.findUnique({
          where: { requestId: input.requestId },
          select: {
            id: true,
            authorId: true,
            organisationId: true,
            clientId: true,
            templateId: true,
            templateVersion: true,
            requestDigest: true,
            version: {
              select: {
                definition: true,
                template: { select: { name: true, kind: true } },
              },
            },
          },
        })
        if (
          previous &&
          (previous.organisationId !== actor.organisationId ||
            previous.authorId !== actor.id ||
            previous.clientId !== id ||
            previous.templateId !== input.templateId ||
            previous.templateVersion !== input.templateVersion ||
            previous.version.template.kind !== "CARE")
        )
          throw new ManagementError(
            409,
            "Request identity conflicts with an existing submission.",
          )
        const current = previous
          ? {
              form: definition(
                previous.version.definition,
                previous.templateVersion,
                previous.version.template.name,
              ),
              version: previous.templateVersion,
            }
          : await assigned(tx, actor.organisationId, id, input.templateId)
        if (current.version !== input.templateVersion)
          throw new ManagementError(
            409,
            "The assigned template version changed. Reopen the form and review before submitting.",
          )
        const values = submittedAnswers(current.form, input.values),
          digest = createHmac("sha256", secret)
            .update(canonicalJson(["care-plan", id, { ...input, values }]))
            .digest("hex")
        if (previous) {
          if (previous.requestDigest !== digest)
            throw new ManagementError(
              409,
              "Request identity conflicts with an existing submission.",
            )
          return { id: previous.id, replayed: true }
        }
        if (Date.parse(input.coveredAt) > receivedAt.getTime())
          invalid(
            "coveredAt",
            "Choose an observed time no later than submission.",
          )
        const attendance = await eligibleDocumentationAttendance(
          tx,
          actor.organisationId,
          actor.id,
          client.houseId,
          receivedAt,
        )
        if (!attendance && !input.offShiftReason)
          invalid(
            "offShiftReason",
            "A reason is required outside eligible recorded attendance for this house.",
          )
        const row = await tx.careRecord.create({
          data: {
            organisationId: actor.organisationId,
            clientId: id,
            houseId: client.houseId,
            authorId: actor.id,
            templateId: input.templateId,
            templateVersion: current.version,
            values: values as Prisma.InputJsonObject,
            status: "SUBMITTED",
            coveredAt: new Date(input.coveredAt),
            submittedAt: receivedAt,
            createdAt: receivedAt,
            offShiftReason: input.offShiftReason || null,
            requestId: input.requestId,
            requestDigest: digest,
            documentationContext: {
              ruleVersion: "recorded-current-house-v1",
              offShift: !attendance,
              attendanceId: attendance?.id ?? null,
            },
          },
          select: { id: true },
        })
        await audit({ tx, actor }, "care.submitted", "careRecord", row.id, {
          clientId: id,
          houseId: client.houseId,
          templateId: input.templateId,
          templateVersion: current.version,
          offShift: !attendance,
        })
        return { id: row.id, replayed: false }
      },
      { maxWait: 10000, timeout: 15000 },
    )
  } catch (error) {
    if (error instanceof FormContractError)
      throw new ManagementError(400, error.message, error.fields)
    if (["P2002", "P2034"].includes((error as { code?: string })?.code ?? ""))
      throw new ManagementError(
        409,
        "Submission changed concurrently. Retry the same request or check history.",
      )
    throw error
  }
}
export async function careRecordDetail(
  clientId: string,
  recordId: string,
  admin = false,
) {
  const { actor, client } = await actorAndClient(clientId, admin)
  const row = await database().careRecord.findFirst({
    where: {
      id: entityId(recordId),
      organisationId: actor.organisationId,
      clientId: client.id,
      status: "SUBMITTED",
      version: { template: { kind: "CARE" } },
    },
    select: recordSelect,
  })
  if (!row) throw new AccessError(404)
  return recordDto(row)
}
function pageInput(query: unknown, admin: boolean, allRecords = false) {
  try {
    const p = object(query, [
        "sub",
        "item",
        "page",
        "range",
        ...(admin ? ["version"] : []),
      ]),
      q: Record<string, string> = {}
    for (const [key, v] of Object.entries(p)) {
      if (typeof v !== "string" || !v) throw new AccessError(400)
      q[key] = v
    }
    for (const key of ["sub", "item"]) if (q[key]) entityId(q[key])
    if (q.page && (!/^[1-9]\d{0,5}$/.test(q.page) || Number(q.page) > 100000))
      throw new AccessError(400)
    if (
      q.version &&
      (!/^[1-9]\d{0,9}$/.test(q.version) || Number(q.version) > 2147483647)
    )
      throw new AccessError(400)
    if ((q.item || q.version || (!allRecords && (q.page || q.range))) && !q.sub)
      throw new AccessError(400)
    if (q.version && q.item) throw new AccessError(400)
    if (q.range && !["1", "7", "30"].includes(q.range))
      throw new AccessError(400)
    return q
  } catch (error) {
    if (error instanceof ManagementError) throw new AccessError(400)
    throw error
  }
}
export async function carePage(
  clientId: string,
  query: unknown = {},
  admin = false,
  allRecords = false,
): Promise<CarePageRead> {
  const { actor, client } = await actorAndClient(clientId, admin),
    q = pageInput(query, admin, allRecords),
    db = database(),
    base = {
      organisationId: actor.organisationId,
      clientId: client.id,
      status: "SUBMITTED" as const,
      version: { template: { kind: "CARE" as const } },
    },
    assignments = await db.clientTemplateAssignment.findMany({
      where: {
        organisationId: actor.organisationId,
        clientId: client.id,
        templateVersion: { template: { kind: "CARE" } },
      },
      select: {
        templateId: true,
        active: true,
        version: true,
        templateVersion: { select: { definition: true } },
      },
      take: 100,
      orderBy: { templateId: "asc" },
    }),
    groups = await db.careRecord.groupBy({
      by: ["templateId"],
      where: base,
      _count: true,
      _max: { submittedAt: true },
      orderBy: { templateId: "asc" },
      take: 100,
    }),
    ids = [
      ...new Set([
        ...assignments.map((a) => a.templateId),
        ...groups.map((g) => g.templateId),
      ]),
    ],
    templates = await db.careTemplate.findMany({
      where: {
        id: { in: ids },
        organisationId: actor.organisationId,
        kind: "CARE",
      },
      select: {
        id: true,
        name: true,
        archived: true,
        versions: {
          select: { version: true, publishedAt: true },
          orderBy: { version: "desc" },
          take: 100,
        },
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      take: 100,
    })
  const categories: CareCategory[] = templates.map((t) => {
    const a = assignments.find((a) => a.templateId === t.id),
      group = groups.find((g) => g.templateId === t.id),
      v = a
        ? { version: a.version, definition: a.templateVersion.definition }
        : undefined
    let available = !!a?.active && !t.archived && !!v,
      message = available
        ? "Assigned published form"
        : "New submissions unavailable; retained records remain read-only."
    if (available) {
      try {
        publishedDefinition(v!.definition, v!.version, t.name)
      } catch {
        available = false
        message = "Published form integrity requires management attention."
      }
    }
    return {
      id: t.id,
      name: t.name,
      version: a?.version ?? null,
      active: !!a?.active,
      archived: t.archived,
      available,
      message,
      count: group?._count ?? 0,
      lastSubmittedAt: group?._max.submittedAt?.toISOString() ?? null,
      publishedVersions: admin
        ? t.versions.map((v) => ({
            version: v.version,
            name: t.name,
            publishedAt: v.publishedAt.toISOString(),
          }))
        : [],
    }
  })
  const selected = q.sub
    ? (categories.find((c) => c.id === q.sub) ?? null)
    : null
  if (q.sub && !selected) throw new AccessError(404)
  let publishedForm: ConfigurableFormVersion | null = null
  if (admin && selected && !q.item) {
    const t = templates.find((t) => t.id === selected.id)!,
      number = q.version ? Number(q.version) : selected.version
    const v =
      number === null
        ? null
        : await db.careTemplateVersion.findFirst({
            where: {
              organisationId: actor.organisationId,
              templateId: selected.id,
              version: number,
            },
            select: { version: true, definition: true },
          })
    if (q.version && !v) throw new AccessError(404)
    if (v) {
      try {
        publishedForm = definition(v.definition, v.version, t.name)
      } catch (error) {
        if (q.version) throw error
      }
    }
  }
  const where = {
      ...base,
      ...(selected ? { templateId: selected.id } : {}),
      ...(q.range
        ? {
            submittedAt: {
              gte: new Date(Date.now() - Number(q.range) * 86400000),
            },
          }
        : {}),
    },
    per = admin ? 20 : 6,
    total = selected || allRecords ? await db.careRecord.count({ where }) : 0,
    page = Math.min(Number(q.page || 1), Math.max(1, Math.ceil(total / per))),
    rows =
      selected || allRecords
        ? await db.careRecord.findMany({
            where,
            select: recordSelect,
            take: per,
            skip: (page - 1) * per,
            orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
          })
        : [],
    detail = q.item ? await careRecordDetail(clientId, q.item, admin) : null
  if (detail && detail.templateId !== selected?.id) throw new AccessError(404)
  return {
    categories,
    selected,
    publishedForm,
    rows: rows.map(recordDto),
    detail,
    per,
    total,
    page,
    filters: q,
  }
}
