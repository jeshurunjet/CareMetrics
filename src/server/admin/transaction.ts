import "server-only"
import { auth } from "../auth"
import { requireManagement, requireCapability } from "../auth/access"
import { database } from "../db"
import { AccessError, entityId } from "../errors"
import { ManagementError } from "./validation"
import type { Prisma } from "@/generated/prisma/client"
export type Tx = Prisma.TransactionClient
export type Actor = Awaited<ReturnType<typeof requireManagement>>
export interface Context {
  tx: Tx
  actor: Actor
}
export async function managementWrite<T>(
  capability: "admin.employeeManagement" | "admin.houseManagement" | "admin.clientManagement" | "admin.shiftManagement",
  run: (context: Context) => Promise<T>,
): Promise<T> {
  const initial = await requireCapability(capability)
  const session = await auth()
  if (!session?.user) throw new AccessError(401)
  try {
    return await database().$transaction(
      async (tx) => {
        // Serialise core mutations within the tenant; recheck authority after taking locks.
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
        if (actor.role !== "ADMINISTRATOR" && actor.role !== "MANAGER")
          throw new AccessError(403)
        return run({ tx, actor })
      },
      { maxWait: 10000, timeout: 15000 },
    )
  } catch (error) {
    const code = (error as { code?: string })?.code
    if (code === "P2002")
      throw new ManagementError(
        409,
        "This identifier or email is already in use. Review the record and try again.",
      )
    if (["P2003", "P2025", "P2034"].includes(code ?? ""))
      throw new ManagementError(
        409,
        "Related records changed. Refresh and review before saving.",
      )
    throw error
  }
}
export async function targetEmployee({ tx, actor }: Context, id: string) {
  const row = await tx.user.findFirst({
    where: { id: entityId(id), organisationId: actor.organisationId },
  })
  if (!row) throw new AccessError(404)
  if (row.role === "ADMINISTRATOR" && actor.role !== "ADMINISTRATOR")
    throw new AccessError(403)
  return row
}
export async function targetHouse(
  { tx, actor }: Context,
  id: string,
  activeOnly = false,
) {
  const row = await tx.house.findFirst({
    where: {
      id: entityId(id),
      organisationId: actor.organisationId,
      ...(activeOnly ? { active: true } : {}),
    },
  })
  if (!row) throw new AccessError(404)
  return row
}
export async function targetClient({ tx, actor }: Context, id: string) {
  const row = await tx.client.findFirst({
    where: { id: entityId(id), organisationId: actor.organisationId },
  })
  if (!row) throw new AccessError(404)
  return row
}
export function stamp(row: { updatedAt: Date }) {
  return {
    updatedAt: new Date(Math.max(Date.now(), row.updatedAt.getTime() + 1)),
  }
}
interface UpdatedEntity {
  id: string
  updatedAt: Date
}
export function result(row: UpdatedEntity) {
  return { id: row.id, updatedAt: row.updatedAt.toISOString() }
}
export async function audit(
  { tx, actor }: Context,
  action: string,
  targetType: string,
  targetId: string,
  summary: Prisma.InputJsonObject,
) {
  await tx.auditEvent.create({
    data: {
      organisationId: actor.organisationId,
      actorId: actor.id,
      action,
      targetType,
      targetId,
      summary,
    },
  })
}

export function changedFields(before: object, proposed: object): string[] {
  const previous = before as Record<string, unknown>
  const next = proposed as Record<string, unknown>
  return Object.keys(next).filter(
    (field) => String(previous[field]) !== String(next[field]),
  )
}
