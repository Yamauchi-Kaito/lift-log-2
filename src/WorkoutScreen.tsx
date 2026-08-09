import { useState, useEffect, useRef, useCallback } from "react"

// ─── Types ───────────────────────────────────────────────

type SetData = {
  id: number
  weight: number
  reps: number
  completed: boolean
}

type Exercise = {
  id: number
  name: string
  prevSets: { weight: number; reps: number }[]
  sets: SetData[]
}

// ─── Initial data (前回記録を初期値として使用) ──────────────

let _exId = 4
let _setId = 10

const INITIAL_EXERCISES: Exercise[] = [
  {
    id: 1,
    name: "ベンチプレス",
    prevSets: [
      { weight: 80, reps: 8 },
      { weight: 80, reps: 7 },
      { weight: 80, reps: 6 },
    ],
    sets: [
      { id: 1, weight: 80, reps: 8, completed: false },
      { id: 2, weight: 80, reps: 7, completed: false },
      { id: 3, weight: 80, reps: 6, completed: false },
    ],
  },
  {
    id: 2,
    name: "インクラインDB",
    prevSets: [
      { weight: 30, reps: 10 },
      { weight: 30, reps: 10 },
      { weight: 30, reps: 9 },
    ],
    sets: [
      { id: 4, weight: 30, reps: 10, completed: false },
      { id: 5, weight: 30, reps: 10, completed: false },
      { id: 6, weight: 30, reps: 9, completed: false },
    ],
  },
  {
    id: 3,
    name: "ケーブルフライ",
    prevSets: [
      { weight: 15, reps: 12 },
      { weight: 15, reps: 12 },
      { weight: 15, reps: 12 },
    ],
    sets: [
      { id: 7, weight: 15, reps: 12, completed: false },
      { id: 8, weight: 15, reps: 12, completed: false },
      { id: 9, weight: 15, reps: 12, completed: false },
    ],
  },
]

// ─── Helpers ─────────────────────────────────────────────

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

// ─── RestTimer ───────────────────────────────────────────

