import { useEffect, useMemo, useState } from "react"
import { supabase } from "./lib/supabase"

type WeightRecord = {
    id: string
    recordedOn: string
    weightKg: number
    bodyFatPercent: number | null
}

type GoalType = "cut" | "maintain" | "bulk"
type RangeKey = "7d" | "30d" | "90d" | "all"

type WeightGoal = {
    targetWeightKg: number | null
    goalType: GoalType
}

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

export default function BodyWeightPanel({ userId, onBack }: { userId: string; onBack?: () => void }) {
    const [records, setRecords] = useState<WeightRecord[]>([])
    const [goal, setGoal] = useState<WeightGoal>({ targetWeightKg: null, goalType: "maintain" })
    const [range, setRange] = useState<RangeKey>("30d")
    const [recordedOn, setRecordedOn] = useState(localDateKey())
    const [weight, setWeight] = useState("")
    const [bodyFat, setBodyFat] = useState("")
    const [targetWeight, setTargetWeight] = useState("")
    const [goalType, setGoalType] = useState<GoalType>("maintain")
    const [loading, setLoading] = useState(true)
    const [savingRecord, setSavingRecord] = useState(false)
    const [savingGoal, setSavingGoal] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false

        async function load() {
            setLoading(true)
            setError(null)

            const [recordsResult, goalResult] = await Promise.all([
                supabase
                    .from("body_weight_records")
                    .select("id, recorded_on, weight_kg, body_fat_percent")
                    .eq("user_id", userId)
                    .order("recorded_on", { ascending: true }),
                supabase
                    .from("body_weight_goals")
                    .select("target_weight_kg, goal_type")
                    .eq("user_id", userId)
                    .maybeSingle(),
            ])

            if (cancelled) return

            if (recordsResult.error) {
                setError(`体重記録を読み込めませんでした: ${recordsResult.error.message}`)
            } else {
                const nextRecords = (recordsResult.data ?? []).map((row) => ({
                    id: String(row.id),
                    recordedOn: String(row.recorded_on),
                    weightKg: Number(row.weight_kg),
                    bodyFatPercent: row.body_fat_percent == null ? null : Number(row.body_fat_percent),
                }))
                setRecords(nextRecords)
                if (nextRecords.length) setWeight(nextRecords[nextRecords.length - 1].weightKg.toFixed(1))
            }

            if (goalResult.error) {
                setError((current) => current ?? `目標を読み込めませんでした: ${goalResult.error.message}`)
            } else if (goalResult.data) {
                const nextGoal: WeightGoal = {
                    targetWeightKg: goalResult.data.target_weight_kg == null ? null : Number(goalResult.data.target_weight_kg),
                    goalType: goalResult.data.goal_type as GoalType,
                }
                setGoal(nextGoal)
                setGoalType(nextGoal.goalType)
                setTargetWeight(nextGoal.targetWeightKg == null ? "" : nextGoal.targetWeightKg.toFixed(1))
            }

            setLoading(false)
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

    async function reloadRecords() {
        const { data, error: reloadError } = await supabase
            .from("body_weight_records")
            .select("id, recorded_on, weight_kg, body_fat_percent")
            .eq("user_id", userId)
            .order("recorded_on", { ascending: true })

        if (reloadError) {
            setError(`記録を読み込めませんでした: ${reloadError.message}`)
            return
        }
        setRecords((data ?? []).map((row) => ({
            id: String(row.id),
            recordedOn: String(row.recorded_on),
            weightKg: Number(row.weight_kg),
            bodyFatPercent: row.body_fat_percent == null ? null : Number(row.body_fat_percent),
        })))
    }

    async function saveRecord() {
        const weightKg = Number(weight)
        const bodyFatPercent = bodyFat.trim() === "" ? null : Number(bodyFat)

        if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 400) {
            setError("体重は20〜400kgの範囲で入力してください")
            return
        }
        if (bodyFatPercent != null && (!Number.isFinite(bodyFatPercent) || bodyFatPercent < 1 || bodyFatPercent > 80)) {
            setError("体脂肪率は1〜80%の範囲で入力してください")
            return
        }

        setSavingRecord(true)
        setError(null)
        const { error: saveError } = await supabase
            .from("body_weight_records")
            .upsert({
                user_id: userId,
                recorded_on: recordedOn,
                weight_kg: weightKg,
                body_fat_percent: bodyFatPercent,
                updated_at: new Date().toISOString(),
            }, { onConflict: "user_id,recorded_on" })

        if (saveError) {
            setError(`保存できませんでした: ${saveError.message}`)
            setSavingRecord(false)
            return
        }

        await reloadRecords()
        setBodyFat("")
        setSavingRecord(false)
    }

    async function saveGoal() {
        const targetWeightKg = targetWeight.trim() === "" ? null : Number(targetWeight)
        if (targetWeightKg != null && (!Number.isFinite(targetWeightKg) || targetWeightKg < 20 || targetWeightKg > 400)) {
            setError("目標体重は20〜400kgの範囲で入力してください")
            return
        }

        setSavingGoal(true)
        setError(null)
        const { error: saveError } = await supabase
            .from("body_weight_goals")
            .upsert({
                user_id: userId,
                target_weight_kg: targetWeightKg,
                goal_type: goalType,
                updated_at: new Date().toISOString(),
            }, { onConflict: "user_id" })

        if (saveError) {
            setError(`目標を保存できませんでした: ${saveError.message}`)
        } else {
            setGoal({ targetWeightKg, goalType })
        }
        setSavingGoal(false)
    }

    async function deleteRecord(record: WeightRecord) {
        if (!window.confirm(`${formatDateLabel(record.recordedOn)}の体重記録を削除しますか？`)) return
        setError(null)
        const { error: deleteError } = await supabase
            .from("body_weight_records")
            .delete()
            .eq("id", record.id)
            .eq("user_id", userId)

        if (deleteError) {
            setError(`削除できませんでした: ${deleteError.message}`)
            return
        }
        setRecords((current) => current.filter((item) => item.id !== record.id))
    }

    if (loading) return <section style={section}><p style={empty}>体重記録を読み込み中...</p></section>

    return <section style={section} aria-label="体重管理">
        <div style={sectionHead}>
            <div style={titleGroup}>{onBack && <button aria-label="設定に戻る" onClick={onBack} style={backButton}>‹</button>}<div><p style={eyebrow}>BODY WEIGHT</p><h2 style={heading}>体重管理</h2></div></div>
            <span style={privateBadge}>自分のみ</span>
        </div>

        {error && <p role="alert" style={errorStyle}>{error}</p>}

        <div style={metrics}>
            <Metric label="現在" value={latest ? `${latest.weightKg.toFixed(1)} kg` : "—"} emphasis />
            <Metric label="7日平均" value={sevenDayAverage == null ? "—" : `${sevenDayAverage.toFixed(1)} kg`} />
            <Metric label="目標" value={goal.targetWeightKg == null ? "未設定" : `${goal.targetWeightKg.toFixed(1)} kg`} />
        </div>

        <div style={changeRow}>
            <Change label="7日前比" value={sevenDayDelta} />
            <Change label="30日前比" value={thirtyDayDelta} />
            <Change label="開始時から" value={totalDelta} />
        </div>

        {goalDelta != null && <p style={goalStatus}>{goalLabels[goal.goalType]}目標まで <strong style={{ color: "#c8ff00" }}>{formatSigned(goalDelta)} kg</strong></p>}

        <div style={rangeTabs}>
            {rangeOptions.map((option) => <button key={option.key} onClick={() => setRange(option.key)} style={{ ...rangeButton, ...(range === option.key ? rangeActive : {}) }}>{option.label}</button>)}
        </div>
        <WeightChart records={visibleRecords} />

        <div style={formBlock}>
            <div style={formTitleRow}><h3 style={subheading}>記録する</h3><span style={hint}>同じ日付は上書き</span></div>
            <div style={twoColumns}>
                <label style={field}>日付<input aria-label="体重記録日" type="date" value={recordedOn} onChange={(event) => setRecordedOn(event.target.value)} style={input} /></label>
                <label style={field}>体重 kg<input aria-label="体重" inputMode="decimal" type="number" min="20" max="400" step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="67.8" style={input} /></label>
            </div>
            <label style={field}>体脂肪率 %（任意）<input aria-label="体脂肪率" inputMode="decimal" type="number" min="1" max="80" step="0.1" value={bodyFat} onChange={(event) => setBodyFat(event.target.value)} placeholder="15.2" style={input} /></label>
            <button onClick={() => void saveRecord()} disabled={savingRecord || !recordedOn || !weight} style={{ ...primaryButton, opacity: savingRecord || !recordedOn || !weight ? .4 : 1 }}>{savingRecord ? "保存中..." : "体重を記録"}</button>
        </div>

        <div style={formBlock}>
            <h3 style={subheading}>目標</h3>
            <div style={twoColumns}>
                <label style={field}>目的<select aria-label="体重管理の目的" value={goalType} onChange={(event) => setGoalType(event.target.value as GoalType)} style={input}><option value="cut">減量</option><option value="maintain">維持</option><option value="bulk">増量</option></select></label>
                <label style={field}>目標体重 kg<input aria-label="目標体重" inputMode="decimal" type="number" min="20" max="400" step="0.1" value={targetWeight} onChange={(event) => setTargetWeight(event.target.value)} placeholder="65.0" style={input} /></label>
            </div>
            <button onClick={() => void saveGoal()} disabled={savingGoal} style={{ ...secondaryButton, opacity: savingGoal ? .4 : 1 }}>{savingGoal ? "保存中..." : "目標を保存"}</button>
        </div>

        <div style={historyBlock}>
            <h3 style={subheading}>最近の記録</h3>
            {records.length ? [...records].reverse().slice(0, 10).map((record) => <div key={record.id} style={historyRow}>
                <div><p style={historyDate}>{formatDateLabel(record.recordedOn)}</p><p style={historyMeta}>{record.bodyFatPercent == null ? "体脂肪率 —" : `体脂肪率 ${record.bodyFatPercent.toFixed(1)}%`}</p></div>
                <strong style={historyWeight}>{record.weightKg.toFixed(1)} kg</strong>
                <button aria-label={`${formatDateLabel(record.recordedOn)}の記録を削除`} onClick={() => void deleteRecord(record)} style={deleteButton}>削除</button>
            </div>) : <p style={empty}>まだ体重記録がありません</p>}
        </div>
    </section>
}

