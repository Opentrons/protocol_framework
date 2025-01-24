import { SetupActions, SetupVerifications } from '../support/SetupSteps'
import { UniversalActions } from '../support/universalActions'
import '../support/commands'
// Every test is goign to use StepsList
// Now every test will be a list of some combination of support 
// typescript file list of actions for specific PD stuff and include StepsList for steps

import { runSteps, type StepsList } from '../support/StepExecution'

describe('The Redesigned Create Protocol Landing Page', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.closeAnalyticsModal()
  })

  it('content and step 1 flow works', () => {
    cy.verifyCreateNewHeader()
    cy.clickCreateNew()
    const steps: StepsList = [
      SetupVerifications.OnStep1,
      SetupVerifications.FlexSelected,
      UniversalActions.Snapshot,
      SetupActions.SelectOT2,
      SetupVerifications.OT2Selected,
      UniversalActions.Snapshot,
      SetupActions.SelectFlex,
      SetupVerifications.FlexSelected,
      UniversalActions.Snapshot,
      SetupActions.Confirm,
      SetupVerifications.OnStep2,
      SetupVerifications.NinetySixChannel,
      UniversalActions.Snapshot,
      SetupActions.GoBack,
      SetupVerifications.OnStep1,
      SetupActions.SelectOT2,
      SetupActions.Confirm,
      SetupVerifications.OnStep2,
      SetupVerifications.NotNinetySixChannel,
      UniversalActions.Snapshot,
    ]

    runSteps(steps)
  })
})
