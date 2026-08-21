import { expect, type Browser, type BrowserContext, type Page } from '@playwright/test'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

export type E2ERole = 'owner' | 'admin' | 'member'

const upper = (role: E2ERole) => role.toUpperCase()

export const isMutationEnabled = process.env.E2E_ENABLE_MUTATION_TESTS === 'true'
export const teamName = process.env.E2E_TEST_TEAM_NAME
export const teamId = process.env.E2E_TEST_TEAM_ID
export const exerciseName = process.env.E2E_TEST_EXERCISE_NAME

export function storageStatePath(role: E2ERole) {
  return resolve(process.env[`E2E_${upper(role)}_STORAGE_STATE`] ?? `playwright/.auth/e2e-${role}.json`)
}

export function roleIsReady(role: E2ERole) {
  return existsSync(storageStatePath(role))
}

export function allRolesReady() {
  return (['owner', 'admin', 'member'] as E2ERole[]).every(roleIsReady)
}

export async function authenticatedPage(browser: Browser, role: E2ERole): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ storageState: storageStatePath(role) })
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.getByRole('button', { name: '設定', exact: true })).toBeVisible()
  return { context, page }
}

export async function openSettings(page: Page) {
  await page.getByRole('button', { name: '設定', exact: true }).click()
  await expect(page.getByRole('heading', { name: '設定', exact: true })).toBeVisible()
}

export async function openWorkspaceManager(page: Page) {
  await openSettings(page)
  await page.getByRole('button', { name: 'ワークスペースを管理', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'ワークスペース管理', exact: true })).toBeVisible()
}

export async function openTeamManager(page: Page) {
  await openWorkspaceManager(page)
  if (!teamName) throw new Error('E2E_TEST_TEAM_NAME is required')
  const card = page.getByText(teamName, { exact: true }).locator('..').locator('..')
  await expect(card).toBeVisible()
  await card.getByRole('button', { name: 'メンバー・共有記録を管理', exact: true }).click()
  await expect(page.getByText('メンバー管理', { exact: true })).toBeVisible()
}

export async function selectTeamWorkspace(page: Page) {
  await openSettings(page)
  if (!teamName) throw new Error('E2E_TEST_TEAM_NAME is required')
  await page.getByText('現在のワークスペース', { exact: true }).locator('..').getByRole('button').click()
  await page.getByRole('button', { name: new RegExp(`${escapeRegExp(teamName)}.*チーム`) }).click()
  await expect(page.getByText(teamName, { exact: true }).first()).toBeVisible()
}

export async function selectPersonalWorkspace(page: Page) {
  await openSettings(page)
  await page.getByText('現在のワークスペース', { exact: true }).locator('..').getByRole('button').click()
  await page.getByRole('button', { name: /個人/ }).last().click()
}

export async function openGrowth(page: Page) {
  await page.getByRole('button', { name: 'ホーム', exact: true }).click()
  await page.getByRole('button', { name: /^成長記録/ }).click()
  await expect(page.getByRole('heading', { name: '成長記録', exact: true })).toBeVisible()
}

export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
