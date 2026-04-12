import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import {Pressable, View} from 'react-native'
import {type AppBskyEmbedVideo} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {useAltTextFirstEnabled, useAutoplayDisabled} from '#/state/preferences'
import {ErrorBoundary} from '#/view/com/util/ErrorBoundary'
import {atoms as a, useTheme} from '#/alf'
import {useIsWithinMessage} from '#/components/dms/MessageContext'
import {useFullscreen} from '#/components/hooks/useFullscreen'
import {ArrowsDiagonalOut_Stroke2_Corner0_Rounded as ExpandIcon} from '#/components/icons/ArrowsDiagonal'
import {TimesLarge_Stroke2_Corner0_Rounded as CloseIcon} from '#/components/icons/Times'
import {ConstrainedImage} from '#/components/images/AutoSizedImage'
import {MediaInsetBorder} from '#/components/MediaInsetBorder'
import {
  HLSUnsupportedError,
  VideoEmbedInnerWeb,
  VideoNotFoundError,
} from '#/components/Post/Embed/VideoEmbed/VideoEmbedInner/VideoEmbedInnerWeb'
import {Text} from '#/components/Typography'
import {PlayButtonIcon} from '#/components/video/PlayButtonIcon'
import {IS_WEB_FIREFOX} from '#/env'
import {useActiveVideoWeb} from './ActiveVideoWebContext'
import * as VideoFallback from './VideoEmbedInner/VideoFallback'

const noop = () => {}

type VideoState = 'collapsed' | 'showingThumbnail' | 'expanded'

