// Presentation only: this mapping never determines access or identity.
const assigned: Record<string, number> = {
  "6bcf3717-8003-42ea-90f4-f6a8beaf6fb9": 9,
  "616b4acf-942f-4c30-a539-15982b7514d1": 10,
  "20000000-0000-4000-8000-000000000011": 1,
  "20000000-0000-4000-8000-000000000012": 2,
  "20000000-0000-4000-8000-000000000013": 3,
  "20000000-0000-4000-8000-000000000014": 4,
  "20000000-0000-4000-8000-000000000015": 5,
  "20000000-0000-4000-8000-000000000031": 6,
  "20000000-0000-4000-8000-000000000032": 7,
  "20000000-0000-4000-8000-000000000033": 8,
}
export function illustratedAvatar(id: string) {
  let hash = 0
  for (const c of id) hash = (Math.imul(hash, 31) + c.charCodeAt(0)) >>> 0
  const n = assigned[id] ?? (hash % 8) + 9
  return `/demo/avatars/portrait-${String(n).padStart(2, "0")}.svg`
}
export function housePhoto(key?: string | null) {
  return key && /^house-[123]$/.test(key)
    ? `/demo/houses/${key}.webp`
    : undefined
}
