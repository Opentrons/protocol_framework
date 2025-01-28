import { SetupActions, SetupVerifications } from '../support/SetupSteps'
import { UniversalActions } from '../support/universalActions'
import { runSteps } from '../support/StepExecution'
import type { StepsList } from '../support/StepExecution'

describe('The Redesigned Create Protocol Landing Page', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.verifyHomePage()
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
      Actions.EditProtocolA,
      Actions.ChoseDeckSlotC2,
      Actions.AddHardwareLabware,
      Actions.ClickLabwareHeader,
      Actions.ClickWellPlatesSection,
      Actions.SelectArmadillo96WellPlate,
      Actions.ChoseDeckSlotC2Labware,
      Actions.AddLiquid,
      Actions.ClickLiquidButton,
      Actions.DefineLiquid,
      Actions.LiquidSaveWIP,
      Actions.WellSelector,
      Actions.LiquidDropdown,
      Verifications.LiquidPage,
      UniversalActions.Snapshot,
      SetupActions.SelectLiquidWells,
      SetupActions.SetVolumeAndSaveforWells,
      SetupActions.ChoseDeckSlotC3,
      SetupActions.AddHardwareLabware,
      SetupActions.ClickLabwareHeader,
      SetupActions.ClickWellPlatesSection,
      SetupActions.SelectBioRad96WellPlate,
      SetupActions.ProtocolStepsH,
      SetupActions.AddStep,
      SetupVerifications.TransferPopOut,
      UniversalActions.Snapshot,
      Actions.ChoseSourceLabware,
      Actions.SelectArmadillo96WellPlateTransfer,
      Actions.AddSourceLabwareDropdown,
      Actions.WellSelector,
      Actions.SaveSelectedWells,
      Actions.ChoseDestinationLabware,
      Actions.SelectBiorad,
      Actions.SelectDestinationWells,
      Actions.WellSelector,
      Actions.SaveSelectedWells,
      Actions.InputTransferVolume30,
      Actions.Continue,
      Actions.PrewetAspirate,
      Actions.DelayAspirate,
      Actions.TouchTipAspirate,
      Actions.MixAspirate,
      Actions.AirGapAspirate,
      Verifications.Delay,
      Verifications.PreWet,
      Verifications.TouchTip,
      Verifications.MixT,
      Verifications.AirGap,
      Actions.AspirateMixVolume,
      Actions.AspirateMixTimes,
      Actions.AspirateAirGapVolume,
      Actions.SelectDispense,
      Actions.DelayAspirate,
      Actions.TouchTipAspirate,
      Actions.MixAspirate,
      Actions.AirGapAspirate,
      Actions.DispenseMixVolume,
      Actions.DispenseMixTimes,
      Actions.DispenseAirGapVolume,
      Actions.BlowoutTransferDestination,
      Verifications.ExtraDispenseTransfer,
    ]
    runCreateTest(steps)

    cy.contains('Save').click()
    cy.contains('button', 'Transfer').should('be.visible').click()
    runSteps(steps)
  })
})
