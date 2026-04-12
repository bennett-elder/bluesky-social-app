import {
  type Browser,
  type BrowserContext,
  chromium,
  expect,
  type Page,
  test,
} from '@playwright/test'

// Prerequisites:
// 1. Start Chrome with remote debugging:
//    pkill -9 -f "Google Chrome"
//    nohup "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
//      --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-test-profile \
//      > /tmp/chrome.log 2>&1 &
// 2. Start dev server: cd bluesky-social-app && yarn web
// 3. Log in to Bluesky at http://localhost:19006
// Then run: yarn e2e:playwright --grep "connected"

const APP_URL = 'http://localhost:19006'
const SETTINGS_URL = `${APP_URL}/settings/content-and-media`
const YOUTUBE_SEARCH_URL =
  `${APP_URL}/search?q=` + encodeURIComponent('youtube.com/watch')
const IMAGE_SEARCH_URL = `${APP_URL}/search?q=` + encodeURIComponent('photo')

test.describe.configure({mode: 'serial'})

test.describe('Alt-text-first mode (connected)', () => {
  let browser: Browser
  let context: BrowserContext

  test.beforeAll(async () => {
    browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
    const contexts = browser.contexts()
    context = contexts[0] || (await browser.newContext())
  })

  test.afterAll(async () => {
    if (browser && browser.isConnected()) {
      await browser.close()
    }
  })

  async function isOopsAllTextEnabled(page: Page): Promise<boolean> {
    await page.goto(SETTINGS_URL)
    await page.waitForLoadState('networkidle', {timeout: 60000})
    const toggle = page.getByText('Oops! All text').first()
    await toggle.waitFor({timeout: 15000})
    // The toggle row — find the parent that has aria-checked
    const row = page
      .locator('[aria-checked]')
      .filter({hasText: 'Oops! All text'})
    const checked = await row.getAttribute('aria-checked')
    return checked === 'true'
  }

  async function setOopsAllText(page: Page, enabled: boolean) {
    const current = await isOopsAllTextEnabled(page)
    if (current !== enabled) {
      await page.getByText('Oops! All text').first().click()
      await page.waitForTimeout(500)
    }
  }

  async function loadSearch(page: Page, url: string) {
    await page.goto(url)
    await page.waitForLoadState('networkidle', {timeout: 60000})
    await page.waitForTimeout(2000)
  }

  function feedThumbnails(page: Page) {
    return page.locator('img[src*="cdn.bsky.app/img/feed_thumbnail"]')
  }

  test('"Oops! All text" toggle can be turned on and off', async () => {
    const page = await context.newPage()

    // Turn on
    await setOopsAllText(page, true)
    expect(await isOopsAllTextEnabled(page)).toBe(true)

    // Turn off
    await setOopsAllText(page, false)
    expect(await isOopsAllTextEnabled(page)).toBe(false)

    await page.close()
  })

  test('external embeds show "Show Thumbnail" buttons when "Oops! All text" is on', async () => {
    const page = await context.newPage()

    await setOopsAllText(page, true)
    await loadSearch(page, YOUTUBE_SEARCH_URL)

    const buttons = page.getByText('Show Thumbnail')
    await expect(buttons.first()).toBeVisible({timeout: 15000})
    expect(await buttons.count()).toBeGreaterThan(0)

    await page.close()
  })

  test('external embeds show no "Show Thumbnail" buttons when "Oops! All text" is off', async () => {
    const page = await context.newPage()

    await setOopsAllText(page, false)
    await loadSearch(page, YOUTUBE_SEARCH_URL)

    expect(await page.getByText('Show Thumbnail').count()).toBe(0)

    await page.close()
  })

  test('clicking "Show Thumbnail" reveals the thumbnail and removes the button', async () => {
    const page = await context.newPage()

    await setOopsAllText(page, true)
    await loadSearch(page, YOUTUBE_SEARCH_URL)

    const buttonsBefore = await page.getByText('Show Thumbnail').count()
    expect(buttonsBefore).toBeGreaterThan(0)

    const thumbsBefore = await feedThumbnails(page).count()

    await page.getByText('Show Thumbnail').first().click()
    await page.waitForTimeout(500)

    expect(await page.getByText('Show Thumbnail').count()).toBe(
      buttonsBefore - 1,
    )
    expect(await feedThumbnails(page).count()).toBe(thumbsBefore + 1)

    await page.close()
  })

  test('"Hide thumbnail" button collapses the thumbnail back to alt text', async () => {
    const page = await context.newPage()

    await setOopsAllText(page, true)
    await loadSearch(page, YOUTUBE_SEARCH_URL)

    const showButtons = page.getByText('Show Thumbnail')
    await expect(showButtons.first()).toBeVisible({timeout: 15000})
    const countBefore = await showButtons.count()

    await showButtons.first().click()
    await page.waitForTimeout(500)

    // Hide thumbnail button should now be visible (icon-only, found by aria-label)
    const hideButton = page.getByLabel('Hide thumbnail').first()
    await expect(hideButton).toBeVisible({timeout: 5000})

    await hideButton.click()
    await page.waitForTimeout(500)

    // Collapsed — Show Thumbnail count restored
    expect(await page.getByText('Show Thumbnail').count()).toBe(countBefore)

    await page.close()
  })

  test('"Hide thumbnail" button does not open the link in a new tab', async () => {
    const page = await context.newPage()

    await setOopsAllText(page, true)
    await loadSearch(page, YOUTUBE_SEARCH_URL)

    await page.getByText('Show Thumbnail').first().click()
    await page.waitForTimeout(500)

    const hideButton = page.getByLabel('Hide thumbnail').first()
    await expect(hideButton).toBeVisible({timeout: 5000})

    const pagesBefore = context.pages().length
    await hideButton.click()
    await page.waitForTimeout(1000)

    expect(context.pages().length).toBe(pagesBefore)

    await page.close()
  })

  test('clicking "Show Thumbnail" does not open the link in a new tab', async () => {
    const page = await context.newPage()

    await setOopsAllText(page, true)
    await loadSearch(page, YOUTUBE_SEARCH_URL)

    await expect(page.getByText('Show Thumbnail').first()).toBeVisible({
      timeout: 15000,
    })

    const pagesBefore = context.pages().length
    await page.getByText('Show Thumbnail').first().click()
    await page.waitForTimeout(1000)

    expect(context.pages().length).toBe(pagesBefore)

    await page.close()
  })

  test('image posts show no inline images when "Oops! All text" is on', async () => {
    const page = await context.newPage()

    await setOopsAllText(page, true)
    await loadSearch(page, IMAGE_SEARCH_URL)

    // With alt-text-first on, both image embeds and video thumbnails collapse
    // so no feed_thumbnail images should be rendered
    expect(await feedThumbnails(page).count()).toBe(0)

    await page.close()
  })

  test('image posts show inline images when "Oops! All text" is off', async () => {
    const page = await context.newPage()

    await setOopsAllText(page, false)
    await loadSearch(page, IMAGE_SEARCH_URL)

    expect(await feedThumbnails(page).count()).toBeGreaterThan(0)

    await page.close()
  })

  test('"Oops! All text" setting persists across page reload', async () => {
    const page = await context.newPage()

    await setOopsAllText(page, true)
    expect(await isOopsAllTextEnabled(page)).toBe(true)

    // Reload — app re-reads from persisted storage
    await page.reload()
    await page.waitForLoadState('networkidle', {timeout: 60000})

    expect(await isOopsAllTextEnabled(page)).toBe(true)

    // Leave the setting off so we don't interfere with manual browsing
    await setOopsAllText(page, false)

    await page.close()
  })
})
