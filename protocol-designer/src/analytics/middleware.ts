import uniq from 'lodash/uniq'
import {
  FLEX_STAGING_AREA_SLOT_ADDRESSABLE_AREAS,
  MOVABLE_TRASH_ADDRESSABLE_AREAS,
  WASTE_CHUTE_ADDRESSABLE_AREAS,
  getModuleDisplayName,
  getPipetteSpecsV2,
} from '@opentrons/shared-data'
import {
  getArgsAndErrorsByStepId,
  getPipetteEntities,
  getSavedStepForms,
} from '../step-forms/selectors'
import {
  createFile,
  getFileMetadata,
  getRobotStateTimeline,
} from '../file-data/selectors'
import { FIXED_TRASH_ID } from '../constants'
import { trackEvent } from './mixpanel'
import { getHasOptedIn } from './selectors'
import { flattenNestedProperties } from './utils/flattenNestedProperties'
import type { Middleware } from 'redux'
import type {
  AddressableAreaName,
  LoadLabwareCreateCommand,
  LoadModuleCreateCommand,
  LoadPipetteCreateCommand,
  PipetteName,
} from '@opentrons/shared-data'
import type { BaseState } from '../types'
import type { FormData, StepIdType, StepType } from '../form-types'
import type { StepArgsAndErrors } from '../steplist'
import type { SaveStepFormAction } from '../ui/steps/actions/thunks'
import type { AnalyticsEventAction } from './actions'
import type { AnalyticsEvent } from './mixpanel'
import type { RenameStepAction } from '../labware-ingred/actions'
import type { SetFeatureFlagAction } from '../feature-flags/actions'

