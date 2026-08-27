// This component is deprecated and no longer used in the app flow.
// Onboarding is now automatically completed with default values.
export default function OnboardingScreen({ onComplete, saving, error }: { onComplete: (teamUse: boolean, tendency: string) => Promise<void>; saving: boolean; error: string | null }) {
  // This screen is intentionally left blank or deprecated
  // The app automatically completes onboarding without user interaction
  return <main style={{ minHeight: "100vh", background: "#0d0d0d" }} />
}
