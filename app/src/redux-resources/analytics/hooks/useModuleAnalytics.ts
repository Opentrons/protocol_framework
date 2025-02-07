import { AttachedModule, CommandData, RUN_STATUS_FAILED, RUN_STATUS_SUCCEEDED } from '@opentrons/api-client'
import { useState } from 'react'

import {
    ANALYTICS_MODULE_COMMAND_COMPLETED,
    ANALYTICS_MODULE_COMMAND_ERROR,
    ANALYTICS_MODULE_COMMAND_STARTED,
    useTrackEvent
} from '/app/redux/analytics'
import { useModulesQuery } from '@opentrons/react-api-client'
import { CreateLiveCommandMutateParams } from '@opentrons/react-api-client/src/runs/useCreateLiveCommandMutation'
import { CompletedProtocolAnalysis } from '@opentrons/shared-data'


type commandType = 'toggle-hs-latch' |'toggle-tc-lid'| 'set-temperature-module-temperature' | 'set-thermocycler-lid-temperature' | 'set-thermocycler-block-temperature' | 'set-heatershaker-temperature' | 'deactivate'
type CommandResult = 'succeeded' | 'failed'
const { data: modulesData } = useModulesQuery()

export interface ReportModuleActionParams{
    resultFromRunCompleted: CommandData,
    protocolAnalysis?: CompletedProtocolAnalysis,
}

export interface UseModuleCommandAnalyticsResult {
    /* Report when a module command completes. */
    reportModuleCommand: (
       params:ReportModuleActionParams
    ) => void
}

export function useModuleCommandAnalytics(modules?:AttachedModule[]): UseModuleCommandAnalyticsResult {
    const doTrackEvent = useTrackEvent()
    useModulesQuery({enabled: modules!= null})
    const reportModuleCommand = (
 
        // Check if you need module data - means it is a protocol command make sure to leave comment
        // 
        
        if (reportModuleCommandType){

        }
        elif (reportModuleCommandType )
        moduleType: string,
        action: commandType,
        result: CommandResult,
        serialNumber: string,
        temperature: number | null

    ): void => {
        doTrackEvent({
            name: ANALYTICS_MODULE_COMMAND_COMPLETED,
            properties: {
                moduleType,
                action,
                result,
                serialNumber, 
            },
        })
    }
    return {
        reportModuleCommandCompleted,
    }
}