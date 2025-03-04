import { AttachedModule, CommandData, RUN_STATUS_FAILED, RUN_STATUS_SUCCEEDED } from '@opentrons/api-client'
import { useState } from 'react'

import {
    ANALYTICS_MODULE_COMMAND_COMPLETED,
    ANALYTICS_MODULE_COMMAND_ERROR,
    useTrackEvent
} from '/app/redux/analytics'
import { useModulesQuery } from '@opentrons/react-api-client'
import { CreateLiveCommandMutateParams } from '@opentrons/react-api-client/src/runs/useCreateLiveCommandMutation'
import { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import { getCommandTextData } from '@opentrons/components'


type commandType = 'toggle-hs-latch' |'toggle-tc-lid'| 'set-temperature-module-temperature' | 'set-thermocycler-lid-temperature' | 'set-thermocycler-block-temperature' | 'set-heatershaker-temperature' | 'deactivate'
type CommandResult = 'succeeded' | 'failed'
const { data: modulesData } = useModulesQuery()

export interface ReportModuleActionParams {
    moduleType: string;
    action: string;
    result?: { status: string; data: any }; // Optional for success case
    errorDetails?: string; // Optional for error case
    serialNumber: string;
    temperature: number | null;
}

export interface UseModuleCommandAnalyticsResult {
    /* Report when a module command completes. */
    reportModuleCommand: (params: ReportModuleActionParams) => void;
}

export function useModuleCommandAnalytics(modules?: AttachedModule[]): UseModuleCommandAnalyticsResult {
    const doTrackEvent = useTrackEvent();
    useModulesQuery({ enabled: modules !== undefined });

    const reportModuleCommand = ({
        moduleType,
        action,
        result,
        errorDetails,
        serialNumber,
        temperature,
    }: ReportModuleActionParams & { errorDetails?: string }): void => {
        const fallbackSerialNumber = serialNumber ?? modules?.find(m => m.moduleModel === moduleType)?.serialNumber;

        doTrackEvent({
            name: errorDetails ? ANALYTICS_MODULE_COMMAND_ERROR : ANALYTICS_MODULE_COMMAND_COMPLETED,
            properties: {
                moduleType,
                action,
                ...(errorDetails
                    ? { errorDetails }
                    : { resultStatus: result }),
                serialNumber: fallbackSerialNumber || 'UNKNOWN',
                temperature,
            },
        });
    };

    return { reportModuleCommand };
}
