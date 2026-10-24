import "server-only"
import { redirect, notFound } from "next/navigation"
import { AccessError } from "../errors"
import { BackendUnavailable } from "@/modules/auth/ui/BackendEntry"
export async function staffPage<T>(
  load: () => Promise<T>,
  render: (data: T) => React.ReactNode,
) {
  let data: T
  try {
    data = await load()
  } catch (error) {
    if (error instanceof AccessError && error.status === 401) redirect("/login")
    if (error instanceof AccessError && [400, 404].includes(error.status))
      notFound()
    return <BackendUnavailable />
  }
  return render(data)
}
