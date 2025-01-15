import { DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'
import type { FormData } from '../../../../../../form-types'
import type { FieldPropsByName } from '../../types'

interface InitializationEditorProps {
  formData: FormData
  propsForFields: FieldPropsByName
}

export function InitializationEditor(
  props: InitializationEditorProps
): JSX.Element {
  return (
    <Flex gridGap={SPACING.spacing4} flexDirection={DIRECTION_COLUMN}>
      <>TODO add wavelength component </>
    </Flex>
  )
}
