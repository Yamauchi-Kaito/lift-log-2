import { FormEvent, useState } from "react"
import { supabase } from "./lib/supabase"

export default function LoginScreen() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const sendMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setErrorMessage("")
    setMessage("")

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })

    setSubmitting(false)
    if (error) {
      setErrorMessage(error.message)
      return
    }
    setMessage("メールを確認して、ログインリンクを開いてください。")
  }

  return (
    <main style={pageStyle}>
      <section style={contentStyle}>
        <div style={headingStyle}>
          <p style={eyebrowStyle}>LIFT LOG</p>
          <h1 style={titleStyle}>トレーニングを記録</h1>
          <p style={descriptionStyle}>ログインリンクをメールで送信します。</p>
        </div>

        <form onSubmit={sendMagicLink} style={formStyle}>
          <label htmlFor="email" style={labelStyle}>メールアドレス</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            style={inputStyle}
          />
          <button type="submit" disabled={submitting} style={{ ...submitStyle, opacity: submitting ? 0.6 : 1 }}>
            {submitting ? "送信中..." : "ログインリンクを送信"}
          </button>
        </form>

        {message && <p role="status" style={messageStyle}>{message}</p>}
        {errorMessage && <p role="alert" style={errorStyle}>{errorMessage}</p>}
      </section>
    </main>
  )
}

const pageStyle = { minHeight: "100vh", display: "flex", justifyContent: "center", background: "#000" } as const
const contentStyle = { width: "100%", maxWidth: 430, minHeight: "100vh", padding: "96px 24px 40px", background: "#0d0d0d" } as const
const headingStyle = { marginBottom: 42 } as const
const eyebrowStyle = { color: "#c8ff00", fontFamily: "Inter", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", marginBottom: 12 } as const
const titleStyle = { fontFamily: "Outfit", fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em" } as const
const descriptionStyle = { color: "#888", fontSize: 14, lineHeight: 1.6, marginTop: 12 } as const
const formStyle = { display: "flex", flexDirection: "column", gap: 10 } as const
const labelStyle = { color: "#aaa", fontFamily: "Inter", fontSize: 12, fontWeight: 500 } as const
const inputStyle = { width: "100%", padding: "15px 14px", border: "1px solid #333", borderRadius: 10, outline: "none", background: "#202020", color: "#f0f0f0", fontFamily: "Inter", fontSize: 16 } as const
const submitStyle = { width: "100%", marginTop: 8, padding: "16px", border: "none", borderRadius: 10, background: "#c8ff00", color: "#0d0d0d", fontFamily: "Inter", fontSize: 14, fontWeight: 700, cursor: "pointer" } as const
const messageStyle = { marginTop: 20, color: "#c8ff00", fontSize: 13, lineHeight: 1.6 } as const
const errorStyle = { marginTop: 20, color: "#ff7777", fontSize: 13, lineHeight: 1.6 } as const
