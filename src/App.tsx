import { useState, useEffect } from "react"
import WorkoutScreen from "./WorkoutScreen"
import QuickRecordScreen from "./QuickRecordScreen"
import HistoryScreen from "./HistoryScreen"
import { INITIAL_HISTORY_RECORDS } from "./HistoryScreen"
import type { HistoryRecord } from "./HistoryScreen"
import MenuEditorScreen from "./MenuEditorScreen"
import MenuListScreen from "./MenuListScreen"
import ExerciseManagerScreen from "./ExerciseManagerScreen"
import TeamCreateScreen from "./TeamCreateScreen"
import OnboardingScreen from "./OnboardingScreen"
import WorkspaceManagerScreen from "./WorkspaceManagerScreen"
import TeamManageScreen from "./TeamManageScreen"
import GrowthScreen from "./GrowthScreen"
import type { GrowthPhoto } from "./GrowthScreen"
import TeamMemberScreen from "./TeamMemberScreen"
import type { TeamMember, SharedRecord } from "./TeamMemberScreen"
import type { RegisteredExercise, TrainingMenu } from "./MenuEditorScreen"
import SettingsScreen from "./SettingsScreen"

const INITIAL_WORKSPACES = [{ id: 1, name: "マイトレーニング", type: "個人" as const }]
const INITIAL_TEAM_MEMBERS: TeamMember[] = [{ id: 1, name: "田中 太郎", role: "オーナー", systemRole: "Owner", weeklyCount: 2, recent: "ベンチプレス 80kg × 8回" }, { id: 2, name: "佐藤 美咲", role: "トレーナー", systemRole: "Admin", weeklyCount: 3, recent: "スクワット 60kg × 10回" }, { id: 3, name: "鈴木 健", systemRole: "Member", weeklyCount: 1, recent: "腕立て伏せ 30回" }]

const PREV_SESSION = {
  date: "8月7日（木）",
  duration: "52分",
  exercises: [
    { name: "ベンチプレス", sets: "4セット", detail: "80kg × 8回" },
    { name: "インクラインDB", sets: "3セット", detail: "30kg × 10回" },
    { name: "ケーブルフライ", sets: "3セット", detail: "15kg × 12回" },
  ],
}

const TRAINING_DAYS = new Set([1, 5, 7, 12, 14, 19, 21, 26])
const TODAY = 9
const filterChipStyle = { flexShrink: 0, padding: "7px 11px", border: "1px solid", borderRadius: 15, background: "#202020", fontFamily: "Inter", fontSize: 11, cursor: "pointer" } as const

function WeekProgress({ done, target }: { done: number; target: number }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex gap-1.5">
        {Array.from({ length: target }, (_, i) => (
          <div
            key={i}
            style={{
              width: 28,
              height: 6,
              borderRadius: 3,
              backgroundColor: i < done ? "#c8ff00" : "#282828",
              transition: "background-color 0.2s",
            }}
          />
        ))}
      </div>
      <span
        style={{
          fontFamily: "Outfit",
          fontSize: 13,
          color: "#888",
          letterSpacing: "0.02em",
        }}
      >
        {done}
        <span style={{ color: "#666" }}> / {target}回</span>
      </span>
    </div>
  )
}

