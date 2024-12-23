import {
  Actions,
  Verifications,
  runCreateTest,
  verifyCreateProtocolPage,
} from '../support/createNew'
import { UniversalActions } from '../support/universalActions'

describe('The Redesigned Create Protocol Landing Page', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.contains('button', 'Confirm').click()
  })

  it('content and step 1 flow works', () => {
    cy.clickCreateNew()
    cy.verifyCreateNewHeader()
    verifyCreateProtocolPage()
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
      Actions.SingleChannelPipette50,
      Verifications.StepTwo50uL,
      UniversalActions.Snapshot,
      Actions.Confirm,
      Verifications.StepTwoPart3,
      UniversalActions.Snapshot,
      Actions.Confirm,
      Verifications.OnStep3,
      Actions.YesGripper,
      Actions.Confirm,
      Verifications.Step4Verification,
      Actions.AddThermocycler,
      Verifications.ThermocyclerImg,
      Actions.AddHeaterShaker,
      Verifications.HeaterShakerImg,
      Actions.AddMagBlock,
      Verifications.MagBlockImg,
      Actions.AddTempdeck2,
      Verifications.Tempdeck2Img,
      Actions.Confirm,
      Actions.Confirm,
      Actions.Confirm,
      Actions.EditProtocol,
      Actions.ChoseDeckSlotC2,
    ]

    // Everything after Actions.SingleChannelPipette
    // Is going to be for transferSettings.cy.js

    runCreateTest(steps)
  })
})
