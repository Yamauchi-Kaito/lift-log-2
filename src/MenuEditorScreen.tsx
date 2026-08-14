import { useState } from "react"

export type ExerciseId = string | number
export type RegisteredExercise = { id: ExerciseId; name: string; kind: "自重" | "器具" }
export type MenuExercise = { id: string | number; exerciseId: ExerciseId; name: string; kind?: RegisteredExercise["kind"]; sets: number }
export type TrainingMenu = { id: string; name: string; exercises: MenuExercise[] }

export default function MenuEditorScreen({ menu, registeredExercises, saving, error, onBack, onSave, onDelete }: { menu?: TrainingMenu; registeredExercises: RegisteredExercise[]; saving: boolean; error: string | null; onBack: () => void; onSave: (menu: TrainingMenu, newExercises: RegisteredExercise[], isNew: boolean) => Promise<boolean>; onDelete: (id: string) => Promise<boolean> }) {
  const [menuName, setMenuName] = useState(menu?.name ?? "")
  const [items, setItems] = useState<MenuExercise[]>(menu?.exercises ?? [])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [newExerciseOpen, setNewExerciseOpen] = useState(false)
  const [newExercise, setNewExercise] = useState("")
  const [newExerciseKind, setNewExerciseKind] = useState<RegisteredExercise["kind"]>("器具")
  const [createdExercises, setCreatedExercises] = useState<RegisteredExercise[]>([])
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [dragId, setDragId] = useState<string | number | null>(null)
  const availableExercises = [...registeredExercises, ...createdExercises]
  const addExercise = (exercise: RegisteredExercise) => { if (!items.some((item) => item.exerciseId === exercise.id)) setItems((current) => [...current, { id: Date.now(), exerciseId: exercise.id, name: exercise.name, kind: exercise.kind, sets: 3 }]); setPickerOpen(false) }
  const updateSets = (id: string | number, value: number) => setItems((current) => current.map((item) => item.id === id ? { ...item, sets: Math.max(1, value || 1) } : item))
  const move = (from: number, to: number) => setItems((current) => { const next = [...current]; const [item] = next.splice(from, 1); next.splice(to, 0, item); return next })
  const createExercise = () => { const name = newExercise.trim(); if (!name) return; const exercise = { id: Date.now(), name, kind: newExerciseKind } as RegisteredExercise; setCreatedExercises((current) => [...current, exercise]); addExercise(exercise); setNewExercise(""); setNewExerciseOpen(false) }
  const save = async () => { if (!menuName.trim() || !items.length || saving) return; await onSave({ id: menu?.id ?? "", name: menuName.trim(), exercises: items }, createdExercises, !menu) }
  return <main style={pageStyle}><div style={contentStyle}>
    <header style={headerStyle}><button onClick={onBack} style={backStyle}>‹</button><div><p style={eyebrowStyle}>WORKOUT MENU</p><h1 style={{ fontFamily: "Outfit", fontSize: 21, fontWeight: 700 }}>{menu ? "メニューを編集" : "メニューを作成"}</h1></div></header>
    <div style={{ flex: 1, overflowY: "auto", padding: "22px 24px 126px" }}>
      <p style={labelStyle}>メニュー名</p><input value={menuName} onChange={(event) => setMenuName(event.target.value)} placeholder="例：胸トレ" style={inputStyle} />
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 29, marginBottom: 10 }}><p style={labelStyle}>種目</p><span style={{ color: "#666", fontSize: 11 }}>右の ≡ をドラッグして並べ替え</span></div>
      {items.map((item, index) => <div key={item.id} onDragOver={(event) => event.preventDefault()} onDrop={() => { const from = items.findIndex((value) => value.id === dragId); if (from >= 0 && from !== index) move(from, index); setDragId(null) }} style={itemStyle}><span style={{ flex: 1, fontFamily: "Outfit", fontSize: 15, fontWeight: 600 }}>{item.name}</span><div style={{ display: "flex", alignItems: "center", gap: 5 }}><button onClick={() => updateSets(item.id, item.sets - 1)} style={stepStyle}>−</button><input aria-label={`${item.name}の基本セット数`} type="number" min="1" value={item.sets} onChange={(event) => updateSets(item.id, Number(event.target.value))} style={setsInputStyle} /><button onClick={() => updateSets(item.id, item.sets + 1)} style={stepStyle}>＋</button></div><button onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} aria-label={`${item.name}を削除`} style={deleteItemStyle}>×</button><span draggable onDragStart={() => setDragId(item.id)} onDragEnd={() => setDragId(null)} aria-label={`${item.name}を並べ替え`} style={dragStyle}>≡</span></div>)}
      <button onClick={() => setPickerOpen((value) => !value)} style={addStyle}>＋ 種目を追加</button>
      {pickerOpen && <section style={{ ...cardStyle, marginTop: 10 }}><p style={{ ...labelStyle, marginBottom: 10 }}>登録済みの種目</p>{availableExercises.filter((exercise) => !items.some((item) => item.exerciseId === exercise.id)).map((exercise) => <button key={exercise.id} onClick={() => addExercise(exercise)} style={pickerItemStyle}><span>{exercise.name}<small style={{ color: "#777", marginLeft: 8 }}>{exercise.kind}</small></span><span>＋</span></button>)}<button onClick={() => { setPickerOpen(false); setNewExerciseOpen(true) }} style={{ ...pickerItemStyle, color: "#c8ff00", borderBottom: "none" }}>新しい種目を作成<span>＋</span></button></section>}
      {newExerciseOpen && <section style={{ ...cardStyle, marginTop: 10 }}><p style={{ ...labelStyle, marginBottom: 10 }}>新しい種目</p><input autoFocus value={newExercise} onChange={(event) => setNewExercise(event.target.value)} placeholder="種目名を入力" style={inputStyle} /><div style={{ display: "flex", gap: 8, marginTop: 10 }}>{(["自重", "器具"] as const).map((kind) => <button key={kind} onClick={() => setNewExerciseKind(kind)} style={{ ...kindStyle, borderColor: newExerciseKind === kind ? "#c8ff00" : "#333", color: newExerciseKind === kind ? "#c8ff00" : "#999", background: newExerciseKind === kind ? "#1b2500" : "#202020" }}>{kind}</button>)}</div><button onClick={createExercise} style={{ ...saveStyle, width: "100%", marginTop: 10 }}>種目を作成して追加</button></section>}
      {error && <p role="alert" style={errorStyle}>{error}</p>}
      {menu && <button onClick={() => setConfirmDelete(true)} disabled={saving} style={{ ...deleteMenuStyle, opacity: saving ? .5 : 1 }}>このメニューを削除</button>}
    </div>
    <footer style={footerStyle}><button onClick={onBack} disabled={saving} style={{ ...saveStyle, flex: 1, background: "#202020", border: "1px solid #333", color: "#ddd", opacity: saving ? .5 : 1 }}>キャンセル</button><button disabled={!menuName.trim() || !items.length || saving} onClick={() => void save()} style={{ ...saveStyle, flex: 1.15, opacity: menuName.trim() && items.length && !saving ? 1 : 0.35 }}>{saving ? "保存中..." : "保存"}</button></footer>
    {confirmDelete && <div style={overlayStyle}><section style={dialogStyle}><p style={{ fontFamily: "Outfit", fontSize: 18, fontWeight: 700, marginBottom: 9 }}>メニューを削除しますか？</p><p style={{ color: "#888", fontSize: 13, lineHeight: 1.5, marginBottom: 22 }}>「{menuName}」を削除します。過去のトレーニング履歴は削除されません。</p><div style={{ display: "flex", gap: 9 }}><button onClick={() => setConfirmDelete(false)} disabled={saving} style={{ ...dialogButtonStyle, background: "#202020", color: "#ddd", opacity: saving ? .5 : 1 }}>キャンセル</button><button onClick={() => void onDelete(menu!.id)} disabled={saving} style={{ ...dialogButtonStyle, background: "#d94b4b", color: "#fff", opacity: saving ? .5 : 1 }}>{saving ? "削除中..." : "削除する"}</button></div></section></div>}
  </div></main>
}
const pageStyle = { minHeight: "100vh", display: "flex", justifyContent: "center", background: "#000" } as const
const contentStyle = { width: "100%", maxWidth: 430, minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", background: "#0d0d0d" } as const
const headerStyle = { display: "flex", alignItems: "center", gap: 14, padding: "24px 20px 18px", borderBottom: "1px solid #1e1e1e" } as const
const eyebrowStyle = { color: "#666", fontFamily: "Inter", fontSize: 11, letterSpacing: "0.1em", marginBottom: 4 } as const
const labelStyle = { color: "#aaa", fontFamily: "Outfit", fontSize: 13, fontWeight: 600 } as const
const inputStyle = { width: "100%", height: 52, padding: "0 14px", border: "1px solid #2a2a2a", borderRadius: 11, background: "#171717", color: "#f0f0f0", outline: "none", fontFamily: "Inter", fontSize: 14 } as const
const backStyle = { width: 38, height: 38, border: "1px solid #2a2a2a", borderRadius: 10, background: "#202020", color: "#ddd", cursor: "pointer", fontSize: 22 } as const
const itemStyle = { display: "flex", alignItems: "center", gap: 8, padding: "13px 10px 13px 12px", marginBottom: 8, background: "#171717", border: "1px solid #2a2a2a", borderRadius: 12 } as const
const stepStyle = { width: 27, height: 28, border: "1px solid #333", borderRadius: 7, background: "#202020", color: "#bbb", cursor: "pointer", fontSize: 16 } as const
const setsInputStyle = { width: 34, height: 28, padding: 0, border: "none", background: "transparent", color: "#f0f0f0", textAlign: "center", fontFamily: "Outfit", fontSize: 14, outline: "none" } as const
const deleteItemStyle = { border: "none", background: "none", color: "#8a5555", cursor: "pointer", fontSize: 18 } as const
const dragStyle = { color: "#777", cursor: "grab", fontSize: 20, lineHeight: 1, padding: "5px 1px", touchAction: "none" } as const
const addStyle = { width: "100%", padding: "15px", background: "transparent", border: "1px dashed #3a3a3a", borderRadius: 12, color: "#aaa", fontFamily: "Inter", fontSize: 13, cursor: "pointer" } as const
const cardStyle = { padding: "14px", border: "1px solid #2a2a2a", borderRadius: 12, background: "#171717" } as const
const pickerItemStyle = { width: "100%", display: "flex", justifyContent: "space-between", padding: "12px 2px", border: "none", borderBottom: "1px solid #282828", background: "transparent", color: "#ccc", textAlign: "left", fontFamily: "Inter", fontSize: 13, cursor: "pointer" } as const
const kindStyle = { flex: 1, height: 42, border: "1px solid", borderRadius: 9, fontFamily: "Inter", fontSize: 13, cursor: "pointer" } as const
const deleteMenuStyle = { width: "100%", marginTop: 28, padding: "14px", border: "1px solid #4a2929", borderRadius: 12, background: "transparent", color: "#df7777", fontFamily: "Inter", fontSize: 13, cursor: "pointer" } as const
const footerStyle = { position: "absolute", bottom: 0, width: "100%", display: "flex", gap: 10, padding: "14px 24px 28px", borderTop: "1px solid #1e1e1e", background: "#0d0d0d" } as const
const saveStyle = { height: 52, border: "none", borderRadius: 12, background: "#c8ff00", color: "#0d0d0d", fontFamily: "Outfit", fontSize: 14, fontWeight: 700, cursor: "pointer" } as const
const overlayStyle = { position: "fixed", inset: 0, zIndex: 30, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(0,0,0,0.7)" } as const
const dialogStyle = { width: "100%", maxWidth: 360, padding: 22, border: "1px solid #333", borderRadius: 16, background: "#171717" } as const
const dialogButtonStyle = { flex: 1, height: 46, border: "none", borderRadius: 10, fontFamily: "Inter", fontSize: 13, fontWeight: 600, cursor: "pointer" } as const
const errorStyle = { padding: 11, marginTop: 18, border: "1px solid #5a3030", borderRadius: 9, background: "#281818", color: "#f09a9a", fontSize: 12, lineHeight: 1.5 } as const
