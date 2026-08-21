import { test, expect } from '@playwright/test'
import { allRolesReady, authenticatedPage, openTeamManager, openWorkspaceManager, roleIsReady, teamName } from './support/e2e'

test.describe('Workspace / Role read-only', () => {
  test('Ownerはpersonal/teamを切替でき、team名変更UIを表示する', async ({ browser }) => {
    test.skip(!roleIsReady('owner') || !teamName, 'Owner storageState and E2E_TEST_TEAM_NAME are required')
    const { context, page } = await authenticatedPage(browser, 'owner')
    await openWorkspaceManager(page)
    const teamCard = page.getByText(teamName!, { exact: true }).locator('..').locator('..')
    await expect(teamCard).toContainText('Owner')
    await expect(teamCard.getByRole('button', { name: '名前変更', exact: true })).toBeVisible()
    await expect(teamCard.getByText('Ownerは先に権限を移譲してください', { exact: true })).toBeVisible()
    await context.close()
  })

  test('Adminは招待のみでき、team名変更/role変更UIを表示しない', async ({ browser }) => {
    test.skip(!roleIsReady('admin') || !teamName, 'Admin storageState and E2E_TEST_TEAM_NAME are required')
    const { context, page } = await authenticatedPage(browser, 'admin')
    await openWorkspaceManager(page)
    const teamCard = page.getByText(teamName!, { exact: true }).locator('..').locator('..')
    await expect(teamCard).toContainText('Admin')
    await expect(teamCard.getByRole('button', { name: '名前変更', exact: true })).toHaveCount(0)
    await expect(teamCard.getByRole('button', { name: 'チームを退出', exact: true })).toBeVisible()
    await openTeamManager(page)
    await expect(page.getByPlaceholder('招待するメールアドレス')).toBeVisible()
    await expect(page.getByRole('combobox')).toHaveCount(0)
    await expect(page.getByRole('button', { name: '移譲', exact: true })).toHaveCount(0)
    await context.close()
  })

  test('Memberは招待/role変更/team名変更UIを表示しない', async ({ browser }) => {
    test.skip(!roleIsReady('member') || !teamName, 'Member storageState and E2E_TEST_TEAM_NAME are required')
    const { context, page } = await authenticatedPage(browser, 'member')
    await openWorkspaceManager(page)
    const teamCard = page.getByText(teamName!, { exact: true }).locator('..').locator('..')
    await expect(teamCard).toContainText('Member')
    await expect(teamCard.getByRole('button', { name: '名前変更', exact: true })).toHaveCount(0)
    await expect(teamCard.getByRole('button', { name: 'チームを退出', exact: true })).toBeVisible()
    await openTeamManager(page)
    await expect(page.getByPlaceholder('招待するメールアドレス')).toHaveCount(0)
    await expect(page.getByRole('combobox')).toHaveCount(0)
    await expect(page.getByRole('button', { name: '移譲', exact: true })).toHaveCount(0)
    await context.close()
  })

  test('3 roleのfixtureが揃う', async () => {
    test.skip(!allRolesReady(), 'Owner/Admin/Member storageState is not configured')
    expect(allRolesReady()).toBe(true)
  })
})
