import { Actions, Verifications, runCreateTest } from '../support/createNew'
import { UniversalActions } from '../support/universalActions'

describe('The Redesigned Create Protocol Landing Page', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.verifyHomePage()
    cy.closeAnalyticsModal()
  })

  it('content and step 1 flow works', () => {
    cy.clickCreateNew()
    cy.verifyCreateNewHeader()
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
      Actions.EditProtocolA,
      Actions.ChoseDeckSlotC2,
      Actions.AddHardwareLabware,
      Actions.ClickLabwareHeader,
      Actions.ClickWellPlatesSection,
      Actions.SelectArmadillo96WellPlateDefinition,
      Actions.ChoseDeckSlotC2Labware,
      Actions.AddLiquid,
      Actions.ClickLiquidButton,
      Actions.DefineLiquid,
      Actions.LiquidSaveWIP,
      Actions.WellSelector,
      Actions.LiquidDropdown,
      Verifications.LiquidPage,
      UniversalActions.Snapshot,
      Actions.SelectLiquidWells,
      Actions.SetVolumeAndSaveforWells,
      Actions.ChoseDeckSlotC3,
      Actions.AddHardwareLabware,
      Actions.ClickLabwareHeader,
      Actions.ClickWellPlatesSection,
      Actions.SelectBioRad96WellPlateDefinition,
      Actions.ProtocolStepsH,
      Actions.AddStep,
      Actions.SelectTransfer,
      Verifications.TransferPopOut,
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
    ]
    runCreateTest(steps)
    cy.contains('Blowout').closest('div').find('button').click()
    cy.contains('Blowout location')
    cy.contains('Blowout flow rate')
    cy.contains('Blowout position from top')
    cy.contains('Choose option').click()
    cy.contains('Destination Well').click()
    cy.contains('Save').click()
  })
})
