import {
  DIRECTION_COLUMN,
  Flex,
  InputField,
  JUSTIFY_FLEX_END,
  ListButton,
  ListButtonAccordion,
  ListButtonAccordionContainer,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type {
  LabwareDefByDefURI,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import { getLabwareDefURI, getAllDefinitions } from '@opentrons/shared-data'
import React, { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { reduce } from 'lodash'
import { ListButtonCheckbox } from '../../atoms/ListButtonCheckbox/ListButtonCheckbox'

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

export function LabwareModal({
  displayLabwareModal,
  setDisplayLabwareModal,
}: {
  displayLabwareModal: boolean
  setDisplayLabwareModal: (value: boolean) => void
}): JSX.Element | null {
  const { t } = useTranslation('create_protocol')
  const { watch, setValue } = useFormContext()
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null
  )
  const labwares: DisplayLabware[] = watch(LABWARES_FIELD_NAME) ?? []
  const [selectedLabwares, setSelectedLabwares] = React.useState<string[]>(
    labwares.map(lw => lw.labwareURI)
  )

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

  return (
    <>
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
                                        <ListButtonCheckbox
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
    </>
  )
}
