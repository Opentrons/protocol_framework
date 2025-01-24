import { RUN_STATUS_FAILED, RUN_STATUS_SUCCEEDED } from '@opentrons/api-client'
import { useState } from 'react'

import {
    ANALYTICS_MODULE_COMMAND_COMPLETED,
    ANALYTICS_MODULE_COMMAND_ERROR,
    ANALYTICS_MODULE_COMMAND_STARTED,
    useTrackEvent
} from '/app/redux/analytics'


type commandType = 'toggle-hs-latch' |'toggle-tc-lid'| 'set-temperature-module-temperature' | 'set-thermocycler-lid-temperature' | 'set-thermocycler-block-temperature' | 'set-heatershaker-temperature' | 'deactivate'
type CommandResult = 'succeeded' | 'failed'

export interface UseModuleCommandAnalyticsResult {
    /* Report when a module command starts. */

    // ASK: temperatureValue
    reportModuleCommandStarted: (moduleType: string, action: commandType, serialNumber:string, temperature: number| null) => void
    /* Report when a module command completes. */
    reportModuleCommandCompleted: (
        moduleType: string,
        action: commandType,
        result: CommandResult,
        serialNumber: string,
        temperature: number | null
    ) => void
    /* Report when an error occurs during a module command. */
    reportModuleCommandError: (
        moduleType: string,
        action: commandType,
        errorDetails: string, 
        serialNumber: string,
        temperature: number | null

    ) => void
}

export function useModuleCommandAnalytics(): UseModuleCommandAnalyticsResult {
    const doTrackEvent = useTrackEvent()
    const reportModuleCommandStarted = (
        moduleType: string,
        action: commandType,
        serialNumber: string
    ): void => {
        doTrackEvent({
            name: ANALYTICS_MODULE_COMMAND_STARTED,
            properties: {
                moduleType,
                action,
                serialNumber
            },
        })
    }

    const reportModuleCommandCompleted = (
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
                serialNumber
            },
        })
    }

    const reportModuleCommandError = (
        moduleType: string,
        action: commandType,
        errorDetails: string,
        serialNumber: string,
        temperature: number | null
    ): void => {
        doTrackEvent({
            name: ANALYTICS_MODULE_COMMAND_ERROR,
            properties: {
                moduleType,
                action,
                errorDetails,
                serialNumber,
                temperature
            },
        })
    }
    return {
        reportModuleCommandStarted,
        reportModuleCommandCompleted,
        reportModuleCommandError,
    }
}