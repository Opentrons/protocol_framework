import { LoadedPipettes, ProtocolTimelineScrubber } from '@opentrons/components'
import { useSelector } from 'react-redux'
import reduce from 'lodash/reduce'
import {
  getInitialRobotState,
  getRobotStateTimeline,
  getRobotType,
} from '../../file-data/selectors'
import {
  CompletedProtocolAnalysis,
  Liquid,
  LoadedLabware,
  LoadedModule,
  LoadedPipette,
  RunTimeCommand,
} from '@opentrons/shared-data'
import { flatMap } from 'lodash'
import { uuid } from '../../utils'
import {
  getInitialDeckSetup,
  getInvariantContext,
} from '../../step-forms/selectors'
import { getLabwareNicknamesById } from '../../ui/labware/selectors'
import { selectors as ingredSelectors } from '../../labware-ingred/selectors'
import { swatchColors } from '../../organisms/DefineLiquidsModal/swatchColors'
import { LiquidGroup } from '../../labware-ingred/types'
import { getNextRobotStateAndWarnings } from '@opentrons/step-generation'

export function ScrubberContainer(): JSX.Element {
  const robotType = useSelector(getRobotType)
  const labwareNickNames = useSelector(getLabwareNicknamesById)
  const robotStateTimeline = useSelector(getRobotStateTimeline)
  const initialRobotState = useSelector(getInitialRobotState)
  const ingredients = useSelector(ingredSelectors.getLiquidGroupsById)
  const invariantContext = useSelector(getInvariantContext)
  const initialDeckSetup = useSelector(getInitialDeckSetup)
  const { pipettes, modules, labware } = initialDeckSetup

  const nonLoadCommands: RunTimeCommand[] = flatMap(
    robotStateTimeline.timeline,
    timelineFrame => timelineFrame.commands
  )
  const loadPipettes: LoadedPipette[] = Object.values(pipettes).map(
    pipette => ({
      id: pipette.id,
      pipetteName: pipette.name,
      mount: pipette.mount,
    })
  )
  const loadModules: LoadedModule[] = Object.values(modules).map(module => ({
    id: module.id,
    model: module.model,
    serialNumber: '1', // todo what is this,
    location: {
      slotName: module.slot,
    },
  }))
  const loadLabware: LoadedLabware[] = Object.values(labware).map(lw => ({
    id: lw.id,
    loadName: lw.def.parameters.loadName,
    definitionUri: lw.labwareDefURI,
    location: { slotName: lw.slot }, // todo fix this
    displayName: labwareNickNames[lw.id],
  }))
  const liquids: Liquid[] = Object.entries(ingredients).map(
    ([liquidId, liquidData]) => ({
      id: liquidId,
      displayName: liquidData.name ?? 'undefined liquid',
      description: liquidData.description ?? '',
      displayColor: liquidData.displayColor ?? swatchColors(liquidId),
    })
  )

  const analysis: CompletedProtocolAnalysis = {
    id: uuid(),
    result: 'ok',
    pipettes: loadPipettes,
    labware: loadLabware,
    modules: loadModules,
    liquids,
    commands: nonLoadCommands,
    errors: [],
    robotType,
  }

  const robotStateAndWarnings = getNextRobotStateAndWarnings(
    nonLoadCommands,
    invariantContext,
    initialRobotState
  )

  return (
    <ProtocolTimelineScrubber
      commands={nonLoadCommands}
      analysis={analysis}
      robotType={robotType}
      invariantContextFromPD={invariantContext}
      initialRobotStateFromPD={initialRobotState}
    />
  )
}
