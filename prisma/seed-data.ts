// Fictional development identifiers, never authentication credentials.
export const seedIds = {
  organisation: "20000000-0000-4000-8000-000000000001",
  admin: "20000000-0000-4000-8000-000000000011",
  manager: "20000000-0000-4000-8000-000000000012",
  staffA: "20000000-0000-4000-8000-000000000013",
  staffB: "20000000-0000-4000-8000-000000000014",
  senior: "20000000-0000-4000-8000-000000000015",
  houseA: "20000000-0000-4000-8000-000000000021",
  houseB: "20000000-0000-4000-8000-000000000022",
  clientA: "20000000-0000-4000-8000-000000000031",
  clientB: "20000000-0000-4000-8000-000000000032",
  clientC: "20000000-0000-4000-8000-000000000033",
  template: "20000000-0000-4000-8000-000000000041",
  version: "20000000-0000-4000-8000-000000000042",
  shiftA: "20000000-0000-4000-8000-000000000051",
  shiftB: "20000000-0000-4000-8000-000000000052",
} as const
export const seedEmployees = [
  {
    id: seedIds.admin,
    email: "avery.admin@caremetrics.example.test",
    name: "Avery Example",
    role: "ADMINISTRATOR",
  },
  {
    id: seedIds.manager,
    email: "morgan.manager@caremetrics.example.test",
    name: "Morgan Fiction",
    role: "MANAGER",
  },
  {
    id: seedIds.staffA,
    email: "robin.staff@caremetrics.example.test",
    name: "Robin Sample",
    role: "STAFF",
  },
  {
    id: seedIds.staffB,
    email: "casey.staff@caremetrics.example.test",
    name: "Casey Example",
    role: "STAFF",
  },
  {
    id: seedIds.senior,
    email: "alex.senior@caremetrics.example.test",
    name: "Alex Fiction",
    role: "SENIOR_STAFF",
  },
] as const