function RestTimer({
  seconds,
  onAdjust,
  onDismiss,
}: {
  seconds: number
  onAdjust: (delta: number) => void
  onDismiss: () => void
}) {
  const urgent = seconds <= 10
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 430,
        backgroundColor: "#141414",
        borderTop: `1px solid ${urgent ? "#c8ff00" : "#252525"}`,
        zIndex: 30,
        padding: "14px 20px 28px",
        display: "flex",
        alignItems: "center",
        gap: 0,
      }}
    >
      {/* Label + time */}
      <div style={{ flex: 1 }}>
        <p
          style={{
            fontFamily: "Outfit",
            fontSize: 11,
            color: urgent ? "#c8ff00" : "#555",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 2,
            fontWeight: 500,
          }}
        >
          休憩中
        </p>
        <span
          style={{
            fontFamily: "Outfit",
            fontSize: 38,
            fontWeight: 800,
            color: urgent ? "#c8ff00" : "#f0f0f0",
            letterSpacing: "-0.03em",
            lineHeight: 1,
          }}
        >
          {formatTime(seconds)}
        </span>
      </div>

      {/* Adjust buttons */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          onClick={() => onAdjust(-10)}
          style={{
            height: 48,
            paddingInline: 16,
            backgroundColor: "#1e1e1e",
            border: "1px solid #2a2a2a",
            borderRadius: 10,
            color: "#aaa",
            fontFamily: "Outfit",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: "0.02em",
          }}
        >
          −10
        </button>
        <button
          onClick={() => onAdjust(10)}
          style={{
            height: 48,
            paddingInline: 16,
            backgroundColor: "#1e1e1e",
            border: "1px solid #2a2a2a",
            borderRadius: 10,
            color: "#aaa",
            fontFamily: "Outfit",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: "0.02em",
          }}
        >
          ＋10
        </button>
        <button
          onClick={onDismiss}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: "transparent",
            border: "none",
            color: "#444",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginLeft: 4,
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ─── SetRow ──────────────────────────────────────────────

function SetRow({
  set,
  setIndex,
  isNext,
  onComplete,
  onWeightChange,
  onRepsChange,
}: {
  set: SetData
  setIndex: number
  isNext: boolean
  onComplete: () => void
  onWeightChange: (v: number) => void
  onRepsChange: (v: number) => void
}) {
  const [editingWeight, setEditingWeight] = useState(false)
  const [editingReps, setEditingReps] = useState(false)
  const weightRef = useRef<HTMLInputElement>(null)
  const repsRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingWeight) weightRef.current?.select()
  }, [editingWeight])
  useEffect(() => {
    if (editingReps) repsRef.current?.select()
  }, [editingReps])

  const dimmed = set.completed

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0 20px",
        height: 58,
        backgroundColor: dimmed ? "#111" : isNext ? "#161a0f" : "transparent",
        borderLeft: isNext ? "2px solid #c8ff00" : "2px solid transparent",
        transition: "background-color 0.2s",
      }}
    >
      {/* Set label */}
      <span
        style={{
          fontFamily: "Outfit",
          fontSize: 10,
          color: dimmed ? "#3a3a3a" : isNext ? "#c8ff00" : "#555",
          letterSpacing: "0.08em",
          fontWeight: 600,
          width: 38,
          flexShrink: 0,
        }}
      >
        SET {setIndex + 1}
      </span>

      {/* Weight */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 3,
          minWidth: 70,
        }}
      >
        {editingWeight ? (
          <input
            ref={weightRef}
            type="number"
            inputMode="decimal"
            value={set.weight}
            onChange={(e) => onWeightChange(Number(e.target.value))}
            onBlur={() => setEditingWeight(false)}
            style={{
              width: 52,
              fontFamily: "Outfit",
              fontSize: 22,
              fontWeight: 700,
              color: "#f0f0f0",
              background: "#1e1e1e",
              border: "1px solid #c8ff00",
              borderRadius: 6,
              textAlign: "center",
              padding: "2px 0",
              outline: "none",
            }}
          />
        ) : (
          <button
            onClick={() => !dimmed && setEditingWeight(true)}
            style={{
              fontFamily: "Outfit",
              fontSize: 22,
              fontWeight: 700,
              color: dimmed ? "#3a3a3a" : "#f0f0f0",
              background: "none",
              border: "none",
              cursor: dimmed ? "default" : "pointer",
              padding: 0,
              minWidth: 48,
              textAlign: "center",
            }}
          >
            {set.weight}
          </button>
        )}
        <span
          style={{
            fontFamily: "Inter",
            fontSize: 12,
            color: dimmed ? "#333" : "#555",
          }}
        >
          kg
        </span>
      </div>

      {/* Reps stepper */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flex: 1,
          justifyContent: "center",
        }}
      >
        <button
          onClick={() => onRepsChange(Math.max(0, set.reps - 1))}
          disabled={dimmed}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: dimmed ? "transparent" : "#1e1e1e",
            border: `1px solid ${dimmed ? "#1e1e1e" : "#2a2a2a"}`,
            color: dimmed ? "#333" : "#888",
            fontFamily: "Outfit",
            fontSize: 18,
            cursor: dimmed ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
          }}
        >
          −
        </button>
        {editingReps ? (
          <input
            ref={repsRef}
            type="number"
            inputMode="numeric"
            value={set.reps}
            onChange={(e) => onRepsChange(Number(e.target.value))}
            onBlur={() => setEditingReps(false)}
            style={{
              width: 44,
              fontFamily: "Outfit",
              fontSize: 22,
              fontWeight: 700,
              color: "#f0f0f0",
              background: "#1e1e1e",
              border: "1px solid #c8ff00",
              borderRadius: 6,
              textAlign: "center",
              padding: "2px 0",
              outline: "none",
            }}
          />
        ) : (
          <button
            onClick={() => !dimmed && setEditingReps(true)}
            style={{
              fontFamily: "Outfit",
              fontSize: 22,
              fontWeight: 700,
              color: dimmed ? "#3a3a3a" : "#f0f0f0",
              background: "none",
              border: "none",
              cursor: dimmed ? "default" : "pointer",
              minWidth: 40,
              textAlign: "center",
              padding: 0,
            }}
          >
            {set.reps}
          </button>
        )}
        <span
          style={{
            fontFamily: "Inter",
            fontSize: 12,
            color: dimmed ? "#333" : "#555",
            marginRight: 2,
          }}
        >
          回
        </span>
        <button
          onClick={() => onRepsChange(set.reps + 1)}
          disabled={dimmed}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: dimmed ? "transparent" : "#1e1e1e",
            border: `1px solid ${dimmed ? "#1e1e1e" : "#2a2a2a"}`,
            color: dimmed ? "#333" : "#888",
            fontFamily: "Outfit",
            fontSize: 18,
            cursor: dimmed ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
          }}
        >
          ＋
        </button>
      </div>

      {/* Complete button */}
      <button
        onClick={onComplete}
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          flexShrink: 0,
          backgroundColor: set.completed ? "#c8ff00" : "transparent",
          border: `2px solid ${
            set.completed ? "#c8ff00" : isNext ? "#c8ff00" : "#2e2e2e"
          }`,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s",
        }}
      >
        {set.completed && (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0d0d0d"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
    </div>
  )
}

