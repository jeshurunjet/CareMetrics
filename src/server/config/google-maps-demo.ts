import "server-only"
import { demoDeployment } from "./demo-deployment"
import {
  GLENFIELD_DEMO_REFERENCE,
  type GoogleMapsDemoConfiguration,
} from "../../modules/attendance/demo-reference"
/** Only the explicitly approved fictional evaluation environment can expose this browser SDK key. */
export function googleMapsDemoConfiguration(
  organisationId: string,
  fictional: boolean,
  env: Record<string, string | undefined> = process.env,
): GoogleMapsDemoConfiguration | undefined {
  const key = env.GOOGLE_MAPS_DEMO_BROWSER_KEY
  if (
    !fictional ||
    !demoDeployment(env) ||
    env.CAREMETRICS_GOOGLE_MAPS_DEMO_ACK !== "no-billing-evaluation-only" ||
    organisationId !== env.CAREMETRICS_DEMO_ORGANISATION_ID ||
    !/^AIza[A-Za-z0-9_-]{20,100}$/.test(key ?? "")
  )
    return
  return { browserKey: key!, reference: GLENFIELD_DEMO_REFERENCE }
}
