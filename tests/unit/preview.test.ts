import { describe, expect, it } from "vitest"
import { isPreviewEnabled } from "../../src/lib/preview"
import { formatTime } from "../../src/lib/time"
describe("local preview boundary", () => {
  it.each(["production", "test", undefined])(
    "fails closed in %s even with opt-in",
    (mode) => {
      expect(
        isPreviewEnabled({ NODE_ENV: mode, CAREMETRICS_UI_PREVIEW: "true" }),
      ).toBe(false)
    },
  )
  it("requires explicit development opt-in", () => {
    expect(isPreviewEnabled({ NODE_ENV: "development" })).toBe(false)
    expect(
      isPreviewEnabled({
        NODE_ENV: "development",
        CAREMETRICS_UI_PREVIEW: "true",
      }),
    ).toBe(true)
  })
})
it("formats Auckland time consistently across daylight saving", () => {
  expect(formatTime("2026-01-01T00:00:00Z")).toBe("13:00")
  expect(formatTime("2026-07-01T00:00:00Z")).toBe("12:00")
})
