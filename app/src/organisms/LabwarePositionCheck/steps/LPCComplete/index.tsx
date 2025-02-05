import { useEffect } from 'react'

import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'

export function LPCComplete(props: LPCWizardContentProps): JSX.Element {
  useEffect(() => {
    setTimeout(() => {
      void props.commandUtils.handleCleanUpAndClose()
    }, 5000)
  }, [])

  return <>LPC COMPLETE</>
}
