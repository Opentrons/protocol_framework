import { Flex, WRAP, SPACING, EmptySelectorButton } from '@opentrons/components'
import type { ModuleType, ModuleModel } from '@opentrons/shared-data'
import { Controller, useFormContext } from 'react-hook-form'

export interface DisplayModules {
  type: ModuleType
  model: ModuleModel
  name: string
  adapter?: string
}

export function ControlledEmptySelectorButtonGroup({
  modules,
}: {
  modules: DisplayModules[]
}): JSX.Element | null {
  const { watch } = useFormContext()
  const modulesWatch: DisplayModules[] = watch('modules') ?? []

  return (
    <Controller
      defaultValue={[]}
      name={'modules'}
      rules={{ required: true, validate: value => value.length > 0 }}
      render={({ field }) => {
        return (
          <Flex flexWrap={WRAP} gap={SPACING.spacing8}>
            {modules.map(module => (
              <EmptySelectorButton
                key={module.type}
                iconName="plus"
                onClick={() => {
                  if (modulesWatch.some(m => m.type === module.type)) {
                    return
                  }
                  field.onChange([...modulesWatch, module])
                }}
                text={module.name}
                textAlignment="left"
              />
            ))}
          </Flex>
        )
      }}
    />
  )
}