// ─── ExerciseSection ─────────────────────────────────────

function ExerciseSection({
  exercise,
  nextSetGlobalId,
  onCompleteSet,
  onWeightChange,
  onRepsChange,
  onAddSet,
}: {
  exercise: Exercise
  nextSetGlobalId: number | null
  onCompleteSet: (exId: number, setId: number) => void
  onWeightChange: (exId: number, setId: number, v: number) => void
  onRepsChange: (exId: number, setId: number, v: number) => void
  onAddSet: (exId: number) => void
}) {
  return (
    <div style={{ marginBottom: 4 }}>
      {/* Exercise header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 20px 10px",
        }}
      >
        <div>
          <span
            style={{
              fontFamily: "Outfit",
              fontSize: 17,
              fontWeight: 700,
              color: "#f0f0f0",
              letterSpacing: "-0.01em",
            }}
          >
            {exercise.name}
          </span>
          {/* Previous record reference */}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 5,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontFamily: "Inter",
                fontSize: 11,
                color: "#505050",
                letterSpacing: "0.02em",
              }}
            >
              前回
            </span>
            {exercise.prevSets.map((ps, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "Outfit",
                  fontSize: 11,
                  color: "#505050",
                  letterSpacing: "0.01em",
                }}
              >
                {ps.weight}kg×{ps.reps}
              </span>
            ))}
          </div>
        </div>
        {/* Drag handle */}
        <div
          style={{
            color: "#333",
            padding: "8px 4px",
            cursor: "grab",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 18,
                height: 1.5,
                backgroundColor: "#333",
                borderRadius: 1,
              }}
            />
          ))}
        </div>
      </div>

      {/* Sets */}
      <div>
        {exercise.sets.map((set, idx) => (
          <SetRow
            key={set.id}
            set={set}
            setIndex={idx}
            isNext={set.id === nextSetGlobalId}
            onComplete={() => onCompleteSet(exercise.id, set.id)}
            onWeightChange={(v) => onWeightChange(exercise.id, set.id, v)}
            onRepsChange={(v) => onRepsChange(exercise.id, set.id, v)}
          />
        ))}
      </div>

      {/* Add set */}
      <button
        onClick={() => onAddSet(exercise.id)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 20px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#555",
          fontFamily: "Inter",
          fontSize: 13,
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        セットを追加
      </button>

      {/* Divider */}
      <div
        style={{
          height: 1,
          backgroundColor: "#1e1e1e",
          marginInline: 20,
          marginTop: 4,
        }}
      />
    </div>
  )
}

// ─── WorkoutScreen ───────────────────────────────────────

