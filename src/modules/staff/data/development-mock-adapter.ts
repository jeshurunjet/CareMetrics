import type { StaffSnapshot } from "./types"
import {
  getHouse,
  getClient,
  getClientsByHouse,
  getClientContacts,
  searchStaff,
} from "./queries"
import { diaryQueries } from "./diary-adapter"
import { seedDiary, diaryCategories } from "./diary-seed"
import { myHouses, myClients, visibleNotices } from "./selectors"
/** FICTIONAL DEVELOPMENT DATA ONLY. Not an API, database, identity or permission control. */
export const developmentMockAdapter = {
  ...diaryQueries,
  getHouses: myHouses,
  getHouse,
  getClients: myClients,
  getClientsByHouse,
  getClient,
  getClientContacts,
  search: searchStaff,
  getSnapshot(employeeId: string, now: string): StaffSnapshot {
    const at = (hours: number) =>
      new Date(Date.parse(now) + hours * 3600000).toISOString()
    const s: StaffSnapshot = {
      now,
      meId: employeeId,
      staff: [
        {
          id: "s1",
          name: "Jamie Taufa",
          role: "Support Worker",
          employeeId: "EMP-001",
          email: "jamie@example.invalid",
        },
        {
          id: "s2",
          name: "Alex Morgan",
          role: "Support Worker",
          employeeId: "EMP-002",
          email: "alex@example.invalid",
        },
        {
          id: "s3",
          name: "Sam Wilson",
          role: "Support Worker",
          employeeId: "EMP-003",
          email: "sam@example.invalid",
        },
      ],
      houses: [
        {
          id: "h1",
          name: "Riverside Lodge",
          email: "riverside@example.invalid",
          description:
            "A fictional supported-living house with shared gardens and a communal lounge.",
          address: "Example address · Hamilton East",
          photo:
            "https://images.unsplash.com/photo-1786526645041-e3bc6a6f0e33?auto=format&fit=crop&w=1080&q=75",
          manager: "Mere Walker (demo)",
          phone: "000 000 1001",
          lat: -37.7905,
          lng: 175.2985,
        },
        {
          id: "h2",
          name: "Sunrise House",
          email: "sunrise@example.invalid",
          description:
            "A fictional supported-living house with quiet shared spaces and room for creative activities.",
          address: "Example address · Hillcrest",
          photo:
            "https://images.unsplash.com/photo-1787636178432-63485b90b1d0?auto=format&fit=crop&w=1080&q=75",
          manager: "Mere Walker (demo)",
          phone: "",
          lat: -37.7985,
          lng: 175.3195,
        },
        {
          id: "h3",
          name: "Cedar Hill",
          address: "Example address · Chartwell",
          photo:
            "https://images.unsplash.com/photo-1786526645041-e3bc6a6f0e33?auto=format&fit=crop&w=1080&q=75",
          manager: "Example Manager",
          phone: "",
          lat: -37.77,
          lng: 175.28,
        },
      ],
      assignments: [
        { employeeId: "s1", houseId: "h1" },
        { employeeId: "s1", houseId: "h2" },
        { employeeId: "s2", houseId: "h1" },
        { employeeId: "s3", houseId: "h2" },
      ],
      clients: [
        {
          id: "c1",
          name: "Taylor Reed",
          preferred: "Taylor",
          dob: "1998-04-12",
          summary:
            "Taylor enjoys music, gardening and short walks. This is a fictional general profile for UI review.",
          contacts: [
            {
              id: "nok1",
              name: "Morgan Reed",
              relation: "Parent (next of kin)",
              phone: "000 000 0101",
              email: "morgan.reed@example.invalid",
              primary: true,
              emergency: true,
              notes: "Fictional contact. Prefers an initial telephone call.",
            },
            {
              id: "nok2",
              name: "Devon Reed",
              relation: "Sibling",
              phone: "000 000 0102",
              emergency: true,
            },
          ],
          houseId: "h1",
          tone: "#1a6b7a",
          alerts: ["Demonstration alert"],
        },
        {
          id: "c2",
          name: "Casey Brooks",
          preferred: "Casey",
          dob: "1990-09-02",
          summary:
            "Casey enjoys audiobooks and community activities. This demonstration record has no contact information yet.",
          contacts: [],
          houseId: "h1",
          tone: "#7c6bb0",
          alerts: [],
        },
        {
          id: "c3",
          name: "Jordan Quinn",
          preferred: "Jordy",
          summary:
            "Jordan enjoys crafts and baking. This fictional profile demonstrates missing optional details.",
          contacts: [
            {
              id: "nok3",
              name: "Riley Quinn",
              relation: "Friend",
              primary: true,
              notes: "Contact details are pending in this demonstration.",
            },
          ],
          houseId: "h2",
          tone: "#c07b45",
          alerts: [],
        },
        {
          id: "c4",
          name: "Unassigned Example",
          preferred: "Unassigned",
          summary: "Outside the demonstration employee's assigned houses.",
          contacts: [
            {
              id: "nok4",
              name: "Restricted Contact",
              relation: "Family",
              phone: "000 000 0104",
              primary: true,
            },
          ],
          houseId: "h3",
          tone: "#1a6b7a",
          alerts: [],
        },
      ],
      shifts: [
        {
          id: "sh1",
          staffId: "s1",
          houseId: "h1",
          start: at(-2),
          end: at(6),
          assignedBy: "Mere Walker (demo)",
        },
        {
          id: "sh2",
          staffId: "s1",
          houseId: "h2",
          start: at(22),
          end: at(30),
          assignedBy: "Mere Walker (demo)",
        },
        {
          id: "sh3",
          staffId: "s1",
          houseId: "h1",
          start: at(46),
          end: at(54),
          assignedBy: "Example Administrator",
        },
        {
          id: "sh4",
          staffId: "s1",
          houseId: "h2",
          start: at(70),
          end: at(78),
          assignedBy: "Mere Walker (demo)",
        },
        {
          id: "co1",
          staffId: "s2",
          houseId: "h1",
          start: at(-1),
          end: at(7),
          assignedBy: "Mere Walker (demo)",
        },
        {
          id: "co2",
          staffId: "s3",
          houseId: "h2",
          start: at(22),
          end: at(30),
          assignedBy: "Mere Walker (demo)",
        },
      ],
      diary: seedDiary(now),
      diaryCategories,
      corrections: [],
      demoAttendance: null,
      notices: [
        {
          id: "n1",
          category: "house",
          relatedId: "h1",
          title: "Riverside team handover",
          body: "Please review the fictional house handover information before your next shift.",
          date: at(-1),
          publisher: "Mere Walker (demo)",
          read: false,
          status: "Published",
        },
        {
          id: "n2",
          category: "client",
          relatedId: "c3",
          title: "Updated support information",
          body: "A demonstration update is available for Jordan. This is fictional content only.",
          date: at(-3),
          publisher: "Example Administrator",
          read: false,
          status: "Published",
        },
        {
          id: "n3",
          category: "staff",
          audience: "All staff",
          title: "Team meeting reminder",
          date: at(-5),
          publisher: "Mere Walker (demo)",
          read: true,
          status: "Published",
        },
        {
          id: "n4",
          category: "house",
          relatedId: "h3",
          title: "Unassigned house notice",
          date: at(-1),
          publisher: "Example Manager",
          read: false,
          status: "Published",
        },
        {
          id: "n5",
          category: "staff",
          title: "Unpublished draft",
          date: at(-1),
          publisher: "Example Manager",
          read: false,
          status: "Draft",
        },
      ],
    }
    if (!s.staff.some((e) => e.id === employeeId))
      throw new Error("Unknown fictional employee")
    const houses = myHouses(s)
    const clients = myClients(s)
    return {
      ...s,
      houses,
      staff: s.staff.filter(
        (e) =>
          e.id === employeeId ||
          s.assignments.some(
            (a) =>
              a.employeeId === e.id && houses.some((h) => h.id === a.houseId),
          ),
      ),
      clients,
      assignments: s.assignments.filter((a) =>
        houses.some((h) => h.id === a.houseId),
      ),
      shifts: s.shifts.filter((sh) => houses.some((h) => h.id === sh.houseId)),
      notices: visibleNotices(s),
      diary: diaryQueries.getHistory(s, undefined),
    }
  },
}
