import { test as setup, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { storageStatePath, type E2ERole } from './support/e2e'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:4173'

function credentials(role: E2ERole) {
  const prefix = `E2E_${role.toUpperCase()}`
  return { email: process.env[`${prefix}_EMAIL`], password: process.env[`${prefix}_PASSWORD`] }
}

function storageKey(supabaseUrl: string) {
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
  return `sb-${projectRef}-auth-token`
}

for (const role of ['owner', 'admin', 'member'] as E2ERole[]) {
  setup(`prepare ${role} authenticated storageState`, async ({ browser }) => {
    const { email, password } = credentials(role)
    setup.skip(!url || !key || !email || !password, `E2E_${role.toUpperCase()}_EMAIL/PASSWORD is not configured`)

    const client = createClient(url!, key!, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    })
    const { data, error } = await client.auth.signInWithPassword({ email: email!, password: password! })
    expect(error, `Cannot authenticate ${role} test account`).toBeNull()
    expect(data.session, `No session for ${role} test account`).not.toBeNull()

    const context = await browser.newContext()
    await context.addInitScript(({ key, session }) => localStorage.setItem(key, JSON.stringify(session)), {
      key: storageKey(url!),
      session: data.session,
    })
    const page = await context.newPage()
    await page.goto(baseURL)
    await expect(page.getByRole('button', { name: '設定', exact: true })).toBeVisible()

    const path = storageStatePath(role)
    mkdirSync(dirname(path), { recursive: true })
    await context.storageState({ path })
    await context.close()
  })
}
