import { Receiver } from "@upstash/qstash"
import { DEMO_TARGET } from "../../../../server/config/demo-deployment"
import { createHash, timingSafeEqual } from "node:crypto"
import { runLocationRetention } from "../../../../server/attendance/retention-job"
import { privateJson } from "../../../../server/errors"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const supplied = request.headers.get("authorization") ?? ""
  if (
    !secret ||
    secret.length < 32 ||
    new URL(request.url).search ||
    supplied.length > 512 ||
    !timingSafeEqual(
      createHash("sha256").update(supplied).digest(),
      createHash("sha256")
        .update("Bearer " + secret)
        .digest(),
    )
  )
    return Response.json({ error: "Access unavailable" }, {
      status: 401,
      headers: { "Cache-Control": "private, no-store" },
    })
  const signature = request.headers.get("upstash-signature")
  const maintenance =
    request.headers.get("x-caremetrics-retention-refresh") === "1"
  if (signature !== null) {
    const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY,
      nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY
    if (!currentSigningKey || !nextSigningKey)
      return Response.json({ error: "Retention job unavailable" }, {
        status: 503,
        headers: { "Cache-Control": "private, no-store" },
      })
    try {
      await new Receiver({ currentSigningKey, nextSigningKey }).verify({
        signature,
        body: await request.text(),
        url: DEMO_TARGET.origin + "/api/jobs/purge-location-evidence",
      })
    } catch {
      return Response.json({ error: "Access unavailable" }, {
        status: 401,
        headers: { "Cache-Control": "private, no-store" },
      })
    }
  } else if (!maintenance) {
    return Response.json({ error: "Access unavailable" }, {
      status: 401,
      headers: { "Cache-Control": "private, no-store" },
    })
  }
  try {
    const result = await runLocationRetention(maintenance)
    const response = privateJson({ purged: result.purged })
    response.headers.set("X-CareMetrics-Retention", result.check)
    return response
  } catch {
    return Response.json({ error: "Retention job unavailable" }, {
      status: 503,
      headers: { "Cache-Control": "private, no-store" },
    })
  }
}
