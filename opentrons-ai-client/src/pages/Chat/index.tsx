import { useForm, FormProvider } from 'react-hook-form'
import {
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_CENTER,
  POSITION_RELATIVE,
} from '@opentrons/components'

import { MainContentContainer } from '../../organisms/MainContentContainer'

export interface InputType {
  userPrompt: string
}

export function Chat(): JSX.Element | null {
  const methods = useForm<InputType>({
    defaultValues: {
      userPrompt: '',
    },
  })

  return (
    <Flex
      position={POSITION_RELATIVE}
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_CENTER}
      width="100%"
    >
      <FormProvider {...methods}>
        <Flex flexDirection={DIRECTION_ROW}>
          {/* <SidePanel /> */}
          <MainContentContainer />
        </Flex>
      </FormProvider>
    </Flex>
  )
}
