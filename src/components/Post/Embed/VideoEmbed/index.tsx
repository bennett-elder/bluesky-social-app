import {useCallback, useState} from 'react'
import {View} from 'react-native'
import {type AppBskyEmbedVideo} from '@atproto/api'
import {Trans} from '@lingui/react/macro'

import {ErrorBoundary} from '#/view/com/util/ErrorBoundary'
import {atoms as a} from '#/alf'
import {AltTextVideoEmbed} from './AltTextVideoEmbed'
import * as VideoFallback from './VideoEmbedInner/VideoFallback'

interface Props {
  embed: AppBskyEmbedVideo.View
}

export function VideoEmbed({embed}: Props) {
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
        <AltTextVideoEmbed embed={embed} />
      </ErrorBoundary>
    </View>
  )
}

function VideoError({retry}: {error: unknown; retry: () => void}) {
  return (
    <VideoFallback.Container>
      <VideoFallback.Text>
        <Trans>
          An error occurred while loading the video. Please try again later.
        </Trans>
      </VideoFallback.Text>
      <VideoFallback.RetryButton onPress={retry} />
    </VideoFallback.Container>
  )
}
