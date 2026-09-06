import { useEffect, useMemo, useState } from "react"
import Spinner from "./Spinner";
import { supabase } from "./lib/supabase"
import CalendarGrid from "./CalendarGrid"
import { dateFromKey, trainingDateKey, trainingDateKeys } from "./calendar"
import type { GrowthPhoto } from "./GrowthScreen"

export type HistoryExercise = { id: string; name: string; kind: string; position: number; sets: { id: string; position: number; weightKg: number | null; reps: number }[] }
export type HistoryRecord = { id: string | number; date: string; day: number; title: string; result: string; sets: string; duration: string; share: string; quick?: boolean; performedAt?: string; normal?: { startedAt: string; endedAt: string; note: string | null; exercises: HistoryExercise[] } }
export type HistoryQuickRecordChanges = { weightKg: number | null; reps: number }
type BodyWeightRecord = { id: string; recordedOn: string; weightKg: number; bodyFatPercent: number | null }
type GoalType = "cut" | "maintain" | "bulk"
type RangeKey = "7d" | "30d" | "90d" | "all"
type WeightGoal = { targetWeightKg: number | null; goalType: GoalType }

export default function HistoryScreen({ onHome, onQuick, onSettings, records, bodyWeights, photos, initialSelectedDateKey, loading, error, onRetry, onDelete, onUpdateQuick, userId }: { onHome: () => void; onQuick: () => void; onSettings: () => void; records: HistoryRecord[]; bodyWeights: BodyWeightRecord[]; photos: GrowthPhoto[]; initialSelectedDateKey?: string | null; loading: boolean; error: string | null; onRetry: () => void; onDelete: (id: string | number) => Promise<string | null>; onUpdateQuick: (id: string | number, changes: HistoryQuickRecordChanges) => Promise<string | null>; userId: string }) {
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(initialSelectedDateKey ?? null)
  const [detail, setDetail] = useState<HistoryRecord | null>(null)
  useEffect(() => {
    setSelectedDateKey(initialSelectedDateKey ?? null)
  }, [initialSelectedDateKey])
  const firstRecordDate = records[0]?.performedAt ? new Date(records[0].performedAt) : records[0]?.normal ? new Date(records[0].normal.startedAt) : new Date()
  const [calendarDate, setCalendarDate] = useState(() => initialSelectedDateKey ? dateFromKey(initialSelectedDateKey) : firstRecordDate)
  useEffect(() => {
    setCalendarDate(selectedDateKey ? dateFromKey(selectedDateKey) : firstRecordDate)
  }, [selectedDateKey, records])
  const calendarYear = calendarDate.getFullYear()
  const calendarMonth = calendarDate.getMonth()
  const calendarMonthLabel = `${calendarYear}年${calendarMonth + 1}月`
  const trainingDays = trainingDateKeys(records)
  const markers = new Map<string, { training?: boolean; weight?: boolean; photo?: boolean }>()
  for (const key of trainingDays) markers.set(key, { ...markers.get(key), training: true })
  for (const weight of bodyWeights) markers.set(weight.recordedOn, { ...markers.get(weight.recordedOn), weight: true })
  for (const photo of photos) markers.set(photo.dateKey, { ...markers.get(photo.dateKey), photo: true })
  const visible = selectedDateKey ? records.filter((record) => trainingDateKey(record) === selectedDateKey) : records
  const visibleWeights = selectedDateKey ? bodyWeights.filter((record) => record.recordedOn === selectedDateKey) : []
  const visiblePhotos = selectedDateKey ? photos.filter((photo) => photo.dateKey === selectedDateKey) : []
  const hasSelectedRecords = visible.length > 0 || visibleWeights.length > 0 || visiblePhotos.length > 0
  if (detail) return <HistoryDetail record={detail} onBack={() => setDetail(null)} onHome={onHome} onQuick={onQuick} onSettings={onSettings} onDelete={onDelete} onUpdateQuick={onUpdateQuick} />

  return <main style={pageStyle}><div style={contentStyle}>
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 92 }}>
      <header style={{ padding: "48px 24px 22px" }}><p style={eyebrowStyle}>PERSONAL HISTORY</p><h1 style={{ fontFamily: "Outfit", fontSize: 25, fontWeight: 700 }}>履歴</h1></header>
      {error && <div role="alert" style={errorStyle}><p>{error}</p><button onClick={onRetry} style={retryStyle}>再試行</button></div>}
      <section style={{ margin: "0 24px", padding: "17px 16px 13px", backgroundColor: "#171717", border: "1px solid #2a2a2a", borderRadius: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><button type="button" onClick={() => setCalendarDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} style={monthButton}>‹</button><p style={{ fontFamily: "Outfit", fontSize: 15, fontWeight: 600 }}>{calendarMonthLabel}</p><div style={{ display: "flex", alignItems: "center", gap: 7 }}><button type="button" onClick={() => setCalendarDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} style={monthButton}>›</button>{selectedDateKey && <button onClick={() => setSelectedDateKey(null)} style={{ background: "none", border: "none", color: "#c8ff00", fontFamily: "Inter", fontSize: 11, cursor: "pointer" }}>すべて表示</button>}</div></div>
        <CalendarGrid month={calendarDate} markers={markers} selectedDateKey={selectedDateKey} onSelectDate={(dateKey) => setSelectedDateKey((current) => current === dateKey ? null : dateKey)} />
        <div style={calendarLegend}><span><i style={{ ...legendDot, background: "#c8ff00" }} />トレーニング</span><span><i style={{ ...legendDot, background: "#f0f0f0" }} />体重</span><span><i style={{ ...legendDot, background: "#a98cff" }} />写真</span></div>
      </section>
      <section style={{ padding: "28px 24px 0" }}><p style={eyebrowStyle}>{selectedDateKey ? `${calendarMonth + 1}月${calendarDate.getDate()}日の記録` : "すべての記録"}</p>{loading ? <p style={statusStyle}>読み込み中...</p> : !hasSelectedRecords ? <p style={{ color: "#777", fontSize: 14, padding: "28px 0", textAlign: "center" }}>この日の記録はありません</p> : <><div>{visible.map((record, index) => <div key={record.id}>{(index === 0 || visible[index - 1].date !== record.date) && <p style={{ fontFamily: "Outfit", color: "#aaa", fontSize: 14, fontWeight: 600, margin: index ? "24px 0 10px" : "0 0 10px" }}>{record.date}</p>}<button onClick={() => setDetail(record)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 13, padding: "15px", backgroundColor: "#171717", border: "1px solid #2a2a2a", borderRadius: 14, color: "#f0f0f0", cursor: "pointer", textAlign: "left", marginBottom: 8 }}><div style={{ width: 35, height: 35, display: "grid", placeItems: "center", borderRadius: 9, backgroundColor: record.quick ? "#202020" : "#1b2500", color: record.quick ? "#aaa" : "#c8ff00", flexShrink: 0 }}>{record.quick ? "⚡" : "✓"}</div><div style={{ flex: 1, minWidth: 0 }}><div style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 4 }}><span style={{ fontFamily: "Outfit", fontSize: 15, fontWeight: 600 }}>{record.title}</span>{record.quick && <span style={{ color: "#888", fontSize: 10, border: "1px solid #333", borderRadius: 4, padding: "2px 4px" }}>クイック</span>}</div><p style={{ color: "#ccc", fontFamily: "Outfit", fontSize: 13 }}>{record.result}<span style={{ color: "#666", fontFamily: "Inter", fontSize: 11 }}>　{record.quick && record.performedAt ? new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit" }).format(new Date(record.performedAt)) : `${record.sets} · ${record.duration}`}</span></p><p style={{ color: "#777", fontSize: 11, marginTop: 5 }}>{record.share}</p></div><span style={{ color: "#555" }}>›</span></button></div>)}</div>{selectedDateKey && visibleWeights.map((record) => <section key={record.id} style={{ ...cardStyle, marginTop: 8 }}><p style={sectionSmallStyle}>体重記録</p><p style={{ fontFamily: "Outfit", fontSize: 20, fontWeight: 700 }}>{record.weightKg.toFixed(1)} kg</p><p style={{ color: "#777", fontSize: 11, marginTop: 5 }}>{record.bodyFatPercent == null ? "体脂肪率 —" : `体脂肪率 ${record.bodyFatPercent.toFixed(1)}%`}</p></section>)}{selectedDateKey && visiblePhotos.length > 0 && <section style={{ ...cardStyle, marginTop: 8 }}><p style={sectionSmallStyle}>写真記録</p><div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>{visiblePhotos.map((photo) => <img key={photo.id} src={photo.imageUrl} alt={`${photo.owner}の成長記録`} style={{ width: "100%", aspectRatio: "3 / 4", objectFit: "cover", borderRadius: 8, background: "#202020" }} />)}</div></section>}</>}</section>
        <BodyWeightStats userId={userId} records={bodyWeights} />
       </div>
       <HistoryNav onHome={onHome} onQuick={onQuick} onSettings={onSettings} />
  </div></main>
}

function HistoryDetail({ record, onBack, onHome, onQuick, onSettings, onDelete, onUpdateQuick }: { record: HistoryRecord; onBack: () => void; onHome: () => void; onQuick: () => void; onSettings: () => void; onDelete: (id: string | number) => Promise<string | null>; onUpdateQuick: (id: string | number, changes: HistoryQuickRecordChanges) => Promise<string | null> }) {
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [share, setShare] = useState(record.share)
  const [note, setNote] = useState(record.quick ? "" : record.normal?.note ?? "")
  const [quickWeight, setQuickWeight] = useState(record.quick && record.result.includes("kg") ? record.result.split("kg")[0] : "")
  const [quickReps, setQuickReps] = useState(record.quick ? (record.result.match(/(\d+)回/)?.[1] ?? "") : "")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const normalExercises = record.normal?.exercises ?? []
  const completedSetCount = normalExercises.reduce((total, exercise) => total + exercise.sets.length, 0)
  const performedAt = record.normal ? new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(record.normal.startedAt)) : record.performedAt ? new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(record.performedAt)) : record.date
  async function finishEditing() {
    if (!editing) { setEditing(true); return }
    const reps = Number(quickReps)
    const weight = quickWeight.trim() === "" ? null : Number(quickWeight)
    if (!Number.isInteger(reps) || reps < 1 || (weight !== null && (!Number.isFinite(weight) || weight < 0))) { setSaveError("重量と回数を確認してください。"); return }
    setSaving(true); setSaveError(null)
    let error: string | null = null
    try { error = await onUpdateQuick(record.id, { weightKg: weight, reps }) } catch { error = "記録を保存できませんでした。もう一度お試しください。" }
    setSaving(false)
    if (error) { setSaveError(error); return }
    setEditing(false)
  }
  async function removeRecord() { setSaving(true); setSaveError(null); try { const error = await onDelete(record.id); setSaving(false); if (error) { setSaveError(error); return } onBack() } catch { setSaving(false); setSaveError("記録を削除できませんでした。もう一度お試しください。") } }
  return <main style={pageStyle}><div style={contentStyle}><header style={{ display: "flex", alignItems: "center", gap: 12, padding: "24px 20px 17px", borderBottom: "1px solid #1e1e1e" }}><button onClick={onBack} disabled={saving} style={backButtonStyle}>‹</button><div style={{ flex: 1 }}><p style={eyebrowStyle}>RECORD DETAIL</p><h1 style={{ fontFamily: "Outfit", fontSize: 20, fontWeight: 700 }}>{editing ? "記録を編集" : record.title}</h1></div>{!record.normal && <button onClick={() => void finishEditing()} disabled={saving} style={{ ...headerActionStyle, opacity: saving ? .5 : 1 }}>{saving ? <Spinner>保存中...</Spinner> : editing ? "保存" : "編集"}</button>}</header><div style={{ padding: "22px 24px 108px", overflowY: "auto" }}><p style={{ color: "#888", fontSize: 13, marginBottom: 18 }}>{performedAt}</p>{saveError && <div role="alert" style={errorStyle}>{saveError}</div>}{record.quick ? <section style={cardStyle}><p style={sectionSmallStyle}>クイック記録</p><p style={{ fontFamily: "Outfit", fontSize: 20, fontWeight: 700, marginBottom: 18 }}>{record.title}</p>{editing ? <div style={{ display: "flex", gap: 9 }}><Field label="重量（kg）" value={quickWeight} onChange={setQuickWeight} /><Field label="回数" value={quickReps} onChange={setQuickReps} /></div> : <p style={{ fontFamily: "Outfit", fontSize: 25, fontWeight: 700 }}>{quickWeight ? `${quickWeight}kg × ` : ""}{quickReps}回</p>}</section> : <><section style={cardStyle}><p style={{ fontFamily: "Outfit", fontSize: 20, fontWeight: 700, marginBottom: 18 }}>{record.title}</p><div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}><Metric label="時間" value={record.duration} /><Metric label="種目数" value={`${normalExercises.length}種目`} /><Metric label="完了セット" value={`${completedSetCount}セット`} /></div></section><p style={{ ...sectionSmallStyle, marginTop: 26 }}>実施種目</p>{normalExercises.map((exercise) => <section key={exercise.id} style={{ ...cardStyle, marginTop: 9, padding: "15px" }}><p style={{ fontFamily: "Outfit", fontWeight: 600, fontSize: 15, marginBottom: 10 }}>{exercise.name}<small style={{ color: "#777", marginLeft: 8, fontFamily: "Inter", fontSize: 11 }}>{exercise.kind}</small></p>{exercise.sets.map((set, index) => <div key={set.id} style={{ display: "flex", justifyContent: "space-between", color: "#bbb", fontSize: 13, paddingTop: index ? 8 : 0 }}><span>SET {set.position + 1}</span><span style={{ fontFamily: "Outfit" }}>{set.weightKg !== null ? `${set.weightKg}kg × ` : ""}{set.reps}回</span></div>)}</section>)}<p style={{ ...sectionSmallStyle, marginTop: 26 }}>メモ</p>{note && <section style={{ ...cardStyle, color: "#bbb", fontSize: 14, lineHeight: 1.6 }}>{note}</section>}</>}<p style={{ ...sectionSmallStyle, marginTop: 26 }}>共有先</p><section style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px" }}><span style={{ color: "#bbb", fontSize: 14 }}>{share}</span>{!record.normal && <button onClick={() => setEditing(true)} disabled={saving} style={{ background: "none", border: "none", color: "#c8ff00", cursor: "pointer", fontSize: 12 }}>変更</button>}</section>{!record.normal && <button onClick={() => setConfirmDelete(true)} disabled={saving} style={{ width: "100%", padding: "15px", marginTop: 28, border: "1px solid #4a2929", borderRadius: 12, background: "transparent", color: "#e17b7b", fontFamily: "Inter", fontSize: 14, cursor: "pointer" }}>記録を削除</button>}</div><HistoryNav onHome={onHome} onQuick={onQuick} onSettings={onSettings} />{confirmDelete && <div style={dialogBackdropStyle}><section style={dialogStyle}><p style={{ fontFamily: "Outfit", fontSize: 18, fontWeight: 700, marginBottom: 9 }}>記録を削除しますか？</p><p style={{ color: "#888", fontSize: 13, lineHeight: 1.5, marginBottom: 22 }}>削除した記録は元に戻せません。</p><div style={{ display: "flex", gap: 9 }}><button onClick={() => setConfirmDelete(false)} disabled={saving} style={{ ...dialogButtonStyle, background: "#202020", color: "#ddd" }}>キャンセル</button><button onClick={() => void removeRecord()} disabled={saving} style={{ ...dialogButtonStyle, background: "#d94b4b", color: "#fff" }}>{saving ? "削除中..." : "削除する"}</button></div></section></div>}</div></main>
}

