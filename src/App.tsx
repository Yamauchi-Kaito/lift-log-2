import { useState, useEffect } from "react"
import WorkoutScreen from "./WorkoutScreen"

const WORKSPACES = ["自宅トレ", "ジムA", "ジムB（会社近く）"]

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

function MiniCalendar() {
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
          return (
            <div
              key={day}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                paddingTop: 3,
                paddingBottom: 3,
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
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  backgroundColor: isTraining ? "#c8ff00" : "transparent",
                  opacity: isTraining ? (day <= TODAY ? 1 : 0.3) : 0,
                }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BottomSheet({ open, onClose, onStartWorkout }: { open: boolean; onClose: () => void; onStartWorkout: () => void }) {
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
  const [screen, setScreen] = useState<"home" | "workout">("home")
  const [activeTab, setActiveTab] = useState<Tab>("home")
  const [wsIndex, setWsIndex] = useState(0)
  const [wsMenuOpen, setWsMenuOpen] = useState(false)
  const [startPressed, setStartPressed] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [menuPressedOpen, setMenuPressedOpen] = useState(false)

  if (screen === "workout") {
    return <WorkoutScreen onBack={() => setScreen("home")} />
  }

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
                    {WORKSPACES[wsIndex]}
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
              <div
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
                  color: "#888",
                }}
              >
                田
              </div>
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
                {WORKSPACES.map((ws, i) => (
                  <button
                    key={ws}
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
                        i < WORKSPACES.length - 1
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
                    {ws}
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
              </div>
            )}
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
              onClick={() => setScreen("workout")}
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
                onClick={() => setScreen("workout")}
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
                8月の実施状況
              </p>
              <span
                style={{ fontFamily: "Outfit", fontSize: 12, color: "#777" }}
              >
                {TRAINING_DAYS.size}回 / 今月
              </span>
            </div>
            <div
              style={{
                backgroundColor: "#171717",
                borderRadius: 16,
                border: "1px solid #2a2a2a",
                padding: "16px 16px 12px",
              }}
            >
              <MiniCalendar />
            </div>
          </div>
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
            onClick={() => setActiveTab("history")}
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
        </div>

        {/* Bottom sheet */}
        <BottomSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          onStartWorkout={() => { setSheetOpen(false); setScreen("workout") }}
        />
      </div>
    </div>
  )
}
