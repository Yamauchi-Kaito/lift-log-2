import { useEffect, useRef, useState } from "react"

const PREVIOUS_RECORDS: Record<string, { weight?: number; reps: number }> = {
  "ベンチプレス": { weight: 80, reps: 8 },
  "スクワット": { weight: 100, reps: 5 },
  "デッドリフト": { weight: 120, reps: 5 },
  "腕立て伏せ": { reps: 30 },
  "懸垂": { reps: 10 },
}

export default function QuickRecordScreen({ onBack, teams, exercises, onSaveShared, onSaveRecord }: { onBack: () => void; teams: { id: number; name: string }[]; exercises: string[]; onSaveShared: (record: { teamId: number; exercise: string; reps: number; weight?: number }) => void; onSaveRecord: (record: { exercise: string; reps: number; weight?: number; share: string }) => void }) {
  const [exercise, setExercise] = useState("")
  const [showExercises, setShowExercises] = useState(false)
  const [weight, setWeight] = useState("")
  const [reps, setReps] = useState(0)
  const [editingReps, setEditingReps] = useState(false)
  const [shareTo, setShareTo] = useState<"private" | "team">("private")
  const [team, setTeam] = useState(teams[0]?.id ?? 0)
  const [saved, setSaved] = useState(false)
  const repsRef = useRef<HTMLInputElement>(null)
  const canSave = Boolean(exercise) && reps > 0 && (shareTo !== "team" || team > 0)

  useEffect(() => {
    if (editingReps) repsRef.current?.select()
  }, [editingReps])

  function save() {
    if (!canSave) return
    if (shareTo === "team" && team) onSaveShared({ teamId: team, exercise, reps, weight: weight ? Number(weight) : undefined })
    onSaveRecord({ exercise, reps, weight: weight ? Number(weight) : undefined, share: shareTo === "team" && team ? `チーム · ${teams.find((item) => item.id === team)?.name ?? ""}` : "自分のみ" })
    setSaved(true)
  }

  function selectExercise(name: string) {
    const previous = PREVIOUS_RECORDS[name]
    setExercise(name)
    setWeight(previous?.weight?.toString() ?? "")
    setReps(previous?.reps ?? 0)
    setShowExercises(false)
  }

  const previousRecord = PREVIOUS_RECORDS[exercise]

  if (saved) {
    return (
      <main style={pageStyle}>
        <div style={{ ...contentStyle, justifyContent: "center", alignItems: "center", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: "#1c2600", border: "1px solid #c8ff00", display: "grid", placeItems: "center", marginBottom: 20 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c8ff00" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4 4L19 6" /></svg>
          </div>
          <p style={{ fontFamily: "Outfit", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>記録を保存しました</p>
          <p style={{ fontSize: 14, color: "#888", marginBottom: 32 }}>{exercise}{weight ? ` · ${weight}kg` : ""} · {reps}回</p>
          <button onClick={onBack} style={saveButtonStyle}>ホームへ戻る</button>
        </div>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <div style={contentStyle}>
        <header style={{ display: "flex", alignItems: "center", gap: 16, padding: "24px 24px 20px", borderBottom: "1px solid #1e1e1e" }}>
          <button onClick={onBack} aria-label="戻る" style={iconButtonStyle}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </button>
          <div><p style={{ color: "#666", fontSize: 11, letterSpacing: "0.1em", marginBottom: 3 }}>QUICK RECORD</p><h1 style={{ fontFamily: "Outfit", fontSize: 22, fontWeight: 700 }}>クイック記録</h1></div>
        </header>

        <div style={{ padding: "24px", flex: 1, overflowY: "auto", paddingBottom: 116 }}>
          <Label>種目</Label>
          <button onClick={() => setShowExercises((value) => !value)} style={{ ...fieldStyle, justifyContent: "space-between", color: exercise ? "#f0f0f0" : "#666" }}>
            <span>{exercise || "種目を選択"}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showExercises ? "rotate(180deg)" : "none" }}><path d="M6 9l6 6 6-6" /></svg>
          </button>
          {showExercises && <div style={{ marginTop: 8, border: "1px solid #2a2a2a", borderRadius: 12, overflow: "hidden", backgroundColor: "#171717" }}>
            {exercises.map((item) => <button key={item} onClick={() => selectExercise(item)} style={{ width: "100%", padding: "14px 16px", background: item === exercise ? "#202020" : "transparent", border: "none", borderBottom: "1px solid #242424", textAlign: "left", color: item === exercise ? "#c8ff00" : "#ccc", fontSize: 14, cursor: "pointer" }}>{item}</button>)}
          </div>}

          <div style={{ height: 28 }} />
          <Label>重量 <span style={{ color: "#555", fontWeight: 400 }}>任意</span></Label>
          <div style={{ ...fieldStyle, padding: "0 16px" }}>
            <input value={weight} onChange={(event) => setWeight(event.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" placeholder="重量を入力" style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: "#f0f0f0", fontFamily: "Outfit", fontSize: 18 }} />
            <span style={{ color: "#777", fontFamily: "Outfit", fontSize: 14 }}>kg</span>
          </div>

          <div style={{ height: 28 }} />
          <Label>回数</Label>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, padding: "8px 0" }}>
            <button onClick={() => setReps((value) => Math.max(0, value - 1))} style={stepperStyle}>−</button>
            {editingReps ? <input ref={repsRef} value={reps} onChange={(event) => setReps(Math.max(0, Number(event.target.value) || 0))} onBlur={() => setEditingReps(false)} onKeyDown={(event) => { if (event.key === "Enter") setEditingReps(false) }} inputMode="numeric" style={{ width: 98, background: "#202020", border: "1px solid #c8ff00", borderRadius: 12, color: "#f0f0f0", outline: "none", fontFamily: "Outfit", fontSize: 34, fontWeight: 700, textAlign: "center", padding: "8px" }} /> : <button onClick={() => setEditingReps(true)} style={{ width: 98, background: "transparent", border: "none", color: "#f0f0f0", fontFamily: "Outfit", fontSize: 38, fontWeight: 700, cursor: "pointer" }}>{reps}</button>}
            <button onClick={() => setReps((value) => value + 1)} style={stepperStyle}>＋</button>
          </div>
          <p style={{ textAlign: "center", color: "#666", fontSize: 11, marginTop: 6 }}>数字をタップして直接入力</p>
          {previousRecord && <p style={{ textAlign: "center", color: "#8b8b8b", fontSize: 12, marginTop: 14 }}><span style={{ color: "#c8ff00", fontFamily: "Outfit", fontWeight: 600 }}>前回</span>{previousRecord.weight ? ` ${previousRecord.weight}kg × ${previousRecord.reps}回` : ` ${previousRecord.reps}回`}</p>}

          <div style={{ height: 30 }} />
          <Label>共有先</Label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <ShareOption active={shareTo === "private"} onClick={() => setShareTo("private")} title="自分のみ" detail="非公開で記録" icon="lock" />
            <ShareOption active={shareTo === "team"} onClick={() => setShareTo("team")} title="チーム" detail="メンバーに共有" icon="team" />
          </div>
          {shareTo === "team" && (teams.length ? <select value={team} onChange={(event) => setTeam(Number(event.target.value))} style={{ ...fieldStyle, marginTop: 10, appearance: "none", color: "#f0f0f0", cursor: "pointer" }}>{teams.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select> : <p style={{ color: "#d7a66d", fontSize: 12, marginTop: 10 }}>共有できるチームがありません</p>)}
        </div>

        <footer style={{ position: "absolute", bottom: 0, width: "100%", padding: "14px 24px 28px", background: "#0d0d0d", borderTop: "1px solid #1e1e1e" }}>
          <button disabled={!canSave} onClick={save} style={{ ...saveButtonStyle, opacity: canSave ? 1 : 0.35, cursor: canSave ? "pointer" : "not-allowed" }}>記録を保存</button>
        </footer>
      </div>
    </main>
  )
}

function Label({ children }: { children: React.ReactNode }) { return <p style={{ fontFamily: "Outfit", color: "#aaa", fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{children}</p> }
function ShareOption({ active, onClick, title, detail, icon }: { active: boolean; onClick: () => void; title: string; detail: string; icon: "lock" | "team" }) { return <button onClick={onClick} style={{ background: active ? "#1b2110" : "#171717", border: `1px solid ${active ? "#c8ff00" : "#2a2a2a"}`, borderRadius: 14, padding: "15px 12px", color: "#f0f0f0", cursor: "pointer", textAlign: "left" }}><div style={{ color: active ? "#c8ff00" : "#777", marginBottom: 12 }}>{icon === "lock" ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M17 11a3 3 0 100-6M21 20c0-2.5-1.5-4.7-3.7-5.6" /></svg>}</div><p style={{ fontFamily: "Outfit", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{title}</p><p style={{ color: "#777", fontSize: 11 }}>{detail}</p></button> }

const pageStyle = { minHeight: "100vh", backgroundColor: "#000", display: "flex", justifyContent: "center" } as const
const contentStyle = { width: "100%", maxWidth: 430, minHeight: "100vh", position: "relative", display: "flex", flexDirection: "column", backgroundColor: "#0d0d0d" } as const
const fieldStyle = { width: "100%", minHeight: 56, backgroundColor: "#171717", border: "1px solid #2a2a2a", borderRadius: 12, padding: "0 16px", display: "flex", alignItems: "center", fontFamily: "Inter", fontSize: 15, textAlign: "left", cursor: "pointer" } as const
const iconButtonStyle = { width: 38, height: 38, display: "grid", placeItems: "center", color: "#ccc", backgroundColor: "#202020", border: "1px solid #2a2a2a", borderRadius: 10, cursor: "pointer" } as const
const stepperStyle = { width: 52, height: 52, borderRadius: "50%", border: "1px solid #333", backgroundColor: "#202020", color: "#c8ff00", fontFamily: "Outfit", fontSize: 25, cursor: "pointer" } as const
const saveButtonStyle = { width: "100%", height: 56, border: "none", borderRadius: 14, backgroundColor: "#c8ff00", color: "#0d0d0d", fontFamily: "Outfit", fontSize: 16, fontWeight: 700, cursor: "pointer" } as const
