import { afterEach, describe, expect, it, vi } from "vitest"
import {
  createForegroundWatch,
  positionProblem,
  stopLiveLocation,
} from "../../src/modules/attendance/foreground-location"
const measuredAt = 1800000000000
const p = { latitude: 1, longitude: 2, accuracyMetres: 5, measuredAt }
const policy = { maxAccuracyMetres: 30, maxAgeMs: 60000, maxFutureSkewMs: 0 }
function fixture() {
  let success: PositionCallback, error: PositionErrorCallback | null | undefined
  const watchPosition = vi.fn(
      (s: PositionCallback, e?: PositionErrorCallback | null) => {
        success = s
        error = e
        return 0
      },
    ),
    clearWatch = vi.fn(),
    report = vi.fn(),
    controller = createForegroundWatch({ watchPosition, clearWatch }, report)
  return {
    controller,
    report,
    watchPosition,
    clearWatch,
    emit: (patch = {}) =>
      success({
        coords: { latitude: 1, longitude: 2, accuracy: 5 },
        timestamp: measuredAt,
        ...patch,
      } as GeolocationPosition),
    fail: (code: number) => error?.({ code } as GeolocationPositionError),
  }
}
afterEach(() => stopLiveLocation())
describe("foreground preview lifecycle", () => {
  it("does not collect on creation; repeated starts make one fresh high-accuracy watch", () => {
    const f = fixture()
    expect(f.watchPosition).not.toHaveBeenCalled()
    f.controller.start()
    f.controller.start()
    expect(f.watchPosition).toHaveBeenCalledOnce()
    expect(f.watchPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    )
    f.emit()
    expect(f.controller.current()).toEqual(p)
  })
  it("updates readings, ignores out-of-order callbacks and discards coordinates on stop", () => {
    const f = fixture()
    f.controller.start()
    f.emit()
    f.emit({
      timestamp: measuredAt + 1000,
      coords: { latitude: 3, longitude: 4, accuracy: 7 },
    })
    expect(f.controller.current()?.latitude).toBe(3)
    f.emit()
    expect(f.controller.current()?.latitude).toBe(3)
    f.controller.stop()
    expect(f.clearWatch).toHaveBeenCalledWith(0)
    f.emit()
    expect(f.controller.current()).toBeNull()
    expect(f.controller.active()).toBe(false)
  })
  it("a second preview instance stops the previous watcher and global logout cleanup stops the new one", () => {
    const a = fixture(),
      b = fixture()
    a.controller.start()
    b.controller.start()
    expect(a.clearWatch).toHaveBeenCalledOnce()
    expect(a.controller.active()).toBe(false)
    stopLiveLocation()
    expect(b.clearWatch).toHaveBeenCalledOnce()
    expect(b.controller.active()).toBe(false)
  })
  it.each([1, 2, 3])(
    "GPS error %i clears the watcher, reading and late callbacks",
    (code) => {
      const f = fixture()
      f.controller.start()
      f.emit()
      f.fail(code)
      expect(f.clearWatch).toHaveBeenCalledWith(0)
      expect(f.controller.current()).toBeNull()
      f.emit()
      expect(f.controller.active()).toBe(false)
      expect(f.report.mock.lastCall?.[0].message).toContain(
        code === 1 ? "permission" : code === 2 ? "unavailable" : "timeout",
      )
    },
  )
  it("clears a synchronous error's returned id and ignores errors from an earlier session", () => {
    const clearWatch = vi.fn(),
      report = vi.fn(),
      watch = createForegroundWatch(
        {
          clearWatch,
          watchPosition: (_s, e) => {
            e?.({ code: 1 } as GeolocationPositionError)
            return 0
          },
        },
        report,
      )
    watch.start()
    expect(clearWatch).toHaveBeenCalledWith(0)
    expect(watch.active()).toBe(false)
    const f = fixture()
    f.controller.start()
    const first = f.watchPosition.mock.calls[0][1]
    f.controller.stop()
    f.controller.start()
    first?.({ code: 1 } as GeolocationPositionError)
    expect(f.controller.active()).toBe(true)
  })
  it("invalid coordinates/timestamps stop instead of displaying a fabricated position", () => {
    const f = fixture()
    f.controller.start()
    f.emit({ timestamp: Infinity })
    expect(f.controller.current()).toBeNull()
    expect(f.controller.active()).toBe(false)
  })
  it("can restart after stop without accumulating watchers", () => {
    const f = fixture()
    f.controller.start()
    f.controller.stop()
    f.controller.stop()
    f.controller.start()
    expect(f.watchPosition).toHaveBeenCalledTimes(2)
    expect(f.clearWatch).toHaveBeenCalledTimes(1)
  })
})
describe("client policy hints do not invent location limits", () => {
  it("accepts exact freshness and accuracy boundaries and rejects just outside", () => {
    expect(
      positionProblem({ ...p, accuracyMetres: 30 }, policy, measuredAt + 60000),
    ).toBe("")
    expect(positionProblem(p, policy, measuredAt + 60001)).toContain("Stale")
    expect(
      positionProblem({ ...p, accuracyMetres: 30.01 }, policy, measuredAt),
    ).toContain("Poor accuracy")
    expect(positionProblem(p, policy, measuredAt - 1)).toContain("ahead")
  })
  it("requires valid measured coordinates and configured policy", () => {
    expect(positionProblem(null, policy, measuredAt)).not.toBe("")
    expect(positionProblem(p, undefined, measuredAt)).toContain("policy")
    expect(
      positionProblem({ ...p, latitude: 91 }, policy, measuredAt),
    ).not.toBe("")
  })
})
