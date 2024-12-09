import { createSelector } from 'reselect'
import { getGroupedCommands } from './utils'

import type { State } from '../types'
import type { StoredProtocolData } from './types'

export const getStoredProtocols: (
  state: State
) => StoredProtocolData[] = createSelector(
  state => state.protocolStorage.protocolKeys,
  state => state.protocolStorage.filesByProtocolKey,
  (protocolKeys, filesByProtocolKey) =>
    protocolKeys
      .map(protocolKey => {
        const storedProtocolData = filesByProtocolKey[protocolKey]
        if (storedProtocolData == null) {
          return null
        }
        const mostRecentAnalysis = storedProtocolData.mostRecentAnalysis
        const groupedCommands =
          mostRecentAnalysis != null
            ? getGroupedCommands(mostRecentAnalysis)
            : []
        return {
          ...storedProtocolData,
          groupedCommands,
        }
      })
      .filter((file): file is StoredProtocolData => file != null)
)

export const getStoredProtocol: (
  state: State,
  protocolKey?: string | null
) => StoredProtocolData | null = (state, protocolKey) => {
  const storedProtocolData =
    protocolKey != null
      ? state.protocolStorage.filesByProtocolKey[protocolKey] ?? null
      : null

  if (storedProtocolData == null) {
    return null
  }
  const mostRecentAnalysis = storedProtocolData.mostRecentAnalysis
  const groupedCommands =
    mostRecentAnalysis != null ? getGroupedCommands(mostRecentAnalysis) : []
  return {
    ...storedProtocolData,
    groupedCommands,
  }
}

export const getIsProtocolAnalysisInProgress: (
  state: State,
  protocolKey: string
) => boolean = (state, protocolKey) =>
  state.protocolStorage.inProgressAnalysisProtocolKeys.includes(protocolKey)
