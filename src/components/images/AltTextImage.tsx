import {useState} from 'react'
import {Pressable, View} from 'react-native'
import {Image} from 'expo-image'
import {type AppBskyEmbedImages} from '@atproto/api'
import {utils} from '@bsky.app/alf'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {ArrowsDiagonalOut_Stroke2_Corner0_Rounded as ExpandIcon} from '#/components/icons/ArrowsDiagonal'
import {TimesLarge_Stroke2_Corner0_Rounded as CloseIcon} from '#/components/icons/Times'
import {MediaInsetBorder} from '#/components/MediaInsetBorder'
import {Text} from '#/components/Typography'

interface AltTextImageProps {
  image: AppBskyEmbedImages.ViewImage
  index: number
  onPress?: (index: number) => void
}

export function AltTextImage({image, index, onPress}: AltTextImageProps) {
  const t = useTheme()
  const {_} = useLingui()
  const [isExpanded, setIsExpanded] = useState(false)

  const hasAlt = !!image.alt
  const altText = hasAlt ? image.alt : 'No Alt Text'

  const handlePress = () => {
    if (isExpanded) {
      // When tapping the expanded image, open the lightbox
      onPress?.(index)
    } else {
      // When tapping the alt text box, just expand to show the inline image
      setIsExpanded(true)
    }
  }

  const handleClose = () => {
    // Close the expanded view without opening the lightbox
    setIsExpanded(false)
  }

  if (isExpanded) {
    // Show the actual image with a close button
    return (
      <View
        style={[
          a.mt_sm,
          a.rounded_md,
          a.overflow_hidden,
          t.atoms.bg_contrast_25,
        ]}>
        <Pressable
          accessibilityRole="button"
          onPress={handlePress}
          style={[a.relative]}>
          <Image
            source={{uri: image.fullsize || image.thumb}}
            style={[a.w_full, {minHeight: 200}]}
            contentFit="contain"
            accessible={true}
            accessibilityLabel={image.alt}
            accessibilityHint={_(msg`Tap to view full size`)}
            loading="lazy"
          />
          <Pressable
            onPress={e => {
              e.stopPropagation()
              handleClose()
            }}
            style={[
              a.absolute,
              a.top_0,
              a.right_0,
              a.m_sm,
              a.rounded_full,
              t.atoms.bg_contrast_25,
              {padding: 6},
            ]}
            accessibilityLabel={_(msg`Hide image`)}
            accessibilityHint={_(msg`Closes the expanded image view`)}
            accessibilityRole="button">
            <CloseIcon fill={t.atoms.text.color} width={16} />
          </Pressable>
        </Pressable>
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

  // Show alt text box
  return (
    <Pressable
      onPress={handlePress}
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
      accessibilityHint={_(msg`Tap to view image`)}
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
            {altText}
          </Text>
        </View>
      </View>
      <MediaInsetBorder />
    </Pressable>
  )
}
