import { useState } from "react"

export default function TeamCreateScreen({ onBack, onCreate }: { onBack: () => void; onCreate: (name: string, role: string) => void }) {
  const [name, setName] = useState("")
  const [role, setRole] = useState("")
  return <main style={pageStyle}><div style={contentStyle}><header style={headerStyle}><button onClick={onBack} style={backStyle}>‹</button><div><p style={eyebrowStyle}>TEAM WORKSPACE</p><h1 style={titleStyle}>チームを作成</h1></div></header><div style={{ padding: "24px" }}><p style={labelStyle}>チーム名</p><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="例：朝活チーム" style={inputStyle} /><p style={{ ...labelStyle, marginTop: 24 }}>自分の役職 <span style={{ color: "#666", fontWeight: 400 }}>任意</span></p><input value={role} onChange={(event) => setRole(event.target.value)} placeholder="例：コーチ" style={inputStyle} /><p style={{ color: "#777", fontSize: 12, lineHeight: 1.6, marginTop: 12 }}>作成者はオーナーになります。</p></div><footer style={footerStyle}><button disabled={!name.trim()} onClick={() => onCreate(name.trim(), role.trim())} style={{ ...createStyle, opacity: name.trim() ? 1 : .35 }}>チームを作成</button></footer></div></main>
}
const pageStyle = { minHeight: "100vh", display: "flex", justifyContent: "center", background: "#000" } as const
const contentStyle = { width: "100%", maxWidth: 430, minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", background: "#0d0d0d" } as const
const headerStyle = { display: "flex", alignItems: "center", gap: 14, padding: "24px 20px 18px", borderBottom: "1px solid #1e1e1e" } as const
const backStyle = { width: 38, height: 38, border: "1px solid #2a2a2a", borderRadius: 10, background: "#202020", color: "#ddd", cursor: "pointer", fontSize: 22 } as const
const eyebrowStyle = { color: "#666", fontFamily: "Inter", fontSize: 11, letterSpacing: "0.1em", marginBottom: 4 } as const
const titleStyle = { fontFamily: "Outfit", fontSize: 21, fontWeight: 700 } as const
const labelStyle = { color: "#aaa", fontFamily: "Outfit", fontSize: 13, fontWeight: 600, marginBottom: 9 } as const
const inputStyle = { width: "100%", height: 52, padding: "0 14px", border: "1px solid #2a2a2a", borderRadius: 11, background: "#171717", color: "#f0f0f0", outline: "none", fontFamily: "Inter", fontSize: 14 } as const
const footerStyle = { position: "absolute", bottom: 0, width: "100%", padding: "14px 24px 28px", borderTop: "1px solid #1e1e1e", background: "#0d0d0d" } as const
const createStyle = { width: "100%", height: 52, border: "none", borderRadius: 12, background: "#c8ff00", color: "#0d0d0d", fontFamily: "Outfit", fontSize: 14, fontWeight: 700, cursor: "pointer" } as const