function MiniCalendar({ activities, filter, onDaySelect }: { activities?: SharedRecord[]; filter?: number[]; onDaySelect?: (day: number) => void }) {
  const year = 2026
  const month = 7
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const dayLabels = ["日", "月", "火", "水", "木", "金", "土"]

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          marginBottom: 6,
        }}
      >
        {dayLabels.map((d, i) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontSize: 10,
              color: i === 0 ? "#e05555" : i === 6 ? "#4d8fff" : "#666",
              fontWeight: 500,
              letterSpacing: "0.05em",
            }}
          >
            {d}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "2px 0",
        }}
      >
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />
          const isTraining = TRAINING_DAYS.has(day)
          const isToday = day === TODAY
          const isSun = idx % 7 === 0
          const isSat = idx % 7 === 6
          const memberColors: Record<number, string> = { 1: "#c8ff00", 2: "#5b9dff", 3: "#b77cff" }
          const dayActivities = activities?.filter((record) => record.day === day && (!filter?.length || filter.includes(record.memberId))) ?? []
          return (
            <button
              onClick={() => dayActivities.length && onDaySelect?.(day)}
              disabled={!dayActivities.length}
              key={day}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                paddingTop: 3,
                paddingBottom: 3,
                border: "none",
                background: "transparent",
                cursor: dayActivities.length ? "pointer" : "default",
                paddingLeft: 0,
                paddingRight: 0,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontFamily: "Outfit",
                  fontWeight: isToday ? 700 : 400,
                  color: isToday
                    ? "#c8ff00"
                    : isSun
                      ? "#e05555"
                      : isSat
                        ? "#4d8fff"
                        : "#888",
                  lineHeight: 1,
                }}
              >
                {day}
              </span>
              {activities ? <div style={{ display: "flex", gap: 2, minHeight: 6, alignItems: "center" }}>{dayActivities.slice(0, 3).map((record) => <i key={record.id} style={{ width: 5, height: 5, borderRadius: "50%", background: memberColors[record.memberId] ?? "#888" }} />)}{dayActivities.length > 3 && <small style={{ color: "#888", fontSize: 8 }}>+{dayActivities.length - 3}</small>}</div> : <div style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: isTraining ? "#c8ff00" : "transparent", opacity: isTraining ? (day <= TODAY ? 1 : 0.3) : 0 }} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function BottomSheet({ open, onClose, onStartWorkout, onQuickRecord }: { open: boolean; onClose: () => void; onStartWorkout: () => void; onQuickRecord: () => void }) {
  const [visible, setVisible] = useState(false)
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    if (open) {
      setRendered(true)
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    } else {
      setVisible(false)
      const t = setTimeout(() => setRendered(false), 300)
      return () => clearTimeout(t)
    }
  }, [open])

  if (!rendered) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          zIndex: 40,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.25s ease",
        }}
      />
      {/* Sheet */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: `translateX(-50%) translateY(${visible ? "0%" : "100%"})`,
          width: "100%",
          maxWidth: 430,
          backgroundColor: "#171717",
          borderRadius: "20px 20px 0 0",
          borderTop: "1px solid #2a2a2a",
          zIndex: 50,
          transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          paddingBottom: "env(safe-area-inset-bottom, 24px)",
        }}
      >
        {/* Handle */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: 12,
            paddingBottom: 8,
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: "#333",
            }}
          />
        </div>

        <div style={{ padding: "8px 20px 24px" }}>
          <p
            style={{
              fontFamily: "Outfit",
              fontSize: 13,
              color: "#666",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              fontWeight: 500,
              marginBottom: 16,
            }}
          >
            記録の種類を選択
          </p>

          {/* Quick record */}
          <button
            onClick={onQuickRecord}
            style={{
              width: "100%",
              background: "none",
              border: "1px solid #2a2a2a",
              borderRadius: 14,
              padding: "18px 20px",
              cursor: "pointer",
              textAlign: "left",
              marginBottom: 10,
              display: "flex",
              alignItems: "flex-start",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: "#222",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#c8ff00"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div>
              <p
                style={{
                  fontFamily: "Outfit",
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#f0f0f0",
                  marginBottom: 4,
                }}
              >
                クイック記録
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "#888",
                  fontFamily: "Inter",
                  lineHeight: 1.5,
                  marginBottom: 10,
                }}
              >
                1種目だけすぐに記録する
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                {["腕立て 30回", "スクワット 20回"].map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 11,
                      color: "#666",
                      backgroundColor: "#1e1e1e",
                      border: "1px solid #282828",
                      borderRadius: 6,
                      padding: "3px 8px",
                      fontFamily: "Inter",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </button>

          {/* Full session */}
          <button
            onClick={onStartWorkout}
            style={{
              width: "100%",
              background: "none",
              border: "1px solid #2a2a2a",
              borderRadius: 14,
              padding: "18px 20px",
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              alignItems: "flex-start",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: "#222",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#c8ff00"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <path d="M9 12h6M9 16h4" />
              </svg>
            </div>
            <div>
              <p
                style={{
                  fontFamily: "Outfit",
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#f0f0f0",
                  marginBottom: 4,
                }}
              >
                トレーニングを開始
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "#888",
                  fontFamily: "Inter",
                  lineHeight: 1.5,
                  marginBottom: 10,
                }}
              >
                複数種目・複数セットをまとめて記録する
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {[
                  { name: "ベンチプレス", detail: "80kg × 8回 / 7回 / 6回" },
                  { name: "スクワット", detail: "100kg × 5回 × 3セット" },
                ].map((ex) => (
                  <div
                    key={ex.name}
                    style={{ display: "flex", gap: 8, alignItems: "baseline" }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: "#666",
                        fontFamily: "Inter",
                        minWidth: 80,
                      }}
                    >
                      {ex.name}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: "#555",
                        fontFamily: "Inter",
                      }}
                    >
                      {ex.detail}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </button>

        </div>
      </div>
    </>
  )
}

type Tab = "home" | "history"

