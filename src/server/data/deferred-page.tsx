import "server-only"
import { requireEmployee, requireManagement } from "../auth/access"
import { staffPage } from "./page"
import { FutureRead } from "@/modules/staff/read/StaffReadViews"

/** No identifier is loaded and no preview component executes in database mode. */
export function deferredPage(management = false) {
  return staffPage(management ? requireManagement : requireEmployee, () => (
    <FutureRead />
  ))
}