export default function WorkoutScreen({ onBack }: { onBack: () => void }) {
  const [exercises, setExercises] = useState<Exercise[]>(INITIAL_EXERCISES)
  const [elapsed, setElapsed] = useState(0)
  const [restActive, setRestActive] = useState(false)
  const [restSeconds, setRestSeconds] = useState(90)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Elapsed timer
  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // Rest timer countdown
  useEffect(() => {
    if (!restActive) return
    if (restSeconds <= 0) {
      setRestActive(false)
      return
    }
    const id = setInterval(() => setRestSeconds((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [restActive, restSeconds])

  // Find the first globally incomplete set ID (for "next" highlight)
  const nextSetGlobalId = (() => {
    for (const ex of exercises) {
      const found = ex.sets.find((s) => !s.completed)
      if (found) return found.id
    }
    return null
  })()

  const completeSet = useCallback(
    (exId: number, setId: number) => {
      setExercises((prev) =>
        prev.map((ex) => {
          if (ex.id !== exId) return ex
          return {
            ...ex,
            sets: ex.sets.map((s) =>
              s.id === setId ? { ...s, completed: !s.completed } : s
            ),
          }
        })
      )
      // Start rest timer on first completion (not on un-complete)
      const ex = exercises.find((e) => e.id === exId)
      const s = ex?.sets.find((s) => s.id === setId)
      if (s && !s.completed) {
        setRestSeconds(90)
        setRestActive(true)
      }
    },
    [exercises]
  )

  const updateWeight = useCallback((exId: number, setId: number, v: number) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exId) return ex
        return {
          ...ex,
          sets: ex.sets.map((s) => (s.id === setId ? { ...s, weight: v } : s)),
        }
      })
    )
  }, [])

  const updateReps = useCallback((exId: number, setId: number, v: number) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exId) return ex
        return {
          ...ex,
          sets: ex.sets.map((s) => (s.id === setId ? { ...s, reps: v } : s)),
        }
      })
    )
  }, [])

  const addSet = useCallback((exId: number) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exId) return ex
        const last = ex.sets[ex.sets.length - 1]
        const newSet: SetData = {
          id: ++_setId,
          weight: last?.weight ?? 0,
          reps: last?.reps ?? 0,
          completed: false,
        }
        return { ...ex, sets: [...ex.sets, newSet] }
      })
    )
  }, [])

  const addExercise = () => {
    const newEx: Exercise = {
      id: ++_exId,
      name: "新しい種目",
      prevSets: [],
      sets: [{ id: ++_setId, weight: 0, reps: 0, completed: false }],
    }
    setExercises((prev) => [...prev, newEx])
  }

  const restPadding = restActive ? 130 : 0

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
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
        }}
      >
        {/* ─── Header ─── */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            backgroundColor: "#0d0d0d",
            borderBottom: "1px solid #1a1a1a",
            padding: "48px 16px 12px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {/* Back */}
          <button
            onClick={onBack}
            style={{
              width: 36,
              height: 36,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#888",
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
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Menu name */}
          <span
            style={{
              fontFamily: "Outfit",
              fontSize: 18,
              fontWeight: 700,
              color: "#f0f0f0",
              letterSpacing: "-0.02em",
              flex: 1,
            }}
          >
            胸トレ
          </span>

          {/* Elapsed time */}
          <span
            style={{
              fontFamily: "Outfit",
              fontSize: 14,
              fontWeight: 600,
              color: "#888",
              letterSpacing: "0.04em",
              flexShrink: 0,
            }}
          >
            {formatTime(elapsed)}
          </span>

          {/* End button */}
          <button
            style={{
              padding: "7px 14px",
              backgroundColor: "transparent",
              border: "1px solid #2a2a2a",
              borderRadius: 8,
              color: "#777",
              fontFamily: "Outfit",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              flexShrink: 0,
              marginLeft: 4,
            }}
          >
            終了
          </button>
        </div>

        {/* ─── Scrollable body ─── */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: "auto",
            paddingBottom: 24 + restPadding,
          }}
        >
          {exercises.map((ex) => (
            <ExerciseSection
              key={ex.id}
              exercise={ex}
              nextSetGlobalId={nextSetGlobalId}
              onCompleteSet={completeSet}
              onWeightChange={updateWeight}
              onRepsChange={updateReps}
              onAddSet={addSet}
            />
          ))}

          {/* Add exercise */}
          <button
            onClick={addExercise}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "20px 20px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#666",
              fontFamily: "Inter",
              fontSize: 14,
              width: "100%",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                border: "1px solid #2a2a2a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#666"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            種目を追加
          </button>
        </div>

        {/* ─── Rest timer ─── */}
        {restActive && (
          <RestTimer
            seconds={restSeconds}
            onAdjust={(d) => setRestSeconds((s) => Math.max(0, s + d))}
            onDismiss={() => setRestActive(false)}
          />
        )}
      </div>
    </div>
  )
}
