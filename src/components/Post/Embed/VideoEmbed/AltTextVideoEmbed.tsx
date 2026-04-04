import {useRef, useState} from 'react'
import {Pressable, View} from 'react-native'
import {Image} from 'expo-image'
import {type AppBskyEmbedVideo} from '@atproto/api'
import {utils} from '@bsky.app/alf'
import {BlueskyVideoView} from '@haileyok/bluesky-video'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {useAutoplayDisabled} from '#/state/preferences'
import {atoms as a, useTheme} from '#/alf'
import {ArrowsDiagonalOut_Stroke2_Corner0_Rounded as ExpandIcon} from '#/components/icons/ArrowsDiagonal'
import {Mute_Stroke2_Corner0_Rounded as MuteIcon} from '#/components/icons/Mute'
import {Pause_Filled_Corner0_Rounded as PauseIcon} from '#/components/icons/Pause'
import {Play_Filled_Corner0_Rounded as PlayIcon} from '#/components/icons/Play'
import {SpeakerVolumeFull_Stroke2_Corner0_Rounded as UnmuteIcon} from '#/components/icons/Speaker'
import {TimesLarge_Stroke2_Corner0_Rounded as CloseIcon} from '#/components/icons/Times'
import {KeepAwake} from '#/components/KeepAwake'
import {MediaInsetBorder} from '#/components/MediaInsetBorder'
import {useVideoMuteState} from '#/components/Post/Embed/VideoEmbed/VideoVolumeContext'
import {Text} from '#/components/Typography'
import {PlayButtonIcon} from '#/components/video/PlayButtonIcon'
import {TimeIndicator} from './VideoEmbedInner/TimeIndicator'

interface AltTextVideoEmbedProps {
  embed: AppBskyEmbedVideo.View
}

type VideoState = 'collapsed' | 'showingThumbnail' | 'playing'

