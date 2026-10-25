import { redirect } from "next/navigation"
import { isBackendEnabled } from "@/server/config/backend"
import { entryIdentity } from "@/modules/auth/ui/BackendEntry"
import { isManagement } from "@/server/auth/access"
export default async function Home() {
  if (isBackendEnabled()) {
    const employee = await entryIdentity()
    if (employee)
      redirect(
        isManagement(employee.role) ? "/admin/dashboard" : "/shift-check",
      )
  }
  redirect("/login")
}
