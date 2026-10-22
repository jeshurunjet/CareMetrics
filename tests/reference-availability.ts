import { existsSync } from "node:fs"
export const hasUiReference =
  process.env.CAREMETRICS_SKIP_REFERENCE !== "true" &&
  existsSync("reference/figma-export/staff/StaffApp.tsx")
