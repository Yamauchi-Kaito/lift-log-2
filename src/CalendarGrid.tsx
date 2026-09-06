import { dateKeyFromDate, type CalendarMarker } from "./calendar"

export default function CalendarGrid({ month, markers, selectedDateKey, onSelectDate, disableUnmarked }: { month: Date; markers: ReadonlyMap<string, CalendarMarker>; selectedDateKey?: string | null; onSelectDate?: (dateKey: string) => void; disableUnmarked?: boolean }) {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const firstDay = new Date(year, monthIndex, 1).getDay()
  const dayCount = new Date(year, monthIndex + 1, 0).getDate()
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: dayCount }, (_, index) => index + 1)]

  return <>
    <div style={weekLabels}>{["日", "月", "火", "水", "木", "金", "土"].map((label, index) => <span key={label} style={{ color: index === 0 ? "#b35b5b" : index === 6 ? "#5b82b3" : "#666" }}>{label}</span>)}</div>
    <div style={grid}>
      {cells.map((day, index) => {
        if (!day) return <span key={`empty-${index}`} />
        const dateKey = dateKeyFromDate(new Date(year, monthIndex, day))
        const marker = markers.get(dateKey)
        const marked = Boolean(marker?.training || marker?.weight || marker?.photo)
        const selected = selectedDateKey === dateKey
        const today = dateKeyFromDate(new Date()) === dateKey
        const disabled = Boolean(disableUnmarked && !marked)
        return <button key={dateKey} type="button" aria-label={`${monthIndex + 1}月${day}日${marked ? " 記録あり" : ""}`} disabled={disabled} onClick={() => onSelectDate?.(dateKey)} style={{ ...dayButton, cursor: disabled || !onSelectDate ? "default" : "pointer" }}>
          <span style={{ ...dayNumber, color: selected ? "#0d0d0d" : today ? "#c8ff00" : marked ? "#ddd" : "#666", fontWeight: selected || today ? 700 : 400, background: selected ? "#c8ff00" : "transparent" }}>{day}</span>
          <span style={dots} aria-hidden="true">
            {marker?.training && <i style={{ ...dot, background: "#c8ff00" }} />}
            {marker?.weight && <i style={{ ...dot, background: "#f0f0f0" }} />}
            {marker?.photo && <i style={{ ...dot, background: "#a98cff" }} />}
          </span>
        </button>
      })}
    </div>
  </>
}

const weekLabels = { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 7, textAlign: "center", fontSize: 10 } as const
const grid = { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px 0" } as const
const dayButton = { display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 0", border: "none", background: "transparent", fontFamily: "Outfit", fontSize: 12 } as const
const dayNumber = { width: 23, height: 23, display: "grid", placeItems: "center", borderRadius: "50%" } as const
const dots = { display: "flex", alignItems: "center", gap: 2, minHeight: 4 } as const
const dot = { width: 4, height: 4, borderRadius: "50%" } as const
