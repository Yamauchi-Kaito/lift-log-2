import { useState } from "react"
import type { RegisteredExercise, TrainingMenu } from "./MenuEditorScreen"

export default function ExerciseManagerScreen({ exercises, menus, onBack, onSave, onDelete }: { exercises: RegisteredExercise[]; menus: TrainingMenu[]; onBack: () => void; onSave: (exercise: RegisteredExercise) => void; onDelete: (id: number) => void }) {
  const [editing, setEditing] = useState<RegisteredExercise | undefined>()
  const [deleting, setDeleting] = useState<RegisteredExercise | undefined>()
  const usedIn = deleting ? menus.filter((menu) => menu.exercises.some((item) => item.exerciseId === deleting.id)) : []
  return <main style={pageStyle}><div style={contentStyle}>
    <header style={headerStyle}><button onClick={onBack} style={backStyle}>‹</button><div style={{ flex: 1 }}><p style={eyebrowStyle}>EXERCISES</p><h1 style={{ fontFamily: "Outfit", fontSize: 22, fontWeight: 700 }}>種目を管理</h1></div><button onClick={() => setEditing({ id: Date.now(), name: "", kind: "器具" })} style={addTopStyle}>＋ 追加</button></header>
    <div style={{ padding: "20px 24px 36px", flex: 1, overflowY: "auto" }}>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>登録済みの種目</p>
      {exercises.map((exercise) => <section key={exercise.id} style={itemStyle}><div style={{ flex: 1 }}><h2 style={{ fontFamily: "Outfit", fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{exercise.name}</h2><span style={typeStyle}>{exercise.kind}</span><p style={{ color: "#777", fontSize: 11, marginTop: 7 }}>{exercise.kind === "器具" ? "重量入力を使用" : "重量入力なし"}</p></div><div style={{ display: "flex", flexDirection: "column", gap: 7 }}><button onClick={() => setEditing(exercise)} style={editStyle}>編集</button><button onClick={() => setDeleting(exercise)} style={deleteStyle}>削除</button></div></section>)}
    </div>
    {editing && <ExerciseEditor exercise={editing} isNew={!exercises.some((exercise) => exercise.id === editing.id)} onBack={() => setEditing(undefined)} onSave={(exercise) => { onSave(exercise); setEditing(undefined) }} />}
    {deleting && <div style={overlayStyle}><section style={dialogStyle}><p style={{ fontFamily: "Outfit", fontSize: 18, fontWeight: 700, marginBottom: 9 }}>種目を削除しますか？</p><p style={{ color: "#888", fontSize: 13, lineHeight: 1.55, marginBottom: usedIn.length ? 10 : 22 }}>「{deleting.name}」を登録済み種目から削除します。過去のトレーニング履歴は削除されません。</p>{usedIn.length > 0 && <p style={warningStyle}>現在「{usedIn.map((menu) => menu.name).join("、")}」で使用中です。メニュー内の既存記録は残ります。</p>}<div style={{ display: "flex", gap: 9 }}><button onClick={() => setDeleting(undefined)} style={{ ...dialogButtonStyle, background: "#202020", color: "#ddd" }}>キャンセル</button><button onClick={() => { onDelete(deleting.id); setDeleting(undefined) }} style={{ ...dialogButtonStyle, background: "#d94b4b", color: "#fff" }}>削除する</button></div></section></div>}
  </div></main>
}

function ExerciseEditor({ exercise, isNew, onBack, onSave }: { exercise: RegisteredExercise; isNew: boolean; onBack: () => void; onSave: (exercise: RegisteredExercise) => void }) {
  const [name, setName] = useState(exercise.name)
  const [kind, setKind] = useState(exercise.kind)
  return <main style={{ ...pageStyle, position: "fixed", inset: 0, zIndex: 20 }}><div style={contentStyle}><header style={headerStyle}><button onClick={onBack} style={backStyle}>‹</button><div><p style={eyebrowStyle}>EXERCISES</p><h1 style={{ fontFamily: "Outfit", fontSize: 21, fontWeight: 700 }}>{isNew ? "種目を追加" : "種目を編集"}</h1></div></header><div style={{ padding: "24px", flex: 1 }}><p style={labelStyle}>種目名</p><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="例：ダンベルカール" style={inputStyle} /><p style={{ ...labelStyle, marginTop: 28 }}>種目タイプ</p><div style={{ display: "flex", gap: 9 }}>{(["自重", "器具"] as const).map((value) => <button key={value} onClick={() => setKind(value)} style={{ ...typeButtonStyle, borderColor: kind === value ? "#c8ff00" : "#333", background: kind === value ? "#1b2500" : "#202020", color: kind === value ? "#c8ff00" : "#aaa" }}>{value}</button>)}</div><p style={{ color: "#777", fontSize: 12, lineHeight: 1.5, marginTop: 12 }}>{kind === "器具" ? "この種目では重量入力を使用します。" : "この種目では重量入力を基本的に使用しません。"}</p></div><footer style={footerStyle}><button onClick={onBack} style={{ ...saveStyle, flex: 1, background: "#202020", border: "1px solid #333", color: "#ddd" }}>キャンセル</button><button disabled={!name.trim()} onClick={() => onSave({ ...exercise, name: name.trim(), kind })} style={{ ...saveStyle, flex: 1, opacity: name.trim() ? 1 : .35 }}>保存</button></footer></div></main>
}

const pageStyle = { minHeight: "100vh", display: "flex", justifyContent: "center", background: "#000" } as const
const contentStyle = { width: "100%", maxWidth: 430, minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", background: "#0d0d0d" } as const
const headerStyle = { display: "flex", alignItems: "center", gap: 14, padding: "24px 20px 18px", borderBottom: "1px solid #1e1e1e" } as const
const eyebrowStyle = { color: "#666", fontFamily: "Inter", fontSize: 11, letterSpacing: "0.1em", marginBottom: 4 } as const
const backStyle = { width: 38, height: 38, border: "1px solid #2a2a2a", borderRadius: 10, background: "#202020", color: "#ddd", cursor: "pointer", fontSize: 22 } as const
const addTopStyle = { padding: "9px 11px", border: "1px solid #3a3a3a", borderRadius: 8, background: "transparent", color: "#c8ff00", fontFamily: "Inter", fontSize: 12, cursor: "pointer" } as const
const itemStyle = { display: "flex", alignItems: "center", gap: 14, padding: "15px 14px", marginBottom: 8, border: "1px solid #2a2a2a", borderRadius: 13, background: "#171717" } as const
const typeStyle = { display: "inline-block", padding: "3px 7px", borderRadius: 5, background: "#202020", color: "#aaa", fontSize: 11 } as const
const editStyle = { padding: "7px 10px", border: "1px solid #3a3a3a", borderRadius: 7, background: "transparent", color: "#c8ff00", fontFamily: "Inter", fontSize: 11, cursor: "pointer" } as const
const deleteStyle = { padding: "7px 10px", border: "none", background: "transparent", color: "#d77", fontFamily: "Inter", fontSize: 11, cursor: "pointer" } as const
const labelStyle = { color: "#aaa", fontFamily: "Outfit", fontSize: 13, fontWeight: 600, marginBottom: 9 } as const
const inputStyle = { width: "100%", height: 52, padding: "0 14px", border: "1px solid #2a2a2a", borderRadius: 11, background: "#171717", color: "#f0f0f0", outline: "none", fontFamily: "Inter", fontSize: 14 } as const
const typeButtonStyle = { flex: 1, height: 48, border: "1px solid", borderRadius: 10, fontFamily: "Outfit", fontSize: 14, fontWeight: 600, cursor: "pointer" } as const
const footerStyle = { position: "absolute", bottom: 0, width: "100%", display: "flex", gap: 10, padding: "14px 24px 28px", borderTop: "1px solid #1e1e1e", background: "#0d0d0d" } as const
const saveStyle = { height: 52, border: "none", borderRadius: 12, background: "#c8ff00", color: "#0d0d0d", fontFamily: "Outfit", fontSize: 14, fontWeight: 700, cursor: "pointer" } as const
const overlayStyle = { position: "fixed", inset: 0, zIndex: 30, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(0,0,0,0.7)" } as const
const dialogStyle = { width: "100%", maxWidth: 360, padding: 22, border: "1px solid #333", borderRadius: 16, background: "#171717" } as const
const warningStyle = { padding: 11, marginBottom: 18, border: "1px solid #564a22", borderRadius: 9, background: "#272313", color: "#d5c778", fontSize: 12, lineHeight: 1.55 } as const
const dialogButtonStyle = { flex: 1, height: 46, border: "none", borderRadius: 10, fontFamily: "Inter", fontSize: 13, fontWeight: 600, cursor: "pointer" } as const
