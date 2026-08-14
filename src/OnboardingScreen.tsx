import { useState } from "react"

export default function OnboardingScreen({ onComplete }: { onComplete: (teamUse: boolean, tendency: string) => void }) {
  const [step, setStep] = useState(1)
  const [teamUse, setTeamUse] = useState(false)
  const [tendency, setTendency] = useState("両方")
  return <main style={pageStyle}><div style={contentStyle}><div style={{ padding: "52px 24px 32px", flex: 1 }}><p style={eyebrowStyle}>LIFT LOG</p>{step === 1 && <><h1 style={titleStyle}>どのように使いますか？</h1><p style={descriptionStyle}>あとから変更できます</p><div style={{ display: "grid", gap: 10, marginTop: 28 }}><Choice title="一人で使う" detail="自分のトレーニングを記録" selected={!teamUse} onClick={() => setTeamUse(false)} /><Choice title="チームでも使う" detail="仲間と記録を共有" selected={teamUse} onClick={() => setTeamUse(true)} /></div></>}{step === 2 && <><h1 style={titleStyle}>トレーニング傾向</h1><p style={descriptionStyle}>種目の登録はいつでも自由です</p><div style={{ display: "grid", gap: 10, marginTop: 28 }}>{["自重中心", "器具中心", "両方"].map((item) => <Choice key={item} title={item} selected={tendency === item} onClick={() => setTendency(item)} />)}</div></>}{step === 3 && <><h1 style={titleStyle}>チームも使いますか？</h1><p style={descriptionStyle}>まず「マイトレーニング」を作成しました</p><div style={{ display: "grid", gap: 10, marginTop: 28 }}><Choice title="チームを作成" detail="チーム名を設定します" selected onClick={() => onComplete(true, tendency)} /><Choice title="あとで設定" detail="設定からいつでも作成できます" onClick={() => onComplete(false, tendency)} /></div></>}</div><footer style={footerStyle}>{step < 3 && <button onClick={() => step === 1 ? setStep(2) : teamUse ? setStep(3) : onComplete(false, tendency)} style={nextStyle}>次へ</button>}</footer></div></main>
}
function Choice({ title, detail, selected, onClick }: { title: string; detail?: string; selected?: boolean; onClick: () => void }) { return <button onClick={onClick} style={{ padding: "17px 16px", border: `1px solid ${selected ? "#c8ff00" : "#2a2a2a"}`, borderRadius: 13, background: selected ? "#1b2500" : "#171717", color: selected ? "#c8ff00" : "#f0f0f0", textAlign: "left", cursor: "pointer" }}><p style={{ fontFamily: "Outfit", fontSize: 16, fontWeight: 700 }}>{title}</p>{detail && <p style={{ color: selected ? "#a4bd57" : "#777", fontSize: 12, marginTop: 5 }}>{detail}</p>}</button> }
const pageStyle = { minHeight: "100vh", display: "flex", justifyContent: "center", background: "#000" } as const
const contentStyle = { width: "100%", maxWidth: 430, minHeight: "100vh", display: "flex", flexDirection: "column", background: "#0d0d0d" } as const
const eyebrowStyle = { color: "#666", fontFamily: "Inter", fontSize: 11, letterSpacing: "0.1em", marginBottom: 10 } as const
const titleStyle = { fontFamily: "Outfit", fontSize: 26, fontWeight: 700 } as const
const descriptionStyle = { color: "#888", fontSize: 13, marginTop: 8 } as const
const footerStyle = { padding: "14px 24px 28px", borderTop: "1px solid #1e1e1e" } as const
const nextStyle = { width: "100%", height: 54, border: "none", borderRadius: 13, background: "#c8ff00", color: "#0d0d0d", fontFamily: "Outfit", fontSize: 16, fontWeight: 700, cursor: "pointer" } as const
