import { test, expect } from '@playwright/test'
import { authenticatedPage, isMutationEnabled, openSettings, roleIsReady } from './support/e2e'

test.describe.serial('Profile mutation', () => {
  test('display_nameを保存し、再読み込み後も保持する', async ({ browser }) => {
    test.skip(!isMutationEnabled || !roleIsReady('owner'), 'Requires E2E_ENABLE_MUTATION_TESTS=true and an Owner test account')
    const { context, page } = await authenticatedPage(browser, 'owner')
    await openSettings(page)
    const field = page.getByLabel('表示名')
    const before = await field.inputValue()
    const next = `E2E Owner ${Date.now()}`

    try {
      await field.fill(next)
      await page.getByRole('button', { name: '保存', exact: true }).click()
      await expect(field).toHaveValue(next)
      await page.reload()
      await page.getByRole('button', { name: '設定', exact: true }).click()
      await expect(page.getByLabel('表示名')).toHaveValue(next)
    } finally {
      const restore = page.getByLabel('表示名')
      await restore.fill(before)
      await page.getByRole('button', { name: '保存', exact: true }).click()
      await context.close()
    }
  })
})
