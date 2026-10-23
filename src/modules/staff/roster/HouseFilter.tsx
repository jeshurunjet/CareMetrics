import Select from "../ui/Select"
import { useStaffData } from "../data/context"
import { myHouses } from "../data/selectors"
export default function HouseFilter({
  value,
  onChange,
  all = true,
}: {
  value: string
  onChange: (value: string) => void
  all?: boolean
}) {
  const s = useStaffData()
  return (
    <Select
      label="Roster house"
      value={value}
      onChange={onChange}
      options={[
        ...(all ? [{ value: "", label: "All assigned houses" }] : []),
        ...myHouses(s).map((h) => ({ value: h.id, label: h.name })),
      ]}
    />
  )
}