export function AltTextVideoEmbed({embed}: AltTextVideoEmbedProps) {
  const t = useTheme()
  const {_} = useLingui()
  const [state, setState] = useState<VideoState>('collapsed')
  const videoRef = useRef<BlueskyVideoView>(null)
  const autoplayDisabled = useAutoplayDisabled()
  const [muted, setMuted] = useVideoMuteState()

  const hasAlt = !!embed.alt
  const altText = embed.alt || _(msg`Video`)
  const isGif = embed.presentation === 'gif'

  const [isPlaying, setIsPlaying] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)

  const handleExpand = () => {
    setState('showingThumbnail')
  }

  const handlePlay = () => {
    setState('playing')
  }

  const handleCollapse = () => {
    // Stop video when collapsing
    videoRef.current?.togglePlayback()
    setState('collapsed')
    setIsPlaying(false)
  }

  const togglePlayback = () => {
    videoRef.current?.togglePlayback()
  }

  const toggleMuted = () => {
    videoRef.current?.toggleMuted()
    setMuted(!muted)
  }

  // State 1: Collapsed - show alt text box
  if (state === 'collapsed') {
    return (
      <Pressable
        onPress={handleExpand}
        android_ripple={{
          color: utils.alpha(t.atoms.bg.backgroundColor, 0.2),
          foreground: true,
        }}
        style={[
          a.mt_sm,
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
    )
  }

  // State 2: Showing thumbnail with play button
  if (state === 'showingThumbnail') {
    return (
      <View
        style={[
          a.mt_sm,
          a.rounded_md,
          a.overflow_hidden,
          t.atoms.bg_contrast_25,
        ]}>
        {/* Close button */}
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
          accessibilityHint={_(msg`Closes the video preview`)}
          accessibilityRole="button">
          <CloseIcon fill={t.atoms.text.color} width={16} />
        </Pressable>

        {/* Thumbnail with play button */}
        <View style={[a.relative]}>
          <Image
            source={{uri: embed.thumbnail}}
            style={[a.w_full, {minHeight: 200}]}
            contentFit="contain"
            accessible={true}
            accessibilityLabel={embed.alt}
            accessibilityHint={_(msg`Tap to play video`)}
            loading="lazy"
          />
          <Pressable
            onPress={handlePlay}
            style={[
              a.absolute,
              a.inset_0,
              a.align_center,
              a.justify_center,
              {backgroundColor: 'rgba(0,0,0,0.3)'},
            ]}
            accessibilityLabel={_(msg`Play video`)}
            accessibilityHint={_(msg`Starts playing the video`)}
            accessibilityRole="button">
            <View style={[a.relative, a.align_center, a.justify_center]}>
              <PlayButtonIcon size={32} />
            </View>
          </Pressable>
        </View>

        {/* Alt text below thumbnail */}
        {hasAlt && (
          <View style={[a.p_sm, t.atoms.bg_contrast_25]}>
            <Text style={[a.text_sm, t.atoms.text_contrast_high]}>
              {altText}
            </Text>
          </View>
        )}
      </View>
    )
  }

  // State 3: Playing video - use actual BlueskyVideoView
  const showTime = !isNaN(timeRemaining)

  return (
    <View
      style={[
        a.mt_sm,
        a.rounded_md,
        a.overflow_hidden,
        t.atoms.bg_contrast_25,
      ]}>
      {/* Close button */}
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
        accessibilityHint={_(msg`Closes the video player`)}
        accessibilityRole="button">
        <CloseIcon fill={t.atoms.text.color} width={16} />
      </Pressable>

      {/* Video player */}
      <View style={[a.relative]}>
        <BlueskyVideoView
          url={embed.playlist}
          autoplay={!autoplayDisabled}
          beginMuted={isGif || (autoplayDisabled ? false : muted)}
          style={[a.w_full, {minHeight: 200}]}
          onStatusChange={e => {
            setIsPlaying(e.nativeEvent.status === 'playing')
          }}
          onTimeRemainingChange={e => {
            setTimeRemaining(e.nativeEvent.timeRemaining)
          }}
          onMutedChange={e => {
            if (!isGif) {
              setMuted(e.nativeEvent.isMuted)
            }
          }}
          accessibilityLabel={
            embed.alt ? _(msg`Video: ${embed.alt}`) : _(msg`Video`)
          }
          accessibilityHint=""
          ref={videoRef}
        />

        {/* Video controls overlay */}
        {isGif ? (
          // GIF controls - just play/pause overlay
          <Pressable
            onPress={togglePlayback}
            style={[
              a.absolute,
              a.inset_0,
              a.align_center,
              a.justify_center,
              {backgroundColor: isPlaying ? 'transparent' : 'rgba(0,0,0,0.3)'},
            ]}
            accessibilityLabel={
              isPlaying ? _(msg`Pause GIF`) : _(msg`Play GIF`)
            }
            accessibilityHint={
              isPlaying ? _(msg`Pauses the GIF`) : _(msg`Plays the GIF`)
            }
            accessibilityRole="button">
            {!isPlaying && (
              <View style={[a.relative, a.align_center, a.justify_center]}>
                <PlayButtonIcon size={32} />
              </View>
            )}
          </Pressable>
        ) : (
          // Video controls
          <View style={[a.absolute, a.inset_0]}>
            <Pressable
              onPress={togglePlayback}
              style={a.flex_1}
              accessibilityLabel={_(msg`Video`)}
              accessibilityHint={_(msg`Tap to play or pause`)}
              accessibilityRole="button"
            />
            <ControlButton
              onPress={togglePlayback}
              label={isPlaying ? _(msg`Pause`) : _(msg`Play`)}
              accessibilityHint={_(msg`Plays or pauses the video`)}
              style={{left: 6}}>
              {isPlaying ? (
                <PauseIcon width={13} fill={t.palette.white} />
              ) : (
                <PlayIcon width={13} fill={t.palette.white} />
              )}
            </ControlButton>
            {showTime && (
              <TimeIndicator time={timeRemaining} style={{left: 33}} />
            )}

            <ControlButton
              onPress={toggleMuted}
              label={
                muted
                  ? _(msg({message: `Unmute`, context: 'video'}))
                  : _(msg({message: `Mute`, context: 'video'}))
              }
              accessibilityHint={_(msg`Toggles the sound`)}
              style={{right: 6}}>
              {muted ? (
                <MuteIcon width={13} fill={t.palette.white} />
              ) : (
                <UnmuteIcon width={13} fill={t.palette.white} />
              )}
            </ControlButton>
          </View>
        )}
        <MediaInsetBorder />
        <KeepAwake enabled={isPlaying} />
      </View>

      {/* Alt text below video */}
      {hasAlt && (
        <View style={[a.p_sm, t.atoms.bg_contrast_25]}>
          <Text style={[a.text_sm, t.atoms.text_contrast_high]}>{altText}</Text>
        </View>
      )}
    </View>
  )
}

function ControlButton({
  onPress,
  children,
  label,
  accessibilityHint,
  style,
}: {
  onPress: () => void
  children: React.ReactNode
  label: string
  accessibilityHint: string
  style?: any
}) {
  return (
    <View
      style={[
        a.absolute,
        a.rounded_full,
        a.justify_center,
        {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          paddingHorizontal: 4,
          paddingVertical: 4,
          bottom: 6,
          minHeight: 21,
          minWidth: 21,
        },
        style,
      ]}>
      <Pressable
        onPress={onPress}
        style={a.flex_1}
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button">
        {children}
      </Pressable>
    </View>
  )
}
