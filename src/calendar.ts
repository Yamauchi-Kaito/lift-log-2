export type TrainingDateRecord = {
  performedAt?: string
  normal?: { startedAt: string }
}

export type CalendarMarker = {
  training?: boolean
  weight?: boolean
  photo?: boolean
}

export function dateKeyFromDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function dateKeyFromTimestamp(timestamp: string | undefined) {
  return timestamp ? dateKeyFromDate(new Date(timestamp)) : undefined
}

export function trainingTimestamp(record: TrainingDateRecord) {
  return record.performedAt ?? record.normal?.startedAt
}

export function trainingDateKey(record: TrainingDateRecord) {
  return dateKeyFromTimestamp(trainingTimestamp(record))
}

export function trainingDateKeys(records: TrainingDateRecord[]) {
  return new Set(records.map(trainingDateKey).filter((key): key is string => Boolean(key)))
}

export function dateFromKey(key: string) {
  const [year, month, day] = key.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function isSameMonth(key: string, date: Date) {
  const [year, month] = key.split("-").map(Number)
  return year === date.getFullYear() && month === date.getMonth() + 1
}
