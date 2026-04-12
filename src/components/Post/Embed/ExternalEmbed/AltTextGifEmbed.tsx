import {useRef, useState} from 'react'
import {Pressable, View} from 'react-native'
import {Image} from 'expo-image'
import {utils} from '@bsky.app/alf'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {useAltTextFirstEnabled, useAutoplayDisabled} from '#/state/preferences'
import {atoms as a, useTheme} from '#/alf'
import {ArrowsDiagonalOut_Stroke2_Corner0_Rounded as ExpandIcon} from '#/components/icons/ArrowsDiagonal'
import {TimesLarge_Stroke2_Corner0_Rounded as CloseIcon} from '#/components/icons/Times'
import {MediaInsetBorder} from '#/components/MediaInsetBorder'
import {Text} from '#/components/Typography'
import {PlayButtonIcon} from '#/components/video/PlayButtonIcon'
import {GifView} from '../../../../../modules/expo-bluesky-gif-view'
import {type GifViewStateChangeEvent} from '../../../../../modules/expo-bluesky-gif-view/src/GifView.types'

interface AltTextGifEmbedProps {
  playerUri: string
  thumb: string | undefined
  altText: string
}

type GifState = 'collapsed' | 'showingThumbnail' | 'playing'

export function AltTextGifEmbed({
  playerUri,
  thumb,
  altText,
}: AltTextGifEmbedProps) {
  const t = useTheme()
  const {_} = useLingui()
  const altTextFirstEnabled = useAltTextFirstEnabled()
  const [state, setState] = useState<GifState>(() =>
    altTextFirstEnabled ? 'collapsed' : 'showingThumbnail',
  )
  const gifRef = useRef<GifView>(null)
  const _autoplayDisabled = useAutoplayDisabled()

  const hasAlt = !!altText
  const displayAltText = hasAlt ? altText : 'No Alt Text'

  const [isPlaying, setIsPlaying] = useState(false)

  const handleExpand = () => {
    setState('showingThumbnail')
  }

  const handlePlay = () => {
    setState('playing')
    setIsPlaying(true)
  }

  const handleCollapse = () => {
    // Pause GIF when collapsing (only if playing, to avoid restarting a paused GIF)
    if (isPlaying) {
      gifRef.current?.toggleAsync()
    }
    setState('collapsed')
    setIsPlaying(false)
  }

  const onGifStateChange = (e: GifViewStateChangeEvent) => {
    setIsPlaying(e.nativeEvent.isPlaying)
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
        accessibilityLabel={displayAltText}
        accessibilityHint={_(msg`Tap to view GIF`)}
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
            <Text
              style={
                hasAlt
                  ? [a.text_sm, t.atoms.text, {flexWrap: 'wrap'}]
                  : [
                      a.text_md,
                      {color: '#dc3545', fontWeight: 'bold', flexWrap: 'wrap'},
                    ]
              }>
              {displayAltText}
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
          accessibilityLabel={_(msg`Close GIF`)}
          accessibilityHint={_(msg`Closes the GIF preview`)}
          accessibilityRole="button">
          <CloseIcon fill={t.atoms.text.color} width={16} />
        </Pressable>

        {/* Thumbnail with play button */}
        <View style={[a.relative]}>
          {thumb ? (
            <Image
              source={{uri: thumb}}
              style={[a.w_full, {minHeight: 200}]}
              contentFit="contain"
              accessible={true}
              accessibilityLabel={altText}
              accessibilityHint={_(msg`Tap to play GIF`)}
              loading="lazy"
            />
          ) : (
            <View
              style={[
                a.w_full,
                {minHeight: 200, backgroundColor: '#333'},
                a.align_center,
                a.justify_center,
              ]}>
              <Text style={[{color: '#999'}]}>GIF</Text>
            </View>
          )}
          <Pressable
            onPress={handlePlay}
            style={[
              a.absolute,
              a.inset_0,
              a.align_center,
              a.justify_center,
              {backgroundColor: 'rgba(0,0,0,0.3)'},
            ]}
            accessibilityLabel={_(msg`Play GIF`)}
            accessibilityHint={_(msg`Starts playing the GIF`)}
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

  // State 3: Playing GIF - use actual GifView
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
        accessibilityLabel={_(msg`Close GIF`)}
        accessibilityHint={_(msg`Closes the GIF player`)}
        accessibilityRole="button">
        <CloseIcon fill={t.atoms.text.color} width={16} />
      </Pressable>

      {/* GIF player */}
      <View style={[a.relative]}>
        <GifView
          source={playerUri}
          placeholderSource={thumb}
          style={[a.w_full, {minHeight: 200}]}
          autoplay={true}
          onPlayerStateChange={onGifStateChange}
          ref={gifRef}
          accessibilityLabel={altText}
          accessibilityHint={_(msg`Animated GIF`)}
        />
        <MediaInsetBorder />
      </View>

      {/* Alt text below GIF */}
      {hasAlt && (
        <View style={[a.p_sm, t.atoms.bg_contrast_25]}>
          <Text style={[a.text_sm, t.atoms.text_contrast_high]}>{altText}</Text>
        </View>
      )}
    </View>
  )
}