export default function App() {
  const [onboarding, setOnboarding] = useState(true)
  const [screen, setScreen] = useState<"home" | "workout" | "quick-record" | "history" | "menu-list" | "menu-editor" | "exercise-manager" | "team-create" | "team-member" | "team-manage" | "workspace-manager" | "growth" | "settings">("home")
  const [activeTab, setActiveTab] = useState<Tab>("home")
  const [wsIndex, setWsIndex] = useState(0)
  const [workspaces, setWorkspaces] = useState(INITIAL_WORKSPACES)
  const [wsMenuOpen, setWsMenuOpen] = useState(false)
  const [trainingTendency, setTrainingTendency] = useState("両方")
  const [restEnabled, setRestEnabled] = useState(true)
  const [restSeconds, setRestSeconds] = useState(90)
  const [startPressed, setStartPressed] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [menuPressedOpen, setMenuPressedOpen] = useState(false)
  const [menus, setMenus] = useState<TrainingMenu[]>([
    { id: 1, name: "胸トレ", exercises: [{ id: 11, exerciseId: 1, name: "ベンチプレス", sets: 3 }, { id: 12, exerciseId: 2, name: "インクラインDB", sets: 3 }, { id: 13, exerciseId: 3, name: "ケーブルフライ", sets: 3 }] },
    { id: 2, name: "脚トレ", exercises: [{ id: 21, exerciseId: 4, name: "スクワット", sets: 3 }, { id: 22, exerciseId: 5, name: "レッグプレス", sets: 3 }, { id: 23, exerciseId: 6, name: "レッグカール", sets: 3 }] },
    { id: 3, name: "背中トレ", exercises: [{ id: 31, exerciseId: 7, name: "デッドリフト", sets: 3 }, { id: 32, exerciseId: 8, name: "懸垂", sets: 3 }, { id: 33, exerciseId: 9, name: "ラットプルダウン", sets: 3 }] },
  ])
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>(INITIAL_HISTORY_RECORDS)
  const [registeredExercises, setRegisteredExercises] = useState<RegisteredExercise[]>([
    { id: 1, name: "ベンチプレス", kind: "器具" }, { id: 2, name: "インクラインDB", kind: "器具" }, { id: 3, name: "ケーブルフライ", kind: "器具" }, { id: 4, name: "スクワット", kind: "器具" }, { id: 5, name: "レッグプレス", kind: "器具" }, { id: 6, name: "レッグカール", kind: "器具" }, { id: 7, name: "デッドリフト", kind: "器具" }, { id: 8, name: "懸垂", kind: "自重" }, { id: 9, name: "ラットプルダウン", kind: "器具" }, { id: 10, name: "ダンベルカール", kind: "器具" }, { id: 11, name: "腕立て伏せ", kind: "自重" },
  ])
  const [editingMenu, setEditingMenu] = useState<TrainingMenu | undefined>()
  const [workoutMenu, setWorkoutMenu] = useState<TrainingMenu | undefined>()
  const [menuListBack, setMenuListBack] = useState<"home" | "settings">("settings")
  const [selectedMember, setSelectedMember] = useState<TeamMember | undefined>()
  const [selectedTeamId, setSelectedTeamId] = useState<number | undefined>()
  const [activityFilter, setActivityFilter] = useState<number[]>([])
  const [selectedActivityDay, setSelectedActivityDay] = useState<number | null>(null)
  const [teamMembers, setTeamMembers] = useState(INITIAL_TEAM_MEMBERS)
  const [growthPhotos, setGrowthPhotos] = useState<GrowthPhoto[]>([
    { id: 1, ownerId: 1, owner: "田中 太郎", day: 14, when: "8月14日", visibility: "自分のみ", note: "朝の記録", tone: "#6b5c55" },
    { id: 2, ownerId: 1, owner: "田中 太郎", day: 7, when: "8月7日", visibility: "自分のみ", tone: "#5e6659" },
    { id: 3, ownerId: 1, owner: "田中 太郎", day: 7, when: "8月7日", visibility: "自分のみ", tone: "#6a5a52" },
  ])
  const [sharedRecords, setSharedRecords] = useState<SharedRecord[]>([
    { id: 1, teamId: 3, memberId: 2, member: "佐藤 美咲", when: "今日 18:20", exercise: "スクワット", weight: 60, reps: 10, day: 9 },
    { id: 2, teamId: 3, memberId: 3, member: "鈴木 健", when: "昨日", exercise: "腕立て伏せ", reps: 30, day: 8 },
    { id: 3, teamId: 3, memberId: 1, member: "田中 太郎", when: "8月8日", exercise: "ベンチプレス", weight: 80, reps: 8, day: 8 },
  ])
  const teamWorkspaces = workspaces.filter((workspace) => workspace.type === "チーム")
  const openMember = (member: TeamMember) => { setSelectedMember(member); setSelectedTeamId(workspaces[wsIndex]?.id); setScreen("team-member") }

  if (onboarding) return <OnboardingScreen onComplete={(teamUse, tendency) => { setTrainingTendency(tendency); setOnboarding(false); if (teamUse) setScreen("team-create") }} />

  if (screen === "workout") {
    return <WorkoutScreen onBack={() => setScreen("home")} menu={workoutMenu} restEnabled={restEnabled} restDuration={restSeconds} onSave={(added) => { setMenus((current) => current.map((menu) => menu.id !== workoutMenu?.id ? menu : { ...menu, exercises: [...menu.exercises, ...added.filter((exercise) => !menu.exercises.some((item) => item.name === exercise.name)).map((exercise) => ({ id: Date.now() + Math.random(), exerciseId: Date.now() + Math.random(), name: exercise.name, sets: exercise.sets }))] })); setHistoryRecords((current) => [{ id: Date.now(), date: "8月14日（木）", day: 14, title: workoutMenu?.name ?? "トレーニング", result: "80kg × 8回", sets: `${workoutMenu?.exercises.length ?? 0}種目`, duration: "52分", share: "自分のみ" }, ...current]); setActiveTab("history"); setScreen("history") }} />
  }
  if (screen === "quick-record") {
    return <QuickRecordScreen onBack={() => setScreen("home")} teams={teamWorkspaces} exercises={registeredExercises.map((exercise) => exercise.name)} onSaveShared={(record) => setSharedRecords((current) => [{ id: Date.now(), ...record, memberId: 1, member: "田中 太郎", when: "たった今", day: TODAY }, ...current])} onSaveRecord={(record) => setHistoryRecords((current) => [{ id: Date.now(), date: "8月14日（木）", day: 14, title: record.exercise, result: `${record.weight ? `${record.weight}kg × ` : ""}${record.reps}回`, sets: "1セット", duration: "—", share: record.share, quick: true }, ...current])} />
  }
  if (screen === "history") {
    return <HistoryScreen onHome={() => { setActiveTab("home"); setScreen("home") }} onQuick={() => setScreen("quick-record")} onSettings={() => setScreen("settings")} onGrowth={() => setScreen("growth")} records={historyRecords} onDelete={(id) => setHistoryRecords((current) => current.filter((record) => record.id !== id))} />
  }
  if (screen === "menu-list") {
    return <MenuListScreen menus={menus} onBack={() => setScreen(menuListBack)} onCreate={() => { setEditingMenu(undefined); setScreen("menu-editor") }} onEdit={(menu) => { setEditingMenu(menu); setScreen("menu-editor") }} onStart={(menu) => { setWorkoutMenu(menu); setScreen("workout") }} />
  }
  if (screen === "menu-editor") {
    return <MenuEditorScreen menu={editingMenu} registeredExercises={registeredExercises} onBack={() => setScreen("menu-list")} onSave={(menu, newExercises) => { setRegisteredExercises((current) => [...current, ...newExercises]); setMenus((current) => current.some((entry) => entry.id === menu.id) ? current.map((entry) => entry.id === menu.id ? menu : entry) : [...current, menu]); setScreen("menu-list") }} onDelete={(id) => { setMenus((current) => current.filter((menu) => menu.id !== id)); setScreen("menu-list") }} />
  }
  if (screen === "exercise-manager") {
    return <ExerciseManagerScreen exercises={registeredExercises} menus={menus} onBack={() => setScreen("settings")} onSave={(exercise) => { setRegisteredExercises((current) => current.some((entry) => entry.id === exercise.id) ? current.map((entry) => entry.id === exercise.id ? exercise : entry) : [...current, exercise]); setMenus((current) => current.map((menu) => ({ ...menu, exercises: menu.exercises.map((item) => item.exerciseId === exercise.id ? { ...item, name: exercise.name } : item) }))) }} onDelete={(id) => setRegisteredExercises((current) => current.filter((exercise) => exercise.id !== id))} />
  }
  if (screen === "team-create") {
    return <TeamCreateScreen onBack={() => setScreen("settings")} onCreate={(name, role) => { const teamId = Date.now(); setWorkspaces((current) => [...current, { id: teamId, name, type: "チーム" }]); setSharedRecords((current) => [{ id: teamId + 1, teamId, memberId: 2, member: "佐藤 美咲", when: "今日 18:20", exercise: "スクワット", weight: 60, reps: 10, day: 9 }, { id: teamId + 2, teamId, memberId: 3, member: "鈴木 健", when: "昨日", exercise: "腕立て伏せ", reps: 30, day: 8 }, ...current]); setGrowthPhotos((current) => [{ id: teamId + 3, teamId, ownerId: 2, owner: "佐藤 美咲", day: 10, when: "8月10日", visibility: "チームに共有", note: "継続中", tone: "#56657a" }, { id: teamId + 4, teamId, ownerId: 3, owner: "鈴木 健", day: 10, when: "8月10日", visibility: "チームに共有", tone: "#66577c" }, ...current]); if (role) setTeamMembers((current) => current.map((member) => member.id === 1 ? { ...member, role } : member)); setWsIndex(workspaces.length); setScreen("home") }} />
  }
  if (screen === "team-member" && selectedMember) {
    return <TeamMemberScreen member={selectedMember} records={sharedRecords.filter((record) => record.teamId === selectedTeamId)} onBack={() => setScreen("home")} />
  }
  if (screen === "team-manage") return <TeamManageScreen teamName={workspaces[wsIndex]?.name ?? "チーム"} members={teamMembers} records={sharedRecords.filter((record) => record.teamId === workspaces[wsIndex]?.id)} currentRole="Owner" onBack={() => setScreen("workspace-manager")} onRoleChange={(id, systemRole) => setTeamMembers((current) => current.map((member) => member.id === id ? { ...member, systemRole } : member))} onRemoveRecord={(id) => setSharedRecords((current) => current.filter((record) => record.id !== id))} />
  if (screen === "workspace-manager") return <WorkspaceManagerScreen workspaces={workspaces} currentId={workspaces[wsIndex].id} onBack={() => setScreen("settings")} onSelect={(id) => { setWsIndex(workspaces.findIndex((workspace) => workspace.id === id)); setScreen("home") }} onRename={(id, name) => setWorkspaces((current) => current.map((workspace) => workspace.id === id ? { ...workspace, name } : workspace))} onExit={(id) => { setWorkspaces((current) => current.filter((workspace) => workspace.id !== id)); setWsIndex(0) }} onCreateTeam={() => setScreen("team-create")} onManageTeam={(id) => { setWsIndex(workspaces.findIndex((workspace) => workspace.id === id)); setScreen("team-manage") }} />
  if (screen === "growth") return <GrowthScreen teamId={workspaces[wsIndex]?.type === "チーム" ? workspaces[wsIndex].id : undefined} members={teamMembers.map((member) => ({ id: member.id, name: member.name, color: member.id === 1 ? "#c8ff00" : member.id === 2 ? "#5b9dff" : "#b77cff" }))} photos={growthPhotos} onBack={() => setScreen("home")} onSave={(photo) => setGrowthPhotos((current) => [photo, ...current])} onUpdate={(photo) => setGrowthPhotos((current) => current.map((item) => item.id === photo.id ? { ...photo, teamId: photo.visibility === "チームに共有" ? workspaces[wsIndex]?.id : photo.teamId } : item))} onDelete={(id) => setGrowthPhotos((current) => current.filter((photo) => photo.id !== id))} />
  if (screen === "settings") {
    return <SettingsScreen onHome={() => setScreen("home")} onQuick={() => setScreen("quick-record")} onHistory={() => setScreen("history")} onMenuEditor={() => { setMenuListBack("settings"); setScreen("menu-list") }} onExerciseManager={() => setScreen("exercise-manager")} onCreateTeam={() => setScreen("team-create")} onWorkspaceManager={() => setScreen("workspace-manager")} tendency={trainingTendency} onTendency={setTrainingTendency} workspaces={workspaces} currentWorkspaceId={workspaces[wsIndex].id} onSelectWorkspace={(id) => setWsIndex(workspaces.findIndex((workspace) => workspace.id === id))} restEnabled={restEnabled} onRestEnabled={setRestEnabled} restSeconds={restSeconds} onRestSeconds={setRestSeconds} />
  }

  const isTeamWorkspace = workspaces[wsIndex]?.type === "チーム"
  const teamActivities = isTeamWorkspace ? sharedRecords.filter((record) => record.teamId === workspaces[wsIndex].id) : []
  const filteredActivities = activityFilter.length === 0 ? teamActivities : teamActivities.filter((record) => activityFilter.includes(record.memberId))

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        minHeight: "100vh",
        backgroundColor: "#000",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 430,
          minHeight: "100vh",
          backgroundColor: "#0d0d0d",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflowX: "hidden",
        }}
      >
        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 88 }}>
          {/* ─── Header ─── */}
          <div style={{ padding: "56px 24px 24px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 11,
                    color: "#666",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    fontWeight: 500,
                    marginBottom: 6,
                  }}
                >
                  ワークスペース
                </p>
                <button
                  onClick={() => setWsMenuOpen((v) => !v)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    color: "#f0f0f0",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "Outfit",
                      fontSize: 22,
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {workspaces[wsIndex].name}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#777"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transform: wsMenuOpen ? "rotate(180deg)" : "none",
                      transition: "transform 0.2s",
                    }}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>
              <button
                onClick={() => setScreen("growth")}
                aria-label="成長記録を開く"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  backgroundColor: "#202020",
                  border: "1px solid #2a2a2a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "Outfit",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#888", cursor: "pointer",
                }}
              >
                田
              </button>
            </div>

            {wsMenuOpen && (
              <div
                style={{
                  marginTop: 8,
                  backgroundColor: "#171717",
                  border: "1px solid #2a2a2a",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                {workspaces.map((ws, i) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      setWsIndex(i)
                      setWsMenuOpen(false)
                    }}
                    style={{
                      display: "flex",
                      width: "100%",
                      padding: "14px 16px",
                      background: i === wsIndex ? "#202020" : "none",
                      border: "none",
                      borderBottom:
                        i < workspaces.length - 1
                          ? "1px solid #2a2a2a"
                          : "none",
                      textAlign: "left",
                      cursor: "pointer",
                      color: i === wsIndex ? "#c8ff00" : "#bbb",
                      fontFamily: "Inter",
                      fontSize: 14,
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{ws.name}<small style={{ color: "#777", marginLeft: 7, fontSize: 10 }}>{ws.type}</small></span>
                    {i === wsIndex && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#c8ff00"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
                <button onClick={() => { setWsMenuOpen(false); setScreen("team-create") }} style={{ display: "flex", width: "100%", padding: "14px 16px", border: "none", background: "transparent", color: "#c8ff00", fontFamily: "Inter", fontSize: 13, textAlign: "left", cursor: "pointer" }}>＋ チームを作成</button>
              </div>
            )}
            <button onClick={() => setScreen("growth")} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 18, padding: 0, border: "none", background: "transparent", color: "#c8ff00", fontFamily: "Inter", fontSize: 12, cursor: "pointer" }}>成長記録 <span style={{ color: "#777" }}>写真で変化を確認</span><span style={{ color: "#777", fontSize: 17 }}>›</span></button>
          </div>

          {/* ─── Weekly progress ─── */}
          <div style={{ padding: "0 24px 28px" }}>
            <div
              style={{
                backgroundColor: "#171717",
                borderRadius: 16,
                padding: "18px 20px",
                border: "1px solid #2a2a2a",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
                <span
                  style={{
                    fontFamily: "Outfit",
                    fontSize: 13,
                    color: "#888",
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                  }}
                >
                  今週のトレーニング
                </span>
                <div
                  style={{ display: "flex", alignItems: "baseline", gap: 2 }}
                >
                  <span
                    style={{
                      fontFamily: "Outfit",
                      fontSize: 28,
                      fontWeight: 800,
                      color: "#f0f0f0",
                      lineHeight: 1,
                    }}
                  >
                    2
                  </span>
                  <span
                    style={{
                      fontFamily: "Outfit",
                      fontSize: 15,
                      color: "#666",
                      fontWeight: 500,
                    }}
                  >
                    {" "}
                    / 3回
                  </span>
                </div>
              </div>
              <WeekProgress done={2} target={3} />
              <p
                style={{
                  fontSize: 12,
                  color: "#777",
                  marginTop: 10,
                  fontFamily: "Inter",
                }}
              >
                あと1回で今週の目標達成
              </p>
            </div>
          </div>


          {/* ─── Start button ─── */}
          <div style={{ padding: "0 24px 28px" }}>
            <button
              onClick={() => { setMenuListBack("home"); setScreen("menu-list") }}
              onPointerDown={() => setStartPressed(true)}
              onPointerUp={() => setStartPressed(false)}
              onPointerLeave={() => setStartPressed(false)}
              style={{
                width: "100%",
                height: 72,
                backgroundColor: startPressed ? "#9fcc00" : "#c8ff00",
                border: "none",
                borderRadius: 18,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                transform: startPressed ? "scale(0.98)" : "scale(1)",
                transition: "transform 0.1s, background-color 0.1s",
                boxShadow: startPressed
                  ? "none"
                  : "0 0 32px rgba(200, 255, 0, 0.18)",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="#0d0d0d"
                stroke="none"
              >
                <path d="M8 5.14v14l11-7-11-7z" />
              </svg>
              <span
                style={{
                  fontFamily: "Outfit",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#0d0d0d",
                  letterSpacing: "-0.01em",
                }}
              >
                トレーニングを開始
              </span>
            </button>
          </div>

          {/* ─── Previous session ─── */}
          <div style={{ padding: "0 24px 28px" }}>
            <p
              style={{
                fontSize: 11,
                color: "#777",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontWeight: 500,
                marginBottom: 14,
              }}
            >
              前回のトレーニング
            </p>
            <div
              style={{
                backgroundColor: "#171717",
                borderRadius: 16,
                border: "1px solid #2a2a2a",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "14px 20px",
                  borderBottom: "1px solid #2a2a2a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontFamily: "Outfit",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#f0f0f0",
                  }}
                >
                  {PREV_SESSION.date}
                </span>
                <span
                  style={{ fontSize: 12, color: "#777", fontFamily: "Inter" }}
                >
                  {PREV_SESSION.duration}
                </span>
              </div>
              {PREV_SESSION.exercises.map((ex, i) => (
                <div
                  key={ex.name}
                  style={{
                    padding: "13px 20px",
                    borderBottom: "1px solid #1e1e1e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{ fontSize: 14, color: "#ccc", fontFamily: "Inter" }}
                  >
                    {ex.name}
                  </span>
                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        fontFamily: "Outfit",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#f0f0f0",
                      }}
                    >
                      {ex.detail}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: "#777",
                        display: "block",
                        marginTop: 1,
                      }}
                    >
                      {ex.sets}
                    </span>
                  </div>
                </div>
              ))}
              {/* Secondary action */}
              <button
                onClick={() => { setWorkoutMenu(menus[0]); setScreen("workout") }}
                onPointerDown={() => setMenuPressedOpen(true)}
                onPointerUp={() => setMenuPressedOpen(false)}
                onPointerLeave={() => setMenuPressedOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  width: "100%",
                  padding: "14px 20px",
                  background: menuPressedOpen ? "#1e1e1e" : "none",
                  border: "none",
                  cursor: "pointer",
                  transition: "background-color 0.1s",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#888"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M8 5.14v14l11-7-11-7z" />
                </svg>
                <span
                  style={{
                    fontFamily: "Inter",
                    fontSize: 13,
                    color: "#888",
                    fontWeight: 500,
                  }}
                >
                  このメニューで開始
                </span>
              </button>
            </div>
          </div>

          {/* ─── Monthly calendar ─── */}
          <div style={{ padding: "0 24px 28px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: "#777",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  fontWeight: 500,
                }}
              >
                {isTeamWorkspace ? "8月のチーム活動" : "8月の実施状況"}
              </p>
              <span
                style={{ fontFamily: "Outfit", fontSize: 12, color: "#777" }}
              >
                {TRAINING_DAYS.size}回 / 今月
              </span>
            </div>
            {isTeamWorkspace && <><div style={{ display: "flex", gap: 7, overflowX: "auto", marginBottom: 9, paddingBottom: 2 }}><button onClick={() => setActivityFilter([])} style={{ ...filterChipStyle, borderColor: activityFilter.length === 0 ? "#c8ff00" : "#333", color: activityFilter.length === 0 ? "#c8ff00" : "#aaa" }}>全員</button>{teamMembers.map((member) => <button key={member.id} onClick={() => setActivityFilter((current) => current.includes(member.id) ? current.filter((id) => id !== member.id) : [...current, member.id])} onDoubleClick={() => openMember(member)} title="ダブルタップで詳細" style={{ ...filterChipStyle, borderColor: activityFilter.includes(member.id) ? "#c8ff00" : "#333", color: activityFilter.includes(member.id) ? "#c8ff00" : "#aaa" }}>{member.id === 1 ? "自分" : member.name.split(" ")[0]}</button>)}</div><div style={{ display: "flex", gap: 10, overflowX: "auto", marginBottom: 10 }}>{teamMembers.map((member) => <button key={member.id} onClick={() => openMember(member)} style={{ display: "flex", alignItems: "center", gap: 4, padding: 0, border: "none", background: "transparent", color: "#888", fontSize: 10, whiteSpace: "nowrap", cursor: "pointer" }}><i style={{ width: 6, height: 6, borderRadius: "50%", background: member.id === 1 ? "#c8ff00" : member.id === 2 ? "#5b9dff" : "#b77cff" }} />{member.id === 1 ? "自分" : member.name}</button>)}</div></>}
            <div
              style={{
                backgroundColor: "#171717",
                borderRadius: 16,
                border: "1px solid #2a2a2a",
                padding: "16px 16px 12px",
              }}
            >
              <MiniCalendar activities={isTeamWorkspace ? teamActivities : undefined} filter={activityFilter} onDaySelect={setSelectedActivityDay} />
            </div>
          </div>
          {isTeamWorkspace && <div style={{ padding: "0 24px 28px" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><p style={{ fontSize: 11, color: "#777", letterSpacing: "0.1em", fontWeight: 500 }}>最近の活動</p><button onClick={() => { setActiveTab("history"); setScreen("history") }} style={{ border: "none", background: "transparent", color: "#c8ff00", fontSize: 12, cursor: "pointer" }}>もっと見る</button></div><div style={{ background: "#171717", border: "1px solid #2a2a2a", borderRadius: 16, overflow: "hidden" }}>{filteredActivities.slice(0, 3).map((record, index) => <div key={record.id} style={{ padding: "14px 16px", borderBottom: index < Math.min(filteredActivities.length, 3) - 1 ? "1px solid #282828" : "none" }}><p style={{ fontFamily: "Outfit", fontSize: 14, fontWeight: 700 }}><button onClick={() => openMember(teamMembers.find((member) => member.id === record.memberId)!)} style={{ padding: 0, border: "none", background: "transparent", color: "#f0f0f0", fontFamily: "Outfit", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>{record.member}</button><span style={{ color: "#777", fontFamily: "Inter", fontWeight: 400, fontSize: 11, marginLeft: 8 }}>{record.when}</span></p><p style={{ color: "#aaa", fontSize: 13, marginTop: 5 }}>{record.exercise} · {record.weight ? `${record.weight}kg × ` : ""}{record.reps}回</p></div>)}</div></div>}
          {isTeamWorkspace && <div style={{ padding: "0 24px 28px" }}><p style={{ fontSize: 11, color: "#777", letterSpacing: "0.1em", fontWeight: 500, marginBottom: 14 }}>メンバー</p><div style={{ background: "#171717", border: "1px solid #2a2a2a", borderRadius: 16, overflow: "hidden" }}>{teamMembers.map((member, index) => <button key={member.id} onClick={() => openMember(member)} style={{ display: "flex", width: "100%", alignItems: "center", gap: 10, padding: "13px 16px", border: "none", borderBottom: index < teamMembers.length - 1 ? "1px solid #282828" : "none", background: "transparent", color: "#f0f0f0", textAlign: "left", cursor: "pointer" }}><i style={{ width: 7, height: 7, borderRadius: "50%", background: member.id === 1 ? "#c8ff00" : member.id === 2 ? "#5b9dff" : "#b77cff" }} /><span style={{ flex: 1, fontFamily: "Outfit", fontSize: 14, fontWeight: 700 }}>{member.name}</span><span style={{ color: "#777", fontSize: 12 }}>今週 {member.weeklyCount}回</span><span style={{ color: "#666", fontSize: 18 }}>›</span></button>)}</div></div>}
          {selectedActivityDay && <div style={{ position: "fixed", inset: 0, zIndex: 30, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(0,0,0,.7)" }}><section style={{ width: "100%", maxWidth: 360, padding: 20, border: "1px solid #333", borderRadius: 16, background: "#171717" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><h2 style={{ fontFamily: "Outfit", fontSize: 18, fontWeight: 700 }}>8月{selectedActivityDay}日</h2><button onClick={() => setSelectedActivityDay(null)} style={{ border: "none", background: "transparent", color: "#aaa", fontSize: 20, cursor: "pointer" }}>×</button></div>{filteredActivities.filter((record) => record.day === selectedActivityDay).map((record) => <div key={record.id} style={{ padding: "12px 0", borderTop: "1px solid #282828" }}><p style={{ fontFamily: "Outfit", fontSize: 14, fontWeight: 700 }}>{record.member}</p><p style={{ color: "#aaa", fontSize: 13, marginTop: 5 }}>{record.exercise} · {record.weight ? `${record.weight}kg × ` : ""}{record.reps}回</p></div>)}</section></div>}
        </div>

        {/* ─── Bottom nav ─── */}
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            maxWidth: 430,
            backgroundColor: "#0d0d0d",
            borderTop: "1px solid #1e1e1e",
            display: "flex",
            alignItems: "flex-end",
            padding: "8px 0 20px",
            zIndex: 10,
          }}
        >
          {/* ホーム */}
          <button
            onClick={() => setActiveTab("home")}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: activeTab === "home" ? "#c8ff00" : "#505050",
              padding: "6px 0",
              transition: "color 0.15s",
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
              <path d="M9 21V12h6v9" />
            </svg>
            <span
              style={{
                fontFamily: "Inter",
                fontSize: 10,
                fontWeight: activeTab === "home" ? 600 : 400,
                letterSpacing: "0.04em",
              }}
            >
              ホーム
            </span>
          </button>

          {/* ＋ center button */}
          <button
            onClick={() => setSheetOpen(true)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0 0 2px",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                backgroundColor: "#222",
                border: "1px solid #333",
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: -10,
                transition: "background-color 0.15s",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#f0f0f0"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <span
              style={{
                fontFamily: "Inter",
                fontSize: 10,
                color: "#505050",
                letterSpacing: "0.04em",
              }}
            >
              記録
            </span>
          </button>

          {/* 履歴 */}
          <button
            onClick={() => { setActiveTab("history"); setScreen("history") }}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: activeTab === "history" ? "#c8ff00" : "#505050",
              padding: "6px 0",
              transition: "color 0.15s",
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
            <span
              style={{
                fontFamily: "Inter",
                fontSize: 10,
                fontWeight: activeTab === "history" ? 600 : 400,
                letterSpacing: "0.04em",
              }}
            >
              履歴
            </span>
          </button>

          <button onClick={() => setScreen("settings")} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: "#505050", padding: "6px 0" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1-2.2 2.2-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5v.2h-3.2v-.2a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.9.3l-.1.1-2.2-2.2.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H5v-3.2h.2a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1 2.2-2.2.1.1a1.7 1.7 0 001.9.3 1.7 1.7 0 001-1.5V4h3.2v.2a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1 2.2 2.2-.1.1a1.7 1.7 0 00-.3 1.9 1.7 1.7 0 001.5 1h.2V14h-.2a1.7 1.7 0 00-1.5 1z" /></svg>
            <span style={{ fontFamily: "Inter", fontSize: 10, letterSpacing: "0.04em" }}>設定</span>
          </button>
        </div>

        {/* Bottom sheet */}
        <BottomSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          onStartWorkout={() => { setSheetOpen(false); setScreen("workout") }}
          onQuickRecord={() => { setSheetOpen(false); setScreen("quick-record") }}
        />
      </div>
    </div>
  )
}
