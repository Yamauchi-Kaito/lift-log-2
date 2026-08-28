import { useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "./lib/supabase"

export type IncomingInvitation = { id: string; workspaceName: string; expiresAt: string; acceptedAt: string | null; revokedAt: string | null }

export default function SettingsScreen({ onHome, onQuick, onHistory, onBodyWeight, onMenuEditor, onExerciseManager, onWorkspaceManager, restEnabled, onRestEnabled, restSeconds, onRestSeconds, incomingInvitations, acceptingInvitationId, invitationError, onAcceptInvitation, displayName, displayNameSaving, onSaveDisplayName, user, onSignOut }: { onHome: () => void; onQuick: () => void; onHistory: () => void; onBodyWeight: () => void; onMenuEditor: () => void; onExerciseManager: () => void; onWorkspaceManager: () => void; restEnabled: boolean; onRestEnabled: (value: boolean) => void; restSeconds: number; onRestSeconds: (value: number) => void; incomingInvitations: IncomingInvitation[]; acceptingInvitationId: string | null; invitationError: string | null; onAcceptInvitation: (id: string) => Promise<boolean>; displayName: string; displayNameSaving: boolean; onSaveDisplayName: (value: string) => Promise<string | null>; user: User; onSignOut: () => Promise<void> }) {
  const [displayNameDraft, setDisplayNameDraft] = useState(displayName)
  const [displayNameError, setDisplayNameError] = useState<string | null>(null)
  const [passwordDraft, setPasswordDraft] = useState("")
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const saveDisplayName = async () => { const error = await onSaveDisplayName(displayNameDraft); setDisplayNameError(error) }

  const savePassword = async () => {
    setPasswordMessage(null)
    setPasswordError(null)
    if (passwordDraft.length < 6) {
      setPasswordError("パスワードは6文字以上にしてください。")
      return
    }

    setPasswordSaving(true)
    const { error } = await supabase.auth.updateUser({ password: passwordDraft })
    setPasswordSaving(false)

    if (error) {
      setPasswordError(error.message)
      return
    }

    setPasswordDraft("")
    setPasswordMessage("パスワードを設定しました。ホーム画面のアプリから同じメールアドレスでログインできます。")
  }

  return <main style={pageStyle}><div style={contentStyle}>
    <div style={{ flex: 1, overflowY: "auto", padding: "48px 24px 108px" }}>
      <p style={eyebrowStyle}>SETTINGS</p><h1 style={{ fontFamily: "Outfit", fontSize: 25, fontWeight: 700, marginBottom: 28 }}>設定</h1>

      <Section title="プロフィール"><div style={profileStyle}><div style={avatarStyle}>{displayName.slice(0, 1).toUpperCase() || "U"}</div><div style={{ flex: 1 }}><p style={{ fontFamily: "Outfit", fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{displayName}</p><p style={{ color: "#777", fontSize: 11, wordBreak: "break-all" }}>{user.email ?? "メール未設定"}</p></div><button onClick={() => void onSignOut()} style={signOutStyle}>ログアウト</button></div><div style={displayNameEditStyle}><label style={displayNameLabelStyle}>表示名<input value={displayNameDraft} disabled={displayNameSaving} maxLength={40} onChange={(event) => { setDisplayNameDraft(event.target.value); setDisplayNameError(null) }} style={displayNameInputStyle} /></label><button disabled={displayNameSaving || !displayNameDraft.trim()} onClick={() => void saveDisplayName()} style={{ ...displayNameSaveStyle, opacity: displayNameSaving || !displayNameDraft.trim() ? .45 : 1 }}>{displayNameSaving ? "保存中..." : "保存"}</button></div>{displayNameError && <p role="alert" style={displayNameErrorStyle}>{displayNameError}</p>}</Section>

      <Section title="ログイン">
        <div style={{ padding: "16px" }}>
          <p style={rowTitleStyle}>ログインパスワード</p>
          <p style={{ ...detailStyle, lineHeight: 1.6, marginBottom: 12 }}>
            Magic Linkで作成した既存アカウントは、ここで一度パスワードを設定するとホーム画面のWebアプリから直接ログインできます。
          </p>
          <input
            type="password"
            autoComplete="new-password"
            minLength={6}
            value={passwordDraft}
            disabled={passwordSaving}
            onChange={(event) => {
              setPasswordDraft(event.target.value)
              setPasswordMessage(null)
              setPasswordError(null)
            }}
            placeholder="6文字以上"
            style={displayNameInputStyle}
          />
          <button
            disabled={passwordSaving || passwordDraft.length < 6}
            onClick={() => void savePassword()}
            style={{
              ...displayNameSaveStyle,
              width: "100%",
              marginTop: 10,
              opacity: passwordSaving || passwordDraft.length < 6 ? .45 : 1,
            }}
          >
            {passwordSaving ? "設定中..." : "パスワードを設定"}
          </button>
          {passwordMessage && <p role="status" style={{ marginTop: 10, color: "#c8ff00", fontSize: 12, lineHeight: 1.5 }}>{passwordMessage}</p>}
          {passwordError && <p role="alert" style={{ marginTop: 10, color: "#f09a9a", fontSize: 12, lineHeight: 1.5 }}>{passwordError}</p>}
        </div>
      </Section>

      <Section title="トレーニング"><div style={rowStyle}><div><p style={rowTitleStyle}>休憩タイマー</p><p style={detailStyle}>セット完了後に自動で開始</p></div><button onClick={() => onRestEnabled(!restEnabled)} aria-label={`休憩タイマー ${restEnabled ? "ON" : "OFF"}`} style={{ ...switchStyle, background: restEnabled ? "#c8ff00" : "#333" }}><i style={{ ...knobStyle, marginLeft: restEnabled ? 19 : 0, background: restEnabled ? "#0d0d0d" : "#aaa" }} /></button></div><div style={{ ...rowStyle, borderTop: "1px solid #282828" }}><div><p style={rowTitleStyle}>休憩時間</p><p style={detailStyle}>初期値</p></div><div style={{ display: "flex", alignItems: "center", gap: 8, opacity: restEnabled ? 1 : .4 }}><button disabled={!restEnabled} onClick={() => onRestSeconds(Math.max(10, restSeconds - 10))} style={restStepStyle}>−</button><span style={{ width: 43, textAlign: "center", fontFamily: "Outfit", fontSize: 16, fontWeight: 700 }}>{restSeconds}秒</span><button disabled={!restEnabled} onClick={() => onRestSeconds(restSeconds + 10)} style={restStepStyle}>＋</button></div></div></Section>

      <Section title="自分宛て招待"><div>{incomingInvitations.map((invitation, index) => { const status = invitation.acceptedAt ? "承認済み" : invitation.revokedAt ? "取消済み" : new Date(invitation.expiresAt).getTime() <= Date.now() ? "期限切れ" : null; return <div key={invitation.id} style={{ ...invitationRowStyle, borderBottom: index < incomingInvitations.length - 1 ? "1px solid #282828" : "none" }}><div style={{ flex: 1 }}><p style={rowTitleStyle}>{invitation.workspaceName}</p><p style={detailStyle}>{status ?? `有効 · ${new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric" }).format(new Date(invitation.expiresAt))}まで`}</p></div>{!status && <button disabled={acceptingInvitationId !== null} onClick={() => void onAcceptInvitation(invitation.id)} style={{ ...acceptButtonStyle, opacity: acceptingInvitationId === null ? 1 : .5 }}>{acceptingInvitationId === invitation.id ? "承認中..." : "承認"}</button>}</div> })}{!incomingInvitations.length && <p style={{ padding: 16, color: "#777", fontSize: 13 }}>届いた招待はありません</p>}{invitationError && <p role="alert" style={invitationErrorStyle}>{invitationError}</p>}</div></Section>

      <Section title="記録"><Row title="体重を管理" detail="推移・目標・体脂肪率" onClick={onBodyWeight} last /></Section>
      <Section title="管理"><Row title="ワークスペースを管理" detail="名前変更・メンバー確認" onClick={onWorkspaceManager} /><Row title="トレーニングメニューを管理" detail="胸トレ、脚トレなど" onClick={onMenuEditor} /><Row title="種目を管理" detail="登録済み種目を編集" onClick={onExerciseManager} last /></Section>
    </div>
    <SettingsNav onHome={onHome} onQuick={onQuick} onHistory={onHistory} />
  </div></main>
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section style={{ marginBottom: 27 }}><p style={labelStyle}>{title}</p><div style={sectionStyle}>{children}</div></section> }
function Row({ title, detail, onClick, last }: { title: string; detail: string; onClick: () => void; last?: boolean }) { return <button onClick={onClick} style={{ ...rowStyle, width: "100%", textAlign: "left", cursor: "pointer", borderTop: last ? "none" : "none", borderBottom: last ? "none" : "1px solid #282828" }}><div style={{ flex: 1 }}><p style={rowTitleStyle}>{title}</p><p style={detailStyle}>{detail}</p></div><span style={{ color: "#666", fontSize: 19 }}>›</span></button> }
function SettingsNav({ onHome, onQuick, onHistory }: { onHome: () => void; onQuick: () => void; onHistory: () => void }) { return <nav style={navStyle}><NavButton onClick={onHome} icon="home" label="ホーム" /><NavButton onClick={onQuick} icon="plus" label="記録" /><NavButton onClick={onHistory} icon="history" label="履歴" /><NavButton icon="settings" label="設定" active /></nav> }
function NavButton({ onClick, icon, label, active }: { onClick?: () => void; icon: string; label: string; active?: boolean }) { const color = active ? "#c8ff00" : "#505050"; return <button onClick={onClick} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: icon === "plus" ? "0 0 2px" : "6px 0", background: "none", border: "none", color, cursor: "pointer" }}>{icon === "plus" ? <div style={{ width: 48, height: 48, display: "grid", placeItems: "center", borderRadius: 14, background: "#222", border: "1px solid #333", marginTop: -10, color: "#f0f0f0", fontSize: 22 }}>＋</div> : <NavIcon icon={icon} />}<span style={{ fontFamily: "Inter", fontSize: 10, fontWeight: active ? 600 : 400, letterSpacing: "0.04em" }}>{label}</span></button> }
function NavIcon({ icon }: { icon: string }) { return icon === "settings" ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1-2.2 2.2-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5v.2h-3.2v-.2a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.9.3l-.1.1-2.2-2.2.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H5v-3.2h.2a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1 2.2-2.2.1.1a1.7 1.7 0 001.9.3 1.7 1.7 0 001-1.5V4h3.2v.2a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1 2.2 2.2-.1.1a1.7 1.7 0 00-.3 1.9 1.7 1.7 0 001.5 1h.2V14h-.2a1.7 1.7 0 00-1.5 1z" /></svg> : icon === "history" ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg> : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" /><path d="M9 21V12h6v9" /></svg> }

const pageStyle = { minHeight: "100vh", display: "flex", justifyContent: "center", background: "#000" } as const
const contentStyle = { width: "100%", maxWidth: 430, minHeight: "100vh", display: "flex", flexDirection: "column", background: "#0d0d0d" } as const
const eyebrowStyle = { color: "#666", fontFamily: "Inter", fontSize: 11, letterSpacing: "0.1em", marginBottom: 5 } as const
const labelStyle = { color: "#777", fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", marginBottom: 10 } as const
const sectionStyle = { border: "1px solid #2a2a2a", borderRadius: 14, background: "#171717", overflow: "hidden" } as const
const profileStyle = { display: "flex", alignItems: "center", gap: 13, padding: "16px" } as const
const avatarStyle = { width: 40, height: 40, display: "grid", placeItems: "center", borderRadius: "50%", background: "#202020", border: "1px solid #333", color: "#aaa", fontFamily: "Outfit", fontWeight: 700 } as const
const signOutStyle = { padding: "8px 9px", border: "1px solid #493030", borderRadius: 8, background: "transparent", color: "#e99", fontFamily: "Inter", fontSize: 11, cursor: "pointer" } as const
const displayNameEditStyle = { display: "flex", alignItems: "flex-end", gap: 9, padding: "0 16px 16px" } as const
const displayNameLabelStyle = { flex: 1, color: "#777", fontSize: 11 } as const
const displayNameInputStyle = { width: "100%", height: 40, marginTop: 6, padding: "0 10px", border: "1px solid #333", borderRadius: 8, background: "#202020", color: "#f0f0f0", outline: "none", fontFamily: "Inter", fontSize: 14 } as const
const displayNameSaveStyle = { height: 40, padding: "0 11px", border: "none", borderRadius: 8, background: "#c8ff00", color: "#0d0d0d", fontFamily: "Inter", fontSize: 12, fontWeight: 700, cursor: "pointer" } as const
const displayNameErrorStyle = { padding: "0 16px 16px", color: "#f09a9a", fontSize: 12, lineHeight: 1.5 } as const
const rowStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "16px", background: "transparent", border: "none", color: "#f0f0f0" } as const
const rowTitleStyle = { fontFamily: "Outfit", fontSize: 15, fontWeight: 600 } as const
const detailStyle = { color: "#777", fontSize: 12, marginTop: 4 } as const
const switchStyle = { width: 46, height: 27, padding: 3, border: "none", borderRadius: 20, cursor: "pointer" } as const
const knobStyle = { display: "block", width: 21, height: 21, borderRadius: "50%", transition: "margin-left 0.15s" } as const
const restStepStyle = { width: 28, height: 28, border: "1px solid #333", borderRadius: 8, background: "#202020", color: "#bbb", cursor: "pointer", fontSize: 16 } as const

const invitationRowStyle = { display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" } as const
const acceptButtonStyle = { padding: "8px 10px", border: "none", borderRadius: 8, background: "#c8ff00", color: "#0d0d0d", fontFamily: "Inter", fontSize: 11, fontWeight: 700, cursor: "pointer" } as const
const invitationErrorStyle = { padding: "0 16px 14px", color: "#f09a9a", fontSize: 12, lineHeight: 1.5 } as const
const navStyle = { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, display: "flex", alignItems: "flex-end", padding: "8px 0 20px", background: "#0d0d0d", borderTop: "1px solid #1e1e1e", zIndex: 10 } as const
