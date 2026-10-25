import { eligibleDocumentationAttendance as eligibleDiaryAttendance } from "../documentation/context"
export { eligibleDocumentationAttendance as eligibleDiaryAttendance } from "../documentation/context"
import "server-only"
import { createHmac } from "node:crypto"
import { database } from "../db"
import { auth } from "../auth"
import { requireCapability, isManagement } from "../auth/access"
import { requireClient } from "../data/access"
import { AccessError, entityId } from "../errors"
import { audit } from "../admin/transaction"
import { invalid, ManagementError, object } from "../admin/validation"
import { diaryInput } from "./validation"
import { clientDiaryCategories } from "../../modules/diary/categories"
import type { Prisma } from "../../generated/prisma/client"
import type {
  DiaryRecord,
  DiaryHistory,
  DiaryEditor,
} from "../../modules/diary/types"

const select = {
  id: true,
  clientId: true,
  houseId: true,
  authorId: true,
  title: true,
  category: true,
  categoryKey: true,
  content: true,
  coveredAt: true,
  createdAt: true,
  submittedAt: true,
  offShiftReason: true,
  house: { select: { name: true } },
  author: { select: { name: true } },
} as const
function dto(
  row: Prisma.ClientDiaryEntryGetPayload<{ select: typeof select }>,
): DiaryRecord {
  return {
    id: row.id,
    clientId: row.clientId,
    houseId: row.houseId,
    houseName: row.house.name,
    authorId: row.authorId,
    authorName: row.author.name,
    title: row.title,
    category: row.category,
    categoryKey: row.categoryKey,
    content: row.content,
    coveredAt: row.coveredAt.toISOString(),
    submittedAt: row.submittedAt!.toISOString(),
    createdAt: row.createdAt.toISOString(),
    offShiftReason: row.offShiftReason,
  }
}
export async function diaryEditor(clientId: string): Promise<DiaryEditor> {
  const actor = await requireCapability("care.clientDiary"),
    client = await requireClient(clientId),
    db = database(),
    now = new Date()
  const house = await db.house.findFirstOrThrow({
    where: { id: client.houseId, organisationId: actor.organisationId },
    select: { name: true },
  })
  const eligible = await eligibleDiaryAttendance(
    db,
    actor.organisationId,
    actor.id,
    client.houseId,
    now,
  )
  return {
    client: {
      id: client.id,
      name: client.name,
      houseId: client.houseId,
      houseName: house.name,
    },
    authorName: actor.name,
    now: now.toISOString(),
    offShift: !eligible,
  }
}
export async function submitDiary(clientId: string, value: unknown) {
  const receivedAt = new Date(Date.now()),
    initial = await requireCapability("care.clientDiary"),
    session = await auth(),
    input = diaryInput(value),
    id = entityId(clientId)
  if (!session?.user) throw new AccessError(401)
  if (!process.env.AUTH_SECRET) throw new AccessError(503)
  const digest = createHmac("sha256", process.env.AUTH_SECRET)
    .update(JSON.stringify(["client-diary", id, input]))
    .digest("hex")
  try {
    return await database().$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Organisation" WHERE id = ${initial.organisationId}::uuid FOR UPDATE`
        await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${initial.id}::uuid FOR UPDATE`
        const actor = await tx.user.findFirst({
          where: {
            id: initial.id,
            organisationId: initial.organisationId,
            status: "ACTIVE",
            sessionVersion: session.user.sessionVersion,
            organisation: { active: true },
          },
          select: {
            id: true,
            organisationId: true,
            employeeCode: true,
            name: true,
            role: true,
            email: true,
            status: true,
          },
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
        const prior = await tx.clientDiaryEntry.findUnique({
          where: { requestId: input.requestId },
          select: {
            id: true,
            organisationId: true,
            authorId: true,
            clientId: true,
            requestDigest: true,
          },
        })
        if (prior) {
          if (
            prior.organisationId === actor.organisationId &&
            prior.authorId === actor.id &&
            prior.clientId === id &&
            prior.requestDigest === digest
          )
            return { id: prior.id, replayed: true }
          throw new ManagementError(
            409,
            "This request was already used. Refresh the diary before submitting again.",
          )
        }
        if (Date.parse(input.coveredAt) > receivedAt.getTime())
          invalid(
            "coveredAt",
            "Choose a covered time no later than submission.",
          )
        const eligible = await eligibleDiaryAttendance(
          tx,
          actor.organisationId,
          actor.id,
          client.houseId,
          receivedAt,
        )
        if (!eligible && !input.offShiftReason)
          invalid(
            "offShiftReason",
            "A reason is required outside eligible recorded attendance for this house.",
          )
        const row = await tx.clientDiaryEntry.create({
          data: {
            organisationId: actor.organisationId,
            clientId: id,
            houseId: client.houseId,
            authorId: actor.id,
            title: input.title,
            category: input.category,
            categoryKey: input.categoryKey,
            content: input.content,
            coveredAt: new Date(input.coveredAt),
            status: "SUBMITTED",
            offShiftReason: input.offShiftReason || null,
            submittedAt: receivedAt,
            createdAt: receivedAt,
            requestId: input.requestId,
            requestDigest: digest,
            documentationContext: {
              ruleVersion: "recorded-current-house-v1",
              offShift: !eligible,
              attendanceId: eligible?.id ?? null,
            },
          },
          select: { id: true },
        })
        await audit({ tx, actor }, "diary.submitted", "clientDiary", row.id, {
          clientId: id,
          houseId: client.houseId,
          categoryKey: input.categoryKey,
          offShift: !eligible,
        })
        return { id: row.id, replayed: false }
      },
      { maxWait: 10000, timeout: 15000 },
    )
  } catch (error) {
    if (["P2002", "P2034"].includes((error as { code?: string })?.code ?? ""))
      throw new ManagementError(
        409,
        "Submission changed concurrently. Retry the same request or refresh the diary.",
      )
    throw error
  }
}
function historyInput(query: unknown) {
  try {
    return object(query, ["page", "category", "range", "item"])
  } catch (error) {
    if (error instanceof ManagementError) throw new AccessError(400)
    throw error
  }
}
export async function diaryHistory(
  clientId: string,
  query: unknown = {},
  admin = false,
): Promise<DiaryHistory> {
  const actor = await requireCapability(
      admin ? "admin.clientDiaryViewing" : "care.clientDiary",
    ),
    client = await requireClient(clientId)
  const raw = historyInput(query),
    q: Record<string, string> = {}
  for (const [key, v] of Object.entries(raw)) {
    if (typeof v !== "string" || !v) throw new AccessError(400)
    q[key] = v
  }
  if (q.page && (!/^[1-9]\d{0,5}$/.test(q.page) || Number(q.page) > 100000))
    throw new AccessError(400)
  if (q.category && !clientDiaryCategories.some((c) => c.id === q.category))
    throw new AccessError(400)
  if (q.range && !["1", "7", "30"].includes(q.range)) throw new AccessError(400)
  if (q.item) entityId(q.item)
  const base = {
      organisationId: actor.organisationId,
      clientId: client.id,
      status: "SUBMITTED" as const,
    },
    where = {
      ...base,
      ...(q.category ? { categoryKey: q.category } : {}),
      ...(q.range
        ? {
            submittedAt: {
              gte: new Date(Date.now() - Number(q.range) * 86400000),
            },
          }
        : {}),
    },
    db = database(),
    per = admin ? 20 : 6,
    total = await db.clientDiaryEntry.count({ where }),
    page = Math.min(Number(q.page || 1), Math.max(1, Math.ceil(total / per))),
    rows = await db.clientDiaryEntry.findMany({
      where,
      select,
      orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
      take: per,
      skip: (page - 1) * per,
    }),
    detail = q.item
      ? await db.clientDiaryEntry.findFirst({
          where: { ...base, id: q.item },
          select,
        })
      : null
  if (q.item && !detail) throw new AccessError(404)
  return {
    rows: rows.map(dto),
    detail: detail ? dto(detail) : null,
    total,
    page,
    per,
    filters: q,
  }
}
