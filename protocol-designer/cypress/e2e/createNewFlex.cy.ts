import { SetupActions, SetupVerifications } from '../support/SetupSteps'
import { UniversalActions } from '../support/universalActions'
import '../support/commands'

import { runSteps, type StepsList } from '../support/StepExecution'


describe('The Redesigned Create Protocol Landing Page', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.closeAnalyticsModal()
  })

  it('content and step 1 flow works', () => {
    cy.clickCreateNew()
    cy.verifyCreateNewHeader()
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
      SetupActions.SingleChannelPipette50,
      SetupVerifications.StepTwo50uL,
      UniversalActions.Snapshot,
      SetupActions.Confirm,
      SetupVerifications.StepTwoPart3,
      UniversalActions.Snapshot,
      SetupActions.Confirm,
      SetupVerifications.OnStep3,
      SetupActions.YesGripper,
      SetupActions.Confirm,
      SetupVerifications.Step4Verification,
      SetupActions.AddThermocycler,
      SetupVerifications.ThermocyclerImg,
      SetupActions.AddHeaterShaker,
      SetupVerifications.HeaterShakerImg,
      SetupActions.AddMagBlock,
      SetupVerifications.MagBlockImg,
      SetupActions.AddTempdeck2,
      SetupVerifications.Tempdeck2Img,
      SetupActions.Confirm,
      SetupActions.Confirm,
      SetupActions.Confirm,
      SetupActions.EditProtocolA,
      SetupActions.ChoseDeckSlotC2,
      SetupActions.AddHardwareLabware,
      SetupActions.ClickLabwareHeader,
      SetupActions.ClickWellPlatesSection,
      SetupActions.SelectArmadillo96WellPlate,
      SetupActions.ChoseDeckSlotC2Labware,
      SetupActions.AddLiquid,
      SetupActions.ClickLiquidButton,
      SetupActions.DefineLiquid,
      SetupActions.LiquidSaveWIP,
      SetupActions.WellSelector,
      SetupActions.LiquidDropdown,
      SetupVerifications.LiquidPage,
      UniversalActions.Snapshot,
      SetupActions.SelectLiquidWells,
      SetupActions.SetVolumeAndSaveforWells,
      SetupActions.ChoseDeckSlotC3,
      SetupActions.AddHardwareLabware,
      SetupActions.ClickLabwareHeader,
      SetupActions.ClickWellPlatesSection,
      SetupActions.SelectBioRad96WellPlate,
    ]
    runSteps(steps)
  })
})