// Converts Redux actions to analytics events (read: Mixpanel events).
// Returns null if there is no analytics event associated with the action,
// which happens for most actions.
export const reduxActionToAnalyticsEvent = (
  state: BaseState,
  action: any
): AnalyticsEvent | null => {
  if (action.type === 'SAVE_STEP_FORM') {
    // create the "saveStep" action, taking advantage of the formToArgs machinery
    // to get nice cleaned-up data instead of the raw form data.
    const a: SaveStepFormAction = action

    const argsAndErrors: StepArgsAndErrors = getArgsAndErrorsByStepId(state)[
      a.payload.id
    ]
    const robotTimeline = getRobotStateTimeline(state)
    const { errors, timeline } = robotTimeline
    const commandAndRobotState = timeline.filter(t => t.warnings != null)
    const warnings =
      commandAndRobotState.length > 0
        ? commandAndRobotState.flatMap(state => state.warnings ?? [])
        : []

    const { stepArgs } = argsAndErrors

    if (stepArgs !== null) {
      const pipetteEntities = getPipetteEntities(state)
      const fileMetadata = getFileMetadata(state)
      const dateCreatedTimestamp = fileMetadata.created

      // additional fields for analytics, eg descriptive name for pipettes
      // (these fields are prefixed with double underscore only to make sure they
      // never accidentally overlap with actual fields)
      const additionalProperties = flattenNestedProperties(
        (stepArgs as unknown) as Record<string, unknown>
      )

      // Mixpanel wants YYYY-MM-DDTHH:MM:SS for Date type
      additionalProperties.__dateCreated =
        dateCreatedTimestamp != null && Number.isFinite(dateCreatedTimestamp)
          ? new Date(dateCreatedTimestamp).toISOString()
          : null

      additionalProperties.__protocolName = fileMetadata.protocolName
      if ('pipette' in stepArgs && stepArgs.pipette != null) {
        additionalProperties.__pipetteName =
          pipetteEntities[stepArgs?.pipette].name
      }

      if (errors != null) {
        const errorTypes = errors.map(error => error.type)
        return {
          name: 'timelineErrors',
          properties: { errorTypes },
        }
      }
      if (warnings.length > 0) {
        return {
          name: 'timelineWarnings',
          properties: { warnings },
        }
      }

      const stepName = stepArgs.commandCreatorFnName
      const modifiedStepName = stepName === 'delay' ? 'pause' : stepName
      return {
        name: `${modifiedStepName}Step`,
        properties: { ...stepArgs, ...additionalProperties },
      }
    }
  }
  if (action.type === 'SAVE_STEP_FORMS_MULTI') {
    const fileMetadata = getFileMetadata(state)
    const dateCreatedTimestamp = fileMetadata.created

    const { editedFields, stepIds } = action.payload
    const additionalProperties = flattenNestedProperties(
      editedFields as Record<string, unknown>
    )
    const savedStepForms = getSavedStepForms(state)
    const batchEditedStepForms: FormData[] = stepIds.map(
      (id: StepIdType) => savedStepForms[id]
    )
    let stepType = null
    const uniqueStepTypes: StepType[] = uniq(
      batchEditedStepForms.map(form => form.stepType)
    )
    if (uniqueStepTypes.length === 1) {
      stepType = uniqueStepTypes[0]
    } else {
      console.warn(
        `Something went wrong, expected one step type in the batch edit form, but got ${String(
          uniqueStepTypes
        )} `
      )
    }

    additionalProperties.stepType = stepType

    // (these fields are prefixed with double underscore only to make sure they
    // never accidentally overlap with actual fields)
    // Mixpanel wants YYYY-MM-DDTHH:MM:SS for Date type
    additionalProperties.__dateCreated =
      dateCreatedTimestamp != null && Number.isFinite(dateCreatedTimestamp)
        ? new Date(dateCreatedTimestamp).toISOString()
        : null

    additionalProperties.__protocolName = fileMetadata.protocolName

    return {
      name: 'saveStepsMulti',
      properties: { ...editedFields, ...additionalProperties },
    }
  }
  if (action.type === 'DELETE_MULTIPLE_STEPS') {
    return {
      name: 'deleteMultipleSteps',
      properties: {},
    }
  }
  if (action.type === 'DUPLICATE_MULTIPLE_STEPS') {
    return {
      name: 'duplicateMultipleSteps',
      properties: {},
    }
  }
  if (action.type === 'LOAD_FILE') {
    return {
      name: 'loadFile',
      properties: {},
    }
  }
  if (action.type === 'GENERATE_NEW_PROTOCOL') {
    return {
      name: 'createNewProtocol',
      properties: {},
    }
  }
  if (action.type === 'CHANGE_STEP_DETAILS') {
    const a: RenameStepAction = action
    if ('stepDetails' in a.payload.update) {
      return {
        name: 'editStepMetadata',
        properties: {
          stepDetails: a.payload.update.stepDetails,
          stepName: a.payload.update.stepName,
        },
      }
    }
  }
  if (action.type === 'SAVE_PROTOCOL_FILE') {
    const file = createFile(state)
    const stepForms = getSavedStepForms(state)
    const { commands, metadata, robot, liquids } = file

    const robotType = { robotType: robot.model }
    const pipetteDisplayNames = commands
      .filter(
        (command): command is LoadPipetteCreateCommand =>
          command.commandType === 'loadPipette'
      )
      ?.map(
        command =>
          getPipetteSpecsV2(command.params.pipetteName as PipetteName)
            ?.displayName ?? command.params.pipetteName
      )
    const moduleModels = commands
      .filter(
        (command): command is LoadModuleCreateCommand =>
          command.commandType === 'loadModule'
      )
      ?.map(command => getModuleDisplayName(command.params.model))
    const labwareInfo = commands
      .filter(
        (command): command is LoadLabwareCreateCommand =>
          command.commandType === 'loadLabware'
      )
      .reduce((acc: Record<string, string>, command) => {
        acc[command.params.loadName] =
          command.params.location === 'offDeck'
            ? 'offDeck'
            : Object.values(command.params.location).join('')
        return acc
      }, {})

    const numberOfSteps = { numberOfSteps: Object.keys(stepForms).length - 1 }
    const trashCommands = commands?.some(
      command =>
        (command.commandType === 'moveToAddressableArea' &&
          (MOVABLE_TRASH_ADDRESSABLE_AREAS.includes(
            command.params.addressableAreaName as AddressableAreaName
          ) ||
            command.params.addressableAreaName === FIXED_TRASH_ID)) ||
        command.commandType === 'moveToAddressableAreaForDropTip'
    )
    const wasteChuteCommands = commands?.some(
      command =>
        (command.commandType === 'moveToAddressableArea' &&
          WASTE_CHUTE_ADDRESSABLE_AREAS.includes(
            command.params.addressableAreaName as AddressableAreaName
          )) ||
        (command.commandType === 'moveLabware' &&
          command.params.newLocation !== 'offDeck' &&
          'addressableAreaName' in command.params.newLocation &&
          command.params.newLocation.addressableAreaName ===
            'gripperWasteChute')
    )
    const hasGripperCommands = commands?.some(
      command =>
        command.commandType === 'moveLabware' &&
        command.params.strategy === 'usingGripper'
    )

    const stagingAreaSlots = FLEX_STAGING_AREA_SLOT_ADDRESSABLE_AREAS.filter(
      location =>
        !commands?.some(
          command =>
            (command.commandType === 'loadLabware' &&
              command.params.location !== 'offDeck' &&
              'addressableAreaName' in command.params.location &&
              command.params.location.addressableAreaName === location) ||
            (command.commandType === 'moveLabware' &&
              command.params.newLocation !== 'offDeck' &&
              'addressableAreaName' in command.params.newLocation &&
              command.params.newLocation.addressableAreaName === location)
        )
          ? null
          : location
    )
    const flattenedLiquids = flattenNestedProperties(liquids)

    const fixtureInfo = {
      trashBin: trashCommands,
      wasteChute: wasteChuteCommands,
      stagingAreaSlots: stagingAreaSlots,
      gripper: hasGripperCommands,
    }

    const loadCommandInfo = {
      modules: moduleModels,
      pipettes: pipetteDisplayNames,
    }

    return {
      name: 'saveProtocol',
      properties: {
        ...metadata,
        ...loadCommandInfo,
        ...robotType,
        ...flattenedLiquids,
        ...numberOfSteps,
        ...fixtureInfo,
        ...labwareInfo,
      },
    }
  }
  if (action.type === 'SET_FEATURE_FLAGS') {
    const a: SetFeatureFlagAction = action
    if (a.payload.OT_PD_ALLOW_ALL_TIPRACKS === true) {
      return {
        name: 'allowAllTipracks',
        properties: {},
      }
    }
  }
  if (action.type === 'ANALYTICS_EVENT') {
    const a: AnalyticsEventAction = action
    return a.payload
  }
  return null
}

export const trackEventMiddleware: Middleware<BaseState, any> = ({
  getState,
  dispatch,
}) => next => action => {
  const result = next(action)

  // NOTE: this is the Redux state AFTER the action has been fully dispatched
  const state = getState()

  const optedIn = getHasOptedIn(state as BaseState) ?? false
  const event = reduxActionToAnalyticsEvent(state as BaseState, action)

  if (event != null) {
    // actually report to analytics (trackEvent is responsible for using optedIn)
    trackEvent(event, optedIn)
  }
  return result
}
