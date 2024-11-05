import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  EmptySelectorButton,
  Flex,
  InfoScreen,
  InputField,
  JUSTIFY_FLEX_END,
  LargeButton,
  ListButton,
  ListButtonAccordion,
  ListButtonAccordionContainer,
  ListButtonRadioButton,
  ListItem,
  ListItemCustomize,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
} from '@opentrons/components'
import type { DropdownBorder } from '@opentrons/components'
import { Controller, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { useAtom } from 'jotai'
import { createProtocolAtom } from '../../resources/atoms'
import { MODULES_STEP } from '../ProtocolSectionsContainer'
import type {
  LabwareDefByDefURI,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import {
  getLabwareDefURI,
  getAllDefinitions,
  getLabwareDisplayName,
} from '@opentrons/shared-data'
import React, { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { reduce } from 'lodash'
import { LabwareDiagram } from '../../molecules/LabwareDiagram'

export interface DisplayLabware {
  labwareURI: string
  count: number
}

export const ORDERED_CATEGORIES: string[] = [
  'tipRack',
  'tubeRack',
  'wellPlate',
  'reservoir',
  'aluminumBlock',
  'adapter',
]

export const LABWARES_FIELD_NAME = 'labwares'

export function LabwareLiquidsSection(): JSX.Element | null {
  const { t } = useTranslation('create_protocol')
  const {
    formState: { isValid },
    watch,
    setValue,
  } = useFormContext()
  const [{ currentStep }, setCreateProtocolAtom] = useAtom(createProtocolAtom)
  const [displayLabwareModal, setDisplayLabwareModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null
  )
  const labwares: DisplayLabware[] = watch(LABWARES_FIELD_NAME) ?? []
  const [selectedLabwares, setSelectedLabwares] = React.useState<string[]>(
    labwares.map(lw => lw.labwareURI)
  )
  // const robotType: string = watch(ROBOT_FIELD_NAME) ?? ''

  const searchFilter = (termToCheck: string): boolean =>
    termToCheck.toLowerCase().includes(searchTerm.toLowerCase())

  const defs = getAllDefinitions()

  const labwareByCategory = React.useMemo(() => {
    return reduce<LabwareDefByDefURI, Record<string, LabwareDefinition2[]>>(
      defs,
      (acc, def: typeof defs[keyof typeof defs]) => {
        const category: string = def.metadata.displayCategory

        return {
          ...acc,
          [category]: [...(acc[category] ?? []), def],
        }
      },
      {}
    )
  }, [])

  const populatedCategories: Record<string, boolean> = useMemo(
    () =>
      ORDERED_CATEGORIES.reduce((acc, category) => {
        return category in labwareByCategory &&
          labwareByCategory[category].some(lw =>
            searchFilter(lw.metadata.displayName)
          )
          ? {
              ...acc,
              [category]: labwareByCategory[category],
            }
          : acc
      }, {}),
    [labwareByCategory, searchTerm]
  )

  const handleCategoryClick = (category: string): void => {
    setSelectedCategory(selectedCategory === category ? null : category)
  }

  function handleConfirmButtonClick(): void {
    const step = currentStep > MODULES_STEP ? currentStep : MODULES_STEP + 1

    setCreateProtocolAtom({
      currentStep: step,
      focusStep: step,
    })
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      height="100%"
      gap={SPACING.spacing24}
    >
      <EmptySelectorButton
        onClick={() => {
          setDisplayLabwareModal(true)
        }}
        text={t('add_opentrons_labware')}
        textAlignment={'left'}
      />

      {displayLabwareModal &&
        createPortal(
          <Modal type="info" title={t('add_opentrons_labware')} marginLeft="0">
            <Flex flexDirection={DIRECTION_COLUMN}>
              <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  gridGap={SPACING.spacing8}
                >
                  <StyledText desktopStyle="bodyDefaultSemiBold">
                    {t('add_labware')}
                  </StyledText>
                  <InputField
                    value={searchTerm}
                    onChange={e => {
                      setSearchTerm(e.target.value)
                    }}
                    placeholder={t('search_for_labware_placeholder')}
                    size="medium"
                    leftIcon="search"
                    showDeleteIcon
                    onDelete={() => {
                      setSearchTerm('')
                    }}
                  />
                </Flex>
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  gridGap={SPACING.spacing4}
                  paddingTop={SPACING.spacing8}
                >
                  {ORDERED_CATEGORIES.map(category => {
                    const isPopulated = populatedCategories[category]
                    if (isPopulated) {
                      return (
                        <ListButton
                          key={`ListButton_${category}`}
                          type="noActive"
                          maxWidth={'100% !important'}
                          onClick={() => {
                            handleCategoryClick(category)
                          }}
                        >
                          <ListButtonAccordionContainer id={`${category}`}>
                            <ListButtonAccordion
                              mainHeadline={t(`${category}`)}
                              isExpanded={category === selectedCategory}
                            >
                              {labwareByCategory[category]?.map(
                                (labwareDef, index) => {
                                  const labwareURI = getLabwareDefURI(
                                    labwareDef
                                  )
                                  const loadName =
                                    labwareDef.parameters.loadName
                                  const isMatch = searchFilter(
                                    labwareDef.metadata.displayName
                                  )
                                  if (isMatch) {
                                    return (
                                      <React.Fragment
                                        key={`${index}_${category}_${loadName}`}
                                      >
                                        <ListButtonRadioButton
                                          id={`${index}_${category}_${loadName}`}
                                          buttonText={
                                            labwareDef.metadata.displayName
                                          }
                                          buttonValue={labwareURI}
                                          onChange={e => {
                                            e.stopPropagation()
                                            setSelectedLabwares(
                                              selectedLabwares.includes(
                                                labwareURI
                                              )
                                                ? selectedLabwares.filter(
                                                    lw => lw !== labwareURI
                                                  )
                                                : [
                                                    ...selectedLabwares,
                                                    labwareURI,
                                                  ]
                                            )
                                          }}
                                          isSelected={selectedLabwares.includes(
                                            labwareURI
                                          )}
                                        />
                                      </React.Fragment>
                                    )
                                  }
                                }
                              )}
                            </ListButtonAccordion>
                          </ListButtonAccordionContainer>
                        </ListButton>
                      )
                    }
                  })}
                </Flex>
              </Flex>

              <Flex
                justifyContent={JUSTIFY_FLEX_END}
                gap={SPACING.spacing8}
                paddingTop={SPACING.spacing24}
              >
                <SecondaryButton
                  onClick={() => {
                    setDisplayLabwareModal(false)
                    setSelectedLabwares(labwares.map(lw => lw.labwareURI))
                    setSelectedCategory(null)
                  }}
                >
                  {t('labwares_cancel_label')}
                </SecondaryButton>
                <PrimaryButton
                  onClick={() => {
                    setDisplayLabwareModal(false)
                    setValue(LABWARES_FIELD_NAME, [
                      ...selectedLabwares.map(labwareURI => ({
                        labwareURI,
                        count: 1,
                      })),
                    ])
                    setSelectedCategory(null)
                  }}
                >
                  {t('labwares_save_label')}
                </PrimaryButton>
              </Flex>
            </Flex>
          </Modal>,
          global.document.body
        )}

      {labwares.length === 0 && (
        <InfoScreen content={t('no_labwares_added_yet')} />
      )}

      <Controller
        name={LABWARES_FIELD_NAME}
        render={({ field }) => {
          return (
            <>
              {labwares.map((labware, index) => {
                const labwareDef = defs[labware.labwareURI]
                console.log('labwareDef', labwareDef)

                const dropdownProps = {
                  currentOption: {
                    name: `${labware.count}`,
                    value: `${labware.count}`,
                  },
                  title: (null as unknown) as string,
                  onClick: (value: string) => {
                    field.onChange(
                      labwares.map(lw =>
                        lw.labwareURI === labware.labwareURI
                          ? { ...lw, count: parseInt(value) }
                          : lw
                      )
                    )
                  },
                  dropdownType: 'neutral' as DropdownBorder,
                  filterOptions: Array.from({ length: 10 }, (_, i) => ({
                    name: `${i + 1}`,
                    value: `${i + 1}`,
                  })),
                }

                return (
                  <ListItem
                    type="noActive"
                    key={`${labwareDef.parameters.loadName}`}
                  >
                    <ListItemCustomize
                      dropdown={dropdownProps}
                      label={t('labwares_quantity_label')}
                      linkText={t('labwares_remove_label')}
                      onClick={() => {
                        setSelectedLabwares(
                          selectedLabwares.filter(
                            lw => lw !== labware.labwareURI
                          )
                        )
                        field.onChange(labwares.filter(lw => lw !== labware))
                      }}
                      header={getLabwareDisplayName(labwareDef)}
                      leftHeaderItem={
                        <Flex
                          padding={SPACING.spacing2}
                          backgroundColor={COLORS.white}
                          borderRadius={BORDERS.borderRadius8}
                          alignItems={ALIGN_CENTER}
                          width="3.75rem"
                          height="3.625rem"
                        >
                          <LabwareDiagram def={labwareDef} />
                        </Flex>
                      }
                    />
                  </ListItem>
                )
              })}
            </>
          )
        }}
      />

      <ButtonContainer>
        <LargeButton
          onClick={handleConfirmButtonClick}
          disabled={!isValid}
          buttonText={t('section_confirm_button')}
        ></LargeButton>
      </ButtonContainer>
    </Flex>
  )
}

const ButtonContainer = styled.div`
  display: ${DISPLAY_FLEX};
  justify-content: ${JUSTIFY_FLEX_END};
`
