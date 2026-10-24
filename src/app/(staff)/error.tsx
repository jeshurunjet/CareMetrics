"use client"
import { Banner, Btn } from "@/modules/staff/ui"
export default function Error({ reset }: { reset: () => void }) {
  return (
    <Banner tone="danger" title="Unable to load this page">
      <p>Please try again.</p>
      <Btn onClick={reset}>Retry</Btn>
    </Banner>
  )
}
