import { useState, Fragment } from 'react'
import map from 'lodash/map'
import isEmpty from 'lodash/isEmpty'

import {
  ALIGN_CENTER,
  BaseDeck,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  LabwareRender,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  getSimplestDeckConfigForProtocol,
  getTopLabwareInfo,
  parseLabwareInfoByLiquidId,
  parseLiquidsInLoadOrder,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'

import { LabwareInfoOverlay } from '../LabwareInfoOverlay'
import { LiquidsLabwareDetailsModal } from '/app/organisms/LiquidsLabwareDetailsModal'
import { getStandardDeckViewLayerBlockList } from '/app/local-resources/deck_configuration'
import {
  getProtocolModulesInfo,
  getLabwareRenderInfo,
  getWellFillFromLabwareId,
} from '/app/transformations/analysis'

import type {
  CompletedProtocolAnalysis,
  ProtocolAnalysisOutput,
  RunTimeCommand,
  LoadLabwareRunTimeCommand,
} from '@opentrons/shared-data'

interface SetupLiquidsMapProps {
  runId: string
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput | null
}

export function SetupLiquidsMap(
  props: SetupLiquidsMapProps
): JSX.Element | null {
  const { runId, protocolAnalysis } = props
  const [hoverLabwareId, setHoverLabwareId] = useState<string>('')
  const [liquidDetailsLabwareId, setLiquidDetailsLabwareId] = useState<
    string | null
  >(null)

  if (protocolAnalysis == null) return null

  const commands: RunTimeCommand[] = protocolAnalysis.commands
  const loadLabwareCommands = commands?.filter(
    (command): command is LoadLabwareRunTimeCommand =>
      command.commandType === 'loadLabware'
  )

  const liquids = parseLiquidsInLoadOrder(
    protocolAnalysis.liquids != null ? protocolAnalysis.liquids : [],
    protocolAnalysis.commands ?? []
  )
  const robotType = protocolAnalysis.robotType ?? FLEX_ROBOT_TYPE
  const deckDef = getDeckDefFromRobotType(robotType)
  const labwareRenderInfo = getLabwareRenderInfo(protocolAnalysis, deckDef)
  const labwareByLiquidId = parseLabwareInfoByLiquidId(
    protocolAnalysis.commands ?? []
  )
  const deckConfig = getSimplestDeckConfigForProtocol(protocolAnalysis)
  const deckLayerBlocklist = getStandardDeckViewLayerBlockList(robotType)

  const protocolModulesInfo = getProtocolModulesInfo(protocolAnalysis, deckDef)

  const modulesOnDeck = protocolModulesInfo.map(module => {
    const {
      topLabwareId,
      topLabwareDefinition,
      topLabwareDisplayName,
    } = getTopLabwareInfo(module.nestedLabwareId ?? '', loadLabwareCommands)
    const nestedLabwareWellFill = getWellFillFromLabwareId(
      topLabwareId ?? '',
      liquids,
      labwareByLiquidId
    )
    const labwareHasLiquid = !isEmpty(nestedLabwareWellFill)

    return {
      moduleModel: module.moduleDef.model,
      moduleLocation: { slotName: module.slotName },
      innerProps:
        module.moduleDef.model === THERMOCYCLER_MODULE_V1
          ? { lidMotorState: 'open' }
          : {},

      nestedLabwareDef: topLabwareDefinition,
      nestedLabwareWellFill,
      moduleChildren:
        topLabwareDefinition != null && topLabwareId != null ? (
          <g
            onMouseEnter={() => {
              setHoverLabwareId(topLabwareId)
            }}
            onMouseLeave={() => {
              setHoverLabwareId('')
            }}
            onClick={() => {
              if (labwareHasLiquid) {
                setLiquidDetailsLabwareId(topLabwareId)
              }
            }}
            cursor={labwareHasLiquid ? 'pointer' : ''}
          >
            <LabwareInfoOverlay
              definition={topLabwareDefinition}
              hover={topLabwareId === hoverLabwareId && labwareHasLiquid}
              labwareHasLiquid={labwareHasLiquid}
              labwareId={topLabwareId}
              displayName={topLabwareDisplayName ?? null}
              runId={runId}
            />
          </g>
        ) : null,
    }
  })
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
    >
      <BaseDeck
        deckConfig={deckConfig}
        deckLayerBlocklist={deckLayerBlocklist}
        robotType={robotType}
        labwareOnDeck={[]}
        modulesOnDeck={modulesOnDeck}
      >
        {map(labwareRenderInfo, ({ x, y }, labwareId) => {
          const {
            topLabwareId,
            topLabwareDefinition,
            topLabwareDisplayName,
          } = getTopLabwareInfo(labwareId, loadLabwareCommands)
          const wellFill = getWellFillFromLabwareId(
            topLabwareId ?? '',
            liquids,
            labwareByLiquidId
          )
          const labwareHasLiquid = !isEmpty(wellFill)
          return topLabwareDefinition != null ? (
            <Fragment key={`LabwareSetup_Labware_${topLabwareId}_${x}${y}`}>
              <g
                transform={`translate(${x},${y})`}
                onMouseEnter={() => {
                  setHoverLabwareId(topLabwareId)
                }}
                onMouseLeave={() => {
                  setHoverLabwareId('')
                }}
                onClick={() => {
                  if (labwareHasLiquid) {
                    setLiquidDetailsLabwareId(topLabwareId)
                  }
                }}
                cursor={labwareHasLiquid ? 'pointer' : ''}
              >
                <LabwareRender
                  definition={topLabwareDefinition}
                  wellFill={labwareHasLiquid ? wellFill : undefined}
                  highlight={labwareId === hoverLabwareId && labwareHasLiquid}
                />
                <LabwareInfoOverlay
                  definition={topLabwareDefinition}
                  labwareId={topLabwareId}
                  displayName={topLabwareDisplayName ?? null}
                  runId={runId}
                  hover={labwareId === hoverLabwareId && labwareHasLiquid}
                  labwareHasLiquid={labwareHasLiquid}
                />
              </g>
            </Fragment>
          ) : null
        })}
      </BaseDeck>
      {liquidDetailsLabwareId != null && (
        <LiquidsLabwareDetailsModal
          labwareId={liquidDetailsLabwareId}
          runId={runId}
          closeModal={() => {
            setLiquidDetailsLabwareId(null)
          }}
        />
      )}
    </Flex>
  )
}
