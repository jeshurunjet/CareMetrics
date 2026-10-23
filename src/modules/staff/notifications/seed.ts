import type { Concern } from "./types"
/** Server seed only. Internal notes deliberately never enter the staff projection. */
interface SeedConcern extends Concern {
  internalNotes?: string
}
export function seedConcerns(now: string): SeedConcern[] {
  const at = (hours: number) =>
    new Date(Date.parse(now) + hours * 3600000).toISOString()
  return [
    {
      id: "concern-submitted",
      title: "Fictional garden equipment check",
      description:
        "Demonstration request to check garden equipment before its next use.",
      context: "house",
      targetId: "h1",
      priority: "Medium",
      submittedById: "s1",
      submittedAt: at(-2),
      status: "Submitted",
    },
    {
      id: "concern-review",
      title: "Fictional appointment transport query",
      description:
        "Please review the fictional transport arrangements for the next appointment.",
      context: "client",
      targetId: "c1",
      priority: "High",
      submittedById: "s1",
      submittedAt: at(-24),
      status: "Under Review",
      response: {
        reviewerName: "Mere Walker (demo)",
        text: "Fictional response: reviewing the demonstration arrangements.",
        at: at(-12),
      },
      internalNotes: "INTERNAL_MANAGEMENT_CONCERN_NOTE",
    },
    {
      id: "concern-resolved",
      title: "Fictional cupboard repair",
      description: "Demonstration cupboard handle requires attention.",
      context: "house",
      targetId: "h1",
      priority: "Low",
      submittedById: "s1",
      submittedAt: at(-72),
      status: "Resolved",
      response: {
        reviewerName: "Mere Walker (demo)",
        text: "Fictional resolution: the demonstration repair is complete.",
        at: at(-48),
      },
      resolvedAt: at(-48),
    },
    {
      id: "concern-closed",
      title: "Fictional duplicate equipment query",
      description: "Demonstration duplicate report closed after review.",
      context: "house",
      targetId: "h2",
      priority: "Low",
      submittedById: "s1",
      submittedAt: at(-96),
      status: "Closed",
    },
    {
      id: "concern-other",
      title: "PRIVATE_COWORKER_CONCERN",
      description: "Private fictional colleague submission.",
      context: "house",
      targetId: "h1",
      priority: "Medium",
      submittedById: "s2",
      submittedAt: at(-1),
      status: "Submitted",
    },
    {
      id: "concern-restricted",
      title: "PRIVATE_RESTRICTED_CONCERN",
      description: "Restricted fictional house submission.",
      context: "house",
      targetId: "h3",
      priority: "Medium",
      submittedById: "s4",
      submittedAt: at(-1),
      status: "Submitted",
    },
  ]
}
