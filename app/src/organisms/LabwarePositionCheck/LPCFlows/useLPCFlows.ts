import { useEffect, useState } from 'react'

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
import { useNotifyCurrentMaintenanceRun } from '/app/resources/maintenance_runs'

import type { RobotType } from '@opentrons/shared-data'
import type { LPCFlowsProps } from '/app/organisms/LabwarePositionCheck/LPCFlows/LPCFlows'

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

  const { data: runRecord } = useNotifyRunQuery(runId, { staleTime: Infinity })
  const currentOffsets = runRecord?.data?.labwareOffsets ?? []
  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)

  useMonitorMaintenanceRunForDeletion({ maintenanceRunId, setMaintenanceRunId })

  const {
    createTargetedMaintenanceRun,
  } = useCreateTargetedMaintenanceRunMutation()
  const {
    createLabwareDefinition,
  } = useCreateMaintenanceRunLabwareDefinitionMutation()
  const { deleteMaintenanceRun } = useDeleteMaintenanceRunMutation()
  useRunLoadedLabwareDefinitions(runId, {
    // TOME TODO: Ideally we don't have to do this POST, since the server has the defs already?
    onSuccess: res => {
      void Promise.all(
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
          maintenanceRunId,
        },
      }
    : { launchLPC, isLaunchingLPC: isLaunching, lpcProps: null, showLPC }
}

const RUN_REFETCH_INTERVAL = 5000

// TODO(jh, 01-02-25): Monitor for deletion behavior exists in several other flows. We should consolidate it.

// Closes the modal in case the run was deleted by the terminate activity modal on the ODD
function useMonitorMaintenanceRunForDeletion({
  maintenanceRunId,
  setMaintenanceRunId,
}: {
  maintenanceRunId: string | null
  setMaintenanceRunId: (id: string | null) => void
}): void {
  const [
    monitorMaintenanceRunForDeletion,
    setMonitorMaintenanceRunForDeletion,
  ] = useState<boolean>(false)

  // We should start checking for run deletion only after the maintenance run is created
  // and the useCurrentRun poll has returned that created id
  const { data: maintenanceRunData } = useNotifyCurrentMaintenanceRun({
    refetchInterval: RUN_REFETCH_INTERVAL,
    enabled: maintenanceRunId != null,
  })

  useEffect(() => {
    if (
      maintenanceRunId !== null &&
      maintenanceRunData?.data.id === maintenanceRunId
    ) {
      setMonitorMaintenanceRunForDeletion(true)
    }
    if (
      maintenanceRunData?.data.id !== maintenanceRunId &&
      monitorMaintenanceRunForDeletion
    ) {
      setMaintenanceRunId(null)
    }
  }, [
    maintenanceRunData?.data.id,
    maintenanceRunId,
    monitorMaintenanceRunForDeletion,
    setMaintenanceRunId,
  ])
}
