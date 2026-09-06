import { useEffect, useState } from "react"
import { supabase } from "./lib/supabase"

export default function BodyWeightPanel({ userId, onBack }: { userId: string; onBack: () => void }) {
  const [recordedOn, setRecordedOn] = useState(localDateKey())
  const [weight, setWeight] = useState("")
  const [bodyFat, setBodyFat] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadLatestWeight() {
      const { data, error: loadError } = await supabase.from("body_weight_records").select("weight_kg").eq("user_id", userId).order("recorded_on", { ascending: false }).limit(1).maybeSingle()
      if (!cancelled && !loadError && data) setWeight(Number(data.weight_kg).toFixed(1))
    }
    void loadLatestWeight()
    return () => { cancelled = true }
  }, [userId])

  async function saveRecord() {
    const weightKg = Number(weight)
    const bodyFatPercent = bodyFat.trim() === "" ? null : Number(bodyFat)
    if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 400) return setError("体重は20〜400kgの範囲で入力してください")
    if (bodyFatPercent != null && (!Number.isFinite(bodyFatPercent) || bodyFatPercent < 1 || bodyFatPercent > 80)) return setError("体脂肪率は1〜80%の範囲で入力してください")
    setSaving(true); setError(null); setMessage(null)
    const { error: saveError } = await supabase.from("body_weight_records").upsert({ user_id: userId, recorded_on: recordedOn, weight_kg: weightKg, body_fat_percent: bodyFatPercent, updated_at: new Date().toISOString() }, { onConflict: "user_id,recorded_on" })
    setSaving(false)
    if (saveError) return setError(`保存できませんでした: ${saveError.message}`)
    setBodyFat(""); setMessage("体重を記録しました。")
  }

  return <section style={section} aria-label="体重を記録">
    <header style={header}><button aria-label="前の画面に戻る" onClick={onBack} style={backButton}>‹</button><div><p style={eyebrow}>BODY WEIGHT</p><h1 style={heading}>体重を記録</h1></div></header>
    <div style={body}>
      <p style={hint}>同じ日付の記録は上書きされます</p>
      {message && <p role="status" style={messageStyle}>{message}</p>}{error && <p role="alert" style={errorStyle}>{error}</p>}
      <label style={field}><span>日付</span><input aria-label="体重記録日" type="date" value={recordedOn} onChange={(event) => setRecordedOn(event.target.value)} style={input} /></label>
      <label style={field}><span>体重 kg</span><input aria-label="体重" inputMode="decimal" type="number" min="20" max="400" step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="67.8" style={input} /></label>
      <label style={field}><span>体脂肪率 %（任意）</span><input aria-label="体脂肪率" inputMode="decimal" type="number" min="1" max="80" step="0.1" value={bodyFat} onChange={(event) => setBodyFat(event.target.value)} placeholder="15.2" style={input} /></label>
      <button onClick={() => void saveRecord()} disabled={saving || !recordedOn || !weight} style={{ ...saveButton, opacity: saving || !recordedOn || !weight ? .4 : 1 }}>{saving ? "保存中..." : "記録"}</button>
    </div>
  </section>
}

function localDateKey() { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}` }
const section = {} as const
const header = { display: "flex", alignItems: "center", gap: 12, padding: "24px 20px 18px", borderBottom: "1px solid #1e1e1e" } as const
const backButton = { width: 38, height: 38, padding: 0, border: "1px solid #2a2a2a", borderRadius: 10, background: "#202020", color: "#ddd", cursor: "pointer", fontSize: 22, lineHeight: 1 } as const
const eyebrow = { margin: "0 0 4px", color: "#666", fontFamily: "Inter", fontSize: 11, letterSpacing: ".1em" } as const
const heading = { margin: 0, color: "#f2f2f2", fontFamily: "Outfit", fontSize: 21, fontWeight: 700 } as const
const body = { padding: "0 24px 38px" } as const
const hint = { margin: "20px 0 0", color: "#666", fontSize: 12 } as const
const field = { display: "block", width: "100%", minWidth: 0, marginTop: 14, color: "#aaa", fontFamily: "Inter", fontSize: 12 } as const
const input = { display: "block", boxSizing: "border-box", width: "100%", minWidth: 0, maxWidth: "100%", height: 48, marginTop: 7, padding: "0 12px", border: "1px solid #333", borderRadius: 9, outline: "none", background: "#181818", color: "#eee", fontFamily: "Inter", fontSize: 16, appearance: "none", WebkitAppearance: "none", colorScheme: "dark" } as const
const saveButton = { width: "100%", height: 52, marginTop: 24, border: "none", borderRadius: 10, background: "#c8ff00", color: "#0d0d0d", fontFamily: "Inter", fontSize: 14, fontWeight: 700, cursor: "pointer" } as const
const messageStyle = { margin: "0 0 14px", color: "#c8ff00", fontSize: 12 } as const
const errorStyle = { margin: "0 0 14px", padding: 10, border: "1px solid #5a3030", borderRadius: 8, background: "#281818", color: "#f09a9a", fontSize: 12, lineHeight: 1.5 } as const
