import { test, expect } from '@playwright/test'
import { allRolesReady, authenticatedPage, isMutationEnabled, openGrowth, roleIsReady, selectPersonalWorkspace, selectTeamWorkspace, teamName } from './support/e2e'

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64')

test.describe.serial('Photo sharing mutation', () => {
  test('team写真はMemberに見え、共有解除でprivateへ戻り、削除で消える', async ({ browser }) => {
    test.skip(!isMutationEnabled || !allRolesReady() || !teamName, 'Requires a dedicated Owner/Admin/Member team and E2E_ENABLE_MUTATION_TESTS=true')
    const owner = await authenticatedPage(browser, 'owner')
    const member = await authenticatedPage(browser, 'member')
    const marker = `E2E-photo-${Date.now()}`

    try {
      await selectTeamWorkspace(owner.page)
      await openGrowth(owner.page)
      await owner.page.getByRole('button', { name: '＋ 写真', exact: true }).click()
      await owner.page.getByLabel('写真').setInputFiles({ name: 'e2e.png', mimeType: 'image/png', buffer: png })
      await owner.page.getByLabel('公開範囲').selectOption('team')
      await owner.page.getByLabel('メモ（任意）').fill(marker)
      await owner.page.getByRole('button', { name: '登録', exact: true }).click()
      await expect(owner.page.getByText(marker, { exact: true })).toHaveCount(0)

      await member.page.reload()
      await selectTeamWorkspace(member.page)
      await openGrowth(member.page)
      const memberPhoto = member.page.getByRole('img').last().locator('..')
      await memberPhoto.click()
      await expect(member.page.getByRole('button', { name: '写真を削除', exact: true })).toHaveCount(0)
      await expect(member.page.getByRole('button', { name: '変更を保存', exact: true })).toHaveCount(0)

      await owner.page.getByRole('img').last().locator('..').click()
      await owner.page.getByLabel('公開範囲').selectOption('private')
      await owner.page.getByRole('button', { name: '変更を保存', exact: true }).click()

      await member.page.reload()
      await selectTeamWorkspace(member.page)
      await openGrowth(member.page)
      await expect(member.page.getByText('表示できる写真はありません', { exact: true })).toBeVisible()

      await selectPersonalWorkspace(owner.page)
      await openGrowth(owner.page)
      await owner.page.getByRole('img').last().locator('..').click()
      await owner.page.getByRole('button', { name: '写真を削除', exact: true }).click()
      await expect(owner.page.getByText('表示できる写真はありません', { exact: true })).toBeVisible()
    } finally {
      await owner.context.close()
      await member.context.close()
    }
  })

  test('他人の写真には削除・共有解除UIを出さない', async ({ browser }) => {
    test.skip(!roleIsReady('member') || !teamName, 'Requires Member storageState and a pre-seeded dedicated team photo')
    const { context, page } = await authenticatedPage(browser, 'member')
    await selectTeamWorkspace(page)
    await openGrowth(page)
    test.skip(await page.getByRole('img').count() === 0, 'No shared test photo is available')
    await page.getByRole('img').last().locator('..').click()
    await expect(page.getByRole('button', { name: '写真を削除', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: '変更を保存', exact: true })).toHaveCount(0)
    await context.close()
  })
})
