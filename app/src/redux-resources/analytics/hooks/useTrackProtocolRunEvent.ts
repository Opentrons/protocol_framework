import { useTrackEvent } from '/app/redux/analytics'
import { useProtocolRunAnalyticsData } from './useProtocolRunAnalyticsData'
import { useRobot } from '/app/redux-resources/robots'

interface ProtocolRunAnalyticsEvent {
  name: string
  properties?: { [key: string]: unknown }
}

export type TrackProtocolRunEvent = (
  protocolRunEvent: ProtocolRunAnalyticsEvent
) => void

export function useTrackProtocolRunEvent(
  runId: string | null,
  robotName: string
): { trackProtocolRunEvent: TrackProtocolRunEvent } {
  const trackEvent = useTrackEvent()
  const robot = useRobot(robotName)
  const { getProtocolRunAnalyticsData } = useProtocolRunAnalyticsData(
    runId,
    robot
  )

  const trackProtocolRunEvent: TrackProtocolRunEvent = ({
    name,
    properties = {},
  }) => {
    getProtocolRunAnalyticsData()
      .then(({ protocolRunAnalyticsData, runTime }) => {
        trackEvent({
          name,
          properties: {
            ...properties,
            ...protocolRunAnalyticsData,
            runTime,
            // It's sometimes unavoidable (namely on the desktop app) to prevent sending an event multiple times.
            // In these circumstances, we need an idempotency key to accurately filter events in Mixpanel.
            transactionId: runId,
          },
        })
      })
      .catch((e: Error) => {
        console.error(
          `getProtocolRunAnalyticsData error during ${name}: ${e.message}; sending protocolRunEvent without protocol properties`
        )
        trackEvent({ name, properties: {} })
      })
  }

  return { trackProtocolRunEvent }
}
