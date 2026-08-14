import { useState, useEffect, useCallback } from "react"
import type { User } from "@supabase/supabase-js"
import LoginScreen from "./LoginScreen"
import { supabase } from "./lib/supabase"
import WorkoutScreen from "./WorkoutScreen"
import type { WorkoutSaveData } from "./TrainingEndScreen"
import QuickRecordScreen from "./QuickRecordScreen"
import type { QuickRecordSaveData } from "./QuickRecordScreen"
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
import type { ExerciseId, RegisteredExercise, TrainingMenu } from "./MenuEditorScreen"
import SettingsScreen from "./SettingsScreen"
import type { PersonalWorkspace, TeamWorkspace, Workspace } from "./workspace"

const INITIAL_WORKSPACES: Workspace[] = []
const INITIAL_TEAM_MEMBERS: TeamMember[] = []

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

function MiniCalendar({ activities, filter, onDaySelect }: { activities?: SharedRecord[]; filter?: string[]; onDaySelect?: (day: number) => void }) {
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
          const memberColors: Record<string, string> = {}
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
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [onboarding, setOnboarding] = useState<boolean | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [onboardingError, setOnboardingError] = useState<string | null>(null)
  const [profileExists, setProfileExists] = useState(false)
  const [profileRefresh, setProfileRefresh] = useState(0)
  const [screen, setScreen] = useState<"home" | "workout" | "quick-record" | "history" | "menu-list" | "menu-editor" | "exercise-manager" | "team-create" | "team-member" | "team-manage" | "workspace-manager" | "growth" | "settings">("home")
  const [activeTab, setActiveTab] = useState<Tab>("home")
  const [wsIndex, setWsIndex] = useState(0)
  const [workspaces, setWorkspaces] = useState(INITIAL_WORKSPACES)
  const [workspaceLoading, setWorkspaceLoading] = useState(true)
  const [workspaceError, setWorkspaceError] = useState<string | null>(null)
  const [workspaceRefresh, setWorkspaceRefresh] = useState(0)
  const [wsMenuOpen, setWsMenuOpen] = useState(false)
  const [trainingTendency, setTrainingTendency] = useState("両方")
  const [restEnabled, setRestEnabled] = useState(true)
  const [restSeconds, setRestSeconds] = useState(90)
  const [startPressed, setStartPressed] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [menuPressedOpen, setMenuPressedOpen] = useState(false)
  const [menus, setMenus] = useState<TrainingMenu[]>([])
  const [menuLoading, setMenuLoading] = useState(false)
  const [menuSaving, setMenuSaving] = useState(false)
  const [menuError, setMenuError] = useState<string | null>(null)
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>(INITIAL_HISTORY_RECORDS)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [workoutSaving, setWorkoutSaving] = useState(false)
  const [workoutSaveError, setWorkoutSaveError] = useState<string | null>(null)
  const [registeredExercises, setRegisteredExercises] = useState<RegisteredExercise[]>([])
  const [exerciseLoading, setExerciseLoading] = useState(false)
  const [exerciseSaving, setExerciseSaving] = useState(false)
  const [exerciseError, setExerciseError] = useState<string | null>(null)
  const [editingMenu, setEditingMenu] = useState<TrainingMenu | undefined>()
  const [workoutMenu, setWorkoutMenu] = useState<TrainingMenu | undefined>()
  const [menuListBack, setMenuListBack] = useState<"home" | "settings">("settings")
  const [selectedMember, setSelectedMember] = useState<TeamMember | undefined>()
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>()
  const [activityFilter, setActivityFilter] = useState<string[]>([])
  const [selectedActivityDay, setSelectedActivityDay] = useState<number | null>(null)
  const [teamMembers, setTeamMembers] = useState(INITIAL_TEAM_MEMBERS)
  const [growthPhotos, setGrowthPhotos] = useState<GrowthPhoto[]>([
    { id: 1, ownerId: 1, owner: "田中 太郎", day: 14, when: "8月14日", visibility: "自分のみ", note: "朝の記録", tone: "#6b5c55" },
    { id: 2, ownerId: 1, owner: "田中 太郎", day: 7, when: "8月7日", visibility: "自分のみ", tone: "#5e6659" },
    { id: 3, ownerId: 1, owner: "田中 太郎", day: 7, when: "8月7日", visibility: "自分のみ", tone: "#6a5a52" },
  ])
  const [sharedRecords, setSharedRecords] = useState<SharedRecord[]>([])
  const [teamCreating, setTeamCreating] = useState(false)
  const [teamCreateError, setTeamCreateError] = useState<string | null>(null)

  const loadMenus = useCallback(async () => {
    if (!user) {
      setMenus([])
      setMenuLoading(false)
      return false
    }

    setMenuLoading(true)
    setMenuError(null)
    const { data, error } = await supabase
      .from("workout_menus")
      .select("id, name, workout_menu_exercises(id, exercise_id, position, base_set_count, exercises(id, name, kind))")
      .eq("owner_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })

    setMenuLoading(false)
    if (error) {
      setMenuError("メニューを読み込めませんでした。通信を確認して再試行してください。")
      return false
    }

    type MenuRow = {
      id: string
      name: string
      workout_menu_exercises: Array<{
        id: string
        exercise_id: ExerciseId
        position: number
        base_set_count: number
        exercises: { name: string; kind: RegisteredExercise["kind"] } | { name: string; kind: RegisteredExercise["kind"] }[] | null
      }> | null
    }
    const loadedMenus = ((data ?? []) as MenuRow[]).map((menu) => ({
      id: String(menu.id),
      name: menu.name,
      exercises: [...(menu.workout_menu_exercises ?? [])]
        .sort((first, second) => first.position - second.position)
        .map((item) => ({
          id: String(item.id),
          exerciseId: item.exercise_id,
          name: Array.isArray(item.exercises) ? item.exercises[0]?.name ?? "削除済みの種目" : item.exercises?.name ?? "削除済みの種目",
          kind: Array.isArray(item.exercises) ? item.exercises[0]?.kind : item.exercises?.kind,
          sets: Number(item.base_set_count),
        })),
    }))
    setMenus(loadedMenus)
    return true
  }, [user])

  const loadHistory = useCallback(async () => {
    if (!user) {
      setHistoryRecords([])
      setHistoryLoading(false)
      return false
    }

    setHistoryLoading(true)
    setHistoryError(null)
    const { data, error } = await supabase
      .from("workout_sessions")
      .select("id, type, menu_name_snapshot, started_at, ended_at, note, workout_session_shares(workspaces(name)), workout_exercises(id, exercise_name_snapshot, kind_snapshot, position, workout_sets(id, position, weight_kg, reps))")
      .eq("owner_id", user.id)
      .is("deleted_at", null)
      .order("started_at", { ascending: false })

    setHistoryLoading(false)
    if (error) {
      console.error("Workout history load failed:", error)
      setHistoryError("履歴を読み込めませんでした。通信を確認して再試行してください。")
      return false
    }

    type SessionRow = {
      id: string
      type: "normal" | "quick"
      menu_name_snapshot: string | null
      started_at: string
      ended_at: string
      note: string | null
      workout_session_shares: Array<{ workspaces: { name: string } | { name: string }[] | null }> | null
      workout_exercises: Array<{
        id: string
        exercise_name_snapshot: string
        kind_snapshot: string
        position: number
        workout_sets: Array<{ id: string; position: number; weight_kg: number | null; reps: number }> | null
      }> | null
    }
    const records = ((data ?? []) as SessionRow[]).map((session) => {
      const sharedWorkspace = session.workout_session_shares?.[0]?.workspaces
      const sharedWorkspaceName = Array.isArray(sharedWorkspace) ? sharedWorkspace[0]?.name : sharedWorkspace?.name
      const share = sharedWorkspaceName ? `チーム · ${sharedWorkspaceName}` : "自分のみ"
      const exercises = [...(session.workout_exercises ?? [])]
        .sort((first, second) => first.position - second.position)
        .map((exercise) => ({
          id: String(exercise.id),
          name: exercise.exercise_name_snapshot,
          kind: exercise.kind_snapshot,
          position: exercise.position,
          sets: [...(exercise.workout_sets ?? [])]
            .sort((first, second) => first.position - second.position)
            .map((set) => ({ id: String(set.id), position: set.position, weightKg: exercise.kind_snapshot === "自重" || set.weight_kg === null ? null : Number(set.weight_kg), reps: Number(set.reps) })),
        }))
      const startedAt = new Date(session.started_at)
      const date = new Intl.DateTimeFormat("ja-JP", { month: "long", day: "numeric", weekday: "short" }).format(startedAt)
      if (session.type === "quick") {
        const exercise = exercises[0]
        const set = exercise?.sets[0]
        return {
          id: String(session.id),
          date,
          day: startedAt.getDate(),
          title: exercise?.name ?? "削除済みの種目",
          result: set ? `${set.weightKg !== null ? `${set.weightKg}kg × ` : ""}${set.reps}回` : "完了セットなし",
          sets: "1セット",
          duration: "—",
          share,
          quick: true,
          performedAt: session.started_at,
        } satisfies HistoryRecord
      }
      const firstSet = exercises.flatMap((exercise) => exercise.sets)[0]
      const durationMinutes = Math.max(0, Math.round((new Date(session.ended_at).getTime() - startedAt.getTime()) / 60000))
      return {
        id: String(session.id),
        date,
        day: startedAt.getDate(),
        title: session.menu_name_snapshot ?? "トレーニング",
        result: firstSet ? `${firstSet.weightKg !== null ? `${firstSet.weightKg}kg × ` : ""}${firstSet.reps}回` : "完了セットなし",
        sets: `${exercises.length}種目 · ${exercises.reduce((total, exercise) => total + exercise.sets.length, 0)}セット`,
        duration: `${durationMinutes}分`,
        share,
        normal: { startedAt: session.started_at, endedAt: session.ended_at, note: session.note, exercises },
      } satisfies HistoryRecord
    })
    setHistoryRecords(records)
    return true
  }, [user])

  useEffect(() => {
    let active = true

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let active = true

    if (!user) {
      setOnboarding(null)
      setProfileLoading(false)
      setProfileError(null)
      setOnboardingError(null)
      setProfileExists(false)
      return () => { active = false }
    }

    const loadProfile = async () => {
      setProfileLoading(true)
      setProfileError(null)
      const { data, error } = await supabase
        .from("profiles")
        .select("id, onboarding_completed, training_preference")
        .eq("id", user.id)
        .maybeSingle()

      if (!active) return
      setProfileLoading(false)
      if (error) {
        setProfileError("プロフィールを読み込めませんでした。通信を確認して再試行してください。")
        return
      }
      setProfileExists(Boolean(data))
      setTrainingTendency(data?.training_preference ?? "両方")
      setOnboarding(!data?.onboarding_completed)
    }

    void loadProfile()
    return () => { active = false }
  }, [user?.id, profileRefresh])

  useEffect(() => {
    let active = true

    if (!user) {
      setWorkspaces([])
      setWsIndex(0)
      setWorkspaceLoading(true)
      setWorkspaceError(null)
      return () => { active = false }
    }

    if (profileLoading || onboarding === null || profileError) {
      return () => { active = false }
    }

    const loadWorkspaces = async () => {
      setWorkspaceLoading(true)
      setWorkspaceError(null)

      const { error: personalWorkspaceError } = await supabase.rpc("create_personal_workspace")
      if (personalWorkspaceError) throw personalWorkspaceError

      const { data, error } = await supabase
        .from("workspace_members")
        .select("system_role, workspaces!inner(id, name, type)")
        .is("left_at", null)
        .is("workspaces.deleted_at", null)

      if (error) throw error

      type MembershipRow = {
        system_role: "owner" | "admin" | "member"
        workspaces: { id: string; name: string; type: "personal" | "team" } | { id: string; name: string; type: "personal" | "team" }[] | null
      }
      const loaded: Workspace[] = ((data ?? []) as MembershipRow[])
        .flatMap<Workspace>((membership) => {
          const workspace = Array.isArray(membership.workspaces) ? membership.workspaces[0] : membership.workspaces
          if (!workspace) return []
          if (workspace.type === "personal") return [{ id: workspace.id, name: workspace.name, type: "個人" } satisfies PersonalWorkspace]
          return [{ id: workspace.id, name: workspace.name, type: "チーム", systemRole: membership.system_role } satisfies TeamWorkspace]
        })
        .sort((first, second) => Number(second.type === "個人") - Number(first.type === "個人"))

      if (!loaded.some((workspace) => workspace.type === "個人")) throw new Error("Personal workspace missing")
      if (!active) return
      setWorkspaces(loaded)
      setWsIndex((current) => Math.min(current, loaded.length - 1))
      setWorkspaceLoading(false)
    }

    void loadWorkspaces().catch((error) => {
      if (!active) return
      console.error("Workspace load failed:", error)
      setWorkspaceError("ワークスペースを取得できませんでした。通信を確認して再試行してください。")
      setWorkspaceLoading(false)
    })

    return () => { active = false }
  }, [user?.id, profileLoading, onboarding, profileError, workspaceRefresh])

  useEffect(() => {
    let active = true
    const teamIds = workspaces.filter((workspace): workspace is TeamWorkspace => workspace.type === "チーム").map((workspace) => workspace.id)

    if (!user || teamIds.length === 0) {
      setSharedRecords([])
      return () => { active = false }
    }

    const loadSharedRecords = async () => {
      setSharedRecords([])
      const { data, error } = await supabase
        .from("workout_session_shares")
        .select("id, workspace_id, shared_at, workout_sessions!inner(owner_id, started_at, workout_exercises(exercise_name_snapshot, position, workout_sets(weight_kg, reps, position)))")
        .in("workspace_id", teamIds)
        .order("shared_at", { ascending: false })

      if (error) throw error

      type ShareRow = {
        id: string
        workspace_id: string
        shared_at: string
        workout_sessions: {
          owner_id: string
          started_at: string
          workout_exercises: Array<{
            exercise_name_snapshot: string
            position: number
            workout_sets: Array<{ weight_kg: number | null; reps: number; position: number }> | null
          }> | null
        } | {
          owner_id: string
          started_at: string
          workout_exercises: Array<{
            exercise_name_snapshot: string
            position: number
            workout_sets: Array<{ weight_kg: number | null; reps: number; position: number }> | null
          }> | null
        }[] | null
      }

      const records = ((data ?? []) as unknown as ShareRow[]).flatMap((share) => {
        const session = Array.isArray(share.workout_sessions) ? share.workout_sessions[0] : share.workout_sessions
        if (!session) return []
        const exercises = [...(session.workout_exercises ?? [])].sort((first, second) => first.position - second.position)
        const firstExercise = exercises[0]
        const firstSet = [...(firstExercise?.workout_sets ?? [])].sort((first, second) => first.position - second.position)[0]
        const performedAt = new Date(session.started_at)
        return [{
          id: share.id,
          teamId: share.workspace_id,
          memberId: session.owner_id,
          member: session.owner_id === user.id ? "自分" : "メンバー",
          when: new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(performedAt),
          exercise: firstExercise?.exercise_name_snapshot ?? "トレーニング",
          weight: firstSet?.weight_kg === null || firstSet?.weight_kg === undefined ? undefined : Number(firstSet.weight_kg),
          reps: Number(firstSet?.reps ?? 0),
          day: performedAt.getDate(),
          sets: exercises.reduce((total, exercise) => total + (exercise.workout_sets?.length ?? 0), 0),
        } satisfies SharedRecord]
      })

      if (active) setSharedRecords(records)
    }

    void loadSharedRecords().catch((error) => console.error("Shared activity load failed:", error))
    return () => { active = false }
  }, [user?.id, workspaces])

  useEffect(() => {
    let active = true
    const current = workspaces[wsIndex]
    if (!user || !current || current.type !== "チーム") {
      setTeamMembers([])
      return () => { active = false }
    }

    const loadTeamMembers = async () => {
      const { data, error } = await supabase
        .from("workspace_members")
        .select("user_id, system_role")
        .eq("workspace_id", current.id)
        .is("left_at", null)
      if (error) throw error

      if (!active) return
      setTeamMembers((data ?? []).map((member) => ({
        id: member.user_id,
        name: member.user_id === user.id ? "自分" : "メンバー",
        systemRole: member.system_role === "owner" ? "Owner" : member.system_role === "admin" ? "Admin" : "Member",
        weeklyCount: sharedRecords.filter((record) => record.teamId === current.id && record.memberId === member.user_id).length,
        recent: "",
      } satisfies TeamMember)))
    }

    void loadTeamMembers().catch((error) => console.error("Team member load failed:", error))
    return () => { active = false }
  }, [user?.id, workspaces, wsIndex, sharedRecords])

  useEffect(() => {
    let active = true

    if (!user) {
      setRegisteredExercises([])
      setExerciseLoading(false)
      return () => { active = false }
    }

    const loadExercises = async () => {
      setExerciseLoading(true)
      setExerciseError(null)
      const { data, error } = await supabase
        .from("exercises")
        .select("id, name, kind, created_at")
        .is("deleted_at", null)
        .order("created_at", { ascending: true })

      if (!active) return
      setExerciseLoading(false)
      if (error) {
        setExerciseError("種目を読み込めませんでした。通信を確認して再試行してください。")
        return
      }
      setRegisteredExercises(data.map((exercise) => ({
        id: exercise.id as ExerciseId,
        name: exercise.name,
        kind: exercise.kind as RegisteredExercise["kind"],
      })))
    }

    void loadExercises()
    return () => { active = false }
  }, [user?.id])

  useEffect(() => {
    void loadMenus()
  }, [loadMenus])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error("Supabase sign out failed:", error.message)
  }

  if (authLoading) return <main style={{ minHeight: "100vh", background: "#0d0d0d" }} />
  if (!user) return <LoginScreen />
  if (profileLoading || onboarding === null) return <main style={{ minHeight: "100vh", background: "#0d0d0d" }} />
  if (profileError) return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#0d0d0d", color: "#f0f0f0" }}><div style={{ maxWidth: 360 }}><p style={{ color: "#f09a9a", fontSize: 14, lineHeight: 1.6 }}>{profileError}</p><button onClick={() => setProfileRefresh((value) => value + 1)} style={{ marginTop: 18, padding: "11px 14px", border: "1px solid #3a3a3a", borderRadius: 8, background: "#202020", color: "#c8ff00", cursor: "pointer" }}>再試行</button></div></main>
  if (workspaceLoading) return <main style={{ minHeight: "100vh", background: "#0d0d0d" }} />
  if (workspaceError) return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#0d0d0d", color: "#f0f0f0" }}><div style={{ maxWidth: 360 }}><p style={{ color: "#f09a9a", fontSize: 14, lineHeight: 1.6 }}>{workspaceError}</p><button onClick={() => setWorkspaceRefresh((value) => value + 1)} style={{ marginTop: 18, padding: "11px 14px", border: "1px solid #3a3a3a", borderRadius: 8, background: "#202020", color: "#c8ff00", cursor: "pointer" }}>再試行</button></div></main>

  const currentWorkspace = workspaces[wsIndex]
  const currentTeamWorkspace = currentWorkspace?.type === "チーム" ? currentWorkspace : undefined
  if (!currentWorkspace) return <main style={{ minHeight: "100vh", background: "#0d0d0d" }} />

  const completeOnboarding = async (teamUse: boolean, tendency: string) => {
    setProfileSaving(true)
    setOnboardingError(null)
    const profile = {
      display_name: user.user_metadata.full_name ?? user.email?.split("@")[0] ?? "ユーザー",
      training_preference: tendency,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    }
    const { error } = profileExists
      ? await supabase.from("profiles").update(profile).eq("id", user.id)
      : await supabase.from("profiles").insert({ id: user.id, ...profile })

    setProfileSaving(false)
    if (error) {
      setOnboardingError("初回設定を保存できませんでした。もう一度お試しください。")
      return
    }
    setProfileExists(true)
    setTrainingTendency(tendency)
    setOnboarding(false)
    if (teamUse) setScreen("team-create")
  }

  const saveExercise = async (exercise: RegisteredExercise, isNew: boolean) => {
    setExerciseSaving(true)
    setExerciseError(null)

    if (isNew) {
      const { data, error } = await supabase
        .from("exercises")
        .insert({ owner_id: user.id, name: exercise.name, kind: exercise.kind })
        .select("id, name, kind, created_at")
        .single()

      setExerciseSaving(false)
      if (error) {
        setExerciseError("種目を保存できませんでした。もう一度お試しください。")
        return false
      }
      const savedExercise: RegisteredExercise = { id: data.id as ExerciseId, name: data.name, kind: data.kind as RegisteredExercise["kind"] }
      setRegisteredExercises((current) => [...current, savedExercise])
      return true
    }

    const { data, error } = await supabase
      .from("exercises")
      .update({ name: exercise.name, kind: exercise.kind })
      .eq("id", exercise.id)
      .select("id, name, kind, created_at")
      .single()

    setExerciseSaving(false)
    if (error) {
      setExerciseError("種目を保存できませんでした。もう一度お試しください。")
      return false
    }
    const savedExercise: RegisteredExercise = { id: data.id as ExerciseId, name: data.name, kind: data.kind as RegisteredExercise["kind"] }
    setRegisteredExercises((current) => current.map((entry) => entry.id === savedExercise.id ? savedExercise : entry))
    setMenus((current) => current.map((menu) => ({ ...menu, exercises: menu.exercises.map((item) => item.exerciseId === savedExercise.id ? { ...item, name: savedExercise.name } : item) })))
    return true
  }

  const deleteExercise = async (id: ExerciseId) => {
    setExerciseSaving(true)
    setExerciseError(null)
    const { error } = await supabase
      .from("exercises")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)

    setExerciseSaving(false)
    if (error) {
      setExerciseError("種目を削除できませんでした。もう一度お試しください。")
      return false
    }
    setRegisteredExercises((current) => current.filter((exercise) => exercise.id !== id))
    return true
  }

  const saveWorkoutSession = async (data: WorkoutSaveData) => {
    const invalidExercise = data.exercises.find((exercise) => !exercise.exerciseId || !exercise.kind)
    if (invalidExercise) {
      setWorkoutSaveError(`「${invalidExercise.name || "未選択の種目"}」の種目情報が不足しているため保存できません。`)
      return false
    }

    setWorkoutSaving(true)
    setWorkoutSaveError(null)
    const { data: session, error: sessionError } = await supabase
      .from("workout_sessions")
      .insert({
        owner_id: user.id,
        menu_id: workoutMenu?.id ?? null,
        menu_name_snapshot: workoutMenu?.name ?? "トレーニング",
        type: "normal",
        started_at: data.startedAt,
        ended_at: data.endedAt,
        note: data.note || null,
      })
      .select("id")
      .single()

    if (sessionError || !session) {
      console.error("Workout save failed at workout_sessions:", sessionError)
      setWorkoutSaving(false)
      setWorkoutSaveError("トレーニング本体を保存できませんでした。もう一度お試しください。")
      return false
    }

    for (const [exercisePosition, exercise] of data.exercises.entries()) {
      const { data: savedExercise, error: exerciseError } = await supabase
        .from("workout_exercises")
        .insert({
          session_id: session.id,
          exercise_id: exercise.exerciseId,
          exercise_name_snapshot: exercise.name,
          kind_snapshot: exercise.kind,
          position: exercisePosition,
        })
        .select("id")
        .single()

      if (exerciseError || !savedExercise) {
        console.error("Workout save incomplete at workout_exercises:", { sessionId: session.id, exercise: exercise.name, error: exerciseError })
        setWorkoutSaving(false)
        setWorkoutSaveError("トレーニング本体は保存されましたが、種目の保存に失敗しました。記録が不完全な可能性があります。")
        return false
      }

      if (!exercise.sets.length) continue
      const { error: setsError } = await supabase
        .from("workout_sets")
        .insert(exercise.sets.map((set, setPosition) => ({
          workout_exercise_id: savedExercise.id,
          position: set.position ?? setPosition,
          weight_kg: exercise.kind === "自重" ? null : set.weight,
          reps: set.reps,
          completed_at: data.endedAt,
        })))

      if (setsError) {
        console.error("Workout save incomplete at workout_sets:", { sessionId: session.id, workoutExerciseId: savedExercise.id, exercise: exercise.name, error: setsError })
        setWorkoutSaving(false)
        setWorkoutSaveError("トレーニング本体と種目は保存されましたが、セットの保存に失敗しました。記録が不完全な可能性があります。")
        return false
      }
    }

    if (currentTeamWorkspace) {
      const { error: shareError } = await supabase
        .from("workout_session_shares")
        .insert({ workout_session_id: session.id, workspace_id: currentTeamWorkspace.id })

      if (shareError) {
        console.error("Workout session share failed:", { sessionId: session.id, workspaceId: currentTeamWorkspace.id, error: shareError })
        await loadHistory()
        setWorkoutSaving(false)
        setWorkoutSaveError("トレーニング記録は保存しましたが、チーム共有に失敗しました。履歴には保存されています。")
        return false
      }
    }

    const reloaded = await loadHistory()
    setWorkoutSaving(false)
    if (!reloaded) {
      setWorkoutSaveError("保存しましたが、履歴を読み込めませんでした。履歴画面で再試行してください。")
      return false
    }
    setActiveTab("history")
    setScreen("history")
    return true
  }

  const loadPreviousSet = async (exerciseId: ExerciseId, kind: RegisteredExercise["kind"]) => {
    const { data, error } = await supabase
      .from("workout_sessions")
      .select("workout_exercises!inner(exercise_id, workout_sets!inner(weight_kg, reps, completed_at))")
      .eq("owner_id", user.id)
      .is("deleted_at", null)
      .eq("workout_exercises.exercise_id", exerciseId)
      .not("workout_exercises.workout_sets.completed_at", "is", null)

    if (error) {
      console.error("Previous set load failed:", error)
      return null
    }

    type PreviousSetRow = {
      workout_exercises: Array<{
        workout_sets: Array<{ weight_kg: number | null; reps: number; completed_at: string | null }> | null
      }> | null
    }
    const latestSet = ((data ?? []) as PreviousSetRow[])
      .flatMap((session) => session.workout_exercises ?? [])
      .flatMap((exercise) => exercise.workout_sets ?? [])
      .reduce<{ weight_kg: number | null; reps: number; completed_at: string } | null>((latest, set) => {
        if (!set.completed_at) return latest
        if (!latest || new Date(set.completed_at).getTime() > new Date(latest.completed_at).getTime()) return { ...set, completed_at: set.completed_at }
        return latest
      }, null)

    return latestSet ? { weight: kind === "自重" || latestSet.weight_kg === null ? null : Number(latestSet.weight_kg), reps: Number(latestSet.reps) } : null
  }

  const saveQuickRecord = async (data: QuickRecordSaveData) => {
    const recordedAt = new Date().toISOString()
    const { data: session, error: sessionError } = await supabase
      .from("workout_sessions")
      .insert({
        owner_id: user.id,
        menu_id: null,
        menu_name_snapshot: null,
        type: "quick",
        started_at: recordedAt,
        ended_at: recordedAt,
        note: null,
      })
      .select("id")
      .single()

    if (sessionError || !session) {
      console.error("Quick record save failed at workout_sessions:", sessionError)
      return "記録本体を保存できませんでした。もう一度お試しください。"
    }

    const { data: exercise, error: exerciseError } = await supabase
      .from("workout_exercises")
      .insert({
        session_id: session.id,
        exercise_id: data.exerciseId,
        exercise_name_snapshot: data.exerciseName,
        kind_snapshot: data.kind,
        position: 0,
      })
      .select("id")
      .single()

    if (exerciseError || !exercise) {
      console.error("Quick record save incomplete at workout_exercises:", { sessionId: session.id, error: exerciseError })
      return "記録本体は保存されましたが、種目の保存に失敗しました。記録が不完全な可能性があります。"
    }

    const { error: setError } = await supabase
      .from("workout_sets")
      .insert({
        workout_exercise_id: exercise.id,
        position: 0,
        weight_kg: data.kind === "自重" ? null : data.weight,
        reps: data.reps,
        completed_at: recordedAt,
      })

    if (setError) {
      console.error("Quick record save incomplete at workout_sets:", { sessionId: session.id, workoutExerciseId: exercise.id, error: setError })
      return "記録本体と種目は保存されましたが、セットの保存に失敗しました。記録が不完全な可能性があります。"
    }

    if (data.shareWorkspaceId) {
      const { error: shareError } = await supabase
        .from("workout_session_shares")
        .insert({ workout_session_id: session.id, workspace_id: data.shareWorkspaceId })
      if (shareError) {
        console.error("Quick record share failed:", { sessionId: session.id, workspaceId: data.shareWorkspaceId, error: shareError })
        await loadHistory()
        return "記録は保存しましたが、チーム共有に失敗しました。履歴には保存されています。"
      }
    }

    if (!await loadHistory()) return "保存しましたが、履歴を読み込めませんでした。履歴画面で再試行してください。"
    return null
  }

  const saveMenu = async (draft: TrainingMenu, createdExercises: RegisteredExercise[], isNew: boolean) => {
    setMenuSaving(true)
    setMenuError(null)

    const savedExercises: RegisteredExercise[] = []
    for (const exercise of createdExercises) {
      const { data, error } = await supabase
        .from("exercises")
        .insert({ owner_id: user.id, name: exercise.name, kind: exercise.kind })
        .select("id, name, kind")
        .single()

      if (error) {
        if (savedExercises.length) setRegisteredExercises((current) => [...current, ...savedExercises])
        setMenuSaving(false)
        setMenuError(savedExercises.length
          ? "新しい種目の一部は保存されましたが、残りの保存に失敗しました。"
          : "新しい種目を保存できませんでした。もう一度お試しください。")
        return false
      }
      savedExercises.push({ id: data.id as ExerciseId, name: data.name, kind: data.kind as RegisteredExercise["kind"] })
    }

    if (savedExercises.length) setRegisteredExercises((current) => [...current, ...savedExercises])
    const resolvedExercises = draft.exercises.map((item) => {
      const createdIndex = createdExercises.findIndex((exercise) => exercise.id === item.exerciseId)
      const savedExercise = createdIndex >= 0 ? savedExercises[createdIndex] : undefined
      return savedExercise ? { ...item, exerciseId: savedExercise.id, name: savedExercise.name } : item
    })

    if (isNew) {
      const { data: menu, error: menuError } = await supabase
        .from("workout_menus")
        .insert({ owner_id: user.id, name: draft.name })
        .select("id")
        .single()

      if (menuError || !menu) {
        setMenuSaving(false)
        setMenuError("メニューを保存できませんでした。もう一度お試しください。")
        return false
      }

      const { error: exerciseError } = await supabase
        .from("workout_menu_exercises")
        .insert(resolvedExercises.map((exercise, position) => ({
          menu_id: menu.id,
          exercise_id: exercise.exerciseId,
          position,
          base_set_count: exercise.sets,
        })))

      if (exerciseError) {
        const { error: rollbackError } = await supabase
          .from("workout_menus")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", menu.id)
        const message = rollbackError
          ? "メニュー本体は保存されましたが、種目構成の保存と後片付けに失敗しました。メニューが残っている可能性があります。"
          : "メニュー本体は保存されましたが、種目構成の保存に失敗しました。保存済みメニューは非表示に戻しました。"
        const reloaded = await loadMenus()
        setMenuSaving(false)
        setMenuError(reloaded ? message : `${message} 最新状態の再読み込みにも失敗しました。`)
        setEditingMenu(undefined)
        setScreen("menu-list")
        return false
      }
    } else {
      const { error: nameError } = await supabase
        .from("workout_menus")
        .update({ name: draft.name, updated_at: new Date().toISOString() })
        .eq("id", draft.id)

      if (nameError) {
        setMenuSaving(false)
        setMenuError("メニュー名を保存できませんでした。もう一度お試しください。")
        return false
      }

      const { error: deleteItemsError } = await supabase
        .from("workout_menu_exercises")
        .delete()
        .eq("menu_id", draft.id)

      if (deleteItemsError) {
        const reloaded = await loadMenus()
        setMenuSaving(false)
        setMenuError(reloaded
          ? "メニュー名は保存されましたが、種目構成の更新に失敗しました。最新状態を読み込みました。"
          : "メニュー名は保存されましたが、種目構成の更新と最新状態の読み込みに失敗しました。")
        setEditingMenu(undefined)
        setScreen("menu-list")
        return false
      }

      const { error: insertItemsError } = await supabase
        .from("workout_menu_exercises")
        .insert(resolvedExercises.map((exercise, position) => ({
          menu_id: draft.id,
          exercise_id: exercise.exerciseId,
          position,
          base_set_count: exercise.sets,
        })))

      if (insertItemsError) {
        const reloaded = await loadMenus()
        setMenuSaving(false)
        setMenuError(reloaded
          ? "メニュー名は保存されましたが、種目構成の保存に失敗しました。最新状態を読み込みました。"
          : "メニュー名は保存されましたが、種目構成の保存と最新状態の読み込みに失敗しました。")
        setEditingMenu(undefined)
        setScreen("menu-list")
        return false
      }
    }

    const reloaded = await loadMenus()
    setMenuSaving(false)
    if (!reloaded) {
      setMenuError("保存しましたが、最新状態を読み込めませんでした。再試行してください。")
      return false
    }
    setEditingMenu(undefined)
    setScreen("menu-list")
    return true
  }

  const deleteMenu = async (id: string) => {
    setMenuSaving(true)
    setMenuError(null)
    const { error } = await supabase
      .from("workout_menus")
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", id)
      .is("deleted_at", null)

    if (error) {
      setMenuSaving(false)
      setMenuError("メニューを削除できませんでした。もう一度お試しください。")
      return false
    }

    const reloaded = await loadMenus()
    setMenuSaving(false)
    if (!reloaded) {
      setMenus((current) => current.filter((menu) => menu.id !== id))
      setMenuError("削除しましたが、最新状態を読み込めませんでした。再試行してください。")
    }
    setEditingMenu(undefined)
    setScreen("menu-list")
    return true
  }

  const teamWorkspaces = workspaces.filter((workspace): workspace is TeamWorkspace => workspace.type === "チーム")
  const openMember = (member: TeamMember) => { setSelectedMember(member); setSelectedTeamId(currentTeamWorkspace?.id); setScreen("team-member") }

  if (onboarding) return <OnboardingScreen onComplete={completeOnboarding} saving={profileSaving} error={onboardingError} />

  if (screen === "workout") {
    return <WorkoutScreen onBack={() => setScreen("home")} menu={workoutMenu} registeredExercises={registeredExercises} saving={workoutSaving} error={workoutSaveError} restEnabled={restEnabled} restDuration={restSeconds} onSave={saveWorkoutSession} />
  }
  if (screen === "quick-record") {
    return <QuickRecordScreen onBack={() => setScreen("home")} teams={teamWorkspaces} exercises={registeredExercises} onLoadPreviousSet={loadPreviousSet} onSaveRecord={saveQuickRecord} />
  }
  if (screen === "history") {
    return <HistoryScreen onHome={() => { setActiveTab("home"); setScreen("home") }} onQuick={() => setScreen("quick-record")} onSettings={() => setScreen("settings")} onGrowth={() => setScreen("growth")} records={historyRecords} loading={historyLoading} error={historyError} onRetry={() => void loadHistory()} onDelete={(id) => setHistoryRecords((current) => current.filter((record) => record.id !== id))} />
  }
  if (screen === "menu-list") {
    return <MenuListScreen menus={menus} loading={menuLoading} error={menuError} onRetry={() => void loadMenus()} onBack={() => setScreen(menuListBack)} onCreate={() => { setMenuError(null); setEditingMenu(undefined); setScreen("menu-editor") }} onEdit={(menu) => { setMenuError(null); setEditingMenu(menu); setScreen("menu-editor") }} onStart={(menu) => { setWorkoutMenu(menu); setScreen("workout") }} />
  }
  if (screen === "menu-editor") {
    return <MenuEditorScreen menu={editingMenu} registeredExercises={registeredExercises} saving={menuSaving} error={menuError} onBack={() => { setMenuError(null); setScreen("menu-list") }} onSave={saveMenu} onDelete={deleteMenu} />
  }
  if (screen === "exercise-manager") {
    return <ExerciseManagerScreen exercises={registeredExercises} menus={menus} loading={exerciseLoading} saving={exerciseSaving} error={exerciseError} onBack={() => setScreen("settings")} onSave={saveExercise} onDelete={deleteExercise} />
  }
  if (screen === "team-create") {
    return <TeamCreateScreen onBack={() => { setTeamCreateError(null); setScreen("settings") }} saving={teamCreating} error={teamCreateError} onCreate={async (name) => {
      setTeamCreating(true)
      setTeamCreateError(null)
      const { data: workspaceId, error: createError } = await supabase.rpc("create_team_workspace", { team_name: name })
      if (createError || !workspaceId) {
        console.error("Team workspace create failed:", createError ?? "No workspace ID returned")
        setTeamCreating(false)
        setTeamCreateError("チームを作成できませんでした。通信を確認して再試行してください。")
        return false
      }

      const { data: workspace, error: loadError } = await supabase
        .from("workspaces")
        .select("id, name")
        .eq("id", workspaceId)
        .single()
      setTeamCreating(false)
      if (loadError || !workspace) {
        console.error("Created team workspace load failed:", loadError ?? "Workspace not found")
        setTeamCreateError("チームは作成しましたが、一覧を更新できませんでした。再読み込みしてください。")
        return false
      }

      setWorkspaces((current) => [...current, { id: String(workspace.id), name: workspace.name, type: "チーム", systemRole: "owner" }])
      setWsIndex(workspaces.length)
      setScreen("home")
      return true
    }} />
  }
  if (screen === "team-member" && selectedMember) {
    return <TeamMemberScreen member={selectedMember} records={sharedRecords.filter((record) => record.teamId === selectedTeamId)} onBack={() => setScreen("home")} />
  }
  if (screen === "team-manage") return <TeamManageScreen teamName={currentTeamWorkspace?.name ?? "チーム"} members={teamMembers} records={sharedRecords.filter((record) => record.teamId === currentTeamWorkspace?.id)} currentRole="Owner" onBack={() => setScreen("workspace-manager")} onRoleChange={(id, systemRole) => setTeamMembers((current) => current.map((member) => member.id === id ? { ...member, systemRole } : member))} onRemoveRecord={(id) => setSharedRecords((current) => current.filter((record) => record.id !== id))} />
  if (screen === "workspace-manager") return <WorkspaceManagerScreen workspaces={workspaces} currentId={currentWorkspace.id} onBack={() => setScreen("settings")} onSelect={(id) => { setWsIndex(workspaces.findIndex((workspace) => workspace.id === id)); setScreen("home") }} onRename={(id, name) => setWorkspaces((current) => current.map((workspace) => workspace.id === id ? { ...workspace, name } : workspace))} onExit={(id) => { setWorkspaces((current) => current.filter((workspace) => workspace.id !== id)); setWsIndex(0) }} onCreateTeam={() => setScreen("team-create")} onManageTeam={(id) => { setWsIndex(workspaces.findIndex((workspace) => workspace.id === id)); setScreen("team-manage") }} />
  if (screen === "growth") return <GrowthScreen teamId={currentTeamWorkspace?.id} members={teamMembers.map((member) => ({ id: member.id, name: member.name, color: "#c8ff00" }))} photos={growthPhotos} onBack={() => setScreen("home")} onSave={(photo) => setGrowthPhotos((current) => [photo, ...current])} onUpdate={(photo) => setGrowthPhotos((current) => current.map((item) => item.id === photo.id ? { ...photo, teamId: photo.visibility === "チームに共有" ? currentTeamWorkspace?.id : photo.teamId } : item))} onDelete={(id) => setGrowthPhotos((current) => current.filter((photo) => photo.id !== id))} />
  if (screen === "settings") {
    return <SettingsScreen onHome={() => setScreen("home")} onQuick={() => setScreen("quick-record")} onHistory={() => setScreen("history")} onMenuEditor={() => { setMenuListBack("settings"); setScreen("menu-list") }} onExerciseManager={() => setScreen("exercise-manager")} onCreateTeam={() => setScreen("team-create")} onWorkspaceManager={() => setScreen("workspace-manager")} tendency={trainingTendency} onTendency={setTrainingTendency} workspaces={workspaces} currentWorkspaceId={currentWorkspace.id} onSelectWorkspace={(id) => setWsIndex(workspaces.findIndex((workspace) => workspace.id === id))} restEnabled={restEnabled} onRestEnabled={setRestEnabled} restSeconds={restSeconds} onRestSeconds={setRestSeconds} user={user} onSignOut={signOut} />
  }

  const isTeamWorkspace = currentWorkspace.type === "チーム"
  const teamActivities = currentTeamWorkspace ? sharedRecords.filter((record) => record.teamId === currentTeamWorkspace.id) : []
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
                onClick={() => { if (menus[0]) { setWorkoutMenu(menus[0]); setScreen("workout") } else { setMenuListBack("home"); setScreen("menu-list") } }}
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
            {isTeamWorkspace && <><div style={{ display: "flex", gap: 7, overflowX: "auto", marginBottom: 9, paddingBottom: 2 }}><button onClick={() => setActivityFilter([])} style={{ ...filterChipStyle, borderColor: activityFilter.length === 0 ? "#c8ff00" : "#333", color: activityFilter.length === 0 ? "#c8ff00" : "#aaa" }}>全員</button>{teamMembers.map((member) => <button key={member.id} onClick={() => setActivityFilter((current) => current.includes(member.id) ? current.filter((id) => id !== member.id) : [...current, member.id])} onDoubleClick={() => openMember(member)} title="ダブルタップで詳細" style={{ ...filterChipStyle, borderColor: activityFilter.includes(member.id) ? "#c8ff00" : "#333", color: activityFilter.includes(member.id) ? "#c8ff00" : "#aaa" }}>{member.name}</button>)}</div><div style={{ display: "flex", gap: 10, overflowX: "auto", marginBottom: 10 }}>{teamMembers.map((member) => <button key={member.id} onClick={() => openMember(member)} style={{ display: "flex", alignItems: "center", gap: 4, padding: 0, border: "none", background: "transparent", color: "#888", fontSize: 10, whiteSpace: "nowrap", cursor: "pointer" }}><i style={{ width: 6, height: 6, borderRadius: "50%", background: "#c8ff00" }} />{member.name}</button>)}</div></>}
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
          {isTeamWorkspace && <div style={{ padding: "0 24px 28px" }}><p style={{ fontSize: 11, color: "#777", letterSpacing: "0.1em", fontWeight: 500, marginBottom: 14 }}>メンバー</p><div style={{ background: "#171717", border: "1px solid #2a2a2a", borderRadius: 16, overflow: "hidden" }}>{teamMembers.map((member, index) => <button key={member.id} onClick={() => openMember(member)} style={{ display: "flex", width: "100%", alignItems: "center", gap: 10, padding: "13px 16px", border: "none", borderBottom: index < teamMembers.length - 1 ? "1px solid #282828" : "none", background: "transparent", color: "#f0f0f0", textAlign: "left", cursor: "pointer" }}><i style={{ width: 7, height: 7, borderRadius: "50%", background: "#c8ff00" }} /><span style={{ flex: 1, fontFamily: "Outfit", fontSize: 14, fontWeight: 700 }}>{member.name}</span><span style={{ color: "#777", fontSize: 12 }}>今週 {member.weeklyCount}回</span><span style={{ color: "#666", fontSize: 18 }}>›</span></button>)}</div></div>}
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
