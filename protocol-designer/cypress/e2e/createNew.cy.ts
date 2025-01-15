import { Actions, Verifications, runCreateTest } from '../support/createNew'
import { UniversalActions } from '../support/universalActions'
import '../support/commands'

describe('The Redesigned Create Protocol Landing Page', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.closeAnalyticsModal()
  })

  it('content and step 1 flow works', () => {
<<<<<<< HEAD
    // cy.clickCreateNew()
    cy.verifyCreateNewHeader()
    cy.contains('button', 'Create a protocol').click()
=======
    cy.verifyCreateNewHeader()
    cy.clickCreateNew()
>>>>>>> edge
    const steps: Array<Actions | Verifications | UniversalActions> = [
      Verifications.OnStep1,
      Verifications.FlexSelected,
      UniversalActions.Snapshot,
      Actions.SelectOT2,
      Verifications.OT2Selected,
      UniversalActions.Snapshot,
      Actions.SelectFlex,
      Verifications.FlexSelected,
      UniversalActions.Snapshot,
      Actions.Confirm,
      Verifications.OnStep2,
      Verifications.NinetySixChannel,
      UniversalActions.Snapshot,
      Actions.GoBack,
      Verifications.OnStep1,
      Actions.SelectOT2,
      Actions.Confirm,
      Verifications.OnStep2,
      Verifications.NotNinetySixChannel,
      UniversalActions.Snapshot,
    ]

    runCreateTest(steps)
  })
})
