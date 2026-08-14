import type { TeamMember, TeamRole, SharedRecord } from "./TeamMemberScreen"

export default function TeamManageScreen({ teamName, members, records, currentRole, onBack, onRoleChange, onRemoveRecord }: { teamName: string; members: TeamMember[]; records: SharedRecord[]; currentRole: TeamRole; onBack: () => void; onRoleChange: (id: number, role: TeamRole) => void; onRemoveRecord: (id: number) => void }) {
  const canManage = currentRole === "Owner" || currentRole === "Admin"
  const owner = currentRole === "Owner"
  return <main style={page}><div style={content}><header style={header}><button onClick={onBack} style={back}>‹</button><div><p style={eyebrow}>TEAM SETTINGS</p><h1 style={title}>{teamName}</h1></div></header><div style={body}>
    <p style={label}>メンバー管理</p><section style={section}>{members.map((member, index) => <div key={member.id} style={{ ...row, borderBottom: index < members.length - 1 ? "1px solid #282828" : "none" }}><div style={{ flex: 1 }}><p style={name}>{member.name}<small style={job}>{member.role ?? "役職なし"}</small></p><p style={sub}>システム権限</p></div>{owner && member.systemRole !== "Owner" ? <select value={member.systemRole} onChange={(event) => onRoleChange(member.id, event.target.value as TeamRole)} style={select}><option>Admin</option><option>Member</option></select> : <span style={{ ...badge, color: member.systemRole === "Owner" ? "#c8ff00" : "#bbb" }}>{member.systemRole}</span>}</div>)}</section>
    <p style={{ ...label, marginTop: 25 }}>共有トレーニング記録</p><section style={section}>{records.map((record, index) => <div key={record.id} style={{ ...row, borderBottom: index < records.length - 1 ? "1px solid #282828" : "none" }}><div style={{ flex: 1 }}><p style={name}>{record.member}<small style={job}>{record.when}</small></p><p style={sub}>{record.exercise} · {record.weight ? `${record.weight}kg × ` : ""}{record.reps}回</p></div>{canManage && <button onClick={() => onRemoveRecord(record.id)} style={remove}>共有解除</button>}</div>)}{!records.length && <p style={{ padding: 16, color: "#777", fontSize: 13 }}>共有記録はありません</p>}</section>
    <p style={note}>Owner: 権限変更・チーム設定。Admin: メンバー・共有記録管理。Member: 自分の記録作成と共有。</p>
  </div></div></main>
}
const page = { minHeight: "100vh", display: "flex", justifyContent: "center", background: "#000" } as const
const content = { width: "100%", maxWidth: 430, minHeight: "100vh", background: "#0d0d0d" } as const
const header = { display: "flex", alignItems: "center", gap: 14, padding: "24px 20px 18px", borderBottom: "1px solid #1e1e1e" } as const
const back = { width: 38, height: 38, border: "1px solid #2a2a2a", borderRadius: 10, background: "#202020", color: "#ddd", fontSize: 22, cursor: "pointer" } as const
const eyebrow = { color: "#666", fontFamily: "Inter", fontSize: 11, letterSpacing: ".1em", marginBottom: 4 } as const
const title = { fontFamily: "Outfit", fontSize: 21, fontWeight: 700 } as const
const body = { padding: "22px 24px 40px" } as const
const label = { color: "#777", fontSize: 11, fontWeight: 500, letterSpacing: ".1em", marginBottom: 10 } as const
const section = { overflow: "hidden", border: "1px solid #2a2a2a", borderRadius: 14, background: "#171717" } as const
const row = { display: "flex", alignItems: "center", gap: 10, padding: "14px 16px" } as const
const name = { fontFamily: "Outfit", fontSize: 15, fontWeight: 700 } as const
const job = { marginLeft: 7, color: "#888", fontFamily: "Inter", fontSize: 10, fontWeight: 400 } as const
const sub = { color: "#777", fontSize: 12, marginTop: 4 } as const
const select = { padding: "8px", border: "1px solid #4c5e00", borderRadius: 8, background: "#1b2500", color: "#c8ff00", fontFamily: "Inter", fontSize: 11 } as const
const badge = { padding: "5px 7px", border: "1px solid #333", borderRadius: 6, background: "#202020", fontFamily: "Inter", fontSize: 10 } as const
const remove = { border: "none", background: "transparent", color: "#e17b7b", fontFamily: "Inter", fontSize: 11, cursor: "pointer" } as const
const note = { color: "#666", fontSize: 11, lineHeight: 1.6, marginTop: 14 } as const
