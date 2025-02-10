import { SetupVerifications, SetupActions } from '../support/SetupSteps'
import { UniversalActions } from '../support/universalActions'
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { StepListBuilder, runSteps } from '../support/StepExecution'

describe('The Redesigned Create Protocol Landing Page', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.closeAnalyticsModal()
  })

  it('content and step 1 flow works', () => {
    cy.verifyCreateNewHeader()
    cy.clickCreateNew()

    const steps = new StepListBuilder()
      .addStep(SetupVerifications.OnStep1)
      .addStep(SetupVerifications.FlexSelected)
      .addStep(UniversalActions.Snapshot)
      .addStep(SetupActions.SelectOT2)
      .addStep(SetupVerifications.OT2Selected)
      .addStep(UniversalActions.Snapshot)
      .addStep(SetupActions.SelectFlex)
      .addStep(SetupVerifications.FlexSelected)
      .addStep(UniversalActions.Snapshot)
      .addStep(SetupActions.Confirm)
      .addStep(SetupVerifications.OnStep2)
      .addStep(SetupVerifications.NinetySixChannel)
      .addStep(UniversalActions.Snapshot)
      .addStep(SetupActions.GoBack)
      .addStep(SetupVerifications.OnStep1)
      .addStep(SetupActions.SelectOT2)
      .addStep(SetupActions.Confirm)
      .addStep(SetupVerifications.OnStep2)
      .addStep(SetupVerifications.NotNinetySixChannel)
      .addStep(UniversalActions.Snapshot)
      .build()

    runSteps(steps)
  })
})
