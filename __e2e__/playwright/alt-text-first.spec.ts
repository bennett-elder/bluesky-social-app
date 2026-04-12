import {expect, test} from '@playwright/test'

// NOTE: Bluesky's search API requires authentication, so content-level
// assertions can't be made here without a session. All behavioral tests
// live in alt-text-first-connected.spec.ts.

test.describe('Alt-text-first mode (smoke tests, no login required)', () => {
  test('app loads without JS errors', async ({page}) => {
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))

    await page.goto('/')
    await page.waitForLoadState('networkidle', {timeout: 120000})
    await page.waitForTimeout(2000)

    expect(errors).toHaveLength(0)
  })

  test('altTextFirstEnabled can be set and read from localStorage', async ({
    page,
  }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle', {timeout: 120000})

    await page.evaluate(() => {
      localStorage.setItem(
        'state',
        JSON.stringify({preferences: {altTextFirstEnabled: true}}),
      )
    })

    const value = await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('state') ?? '{}')
      return state.preferences?.altTextFirstEnabled
    })

    expect(value).toBe(true)
  })
})
