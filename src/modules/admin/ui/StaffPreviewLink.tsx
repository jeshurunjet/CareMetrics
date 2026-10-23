"use client"
import { useRouter } from "next/navigation"
import { Btn } from "@/modules/staff/ui"
import { usePreviewSession } from "@/modules/preview/context"
export default function StaffPreviewLink({
  employeeId,
}: {
  employeeId?: string
}) {
  const session = usePreviewSession(),
    router = useRouter()
  return (
    <Btn
      variant="secondary"
      icon="eye"
      onClick={() => {
        session.selectEmployee(employeeId ?? "s1")
        router.push("/profile")
      }}
    >
      View Staff preview
    </Btn>
  )
}
