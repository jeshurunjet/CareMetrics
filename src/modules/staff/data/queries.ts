import type {
  StaffSnapshot,
  StaffSearchResults,
  StaffReadService,
} from "./types"
import { myHouses, myClients } from "./selectors"
/** Mock scope is rechecked on every lookup, including callers with a broader snapshot. */
export const getHouse = (s: StaffSnapshot, id: string) =>
  myHouses(s).find((h) => h.id === id)
export const getClient = (s: StaffSnapshot, id: string) =>
  myClients(s).find((c) => c.id === id)
export const getClientsByHouse = (s: StaffSnapshot, id: string) =>
  getHouse(s, id) ? myClients(s).filter((c) => c.houseId === id) : []
export const getClientContacts = (s: StaffSnapshot, id: string) =>
  getClient(s, id)?.contacts ?? []
/** Deliberate search projection: no contacts, DOB, notes, alerts, NHI or profile text. */
export function searchStaff(
  s: StaffSnapshot,
  query: string,
): StaffSearchResults {
  const term = query.trim().toLocaleLowerCase("en-NZ")
  if (!term) return { houses: [], clients: [] }
  const houses = myHouses(s)
  const clients = myClients(s)
  const matches = houses.filter((h) =>
    `${h.name} ${h.address}`.toLocaleLowerCase("en-NZ").includes(term),
  )
  return {
    houses: matches.map((h) => ({
      id: h.id,
      name: h.name,
      address: h.address,
      photo: h.photo,
      clientNames: clients
        .filter((c) => c.houseId === h.id)
        .map((c) => c.preferred),
    })),
    clients: clients
      .filter(
        (c) =>
          `${c.name} ${c.preferred}`
            .toLocaleLowerCase("en-NZ")
            .includes(term) || matches.some((h) => h.id === c.houseId),
      )
      .map((c) => ({
        id: c.id,
        name: c.name,
        preferred: c.preferred,
        houseId: c.houseId,
        houseName: houses.find((h) => h.id === c.houseId)!.name,
        tone: c.tone,
        photo: c.photo,
      })),
  }
}
/** Client-safe queries over the already scoped preview snapshot; no fixture builder is imported. */
export const staffQueries = {
  getHouses: myHouses,
  getHouse,
  getClients: myClients,
  getClientsByHouse,
  getClient,
  getClientContacts,
  search: searchStaff,
} satisfies Omit<StaffReadService, "getSnapshot">
