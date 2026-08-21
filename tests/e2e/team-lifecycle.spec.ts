import { test, expect } from '@playwright/test'
import { authenticatedPage, isMutationEnabled, openWorkspaceManager, roleIsReady, teamName } from './support/e2e'

test.describe('Team lifecycle', () => {
  test('Ownerは直接退出できない', async ({ browser }) => {
    test.skip(!roleIsReady('owner') || !teamName, 'Owner storageState and E2E_TEST_TEAM_NAME are required')
    const { context, page } = await authenticatedPage(browser, 'owner')
    await openWorkspaceManager(page)
    const card = page.getByText(teamName!, { exact: true }).locator('..').locator('..')
    await expect(card.getByRole('button', { name: 'チームを退出', exact: true })).toHaveCount(0)
    await expect(card.getByText('Ownerは先に権限を移譲してください', { exact: true })).toBeVisible()
    await context.close()
  })

  test('Member/Admin退出は専用の使い捨てteamでだけ実行する', async ({ browser }) => {
    test.skip(!isMutationEnabled || !roleIsReady('member') || !teamName, 'Requires a disposable Member team and E2E_ENABLE_MUTATION_TESTS=true')
    const { context, page } = await authenticatedPage(browser, 'member')
    await openWorkspaceManager(page)
    const card = page.getByText(teamName!, { exact: true }).locator('..').locator('..')
    await card.getByRole('button', { name: 'チームを退出', exact: true }).click()
    await page.getByRole('button', { name: '退出する', exact: true }).click()
    await expect(page.getByText(teamName!, { exact: true })).toHaveCount(0)
    await context.close()
  })
})
