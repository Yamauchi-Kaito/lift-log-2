import { useEffect, useState } from "react"
import { supabase } from "./lib/supabase"

type WeightRecord = {
    id: string
    recordedOn: string
    weightKg: number
    bodyFatPercent: number | null
}

type GoalType = "cut" | "maintain" | "bulk"

export default function BodyWeightPanel({ userId, onBack }: { userId: string; onBack?: () => void }) {
    const [records, setRecords] = useState<WeightRecord[]>([])
    const [recordedOn, setRecordedOn] = useState(localDateKey())
    const [weight, setWeight] = useState("")
    const [bodyFat, setBodyFat] = useState("")
    const [saving, setSaving] = useState(false)
    const [recordError, setRecordError] = useState<string | null>(null)
    const [goalType, setGoalType] = useState<GoalType>("maintain")
    const [goalTargetWeight, setGoalTargetWeight] = useState("")
    const [goalSaving, setGoalSaving] = useState(false)
    const [goalError, setGoalError] = useState<string | null>(null)
    const [goalMessage, setGoalMessage] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        async function load() {
            setRecordError(null)
            const { data, error: loadError } = await supabase
                 .from("body_weight_records")
                 .select("id, recorded_on, weight_kg, body_fat_percent")
                 .eq("user_id", userId)
                 .order("recorded_on", { ascending: true })
            if (cancelled) return
            if (loadError) {
                setRecordError(`体重記録を読み込めませんでした: ${loadError.message}`)
                return
              }
            const nextRecords = (data ?? []).map((row) => ({
                id: String(row.id),
                recordedOn: String(row.recorded_on),
                weightKg: Number(row.weight_kg),
                bodyFatPercent: row.body_fat_percent == null ? null : Number(row.body_fat_percent),
              }))
            setRecords(nextRecords)
            if (nextRecords.length) setWeight(nextRecords[nextRecords.length - 1].weightKg.toFixed(1))
          }
        void load()
        return () => { cancelled = true }
      }, [userId])

    useEffect(() => {
        let cancelled = false
        async function loadGoal() {
            const { error, data } = await supabase
                 .from("body_weight_goals")
                 .select("target_weight_kg, goal_type")
                 .eq("user_id", userId)
                 .maybeSingle()
            if (cancelled) return
            if (error) {
                setGoalError(`目標を読み込めませんでした: ${error.message}`)
                return
              }
            if (data) {
                setGoalType(data.goal_type as GoalType)
                setGoalTargetWeight(data.target_weight_kg == null ? "" : Number(data.target_weight_kg).toFixed(1))
              }
          }
        void loadGoal()
        return () => { cancelled = true }
      }, [userId])

    async function reloadRecords() {
        const { data, error: reloadError } = await supabase
              .from("body_weight_records")
              .select("id, recorded_on, weight_kg, body_fat_percent")
              .eq("user_id", userId)
              .order("recorded_on", { ascending: true })
        if (reloadError) {
            setRecordError(`記録を読み込めませんでした: ${reloadError.message}`)
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
            setRecordError("体重は20〜400kgの範囲で入力してください")
            return
          }
        if (bodyFatPercent != null && (!Number.isFinite(bodyFatPercent) || bodyFatPercent < 1 || bodyFatPercent > 80)) {
            setRecordError("体脂肪率は1〜80%の範囲で入力してください")
            return
          }
        setSaving(true)
        setRecordError(null)
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
            setRecordError(`保存できませんでした: ${saveError.message}`)
            setSaving(false)
            return
          }
        await reloadRecords()
        setBodyFat("")
        setSaving(false)
      }

    async function deleteRecord(record: WeightRecord) {
        if (!window.confirm(`${formatDateLabel(record.recordedOn)}の体重記録を削除しますか？`)) return
        setRecordError(null)
        const { error: deleteError } = await supabase
              .from("body_weight_records")
              .delete()
              .eq("id", record.id)
              .eq("user_id", userId)
        if (deleteError) {
            setRecordError(`削除できませんでした: ${deleteError.message}`)
            return
          }
        setRecords((current) => current.filter((item) => item.id !== record.id))
      }

    async function saveGoal() {
        const targetWeightKg = goalTargetWeight.trim() === "" ? null : Number(goalTargetWeight)
        if (targetWeightKg != null && (!Number.isFinite(targetWeightKg) || targetWeightKg < 20 || targetWeightKg > 400)) {
            setGoalError("目標体重は20〜400kgの範囲で入力してください")
            return
          }
        setGoalMessage(null)
        setGoalError(null)
        setGoalSaving(true)
        const { error } = await supabase
              .from("body_weight_goals")
              .upsert({
            user_id: userId,
            target_weight_kg: targetWeightKg,
            goal_type: goalType,
            updated_at: new Date().toISOString(),
              }, { onConflict: "user_id" })
        setGoalSaving(false)
        if (error) {
            setGoalError(`目標を保存できませんでした: ${error.message}`)
            return
          }
        setGoalMessage("目標を保存しました。")
      }

    return <section style={section} aria-label="体重管理">
          <div style={sectionHead}>
             <div style={titleGroup}>{onBack && <button aria-label="前の画面に戻る" onClick={onBack} style={backButton}>‹</button>}<div><p style={eyebrow}>BODY WEIGHT</p><h2 style={heading}>体重管理</h2></div></div>
             <span style={privateBadge}>自分のみ</span>
          </div>

          <div style={formBlock}>
             <div style={formTitleRow}><p style={formTitle}>記録する</p><span style={hint}>同じ日付は上書き</span></div>
             {recordError && <p role="alert" style={errorStyle}>{recordError}</p>}
             <div style={twoColumns}>
               <label style={field}><span>日付</span><input aria-label="体重記録日" type="date" value={recordedOn} onChange={(event) => setRecordedOn(event.target.value)} style={input} /></label>
               <label style={field}><span>体重 kg</span><input aria-label="体重" inputMode="decimal" type="number" min="20" max="400" step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="67.8" style={input} /></label>
             </div>
             <label style={{ ...field, marginTop: 8 }}><span>体脂肪率 %（任意）</span><input aria-label="体脂肪率" inputMode="decimal" type="number" min="1" max="80" step="0.1" value={bodyFat} onChange={(event) => setBodyFat(event.target.value)} placeholder="15.2" style={input} /></label>
             <button onClick={() => void saveRecord()} disabled={saving || !recordedOn || !weight} style={{ ...primaryButton, opacity: saving || !recordedOn || !weight ? .4 : 1 }}>{saving ? "保存中..." : "体重を記録"}</button>
          </div>

          <p style={{ ...subLabel, marginTop: 26 }}>最近の記録</p>
          {records.length ? [...records].reverse().slice(0, 10).map((record) => <div key={record.id} style={historyRow}>
             <div><p style={historyDate}>{formatDateLabel(record.recordedOn)}</p><p style={historyMeta}>{record.bodyFatPercent == null ? "体脂肪率 —" : `体脂肪率 ${record.bodyFatPercent.toFixed(1)}%`}</p></div>
             <strong style={historyWeight}>{record.weightKg.toFixed(1)} kg</strong>
             <button aria-label={`${formatDateLabel(record.recordedOn)}の記録を削除`} onClick={() => void deleteRecord(record)} style={deleteButton}>削除</button>
          </div>) : <p style={empty}>まだ体重記録がありません</p>}

          <div style={formBlock}>
             <div style={formTitleRow}><p style={formTitle}>目標</p></div>
             {goalMessage && <p role="status" style={statusMessage}>{goalMessage}</p>}
             {goalError && <p role="alert" style={errorStyle}>{goalError}</p>}
             <div style={twoColumns}>
               <label style={field}><span>目的</span><select aria-label="体重管理の目的" value={goalType} onChange={(event) => setGoalType(event.target.value as GoalType)} style={input}><option value="cut">減量</option><option value="maintain">維持</option><option value="bulk">増量</option></select></label>
               <label style={field}><span>目標体重 kg</span><input aria-label="目標体重" inputMode="decimal" type="number" min="20" max="400" step="0.1" value={goalTargetWeight} onChange={(event) => setGoalTargetWeight(event.target.value)} placeholder="65.0" style={input} /></label>
             </div>
             <button disabled={goalSaving} onClick={() => void saveGoal()} style={{ ...primaryButton, opacity: goalSaving ? .45 : 1 }}>{goalSaving ? "保存中..." : "目標を保存"}</button>
          </div>
      </section>
}

