export type PersonalWorkspace = { id: string; name: string; type: "個人" }
export type TeamWorkspace = { id: string; name: string; type: "チーム"; systemRole: "owner" | "admin" | "member" }
export type Workspace = PersonalWorkspace | TeamWorkspace