function Metric({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
    return <div style={metric}><span style={metricLabel}>{label}</span><strong style={{ ...metricValue, color: emphasis ? "#c8ff00" : "#f2f2f2" }}>{value}</strong></div>
}

function Change({ label, value }: { label: string; value: number | null }) {
    return <div style={change}><span style={changeLabel}>{label}</span><strong style={changeValue}>{value == null ? "—" : `${formatSigned(value)} kg`}</strong></div>
}

function WeightChart({ records }: { records: WeightRecord[] }) {
    if (!records.length) return <div style={chartEmpty}>この期間の記録はありません</div>

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

    return <div style={chartWrap}>
        <div style={chartLabels}><span>{max.toFixed(1)} kg</span><span>{min.toFixed(1)} kg</span></div>
        <svg role="img" aria-label="体重推移グラフ" viewBox={`0 0 ${width} ${height}`} style={chart}>
            <line x1="0" x2={width} y1={height / 2} y2={height / 2} stroke="#242424" strokeWidth="1" />
            <path d={rawPath} fill="none" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d={averagePath} fill="none" stroke="#c8ff00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {records.map((record, index) => <circle key={record.id} cx={x(index)} cy={y(record.weightKg)} r="2.5" fill="#d7d7d7" />)}
        </svg>
        <div style={legend}><span><i style={{ ...legendLine, background: "#666" }} />実測</span><span><i style={{ ...legendLine, background: "#c8ff00" }} />7日平均</span></div>
    </div>
}

function localDateKey() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

function parseDate(value: string) {
    return new Date(`${value}T00:00:00`)
}

function averageWithinDays(records: WeightRecord[], endDate: string, days: number) {
    const end = parseDate(endDate)
    const start = new Date(end)
    start.setDate(start.getDate() - days + 1)
    const values = records.filter((record) => {
        const date = parseDate(record.recordedOn)
        return date >= start && date <= end
    }).map((record) => record.weightKg)
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
}

function deltaFromDaysAgo(records: WeightRecord[], latest: WeightRecord, days: number) {
    const target = parseDate(latest.recordedOn)
    target.setDate(target.getDate() - days)
    const baseline = [...records].reverse().find((record) => parseDate(record.recordedOn) <= target)
    return baseline ? latest.weightKg - baseline.weightKg : null
}

function formatSigned(value: number) {
    const rounded = value.toFixed(1)
    return value > 0 ? `+${rounded}` : rounded
}

function formatDateLabel(value: string) {
    const date = parseDate(value)
    return `${date.getMonth() + 1}/${date.getDate()}`
}

const section = { paddingTop: 18, paddingBottom: 26 } as const
const sectionHead = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 } as const
const titleGroup = { display: "flex", alignItems: "center", gap: 10 } as const
const backButton = { width: 32, height: 32, padding: 0, border: "1px solid #2a2a2a", borderRadius: 8, background: "#202020", color: "#ddd", cursor: "pointer", fontSize: 22, lineHeight: 1 } as const
const eyebrow = { margin: 0, color: "#666", fontFamily: "Inter", fontSize: 10, letterSpacing: ".12em" } as const
const heading = { margin: "3px 0 0", color: "#f2f2f2", fontFamily: "Outfit", fontSize: 18, fontWeight: 700 } as const
const privateBadge = { padding: "5px 8px", border: "1px solid #333", borderRadius: 999, color: "#888", fontFamily: "Inter", fontSize: 10 } as const
const errorStyle = { margin: "0 0 12px", padding: 10, border: "1px solid #5a3030", borderRadius: 8, background: "#281818", color: "#f09a9a", fontSize: 11, lineHeight: 1.5 } as const
const metrics = { display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", borderTop: "1px solid #282828", borderBottom: "1px solid #282828" } as const
const metric = { minWidth: 0, padding: "14px 7px" } as const
const metricLabel = { display: "block", color: "#666", fontFamily: "Inter", fontSize: 9, marginBottom: 4 } as const
const metricValue = { display: "block", fontFamily: "Outfit", fontSize: 17, fontWeight: 700, whiteSpace: "nowrap" } as const
const changeRow = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, marginTop: 12, background: "#282828" } as const
const change = { padding: "10px 8px", background: "#141414" } as const
const changeLabel = { display: "block", color: "#666", fontFamily: "Inter", fontSize: 9, marginBottom: 3 } as const
const changeValue = { color: "#bbb", fontFamily: "Outfit", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" } as const
const goalStatus = { margin: "12px 0 0", color: "#888", fontFamily: "Inter", fontSize: 11 } as const
const rangeTabs = { display: "flex", gap: 5, marginTop: 18 } as const
const rangeButton = { flex: 1, padding: "7px 4px", border: "1px solid #2c2c2c", borderRadius: 7, background: "#171717", color: "#777", fontFamily: "Inter", fontSize: 9, cursor: "pointer" } as const
const rangeActive = { borderColor: "#6c8700", background: "#1b2500", color: "#c8ff00" } as const
const chartWrap = { position: "relative", marginTop: 8, padding: "10px 0 0", borderBottom: "1px solid #282828" } as const
const chart = { display: "block", width: "100%", height: 150, overflow: "visible" } as const
const chartLabels = { position: "absolute", inset: "5px 0 auto", display: "flex", justifyContent: "space-between", color: "#555", fontFamily: "Inter", fontSize: 8, pointerEvents: "none" } as const
const chartEmpty = { marginTop: 8, padding: "44px 12px", borderTop: "1px solid #282828", borderBottom: "1px solid #282828", color: "#666", textAlign: "center", fontSize: 11 } as const
const legend = { display: "flex", justifyContent: "flex-end", gap: 12, padding: "0 0 9px", color: "#666", fontFamily: "Inter", fontSize: 9 } as const
const legendLine = { display: "inline-block", width: 12, height: 2, marginRight: 4, verticalAlign: "middle" } as const
const formBlock = { marginTop: 20, paddingTop: 16, borderTop: "1px solid #282828" } as const
const formTitleRow = { display: "flex", alignItems: "center", justifyContent: "space-between" } as const
const subheading = { margin: 0, color: "#ccc", fontFamily: "Outfit", fontSize: 14, fontWeight: 700 } as const
const hint = { color: "#555", fontFamily: "Inter", fontSize: 9 } as const
const twoColumns = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 } as const
const field = { display: "block", minWidth: 0, marginTop: 10, color: "#777", fontFamily: "Inter", fontSize: 10 } as const
const input = { display: "block", boxSizing: "border-box", width: "100%", marginTop: 5, padding: "10px 9px", border: "1px solid #333", borderRadius: 8, outline: "none", background: "#181818", color: "#eee", fontFamily: "Inter", fontSize: 13 } as const
const primaryButton = { width: "100%", marginTop: 12, padding: 11, border: "none", borderRadius: 8, background: "#c8ff00", color: "#0d0d0d", fontFamily: "Inter", fontSize: 11, fontWeight: 700, cursor: "pointer" } as const
const secondaryButton = { width: "100%", marginTop: 12, padding: 10, border: "1px solid #444", borderRadius: 8, background: "#202020", color: "#ddd", fontFamily: "Inter", fontSize: 11, fontWeight: 700, cursor: "pointer" } as const
const historyBlock = { marginTop: 20, paddingTop: 16, borderTop: "1px solid #282828" } as const
const historyRow = { display: "grid", gridTemplateColumns: "1fr auto auto", alignItems: "center", gap: 12, minHeight: 54, borderBottom: "1px solid #202020" } as const
const historyDate = { margin: 0, color: "#bbb", fontFamily: "Outfit", fontSize: 12, fontWeight: 600 } as const
const historyMeta = { margin: "2px 0 0", color: "#555", fontFamily: "Inter", fontSize: 9 } as const
const historyWeight = { color: "#eee", fontFamily: "Outfit", fontSize: 14 } as const
const deleteButton = { padding: "6px 0 6px 8px", border: "none", background: "transparent", color: "#9b5f5f", fontFamily: "Inter", fontSize: 9, cursor: "pointer" } as const
const empty = { margin: 0, padding: "24px 0", color: "#666", fontFamily: "Inter", fontSize: 11, textAlign: "center" } as const
