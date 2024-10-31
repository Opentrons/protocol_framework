import {
  Flex,
  SPACING,
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  ListItem,
  ListItemCustomize,
} from '@opentrons/components'
import type { DropdownBorder } from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'
import { Controller, useFormContext } from 'react-hook-form'
import { ModuleDiagram } from '../ModelDiagram'
import { MODULES_FIELD_NAME, type DisplayModules } from '../../organisms/ModulesSection'
import { useTranslation } from 'react-i18next'

const adapters = ['adapter1', 'adapter2', 'adapter3']

export function ModuleListItemGroup(): JSX.Element | null {
  const { watch, setValue } = useFormContext()
  const { t } = useTranslation('create_protocol')
  const modulesWatch: DisplayModules[] = watch(MODULES_FIELD_NAME) ?? []

  return (
    <>
      {modulesWatch?.map(module => {
        return (
          <Controller
            key={module.type}
            name={`${MODULES_FIELD_NAME}.${module.type}`}
            render={({ field }) => (
              <ListItem type="noActive" key={module.type}>
                <ListItemCustomize
                  label={
                    adapters != null && adapters.length > 0
                      ? t('modules_adapter_label')
                      : undefined
                  }
                  linkText={t('modules_remove_label')}
                  dropdown={
                    adapters != null && adapters.length > 0
                      ? {
                          title: (null as unknown) as string,
                          currentOption: {
                            name: field.value,
                            value: field.value,
                          },
                          onClick: (value: string) => {
                            field.onChange(value)
                          },
                          dropdownType: 'neutral' as DropdownBorder,
                          filterOptions: adapters?.map(adapter => ({
                            name: adapter,
                            value: adapter,
                          })),
                        }
                      : undefined
                  }
                  onClick={() => {
                    setValue(
                      MODULES_FIELD_NAME,
                      modulesWatch.filter(m => m.type !== module.type),
                      { shouldValidate: true }
                    )
                  }}
                  header={getModuleDisplayName(module.model)}
                  leftHeaderItem={
                    <Flex
                      padding={SPACING.spacing2}
                      backgroundColor={COLORS.white}
                      borderRadius={BORDERS.borderRadius8}
                      alignItems={ALIGN_CENTER}
                      width="3.75rem"
                      height="3.625rem"
                    >
                      <ModuleDiagram type={module.type} model={module.model} />
                    </Flex>
                  }
                />
              </ListItem>
            )}
          />
        )
      })}
    </>
  )
}
