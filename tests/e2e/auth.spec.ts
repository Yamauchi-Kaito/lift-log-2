import { test, expect } from '@playwright/test'
import { authenticatedPage, roleIsReady } from './support/e2e'

test.use({ storageState: { cookies: [], origins: [] } })

test('未ログインではログイン画面を表示する', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'トレーニングを記録', exact: true })).toBeVisible()
  await expect(page.getByLabel('メールアドレス')).toBeVisible()
  await expect(page.getByRole('button', { name: 'ログインリンクを送信', exact: true })).toBeVisible()
})

test('認証済みOwnerはアプリを表示する', async ({ browser }) => {
  test.skip(!roleIsReady('owner'), 'Owner storageState is not configured')
  const { context, page } = await authenticatedPage(browser, 'owner')
  await expect(page.getByRole('button', { name: '設定', exact: true })).toBeVisible()
  await context.close()
})

test('logoutは専用accountでだけ検証する', async ({ browser }) => {
  test.skip(process.env.E2E_ENABLE_MUTATION_TESTS !== 'true' || !roleIsReady('owner'), 'logout revokes the test session; enable only for dedicated E2E accounts')
  const { context, page } = await authenticatedPage(browser, 'owner')
  await page.getByRole('button', { name: '設定', exact: true }).click()
  await page.getByRole('button', { name: 'ログアウト', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'トレーニングを記録', exact: true })).toBeVisible()
  await context.close()
})
