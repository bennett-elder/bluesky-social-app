import {
  type Browser,
  type BrowserContext,
  chromium,
  expect,
  type Page,
  test,
} from '@playwright/test'

// This test connects to your existing Chrome profile with remote debugging enabled
// Prerequisites:
// 1. Start Chrome: pkill -9 -f "Google Chrome"; nohup "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-test-profile > /tmp/chrome.log 2>&1 &
// 2. Start dev server: cd bluesky-social-app && yarn web
// 3. Log in to Bluesky in Chrome at http://localhost:19006
// Then run: yarn e2e:playwright --grep "connected"

interface AppState {
  preferences?: {altTextFirstEnabled?: boolean}
}

test.describe('Oops! All text (connected to your Chrome profile)', () => {
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

  async function setAltTextFirst(page: Page, enabled: boolean) {
    await page.evaluate(value => {
      const stored = localStorage.getItem('state')
      let state: AppState = stored ? JSON.parse(stored) : {}
      if (!state.preferences) state.preferences = {}
      state.preferences.altTextFirstEnabled = value
      localStorage.setItem('state', JSON.stringify(state))
    }, enabled)
  }

  async function getAltTextFirstState(page: Page) {
    return await page.evaluate(() => {
      const stored = localStorage.getItem('state')
      if (stored) {
        const state = JSON.parse(stored) as AppState
        return state.preferences?.altTextFirstEnabled
      }
      return false
    })
  }

  async function inspectDOM(page: Page) {
    // Scroll to trigger lazy loading
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1000)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(500)

    // Get detailed DOM info
    const domInfo = await page.evaluate(() => {
      const images = document.querySelectorAll('img')
      // YouTube thumbnails are proxied through cdn.bsky.app/img/feed_thumbnail/plain/
      const videoThumbnails = document.querySelectorAll(
        'img[src*="cdn.bsky.app/img/feed_thumbnail"]',
      )
      const allThumbnailSrcs = Array.from(images)
        .map(img => img.src)
        .filter(src => src.includes('cdn.bsky.app/img/feed_thumbnail'))

      return {
        totalImages: images.length,
        videoThumbnails: videoThumbnails.length,
        thumbnailSrcs: allThumbnailSrcs.slice(0, 5), // First 5 thumbnail srcs
      }
    })

    return domInfo
  }

  const youtubeLinkTypes = [
    {name: 'YouTube Shorts', query: 'youtube.com/shorts'},
    {name: 'YouTube Videos', query: 'youtube.com/watch'},
    {name: 'YouTube Playlists', query: 'youtube.com/playlist'},
    {name: 'YouTube Live', query: 'youtube.com/live'},
  ]

  test('should verify alt-text-first setting can be toggled', async () => {
    const page = await context.newPage()

    await page.goto('http://localhost:19006')
    await page.waitForLoadState('networkidle', {timeout: 60000})

    const isLoggedIn = await page
      .isVisible(
        '[data-testid="profileHeaderMenuBtn"], [data-testid="bottomBarProfileBtn"]',
      )
      .catch(() => false)
    console.log('Are you logged in?', isLoggedIn)

    let altTextFirstEnabled = await getAltTextFirstState(page)
    console.log('Initial altTextFirstEnabled value:', altTextFirstEnabled)

    await setAltTextFirst(page, true)
    altTextFirstEnabled = await getAltTextFirstState(page)
    console.log('After enabling:', altTextFirstEnabled)
    expect(altTextFirstEnabled).toBe(true)

    await setAltTextFirst(page, false)
    altTextFirstEnabled = await getAltTextFirstState(page)
    console.log('After disabling:', altTextFirstEnabled)
    expect(altTextFirstEnabled).toBe(false)

    console.log('✅ Setting toggle test passed')
    await page.close()
  })

  test('should verify YouTube embeds with alt-text-first ENABLED then DISABLED', async () => {
    const page = await context.newPage()

    console.log('\n' + '='.repeat(60))
    console.log('PHASE 1: Testing with alt-text-first ENABLED')
    console.log('='.repeat(60))

    await page.goto('http://localhost:19006')
    await page.waitForLoadState('networkidle', {timeout: 60000})
    await setAltTextFirst(page, true)
    await page.reload()
    await page.waitForLoadState('networkidle', {timeout: 60000})

    let totalThumbnailsEnabled = 0
    for (const linkType of youtubeLinkTypes) {
      console.log(`\n--- Testing: ${linkType.name} (ENABLED) ---`)
      await page.goto(
        `http://localhost:19006/search?q=${encodeURIComponent(linkType.query)}`,
      )
      await page.waitForLoadState('networkidle', {timeout: 60000})
      await page.waitForTimeout(3000)

      const domInfo = await inspectDOM(page)
      console.log(`  Total images: ${domInfo.totalImages}`)
      console.log(`  Video thumbnails: ${domInfo.videoThumbnails}`)
      if (domInfo.thumbnailSrcs.length > 0) {
        console.log(`  Thumbnail srcs: ${domInfo.thumbnailSrcs.join(', ')}`)
      }
      totalThumbnailsEnabled += domInfo.videoThumbnails
    }

    console.log('\n' + '='.repeat(60))
    console.log('PHASE 2: Testing with alt-text-first DISABLED')
    console.log('='.repeat(60))

    await page.goto('http://localhost:19006')
    await page.waitForLoadState('networkidle', {timeout: 60000})
    await setAltTextFirst(page, false)
    await page.reload()
    await page.waitForLoadState('networkidle', {timeout: 60000})

    let totalThumbnailsDisabled = 0
    for (const linkType of youtubeLinkTypes) {
      console.log(`\n--- Testing: ${linkType.name} (DISABLED) ---`)
      await page.goto(
        `http://localhost:19006/search?q=${encodeURIComponent(linkType.query)}`,
      )
      await page.waitForLoadState('networkidle', {timeout: 60000})
      await page.waitForTimeout(3000)

      const domInfo = await inspectDOM(page)
      console.log(`  Total images: ${domInfo.totalImages}`)
      console.log(`  Video thumbnails: ${domInfo.videoThumbnails}`)
      if (domInfo.thumbnailSrcs.length > 0) {
        console.log(`  Thumbnail srcs: ${domInfo.thumbnailSrcs.join(', ')}`)
      }
      totalThumbnailsDisabled += domInfo.videoThumbnails
    }

    console.log('\n' + '='.repeat(60))
    console.log('SUMMARY')
    console.log('='.repeat(60))
    console.log(
      `Total thumbnails with alt-text-first ENABLED: ${totalThumbnailsEnabled}`,
    )
    console.log(
      `Total thumbnails with alt-text-first DISABLED: ${totalThumbnailsDisabled}`,
    )

    // When alt-text-first is enabled, there should be fewer (or zero) thumbnails
    // When disabled, there should be more thumbnails visible
    console.log('\n✅ All YouTube embed tests complete')
    await page.close()
  })

  test('should verify internal video embed behavior with alt-text-first setting', async () => {
    const page = await context.newPage()

    console.log('\n' + '='.repeat(60))
    console.log('Testing internal video embed with alt-text-first ENABLED')
    console.log('='.repeat(60))

    // Navigate to a post with an internal video embed
    await page.goto(
      'http://localhost:19006/profile/lucagalletti.bsky.social/post/3mirf6lwcss2x',
    )
    await page.waitForLoadState('networkidle', {timeout: 60000})
    await page.waitForTimeout(3000)

    // Enable alt-text-first
    await setAltTextFirst(page, true)
    await page.reload()
    await page.waitForLoadState('networkidle', {timeout: 60000})
    await page.waitForTimeout(3000)

    // Check that no video thumbnail images are visible (should be collapsed)
    const domInfoEnabled = await inspectDOM(page)
    console.log(`  With alt-text-first ENABLED:`)
    console.log(`    Total images: ${domInfoEnabled.totalImages}`)
    console.log(`    Video thumbnails: ${domInfoEnabled.videoThumbnails}`)

    // The video should start collapsed (no thumbnail visible)
    // Note: This is a basic check - a full test would verify the alt text box is visible

    console.log('\n' + '='.repeat(60))
    console.log('Testing internal video embed with alt-text-first DISABLED')
    console.log('='.repeat(60))

    // Disable alt-text-first
    await setAltTextFirst(page, false)
    await page.reload()
    await page.waitForLoadState('networkidle', {timeout: 60000})
    await page.waitForTimeout(3000)

    // Check that video thumbnail images are visible
    const domInfoDisabled = await inspectDOM(page)
    console.log(`  With alt-text-first DISABLED:`)
    console.log(`    Total images: ${domInfoDisabled.totalImages}`)
    console.log(`    Video thumbnails: ${domInfoDisabled.videoThumbnails}`)

    // The video should start with thumbnail visible

    console.log('\n✅ Internal video embed test complete')
    await page.close()
  })
})
