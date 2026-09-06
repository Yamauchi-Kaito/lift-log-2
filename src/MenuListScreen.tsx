import type { TrainingMenu } from "./MenuEditorScreen"

export default function MenuListScreen({ menus, loading, error, onRetry, onBack, onCreate, onEdit, canStart, onStart }: { menus: TrainingMenu[]; loading: boolean; error: string | null; onRetry: () => void; onBack: () => void; onCreate: () => void; onEdit: (menu: TrainingMenu) => void; canStart: boolean; onStart: (menu: TrainingMenu) => void }) {
  return <main style={pageStyle}><div style={contentStyle}>
    <header style={headerStyle}><button onClick={onBack} style={backStyle}>‹</button><div><p style={eyebrowStyle}>WORKOUT MENU</p><h1 style={{ fontFamily: "Outfit", fontSize: 22, fontWeight: 700 }}>トレーニングメニュー</h1></div></header>
    <div style={{ padding: "22px 24px 36px", flex: 1, overflowY: "auto" }}>
      <p style={{ color: "#888", fontSize: 13, lineHeight: 1.5, marginBottom: 18 }}>よく行う種目と基本セット数を保存できます</p>
      {error && <div role="alert" style={errorStyle}><p>{error}</p><button onClick={onRetry} style={retryStyle}>再試行</button></div>}
      {loading ? <p style={statusStyle}>読み込み中...</p> : menus.map((menu) => { const totalSets = menu.exercises.reduce((sum, exercise) => sum + exercise.sets, 0); return <section key={menu.id} style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}><div><h2 style={{ fontFamily: "Outfit", fontSize: 18, fontWeight: 700, marginBottom: 7 }}>{menu.name}</h2><p style={{ color: "#777", fontSize: 12 }}>{menu.exercises.length}種目 · 合計 {totalSets}セット</p></div><button onClick={() => onEdit(menu)} style={editStyle}>編集</button></div>
        {canStart && <><div style={{ margin: "16px 0", borderTop: "1px solid #282828" }} />
        <button onClick={() => onStart(menu)} style={startStyle}><span>▶</span> このメニューで開始</button></>}
      </section> })}
      {!loading && menus.length === 0 && <p style={{ color: "#777", textAlign: "center", padding: "36px 0" }}>メニューがまだありません</p>}
      <button onClick={onCreate} disabled={loading} style={{ ...createStyle, opacity: loading ? .5 : 1 }}>＋ メニューを作成</button>
    </div>
  </div></main>
}

const pageStyle = { minHeight: "100vh", display: "flex", justifyContent: "center", background: "#000" } as const
const contentStyle = { width: "100%", maxWidth: 430, minHeight: "100vh", display: "flex", flexDirection: "column", background: "#0d0d0d" } as const
const headerStyle = { display: "flex", alignItems: "center", gap: 14, padding: "24px 20px 18px", borderBottom: "1px solid #1e1e1e" } as const
const eyebrowStyle = { color: "#666", fontFamily: "Inter", fontSize: 11, letterSpacing: "0.1em", marginBottom: 4 } as const
const backStyle = { width: 38, height: 38, border: "1px solid #2a2a2a", borderRadius: 10, background: "#202020", color: "#ddd", cursor: "pointer", fontSize: 22 } as const
const cardStyle = { padding: 18, marginBottom: 10, border: "1px solid #2a2a2a", borderRadius: 14, background: "#171717" } as const
const editStyle = { padding: "8px 11px", border: "1px solid #3a3a3a", borderRadius: 8, background: "transparent", color: "#c8ff00", fontFamily: "Inter", fontSize: 12, cursor: "pointer" } as const
const startStyle = { width: "100%", padding: "12px", border: "none", borderRadius: 10, background: "#c8ff00", color: "#0d0d0d", fontFamily: "Outfit", fontSize: 14, fontWeight: 700, cursor: "pointer" } as const
const createStyle = { width: "100%", padding: "15px", marginTop: 8, border: "1px dashed #4a4a4a", borderRadius: 12, background: "transparent", color: "#bbb", fontFamily: "Inter", fontSize: 13, cursor: "pointer" } as const
const statusStyle = { color: "#888", fontSize: 13, textAlign: "center", padding: "36px 0" } as const
const errorStyle = { padding: 12, marginBottom: 14, border: "1px solid #5a3030", borderRadius: 9, background: "#281818", color: "#f09a9a", fontSize: 12, lineHeight: 1.5 } as const
const retryStyle = { marginTop: 9, padding: "7px 10px", border: "1px solid #7a4242", borderRadius: 7, background: "transparent", color: "#f3b0b0", fontFamily: "Inter", fontSize: 12, cursor: "pointer" } as const