function HistoryNav({ onHome, onQuick, onSettings }: { onHome: () => void; onQuick: () => void; onSettings: () => void }) { return <nav style={navStyle}><button onClick={onHome} style={navButtonStyle}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" /><path d="M9 21V12h6v9" /></svg><span style={navLabelStyle}>ホーム</span></button><button onClick={onQuick} style={{ ...navButtonStyle, padding: "0 0 2px" }}><div style={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#222", border: "1px solid #333", marginTop: -10, fontSize: 22, fontWeight: 400 }}>＋</div><span style={navLabelStyle}>記録</span></button><button style={{ ...navButtonStyle, color: "#c8ff00" }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg><span style={{ ...navLabelStyle, fontWeight: 600 }}>履歴</span></button><button onClick={onSettings} style={navButtonStyle}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1-2.2 2.2-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5v.2h-3.2v-.2a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.9.3l-.1.1-2.2-2.2.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H5v-3.2h.2a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1 2.2-2.2.1.1a1.7 1.7 0 001.9.3 1.7 1.7 0 001-1.5V4h3.2v.2a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1 2.2 2.2-.1.1a1.7 1.7 0 00-.3 1.9 1.7 1.7 0 001.5 1h.2V14h-.2a1.7 1.7 0 00-1.5 1z" /></svg><span style={navLabelStyle}>設定</span></button></nav> }

function Metric({ label, value }: { label: string; value: string }) { return <div><p style={{ color: "#777", fontSize: 10, marginBottom: 5 }}>{label}</p><p style={{ fontFamily: "Outfit", fontSize: 14, fontWeight: 700 }}>{value}</p></div> }
function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label style={{ flex: 1, color: "#777", fontSize: 11 }}>{label}<input value={value} onChange={(event) => onChange(event.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" style={{ width: "100%", marginTop: 6, padding: "10px", background: "#202020", border: "1px solid #333", borderRadius: 8, outline: "none", color: "#f0f0f0", fontFamily: "Outfit", fontSize: 16 }} /></label> }

const rangeOptions: { key: RangeKey; label: string; days?: number }[] = [
   { key: "7d", label: "1週間", days: 7 },
   { key: "30d", label: "1か月", days: 30 },
   { key: "90d", label: "3か月", days: 90 },
   { key: "all", label: "全期間" },
]

const goalLabels: Record<GoalType, string> = {
   cut: "減量",
   maintain: "維持",
   bulk: "増量",
}

function BodyWeightStats({ userId, records }: { userId: string; records: BodyWeightRecord[] }) {
   const [goal, setGoal] = useState<WeightGoal>({ targetWeightKg: null, goalType: "maintain" })
   const [range, setRange] = useState<RangeKey>("30d")
   const [error, setError] = useState<string | null>(null)

   useEffect(() => {
      let cancelled = false
      async function load() {
         setError(null)
         const goalResult = await supabase
                  .from("body_weight_goals")
                  .select("target_weight_kg, goal_type")
                  .eq("user_id", userId)
                  .maybeSingle()
         if (cancelled) return
         if (goalResult.error) {
            setError((current) => current ?? `目標を読み込めませんでした: ${goalResult.error.message}`)
          } else if (goalResult.data) {
            setGoal({
               targetWeightKg: goalResult.data.target_weight_kg == null ? null : Number(goalResult.data.target_weight_kg),
               goalType: goalResult.data.goal_type as GoalType,
            })
          }
       }
      void load()
      return () => { cancelled = true }
   }, [userId])

   const visibleRecords = useMemo(() => {
      const option = rangeOptions.find((item) => item.key === range)
      if (!option?.days || !records.length) return records
      const latestRecord = parseDate(records[records.length - 1].recordedOn)
      const start = new Date(latestRecord)
      start.setDate(start.getDate() - option.days + 1)
      return records.filter((record) => parseDate(record.recordedOn) >= start)
   }, [range, records])

   const latest = records.length ? records[records.length - 1] : undefined
   const first = records.length ? records[0] : undefined
   const sevenDayAverage = latest ? averageWithinDays(records, latest.recordedOn, 7) : null
   const sevenDayDelta = latest ? deltaFromDaysAgo(records, latest, 7) : null
   const thirtyDayDelta = latest ? deltaFromDaysAgo(records, latest, 30) : null
   const totalDelta = latest && first ? latest.weightKg - first.weightKg : null
   const goalDelta = latest && goal.targetWeightKg != null ? goal.targetWeightKg - latest.weightKg : null

   return <section style={{ padding: "28px 24px 0" }}>
       <p style={sectionSmallStyle}>体重の集計</p>
       {error && <p role="alert" style={{ ...errorStyle, margin: "0 0 14px" }}>{error}</p>}
       <div style={{ ...cardStyle, marginTop: 12 }}>
          <div style={bwMetrics}>
             <StatMetric label="現在" value={latest ? `${latest.weightKg.toFixed(1)} kg` : "—"} emphasis />
             <StatMetric label="7日平均" value={sevenDayAverage == null ? "—" : `${sevenDayAverage.toFixed(1)} kg`} />
             <StatMetric label="目標" value={goal.targetWeightKg == null ? "未設定" : `${goal.targetWeightKg.toFixed(1)} kg`} />
          </div>

          <div style={bwChangeRow}>
             <StatChange label="7日前比" value={sevenDayDelta} />
             <StatChange label="30日前比" value={thirtyDayDelta} />
             <StatChange label="開始時から" value={totalDelta} />
          </div>

          {goalDelta != null && <p style={bwGoalStatus}>{goalLabels[goal.goalType]}目標まで <strong style={{ color: "#c8ff00" }}>{formatSigned(goalDelta)} kg</strong></p>}

          <div style={bwRangeTabs}>
             {rangeOptions.map((option) => <button key={option.key} onClick={() => setRange(option.key)} style={{ ...bwRangeButton, ...(range === option.key ? bwRangeActive : {}) }}>{option.label}</button>)}
          </div>
          <WeightChart records={visibleRecords} />
       </div>
   </section>
}

function StatMetric({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
   return <div style={bwMetric}><span style={bwMetricLabel}>{label}</span><strong style={{ ...bwMetricValue, color: emphasis ? "#c8ff00" : "#f2f2f2" }}>{value}</strong></div>
}

function StatChange({ label, value }: { label: string; value: number | null }) {
   return <div style={bwChange}><span style={bwChangeLabel}>{label}</span><strong style={bwChangeValue}>{value == null ? "—" : `${formatSigned(value)} kg`}</strong></div>
}

function WeightChart({ records }: { records: BodyWeightRecord[] }) {
   if (!records.length) return <div style={bwChartEmpty}>この期間の記録はありません</div>

   const width = 334
   const height = 150
   const padX = 8
   const padY = 16
   const weights = records.map((record) => record.weightKg)
   const averages = records.map((record) => averageWithinDays(records, record.recordedOn, 7) ?? record.weightKg)
   const allValues = [...weights, ...averages]
   const min = Math.min(...allValues)
   const max = Math.max(...allValues)
   const span = Math.max(max - min, 1)
   const x = (index: number) => records.length === 1 ? width / 2 : padX + index * ((width - padX * 2) / (records.length - 1))
   const y = (value: number) => padY + (max - value) * ((height - padY * 2) / span)
   const rawPath = records.map((record, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(record.weightKg)}`).join(" ")
   const averagePath = averages.map((value, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(value)}`).join(" ")

   return <div style={bwChartWrap}>
       <div style={bwChartLabels}><span>{max.toFixed(1)} kg</span><span>{min.toFixed(1)} kg</span></div>
       <svg role="img" aria-label="体重推移グラフ" viewBox={`0 0 ${width} ${height}`} style={bwChart}>
          <line x1="0" x2={width} y1={height / 2} y2={height / 2} stroke="#242424" strokeWidth="1" />
          <path d={rawPath} fill="none" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d={averagePath} fill="none" stroke="#c8ff00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {records.map((record, index) => <circle key={record.id} cx={x(index)} cy={y(record.weightKg)} r="2.5" fill="#d7d7d7" />)}
       </svg>
       <div style={bwLegend}><span><i style={{ ...bwLegendLine, background: "#666" }} />実測</span><span><i style={{ ...bwLegendLine, background: "#c8ff00" }} />7日平均</span></div>
   </div>
}

function parseDate(value: string) {
   return new Date(`${value}T00:00:00`)
}

function averageWithinDays(records: BodyWeightRecord[], endDate: string, days: number) {
   const end = parseDate(endDate)
   const start = new Date(end)
   start.setDate(start.getDate() - days + 1)
   const values = records.filter((record) => {
      const date = parseDate(record.recordedOn)
      return date >= start && date <= end
   }).map((record) => record.weightKg)
   return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
}

function deltaFromDaysAgo(records: BodyWeightRecord[], latest: BodyWeightRecord, days: number) {
   const target = parseDate(latest.recordedOn)
   target.setDate(target.getDate() - days)
   const baseline = [...records].reverse().find((record) => parseDate(record.recordedOn) <= target)
   return baseline ? latest.weightKg - baseline.weightKg : null
}

function formatSigned(value: number) {
   const rounded = value.toFixed(1)
   return value > 0 ? `+${rounded}` : rounded
}

const pageStyle = { minHeight: "100vh", display: "flex", justifyContent: "center", backgroundColor: "#000" } as const
const contentStyle = { width: "100%", maxWidth: 430, minHeight: "100vh", position: "relative", display: "flex", flexDirection: "column", backgroundColor: "#0d0d0d" } as const
const eyebrowStyle = { color: "#666", fontFamily: "Inter", fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", marginBottom: 5 } as const
const cardStyle = { backgroundColor: "#171717", border: "1px solid #2a2a2a", borderRadius: 16, padding: "18px" } as const
const navStyle = { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, display: "flex", alignItems: "flex-end", padding: "8px 0 20px", backgroundColor: "#0d0d0d", borderTop: "1px solid #1e1e1e", zIndex: 10 } as const
const navButtonStyle = { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, border: "none", background: "none", color: "#505050", cursor: "pointer", padding: "6px 0" } as const
const navLabelStyle = { fontFamily: "Inter", fontSize: 10, letterSpacing: "0.04em" } as const
const backButtonStyle = { width: 38, height: 38, borderRadius: 10, background: "#202020", border: "1px solid #2a2a2a", color: "#ddd", cursor: "pointer", fontSize: 22 } as const
const headerActionStyle = { padding: "8px 11px", background: "transparent", border: "1px solid #333", borderRadius: 8, color: "#c8ff00", fontFamily: "Inter", fontSize: 12, cursor: "pointer" } as const
const sectionSmallStyle = { color: "#777", fontSize: 11, fontWeight: 500, letterSpacing: "0.09em", marginBottom: 10 } as const
const setInputStyle = { width: 105, padding: "4px 7px", background: "#202020", border: "1px solid #444", borderRadius: 6, color: "#f0f0f0", fontFamily: "Outfit", fontSize: 12, textAlign: "right" } as const
const noteInputStyle = { width: "100%", minHeight: 76, padding: "12px", background: "#171717", border: "1px solid #2a2a2a", borderRadius: 12, outline: "none", resize: "vertical", color: "#ddd", fontFamily: "Inter", fontSize: 14, lineHeight: 1.5 } as const
const selectStyle = { width: "100%", padding: "14px 16px", background: "#171717", border: "1px solid #2a2a2a", borderRadius: 12, color: "#ddd", fontFamily: "Inter", fontSize: 14, outline: "none" } as const
const dialogBackdropStyle = { position: "fixed", inset: 0, zIndex: 20, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "rgba(0,0,0,0.7)" } as const
const dialogStyle = { width: "100%", maxWidth: 360, padding: 22, border: "1px solid #333", borderRadius: 16, backgroundColor: "#171717" } as const
const dialogButtonStyle = { flex: 1, height: 46, border: "none", borderRadius: 10, fontFamily: "Inter", fontSize: 13, fontWeight: 600, cursor: "pointer" } as const
const statusStyle = { color: "#888", fontSize: 14, padding: "28px 0", textAlign: "center" } as const
const monthButton = { width: 24, height: 24, border: "1px solid #333", borderRadius: 6, background: "#202020", color: "#aaa", fontFamily: "Outfit", fontSize: 18, lineHeight: 1, cursor: "pointer" } as const
const errorStyle = { margin: "0 24px 18px", padding: 12, border: "1px solid #5a3030", borderRadius: 9, backgroundColor: "#281818", color: "#f09a9a", fontSize: 12, lineHeight: 1.5 } as const
const retryStyle = { marginTop: 9, padding: "7px 10px", border: "1px solid #7a4242", borderRadius: 7, background: "transparent", color: "#f3b0b0", fontFamily: "Inter", fontSize: 12, cursor: "pointer" } as const
const calendarLegend = { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10, color: "#777", fontSize: 10 } as const
const legendDot = { display: "inline-block", width: 5, height: 5, marginRight: 4, borderRadius: "50%" } as const
const bwMetrics = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 } as React.CSSProperties
const bwMetric = { display: "flex", flexDirection: "column", gap: 4, padding: "12px 0", borderLeft: "1px solid #2a2a2a", paddingLeft: 12 } as React.CSSProperties
const bwMetricLabel = { color: "#888", fontFamily: "Inter", fontSize: 10 } as React.CSSProperties
const bwMetricValue = { fontFamily: "JetBrains Mono", fontSize: 17, fontWeight: 600 } as React.CSSProperties
const bwChangeRow = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 14, paddingTop: 14, borderTop: "1px solid #1f1f1f" } as React.CSSProperties
const bwChange = { display: "flex", flexDirection: "column", gap: 3 } as React.CSSProperties
const bwChangeLabel = { color: "#888", fontFamily: "Inter", fontSize: 10 } as React.CSSProperties
const bwChangeValue = { fontFamily: "JetBrains Mono", fontSize: 14, color: "#f0f0f0" } as React.CSSProperties
const bwGoalStatus = { margin: "14px 0 0", fontFamily: "Inter", fontSize: 11, color: "#888" } as React.CSSProperties
const bwRangeTabs = { display: "flex", gap: 8, marginTop: 16 } as React.CSSProperties
const bwRangeButton = { flex: 1, height: 34, border: "1px solid #2a2a2a", background: "#151515", color: "#888", borderRadius: 999, fontFamily: "Outfit", fontWeight: 600, fontSize: 12, cursor: "pointer" } as React.CSSProperties
const bwRangeActive = { background: "#f0f0f0", color: "#0c0c0c", borderColor: "#f0f0f0" } as React.CSSProperties
const bwChartWrap = { marginTop: 16, display: "flex", flexDirection: "column", gap: 8 } as React.CSSProperties
const bwChart = { width: "100%", height: 150 } as React.CSSProperties
const bwChartLabels = { display: "flex", justifyContent: "space-between", color: "#666", fontFamily: "JetBrains Mono", fontSize: 10 } as React.CSSProperties
const bwChartEmpty = { padding: "28px 0", textAlign: "center", color: "#666", fontFamily: "Inter", fontSize: 12 } as React.CSSProperties
const bwLegend = { display: "flex", gap: 18, color: "#888", fontFamily: "Inter", fontSize: 10 } as React.CSSProperties
const bwLegendLine = { display: "inline-block", width: 12, height: 2, margin: "0 6px 0 8px", verticalAlign: "middle" } as React.CSSProperties
