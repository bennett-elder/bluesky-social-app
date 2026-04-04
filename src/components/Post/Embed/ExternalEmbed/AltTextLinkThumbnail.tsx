import {useState} from 'react'
import {Pressable, View} from 'react-native'
import {Image} from 'expo-image'
import {utils} from '@bsky.app/alf'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {ArrowsDiagonalOut_Stroke2_Corner0_Rounded as ExpandIcon} from '#/components/icons/ArrowsDiagonal'
import {TimesLarge_Stroke2_Corner0_Rounded as CloseIcon} from '#/components/icons/Times'
import {MediaInsetBorder} from '#/components/MediaInsetBorder'
import {Text} from '#/components/Typography'

interface AltTextLinkThumbnailProps {
  imageUri: string
  altText?: string
}

type ThumbnailState = 'collapsed' | 'expanded'

export function AltTextLinkThumbnail({
  imageUri,
  altText,
}: AltTextLinkThumbnailProps) {
  const t = useTheme()
  const {_} = useLingui()
  const [state, setState] = useState<ThumbnailState>('collapsed')

  const hasAlt = !!altText
  const displayAltText = hasAlt ? altText : 'No Alt Text,\nCoal In Stocking'

  const handleExpand = () => {
    setState('expanded')
  }

  const handleCollapse = () => {
    setState('collapsed')
  }

  // State 1: Collapsed - show "Show Thumbnail" button
  if (state === 'collapsed') {
    return (
      <Pressable
        onPress={handleExpand}
        android_ripple={{
          color: utils.alpha(t.atoms.bg.backgroundColor, 0.2),
          foreground: true,
        }}
        style={[
          a.rounded_md,
          a.overflow_hidden,
          t.atoms.bg_contrast_25,
          {minHeight: 44},
        ]}
        accessibilityLabel={displayAltText}
        accessibilityHint={_(msg`Tap to view thumbnail`)}
        accessibilityRole="button">
        <View
          style={[
            a.p_md,
            a.flex_row,
            a.align_center,
            a.gap_sm,
            a.justify_center,
          ]}>
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
          <Text style={[a.text_sm, a.font_medium, t.atoms.text]}>
            Show Thumbnail
          </Text>
        </View>
        <MediaInsetBorder />
      </Pressable>
    )
  }

  // State 2: Expanded - show thumbnail
  return (
    <View style={[a.rounded_md, a.overflow_hidden, t.atoms.bg_contrast_25]}>
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
        accessibilityLabel={_(msg`Hide thumbnail`)}
        accessibilityHint={_(msg`Closes the thumbnail preview`)}
        accessibilityRole="button">
        <CloseIcon fill={t.atoms.text.color} width={16} />
      </Pressable>

      {/* Thumbnail image */}
      <Image
        source={{uri: imageUri}}
        style={[a.w_full, {minHeight: 150}]}
        contentFit="contain"
        accessible={true}
        accessibilityLabel={altText}
        accessibilityHint={_(msg`Link thumbnail`)}
        loading="lazy"
      />
      <MediaInsetBorder />

      {/* Alt text below thumbnail */}
      {hasAlt && (
        <View style={[a.p_sm, t.atoms.bg_contrast_25]}>
          <Text style={[a.text_sm, t.atoms.text_contrast_high]}>{altText}</Text>
        </View>
      )}
    </View>
  )
}
