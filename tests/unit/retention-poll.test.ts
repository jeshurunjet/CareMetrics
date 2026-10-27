import { it, expect, vi } from "vitest"
import {
  retentionPoll,
  RETENTION_METADATA_CACHE_MS,
} from "../../src/server/attendance/retention-poll"
function setup() {
  let now = 1_800_000_000_000,
    stored: unknown = null
  const deps = {
    now: () => now,
    readCache: vi.fn(async () => stored),
    writeCache: vi.fn(async (value: unknown) => {
      stored = value
    }),
    clearCache: vi.fn(async () => {
      stored = null
    }),
    nextExpiry: vi.fn(async (): Promise<number | null> => null),
    purge: vi.fn(async () => 1),
  }
  return {
    deps,
    advance: (ms: number) => {
      now += ms
    },
    set: (value: unknown) => {
      stored = value
    },
  }
}
it("five-minute idle polling queries PostgreSQL only at the hourly metadata boundary", async () => {
  const { deps, advance } = setup()
  for (let n = 0; n < 12; n++) {
    expect((await retentionPoll(deps)).purged).toBe(0)
    advance(300000)
  }
  expect(deps.nextExpiry).toHaveBeenCalledTimes(1)
  await retentionPoll(deps)
  expect(deps.nextExpiry).toHaveBeenCalledTimes(2)
  expect(deps.purge).not.toHaveBeenCalled()
  expect(
    Object.keys(deps.writeCache.mock.calls[0][0] as object).sort(),
  ).toEqual(["checkedAt", "expiresAt"])
})
it("a known expiry triggers deletion on the first due poll even inside the cache TTL", async () => {
  const { deps, advance } = setup()
  deps.nextExpiry.mockResolvedValueOnce(deps.now() + 600000)
  expect((await retentionPoll(deps)).purged).toBe(0)
  advance(300000)
  expect((await retentionPoll(deps)).purged).toBe(0)
  advance(300000)
  expect(await retentionPoll(deps)).toEqual({
    purged: 1,
    check: "purged-check",
  })
  expect(deps.nextExpiry).toHaveBeenCalledTimes(1)
  expect(deps.clearCache).toHaveBeenCalledTimes(1)
})
it("new normal clock-ins become visible well before their seven-day deadline", async () => {
  const { deps, advance } = setup()
  await retentionPoll(deps)
  const expiry = deps.now() + 7 * 86400000 - 60000
  deps.nextExpiry.mockResolvedValue(expiry)
  advance(RETENTION_METADATA_CACHE_MS)
  await retentionPoll(deps)
  expect(deps.purge).not.toHaveBeenCalled()
  advance(expiry - deps.now())
  expect((await retentionPoll(deps)).purged).toBe(1)
})
it("rejects future, stale and malformed metadata rather than trusting a negative cached result", async () => {
  for (const value of [
    { checkedAt: Infinity, expiresAt: null },
    { checkedAt: 1_900_000_000_000, expiresAt: null },
    { checkedAt: 1, expiresAt: null },
    { checkedAt: 1_800_000_000_000, expiresAt: null, coordinates: [1, 2] },
  ]) {
    const { deps, set } = setup()
    set(value)
    await retentionPoll(deps)
    expect(deps.nextExpiry).toHaveBeenCalledTimes(1)
  }
})
it("authenticated maintenance refresh can bypass cached metadata; failures never masquerade as purge success", async () => {
  const { deps } = setup()
  await retentionPoll(deps)
  await retentionPoll(deps, true)
  expect(deps.nextExpiry).toHaveBeenCalledTimes(2)
  deps.nextExpiry.mockRejectedValueOnce(Error("unavailable"))
  await expect(retentionPoll(deps, true)).rejects.toThrow("unavailable")
  const second = setup()
  second.deps.writeCache.mockRejectedValueOnce(Error("cache unavailable"))
  await expect(retentionPoll(second.deps)).rejects.toThrow("cache unavailable")
  expect(second.deps.purge).not.toHaveBeenCalled()
})
