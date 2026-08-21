import { test, expect, type Page } from '@playwright/test'
import { allRolesReady, authenticatedPage, exerciseName, isMutationEnabled, openSettings, roleIsReady, selectTeamWorkspace, teamName } from './support/e2e'

async function openQuickRecord(page: Page) {
  await openSettings(page)
  await page.getByRole('button', { name: '記録', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'クイック記録', exact: true })).toBeVisible()
}

async function openMatchingHistoryRecord(page: Page, reps: number) {
  await page.getByRole('button', { name: '履歴', exact: true }).click()
  const record = page.getByRole('button').filter({ hasText: exerciseName! }).filter({ hasText: `${reps}回` }).first()
  await expect(record).toBeVisible()
  await record.click()
}

test.describe.serial('Quick workout / sharing mutation', () => {
  test('Quick記録の作成・編集・永続化・削除とteam共有を検証する', async ({ browser }) => {
    test.skip(!isMutationEnabled || !allRolesReady() || !teamName || !exerciseName, 'Requires a dedicated 3-role team, E2E_TEST_EXERCISE_NAME, and E2E_ENABLE_MUTATION_TESTS=true')
    const owner = await authenticatedPage(browser, 'owner')
    const member = await authenticatedPage(browser, 'member')
    const reps = 101 + (Date.now() % 700)
    const editedReps = reps + 1

    try {
      await openQuickRecord(owner.page)
      await owner.page.getByRole('button', { name: '種目を選択', exact: true }).click()
      await owner.page.getByRole('button', { name: exerciseName!, exact: true }).click()
      await owner.page.getByPlaceholder('重量を入力').fill('12.5')
      await owner.page.getByRole('button', { name: '0', exact: true }).click()
      await owner.page.keyboard.press('Control+A')
      await owner.page.keyboard.type(String(reps))
      await owner.page.keyboard.press('Enter')
      await owner.page.getByRole('button', { name: /^チーム/ }).click()
      await owner.page.getByRole('combobox').selectOption({ label: teamName! })
      await owner.page.getByRole('button', { name: '記録を保存', exact: true }).click()
      await expect(owner.page.getByText('記録を保存しました', { exact: true })).toBeVisible()

      await owner.page.getByRole('button', { name: 'ホームへ戻る', exact: true }).click()
      await openMatchingHistoryRecord(owner.page, reps)
      await owner.page.getByRole('button', { name: '編集', exact: true }).click()
      await owner.page.getByText('回数', { exact: true }).locator('..').getByRole('textbox').fill(String(editedReps))
      await owner.page.getByRole('button', { name: '保存', exact: true }).click()
      await expect(owner.page.getByText(`${editedReps}回`, { exact: true })).toBeVisible()

      await owner.page.reload()
      await openMatchingHistoryRecord(owner.page, editedReps)
      await expect(owner.page.getByText(`12.5kg × ${editedReps}回`, { exact: true })).toBeVisible()

      await member.page.reload()
      await selectTeamWorkspace(member.page)
      await member.page.getByRole('button', { name: 'ホーム', exact: true }).click()
      await expect(member.page.getByText(exerciseName!, { exact: true }).first()).toBeVisible()
      await expect(member.page.getByText(`${editedReps}回`, { exact: true }).first()).toBeVisible()

      await owner.page.getByRole('button', { name: '記録を削除', exact: true }).click()
      await owner.page.getByRole('button', { name: '削除する', exact: true }).click()
      await expect(owner.page.getByRole('heading', { name: '履歴', exact: true })).toBeVisible()

      await member.page.reload()
      await selectTeamWorkspace(member.page)
      await member.page.getByRole('button', { name: 'ホーム', exact: true }).click()
      await expect(member.page.getByRole('button').filter({ hasText: exerciseName! }).filter({ hasText: `${editedReps}回` })).toHaveCount(0)
    } finally {
      await owner.context.close()
      await member.context.close()
    }
  })

  test('Memberは他人の共有記録を編集・削除できない', async ({ browser }) => {
    test.skip(!roleIsReady('member') || !teamName || !exerciseName, 'Requires a pre-seeded shared record in the dedicated E2E team')
    const { context, page } = await authenticatedPage(browser, 'member')
    await selectTeamWorkspace(page)
    await page.getByRole('button', { name: 'ホーム', exact: true }).click()
    const record = page.getByRole('button').filter({ hasText: exerciseName! }).first()
    test.skip(await record.count() === 0, 'No shared record is available')
    await record.click()
    await expect(page.getByRole('button', { name: '編集', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: '記録を削除', exact: true })).toHaveCount(0)
    await context.close()
  })
})