function localDateKey() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

function formatDateLabel(value: string) {
    const date = new Date(`${value}T00:00:00`)
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
const formBlock = { marginTop: 20, paddingTop: 16, borderTop: "1px solid #282828" } as const
const formTitleRow = { display: "flex", alignItems: "center", justifyContent: "space-between" } as const
const formTitle = { margin: 0, fontFamily: "Outfit", fontSize: 15, fontWeight: 600 } as const
const hint = { color: "#555", fontFamily: "Inter", fontSize: 9 } as const
const twoColumns = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 } as const
const field = { display: "block", minWidth: 0, marginTop: 10, color: "#777", fontFamily: "Inter", fontSize: 10 } as const
const input = { display: "block", boxSizing: "border-box", width: "100%", marginTop: 5, padding: "10px 9px", border: "1px solid #333", borderRadius: 8, outline: "none", background: "#181818", color: "#eee", fontFamily: "Inter", fontSize: 13 } as const
const primaryButton = { width: "100%", marginTop: 12, padding: 11, border: "none", borderRadius: 8, background: "#c8ff00", color: "#0d0d0d", fontFamily: "Inter", fontSize: 11, fontWeight: 700, cursor: "pointer" } as const
const secondaryButton = { width: "100%", marginTop: 12, padding: 10, border: "1px solid #444", borderRadius: 8, background: "#202020", color: "#ddd", fontFamily: "Inter", fontSize: 11, fontWeight: 700, cursor: "pointer" } as const
const subLabel = { color: "#777", fontSize: 11, fontWeight: 500, letterSpacing: "0.09em" } as const
const historyRow = { display: "grid", gridTemplateColumns: "1fr auto auto", alignItems: "center", gap: 12, minHeight: 50, padding: "12px 0", borderBottom: "1px solid #202020" } as const
const historyDate = { margin: 0, color: "#bbb", fontFamily: "Outfit", fontSize: 13, fontWeight: 600 } as const
const historyMeta = { margin: "2px 0 0", color: "#555", fontFamily: "Inter", fontSize: 10 } as const
const historyWeight = { color: "#f0f0f0", fontFamily: "Outfit", fontSize: 15 } as const
const deleteButton = { padding: "6px 0 6px 10px", border: "none", background: "transparent", color: "#9b5f5f", fontFamily: "Inter", fontSize: 11, cursor: "pointer" } as const
const statusMessage = { margin: "0 0 10px", color: "#c8ff00", fontSize: 12, lineHeight: 1.5 } as const
const empty = { margin: 0, padding: "24px 0", color: "#666", fontFamily: "Inter", fontSize: 11, textAlign: "center" } as const
