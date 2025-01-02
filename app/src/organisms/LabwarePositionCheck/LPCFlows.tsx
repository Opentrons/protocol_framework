import { useState } from 'react'

import {
  useCreateMaintenanceRunLabwareDefinitionMutation,
  useDeleteMaintenanceRunMutation,
  useRunLoadedLabwareDefinitions,
} from '@opentrons/react-api-client'

import {
  useCreateTargetedMaintenanceRunMutation,
  useNotifyRunQuery,
  useMostRecentCompletedAnalysis,
} from '/app/resources/runs'
import { LPCWizardContainer } from './LPCWizardContainer'

import type {
  RobotType,
  CompletedProtocolAnalysis,
} from '@opentrons/shared-data'
import type { LabwareOffset } from '@opentrons/api-client'

interface UseLPCFlowsBase {
  showLPC: boolean
  lpcProps: LPCFlowsProps | null
  isLaunchingLPC: boolean
  launchLPC: () => Promise<void>
}
interface UseLPCFlowsIdle extends UseLPCFlowsBase {
  showLPC: false
  lpcProps: null
}
interface UseLPCFlowsLaunched extends UseLPCFlowsBase {
  showLPC: true
  lpcProps: LPCFlowsProps
  isLaunchingLPC: false
}
export type UseLPCFlowsResult = UseLPCFlowsIdle | UseLPCFlowsLaunched

export interface UseLPCFlowsProps {
  runId: string
  robotType: RobotType
  protocolName: string | undefined
}

export function useLPCFlows({
  runId,
  robotType,
  protocolName,
}: UseLPCFlowsProps): UseLPCFlowsResult {
  const [maintenanceRunId, setMaintenanceRunId] = useState<string | null>(null)
  const [isLaunching, setIsLaunching] = useState(false)
  const [hasCreatedLPCRun, setHasCreatedLPCRun] = useState(false)

  const {
    createTargetedMaintenanceRun,
  } = useCreateTargetedMaintenanceRunMutation()
  const {
    createLabwareDefinition,
  } = useCreateMaintenanceRunLabwareDefinitionMutation()
  const {
    deleteMaintenanceRun,
    isLoading: isDeletingMaintenanceRun,
  } = useDeleteMaintenanceRunMutation()
  useRunLoadedLabwareDefinitions(runId, {
    // TOME TODO: Ideally we don't have to do this POST, since the server has the defs already?
    onSuccess: res => {
      Promise.all(
        res.data.map(def => {
          if ('schemaVersion' in def) {
            createLabwareDefinition({
              maintenanceRunId: maintenanceRunId as string,
              labwareDef: def,
            })
          }
        })
      ).then(() => {
        setHasCreatedLPCRun(true)
      })
    },
    onSettled: () => {
      // TOME TODO: Think about potentially error handling if there's some sort of failure here?
      setIsLaunching(false)
    },
    enabled: maintenanceRunId != null,
  })

  const { data: runRecord } = useNotifyRunQuery(runId, { staleTime: Infinity })
  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)

  const currentOffsets = runRecord?.data?.labwareOffsets ?? []

  const launchLPC = (): Promise<void> => {
    setIsLaunching(true)

    return createTargetedMaintenanceRun({
      labwareOffsets: currentOffsets.map(
        ({ vector, location, definitionUri }) => ({
          vector,
          location,
          definitionUri,
        })
      ),
    }).then(maintenanceRun => {
      setMaintenanceRunId(maintenanceRun.data.id)
    })
  }

  const handleCloseLPC = (): void => {
    if (maintenanceRunId != null) {
      deleteMaintenanceRun(maintenanceRunId, {
        onSettled: () => {
          setMaintenanceRunId(null)
          setHasCreatedLPCRun(false)
        },
      })
    }
  }

  const showLPC =
    hasCreatedLPCRun && maintenanceRunId != null && protocolName != null

  return showLPC
    ? {
        launchLPC,
        isLaunchingLPC: false,
        showLPC,
        lpcProps: {
          onCloseClick: handleCloseLPC,
          runId,
          robotType,
          existingOffsets: currentOffsets,
          mostRecentAnalysis,
          protocolName,
          maintenanceRunUtils: {
            maintenanceRunId,
            setMaintenanceRunId,
            isDeletingMaintenanceRun,
          },
        },
      }
    : { launchLPC, isLaunchingLPC: isLaunching, lpcProps: null, showLPC }
}

interface LPCFlowsMaintenanceRunProps {
  maintenanceRunId: string
  setMaintenanceRunId: (id: string | null) => void
  isDeletingMaintenanceRun: boolean
}

export interface LPCFlowsProps {
  onCloseClick: () => void
  runId: string
  robotType: RobotType
  existingOffsets: LabwareOffset[]
  mostRecentAnalysis: CompletedProtocolAnalysis | null
  protocolName: string
  maintenanceRunUtils: LPCFlowsMaintenanceRunProps
}

export function LPCFlows(props: LPCFlowsProps): JSX.Element {
  return <LPCWizardContainer {...props} />
}
