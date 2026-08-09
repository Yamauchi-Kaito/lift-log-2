type SetData = { id: number; weight: number; reps: number; completed: boolean }
type Exercise = { id: number; name: string; prevSets: { weight: number; reps: number }[]; sets: SetData[] }

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return h > 0 ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export default function TrainingEndScreen({ exercises, elapsed, onReturn, onSave }: { exercises: Exercise[]; elapsed: number; onReturn: () => void; onSave: () => void }) {
  const completedExercises = exercises.filter((exercise) => exercise.sets.some((set) => set.completed))
  const completedSets = completedExercises.reduce((total, exercise) => total + exercise.sets.filter((set) => set.completed).length, 0)
  const addedExercises = exercises.filter((exercise) => exercise.id > 3)
  const [addToMenu, setAddToMenu] = useState<Record<number, boolean>>(() => Object.fromEntries(addedExercises.map((exercise) => [exercise.id, true])))

  return <main style={pageStyle}><div style={contentStyle}>
    <header style={{ padding: "28px 24px 20px", borderBottom: "1px solid #1e1e1e" }}>
      <p style={{ color: "#c8ff00", fontFamily: "Outfit", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", marginBottom: 6 }}>WORKOUT COMPLETE</p>
      <h1 style={{ fontFamily: "Outfit", fontSize: 24, fontWeight: 700 }}>トレーニングを終了</h1>
    </header>
    <div style={{ padding: "24px", overflowY: "auto", paddingBottom: 136 }}>
      <section style={cardStyle}>
        <p style={{ fontFamily: "Outfit", fontSize: 19, fontWeight: 700, marginBottom: 20 }}>胸トレ</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          <Metric label="トレーニング時間" value={formatTime(elapsed)} />
          <Metric label="実施種目数" value={`${completedExercises.length}種目`} />
          <Metric label="完了セット数" value={`${completedSets}セット`} />
        </div>
      </section>
      <p style={sectionLabel}>実績</p>
      {completedExercises.length === 0 ? <div style={{ ...cardStyle, color: "#777", fontSize: 14 }}>完了したセットはありません</div> : <section style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>{completedExercises.map((exercise, index) => <div key={exercise.id} style={{ padding: "16px 18px", borderBottom: index < completedExercises.length - 1 ? "1px solid #242424" : "none" }}><p style={{ fontFamily: "Outfit", fontSize: 16, fontWeight: 600, marginBottom: 9 }}>{exercise.name}</p><div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{exercise.sets.filter((set) => set.completed).map((set, setIndex) => <span key={set.id} style={{ backgroundColor: "#202020", border: "1px solid #303030", borderRadius: 7, padding: "5px 8px", color: "#ccc", fontFamily: "Outfit", fontSize: 12 }}>SET {setIndex + 1}　{set.weight > 0 ? `${set.weight}kg × ` : ""}{set.reps}回</span>)}</div></div>)}</section>}
      {addedExercises.length > 0 && <><p style={sectionLabel}>メニューへ追加</p><section style={cardStyle}>{addedExercises.map((exercise, index) => <div key={exercise.id} style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: index < addedExercises.length - 1 ? 16 : 0, marginBottom: index < addedExercises.length - 1 ? 16 : 0, borderBottom: index < addedExercises.length - 1 ? "1px solid #242424" : "none" }}><div style={{ flex: 1 }}><p style={{ fontFamily: "Outfit", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{exercise.name}</p><p style={{ color: "#777", fontSize: 12 }}>この種目を「胸トレ」に追加しますか？</p></div><div style={{ display: "flex", border: "1px solid #333", borderRadius: 8, overflow: "hidden" }}><button onClick={() => setAddToMenu((value) => ({ ...value, [exercise.id]: true }))} style={choiceStyle(addToMenu[exercise.id])}>追加する</button><button onClick={() => setAddToMenu((value) => ({ ...value, [exercise.id]: false }))} style={choiceStyle(!addToMenu[exercise.id])}>しない</button></div></div>)}</section></>}
    </div>
    <footer style={{ position: "absolute", bottom: 0, width: "100%", display: "flex", gap: 10, padding: "14px 24px 28px", backgroundColor: "#0d0d0d", borderTop: "1px solid #1e1e1e" }}><button onClick={onReturn} style={{ ...buttonStyle, flex: 1, backgroundColor: "#202020", border: "1px solid #333", color: "#ddd" }}>トレーニングに戻る</button><button onClick={onSave} style={{ ...buttonStyle, flex: 1.15 }}>保存して終了</button></footer>
  </div></main>
}

import { useState } from "react"
function Metric({ label, value }: { label: string; value: string }) { return <div><p style={{ color: "#777", fontSize: 10, marginBottom: 5 }}>{label}</p><p style={{ fontFamily: "Outfit", fontSize: 15, fontWeight: 700, whiteSpace: "nowrap" }}>{value}</p></div> }
const pageStyle = { minHeight: "100vh", display: "flex", justifyContent: "center", backgroundColor: "#000" } as const
const contentStyle = { position: "relative", width: "100%", maxWidth: 430, minHeight: "100vh", backgroundColor: "#0d0d0d" } as const
const cardStyle = { backgroundColor: "#171717", border: "1px solid #2a2a2a", borderRadius: 16, padding: "18px" } as const
const sectionLabel = { color: "#777", fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", margin: "28px 0 12px" } as const
const buttonStyle = { height: 52, border: "none", borderRadius: 12, backgroundColor: "#c8ff00", color: "#0d0d0d", fontFamily: "Outfit", fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" } as const
const choiceStyle = (selected: boolean) => ({ padding: "8px 9px", border: "none", backgroundColor: selected ? "#c8ff00" : "#202020", color: selected ? "#0d0d0d" : "#777", fontFamily: "Inter", fontSize: 11, fontWeight: selected ? 600 : 400, cursor: "pointer" })
