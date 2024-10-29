import type * as React from 'react'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'

import type { ModuleOnDeck, PipetteOnDeck } from '../../step-forms'
import type { HintKey } from '../../tutorial'
import type { Fixture } from './index'

interface MissingContent {
  noCommands: boolean
  pipettesWithoutStep: PipetteOnDeck[]
  modulesWithoutStep: ModuleOnDeck[]
  gripperWithoutStep: boolean
  fixtureWithoutStep: Fixture
  t: any
  enableRedesign?: boolean
}

// TODO (nd: 10/29/2024) refine interface once redesign FF is removed
export interface WarningContent {
  content: React.ReactNode
  heading?: string
  titleElement?: JSX.Element
  hintKey?: HintKey
}

// TODO(ja): update this to use StyledText
export function getWarningContent({
  noCommands,
  pipettesWithoutStep,
  modulesWithoutStep,
  gripperWithoutStep,
  fixtureWithoutStep,
  t,
  enableRedesign = true,
}: MissingContent): WarningContent | null {
  if (enableRedesign) {
    if (noCommands) {
      return {
        hintKey: 'no_commands',
        content: (
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('alert:export_warnings.redesign.no_commands.body1')}
          </StyledText>
        ),
      }
    } else if (
      pipettesWithoutStep.length +
        modulesWithoutStep.length +
        (gripperWithoutStep ? 1 : 0) +
        fixtureWithoutStep.stagingAreaSlots.length +
        (fixtureWithoutStep.trashBin ? 1 : 0) +
        (fixtureWithoutStep.wasteChute ? 1 : 0) >
      1
    ) {
      const allUnusedContent = [
        ...pipettesWithoutStep.map(pipette =>
          t('alert:export_warnings.redesign.unused_pipette', {
            pipette: pipette.spec.displayName,
            mount: pipette.mount,
          })
        ),
        ...(gripperWithoutStep
          ? [t('modules:additional_equipment_display_names.gripper')]
          : []),
        ...modulesWithoutStep.map(module =>
          t('alert:export_warnings.redesign.unused_module', {
            module: getModuleDisplayName(module.model),
            slot: module.slot,
          })
        ),
        ...fixtureWithoutStep.stagingAreaSlots.map(slot =>
          t('alert:export_warnings.redesign.unused_staging_area', { slot })
        ),
        ...(fixtureWithoutStep.trashBin
          ? [t('modules:additional_equipment_display_names.trashBin')]
          : []),
        ...(fixtureWithoutStep.wasteChute
          ? [t('modules:additional_equipment_display_names.wasteChute')]
          : []),
      ]
      return {
        hintKey: 'unused_hardware',
        content: (
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t(
                'alert:export_warnings.redesign.unused_hardware_content.body1'
              )}
            </StyledText>
            <Flex flexDirection={DIRECTION_COLUMN}>
              <StyledText desktopStyle="bodyDefaultRegular">
                {t('alert:export_warnings.redesign.unused_hardware')}
              </StyledText>
              {allUnusedContent.map((unusedHardware, i) => (
                <StyledText key={i} desktopStyle="bodyDefaultRegular">
                  {unusedHardware}
                </StyledText>
              ))}
            </Flex>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t(
                'alert:export_warnings.redesign.unused_hardware_content.body2'
              )}
            </StyledText>
          </Flex>
        ),
      }
    } else {
      return null
    }
  } else {
    if (noCommands) {
      return {
        heading: t('alert:export_warnings.no_commands.redesign.heading'),
        content: (
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('alert:export_warnings.no_commands.redesign.body')}
          </StyledText>
        ),
        titleElement: (
          <Icon name="alert-circle" size="1.25rem" color={COLORS.yellow50} />
        ),
      }
    }

    if (gripperWithoutStep) {
      return {
        content: (
          <>
            <p>{t('alert:export_warnings.unused_gripper.body1')}</p>
            <p>{t('alert:export_warnings.unused_gripper.body2')}</p>
          </>
        ),
        heading: t('alert:export_warnings.unused_gripper.heading'),
      }
    }

    const pipettesDetails = pipettesWithoutStep
      .map(pipette =>
        pipette.spec.channels === 96
          ? `${pipette.spec.displayName} pipette`
          : `${pipette.mount} ${pipette.spec.displayName} pipette`
      )
      .join(' and ')

    const unusedModuleCounts = modulesWithoutStep.reduce<{
      [key: string]: number
    }>((acc, mod) => {
      if (!(mod.type in acc)) {
        return { ...acc, [mod.type]: 1 }
      } else {
        return { ...acc, [mod.type]: acc[mod.type] + 1 }
      }
    }, {})

    const modulesDetails = Object.keys(unusedModuleCounts)
      // sorting by module count
      .sort((k1, k2) => {
        if (unusedModuleCounts[k1] < unusedModuleCounts[k2]) {
          return 1
        } else if (unusedModuleCounts[k1] > unusedModuleCounts[k2]) {
          return -1
        } else {
          return 0
        }
      })
      .map(modType =>
        unusedModuleCounts[modType] === 1
          ? t(`modules:module_long_names.${modType}`)
          : `${t(`modules:module_long_names.${modType}`)}s`
      )
      // transform list of modules with counts to string
      .reduce((acc, modName, index, arr) => {
        if (arr.length > 2) {
          if (index === arr.length - 1) {
            return `${acc} and ${modName}`
          } else {
            return `${acc}${modName}, `
          }
        } else if (arr.length === 2) {
          return index === 0 ? `${modName} and ` : `${acc}${modName}`
        } else {
          return modName
        }
      }, '')

    if (pipettesWithoutStep.length && modulesWithoutStep.length) {
      return {
        content: (
          <>
            <p>
              {t('alert:export_warnings.unused_pipette_and_module.body1', {
                modulesDetails,
                pipettesDetails,
              })}
            </p>
            <p>{t('alert:export_warnings.unused_pipette_and_module.body2')}</p>
          </>
        ),
        heading: t('alert:export_warnings.unused_pipette_and_module.heading'),
      }
    }

    if (pipettesWithoutStep.length) {
      return {
        content: (
          <>
            <p>
              {t('alert:export_warnings.unused_pipette.body1', {
                pipettesDetails,
              })}
            </p>
            <p>{t('alert:export_warnings.unused_pipette.body2')}</p>
          </>
        ),
        heading: t('alert:export_warnings.unused_pipette.heading'),
      }
    }

    if (modulesWithoutStep.length) {
      const moduleCase =
        modulesWithoutStep.length > 1 ? 'unused_modules' : 'unused_module'
      const slotName = modulesWithoutStep.map(module => module.slot)
      return {
        content: (
          <>
            <p>
              {t(`alert:export_warnings.${moduleCase}.body1`, {
                modulesDetails,
                slotName: slotName,
              })}
            </p>
            <p>{t(`alert:export_warnings.${moduleCase}.body2`)}</p>
          </>
        ),
        heading: t(`alert:export_warnings.${moduleCase}.heading`),
      }
    }

    if (fixtureWithoutStep.trashBin || fixtureWithoutStep.wasteChute) {
      return {
        content:
          (fixtureWithoutStep.trashBin && !fixtureWithoutStep.wasteChute) ||
          (!fixtureWithoutStep.trashBin && fixtureWithoutStep.wasteChute) ? (
            <p>
              {t('alert:export_warnings.unused_trash.body', {
                name: fixtureWithoutStep.trashBin ? 'trash bin' : 'waste chute',
              })}
            </p>
          ) : (
            <p>
              {t('alert:export_warnings.unused_trash.body_both', {
                trashName: 'trash bin',
                wasteName: 'waste chute',
              })}
            </p>
          ),
        heading: t('alert:export_warnings.unused_trash.heading'),
      }
    }

    if (fixtureWithoutStep.stagingAreaSlots.length) {
      return {
        content: (
          <>
            <p>
              {t('alert:export_warnings.unused_staging_area.body1', {
                count: fixtureWithoutStep.stagingAreaSlots.length,
                slot: fixtureWithoutStep.stagingAreaSlots,
              })}
            </p>
            <p>
              {t('alert:export_warnings.unused_staging_area.body2', {
                count: fixtureWithoutStep.stagingAreaSlots.length,
              })}
            </p>
          </>
        ),
        heading: t('alert:export_warnings.unused_staging_area.heading'),
      }
    }

    return null
  }
}
