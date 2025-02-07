import { SetupVerifications, SetupActions } from '../support/SetupSteps'
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { StepsList, runSteps } from '../support/StepExecution'
import { UniversalActions } from '../support/universalActions'

describe('The Redesigned Create Protocol Landing Page', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.closeAnalyticsModal()
  })

  it('content and step 1 flow works', () => {
    cy.verifyCreateNewHeader()
    cy.clickCreateNew()
    const steps: StepsList = [
      { step: SetupVerifications.OnStep1 },
      { step: SetupVerifications.FlexSelected },
      { step: UniversalActions.Snapshot },
      { step: SetupActions.SelectOT2 },
      { step: SetupVerifications.OT2Selected },
      { step: UniversalActions.Snapshot },
      { step: SetupActions.SelectFlex },
      { step: SetupVerifications.FlexSelected },
      { step: UniversalActions.Snapshot },
      { step: SetupActions.Confirm },
      { step: SetupVerifications.OnStep2 },
      { step: SetupVerifications.NinetySixChannel },
      { step: UniversalActions.Snapshot },
      { step: SetupActions.GoBack },
      { step: SetupVerifications.OnStep1 },
      { step: SetupActions.SelectOT2 },
      { step: SetupActions.Confirm },
      { step: SetupVerifications.OnStep2 },
      { step: SetupVerifications.NotNinetySixChannel },
      { step: UniversalActions.Snapshot },
    ]
    runSteps(steps)
  })
})