export function VideoEmbed({embed}: {embed: AppBskyEmbedVideo.View}) {
  const t = useTheme()
  const altTextFirstEnabled = useAltTextFirstEnabled()
  const autoplayDisabled = useAutoplayDisabled()
  const {_} = useLingui()
  const [state, setState] = useState<VideoState>(() =>
    altTextFirstEnabled ? 'collapsed' : 'showingThumbnail',
  )
  const userInteractedRef = useRef(false)
  const [forceShowVideo, setForceShowVideo] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const {
    active: activeFromContext,
    setActive,
    sendPosition,
    currentActiveView,
  } = useActiveVideoWeb()
  const [onScreen, setOnScreen] = useState(false)
  const [isFullscreen] = useFullscreen()
  const lastKnownTimeRef = useRef<number | undefined>(undefined)

  const isGif = embed.presentation === 'gif'
  // GIFs don't participate in the "one video at a time" system
  const active = isGif || activeFromContext

  const handleExpand = () => {
    userInteractedRef.current = true
    // If autoplay is enabled, skip thumbnail and go straight to the player
    setState(autoplayDisabled ? 'showingThumbnail' : 'expanded')
  }

  const handlePlay = () => {
    userInteractedRef.current = true
    setForceShowVideo(true)
    setState('expanded')
  }

  const handleCollapse = () => {
    userInteractedRef.current = true
    setState('collapsed')
  }

  // Update state when setting changes (only if user hasn't manually interacted)
  // Using a ref to track the setting value and update state lazily to avoid setState in effect
  const altTextFirstEnabledRef = useRef(altTextFirstEnabled)
  useEffect(() => {
    if (userInteractedRef.current) return
    if (altTextFirstEnabledRef.current !== altTextFirstEnabled) {
      altTextFirstEnabledRef.current = altTextFirstEnabled
      setState(altTextFirstEnabled ? 'collapsed' : 'showingThumbnail')
    }
  }, [altTextFirstEnabled])

  useEffect(() => {
    if (!ref.current) return
    if (isFullscreen && !IS_WEB_FIREFOX) return
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0]
        if (!entry) return
        setOnScreen(entry.isIntersecting)
        // GIFs don't send position - they don't compete to be the active video
        if (!isGif) {
          sendPosition(
            entry.boundingClientRect.y + entry.boundingClientRect.height / 2,
          )
        }
      },
      {threshold: 0.5},
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [sendPosition, isFullscreen, isGif])

  // ALL hooks must be called before any early returns
  const [key, setKey] = useState(0)
  const renderError = useCallback(
    (error: unknown) => (
      <VideoError error={error} retry={() => setKey(key + 1)} />
    ),
    [key],
  )

  // If collapsed, show alt text box (after all hooks are called)
  if (state === 'collapsed') {
    const altText = embed.alt || _(msg`Video`)
    return (
      <View style={[a.pt_xs]}>
        <Pressable
          onPress={handleExpand}
          style={[
            a.rounded_md,
            a.overflow_hidden,
            t.atoms.bg_contrast_25,
            {minHeight: 80},
          ]}
          accessibilityLabel={altText}
          accessibilityHint={_(msg`Tap to view video thumbnail`)}
          accessibilityRole="button">
          <View style={[a.p_md, a.flex_row, a.align_center, a.gap_sm]}>
            <View
              style={[
                a.rounded_xs,
                {
                  padding: 4,
                  backgroundColor: t.atoms.text_contrast_high.color,
                  opacity: 0.8,
                },
              ]}>
              <ExpandIcon fill={t.atoms.bg.backgroundColor} width={16} />
            </View>
            <View style={[a.flex_1]}>
              <Text style={[a.text_sm, t.atoms.text, {flexWrap: 'wrap'}]}>
                {altText}
              </Text>
            </View>
          </View>
          <MediaInsetBorder />
        </Pressable>
      </View>
    )
  }

  let aspectRatio: number | undefined
  const dims = embed.aspectRatio
  if (dims) {
    aspectRatio = dims.width / dims.height
    if (Number.isNaN(aspectRatio)) {
      aspectRatio = undefined
    }
  }

  let constrained: number | undefined
  if (aspectRatio !== undefined) {
    const ratio = 1 / 2 // max of 1:2 ratio in feeds
    constrained = Math.max(aspectRatio, ratio)
  }

  // State: showingThumbnail — thumbnail with play button and close button
  if (state === 'showingThumbnail') {
    return (
      <View style={[a.pt_xs, {position: 'relative'}]}>
        <ConstrainedImage
          fullBleed
          aspectRatio={constrained || 1}
          minMobileAspectRatio={14 / 9}>
          <div
            style={{
              width: '100%',
              height: '100%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: t.palette.black,
              backgroundImage: `url(${embed.thumbnail})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
            onClick={handlePlay}>
            <PlayButtonIcon size={32} />
          </div>
          <MediaInsetBorder />
        </ConstrainedImage>
        <Pressable
          onPress={handleCollapse}
          style={[
            a.absolute,
            a.top_0,
            a.right_0,
            a.m_sm,
            a.rounded_full,
            t.atoms.bg_contrast_25,
            {padding: 6, zIndex: 10},
          ]}
          accessibilityLabel={_(msg`Close video`)}
          accessibilityHint={_(msg`Collapses the video back to alt text`)}
          accessibilityRole="button">
          <CloseIcon fill={t.atoms.text.color} width={16} />
        </Pressable>
      </View>
    )
  }

  const contents = (
    <div
      ref={ref}
      style={{
        display: 'flex',
        flex: 1,
        cursor: 'default',
        backgroundColor: altTextFirstEnabled
          ? t.atoms.bg_contrast_25.backgroundColor
          : t.palette.black,
        backgroundImage: altTextFirstEnabled
          ? 'none'
          : `url(${embed.thumbnail})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      onClick={evt => evt.stopPropagation()}>
      <ErrorBoundary renderError={renderError} key={key}>
        <OnlyNearScreen>
          <VideoEmbedInnerWeb
            embed={embed}
            active={active}
            setActive={setActive}
            onScreen={onScreen}
            lastKnownTimeRef={lastKnownTimeRef}
          />
        </OnlyNearScreen>
      </ErrorBoundary>
    </div>
  )

  return (
    <View style={[a.pt_xs, {position: 'relative'}]}>
      <ViewportObserver
        sendPosition={isGif ? noop : sendPosition}
        isAnyViewActive={currentActiveView !== null}>
        <ConstrainedImage
          fullBleed
          aspectRatio={constrained || 1}
          // slightly smaller max height than images
          // images use 16 / 9, for reference
          minMobileAspectRatio={14 / 9}>
          <OnlyNearScreen forceShow={forceShowVideo}>{contents}</OnlyNearScreen>
          <MediaInsetBorder />
        </ConstrainedImage>
      </ViewportObserver>
      <Pressable
        onPress={handleCollapse}
        style={[
          a.absolute,
          a.top_0,
          a.right_0,
          a.m_sm,
          a.rounded_full,
          t.atoms.bg_contrast_25,
          {padding: 6, zIndex: 10},
        ]}
        accessibilityLabel={_(msg`Close video`)}
        accessibilityHint={_(msg`Collapses the video back to alt text`)}
        accessibilityRole="button">
        <CloseIcon fill={t.atoms.text.color} width={16} />
      </Pressable>
    </View>
  )
}

const NearScreenContext = createContext(false)
NearScreenContext.displayName = 'VideoNearScreenContext'

/**
 * Renders a 100vh tall div and watches it with an IntersectionObserver to
 * send the position of the div when it's near the screen.
 *
 * IMPORTANT: ViewportObserver _must_ not be within a `overflow: hidden` container.
 */
function ViewportObserver({
  children,
  sendPosition,
  isAnyViewActive,
}: {
  children: React.ReactNode
  sendPosition: (position: number) => void
  isAnyViewActive: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [nearScreen, setNearScreen] = useState(false)
  const [isFullscreen] = useFullscreen()
  const isWithinMessage = useIsWithinMessage()

  // Send position when scrolling. This is done with an IntersectionObserver
  // observing a div of 100vh height
  useEffect(() => {
    if (!ref.current) return
    if (isFullscreen && !IS_WEB_FIREFOX) return
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0]
        if (!entry) return
        const position =
          entry.boundingClientRect.y + entry.boundingClientRect.height / 2
        sendPosition(position)
        setNearScreen(entry.isIntersecting)
      },
      {threshold: Array.from({length: 101}, (_, i) => i / 100)},
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [sendPosition, isFullscreen])

  // In case scrolling hasn't started yet, send up the position
  useEffect(() => {
    if (ref.current && !isAnyViewActive) {
      const rect = ref.current.getBoundingClientRect()
      const position = rect.y + rect.height / 2
      sendPosition(position)
    }
  }, [isAnyViewActive, sendPosition])

  return (
    <View style={[a.flex_1, a.flex_row]}>
      <NearScreenContext.Provider value={nearScreen}>
        {children}
      </NearScreenContext.Provider>
      <div
        ref={ref}
        style={{
          // Don't escape bounds when in a message
          ...(isWithinMessage
            ? {top: 0, height: '100%'}
            : {top: 'calc(50% - 50vh)', height: '100vh'}),
          position: 'absolute',
          left: '50%',
          width: 1,
          pointerEvents: 'none',
        }}
      />
    </View>
  )
}

/**
 * Awkward data flow here, but we need to hide the video when it's not near the screen.
 * But also, ViewportObserver _must_ not be within a `overflow: hidden` container.
 * So we put it at the top level of the component tree here, then hide the children of
 * the auto-resizing container.
 */
export const OnlyNearScreen = ({
  children,
  forceShow = false,
}: {
  children: React.ReactNode
  forceShow?: boolean
}) => {
  const nearScreen = useContext(NearScreenContext)

  return nearScreen || forceShow ? children : null
}

function VideoError({error, retry}: {error: unknown; retry: () => void}) {
  const {_} = useLingui()

  let showRetryButton = true
  let text = null

  if (error instanceof VideoNotFoundError) {
    text = _(msg`Video not found.`)
  } else if (error instanceof HLSUnsupportedError) {
    showRetryButton = false
    text = _(
      msg`Your browser does not support the video format. Please try a different browser.`,
    )
  } else {
    text = _(msg`An error occurred while loading the video. Please try again.`)
  }

  return (
    <VideoFallback.Container>
      <VideoFallback.Text>{text}</VideoFallback.Text>
      {showRetryButton && <VideoFallback.RetryButton onPress={retry} />}
    </VideoFallback.Container>
  )
}
