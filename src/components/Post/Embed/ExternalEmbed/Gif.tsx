import {useCallback, useState} from 'react'
import {View} from 'react-native'
import {Trans} from '@lingui/react/macro'

import {ErrorBoundary} from '#/view/com/util/ErrorBoundary'
import {atoms as a} from '#/alf'
import * as VideoFallback from '../VideoEmbed/VideoEmbedInner/VideoFallback'
import {AltTextGifEmbed} from './AltTextGifEmbed'

export function GifEmbed({
  params,
  thumb,
  altText,
  isPreferredAltText: _isPreferredAltText,
  hideAlt: _hideAlt,
}: {
  params: {playerUri: string}
  thumb: string | undefined
  altText: string
  isPreferredAltText: boolean
  hideAlt?: boolean
}) {
  const [key, setKey] = useState(0)

  const renderError = useCallback(
    (error: unknown) => (
      <VideoError error={error} retry={() => setKey(key + 1)} />
    ),
    [key],
  )

  return (
    <View style={[a.pt_xs]}>
      <ErrorBoundary renderError={renderError} key={key}>
        <AltTextGifEmbed
          playerUri={params.playerUri}
          thumb={thumb}
          altText={altText}
        />
      </ErrorBoundary>
    </View>
  )
}

function VideoError({retry}: {error: unknown; retry: () => void}) {
  return (
    <VideoFallback.Container>
      <VideoFallback.Text>
        <Trans>
          An error occurred while loading the GIF. Please try again later.
        </Trans>
      </VideoFallback.Text>
      <VideoFallback.RetryButton onPress={retry} />
    </VideoFallback.Container>
  )
}
