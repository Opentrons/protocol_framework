import { SetupActions, SetupVerifications } from '../support/SetupSteps'
import { UniversalActions } from '../support/universalActions'
import { ModActions, ModVerifications } from '../support/SupportModules'
// Updated import to bring in StepListBuilder instead of StepsList
import { runSteps, StepListBuilder } from '../support/StepExecution'

describe('The Redesigned Create Protocol Landing Page', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.verifyHomePage()
    cy.closeAnalyticsModal()
  })

  it('content and step 1 flow works', () => {
    cy.clickCreateNew()
    cy.verifyCreateNewHeader()

    const steps = new StepListBuilder()
      // Verification steps
      .addStep(SetupVerifications.OnStep1)
      .addStep(SetupVerifications.FlexSelected)
      .addStep(UniversalActions.Snapshot)
      // Switching between OT2 and Flex
      .addStep(SetupActions.SelectOT2)
      .addStep(SetupVerifications.OT2Selected)
      .addStep(UniversalActions.Snapshot)
      .addStep(SetupActions.SelectFlex)
      .addStep(SetupVerifications.FlexSelected)
      .addStep(UniversalActions.Snapshot)
      // Confirm moves to step2
      .addStep(SetupActions.Confirm)
      .addStep(SetupVerifications.OnStep2)
      // Choose pipette
      .addStep(SetupActions.SingleChannelPipette50)
      .addStep(SetupVerifications.StepTwo50uL)
      .addStep(UniversalActions.Snapshot)
      .addStep(SetupActions.Confirm)
      .addStep(SetupVerifications.StepTwoPart3)
      .addStep(UniversalActions.Snapshot)
      .addStep(SetupActions.Confirm)
      // Move to step3
      .addStep(SetupVerifications.OnStep3)
      .addStep(SetupActions.YesGripper)
      .addStep(SetupActions.Confirm)
      // Step4: add modules
      .addStep(SetupVerifications.Step4Verification)
      .addStep(SetupActions.AddThermocycler)
      .addStep(SetupVerifications.ThermocyclerImg)
      .addStep(SetupActions.AddHeaterShaker)
      .addStep(SetupVerifications.HeaterShakerImg)
      .addStep(SetupActions.AddMagBlock)
      .addStep(SetupVerifications.MagBlockImg)
      .addStep(SetupActions.AddTempdeck2)
      .addStep(SetupVerifications.Tempdeck2Img)
      // Confirm a few times to proceed
      .addStep(SetupActions.Confirm)
      .addStep(SetupActions.Confirm)
      .addStep(SetupActions.Confirm)
      // Edit protocol, add labware
      .addStep(SetupActions.EditProtocolA)
      .addStep(SetupActions.ChoseDeckSlotC2)
      .addStep(SetupActions.AddHardwareLabware)
      .addStep(SetupActions.ClickLabwareHeader)
      .addStep(SetupActions.ClickWellPlatesSection)
      // Example function-based step with a parameter
      .addStep(SetupActions.SelectLabwareByDisplayName, 'Bio-Rad 96 Well Plate')
      .addStep(SetupActions.ChoseDeckSlotC2Labware)
      // Liquid adding steps
      .addStep(SetupActions.AddLiquid)
      .addStep(SetupActions.ClickLiquidButton)
      .addStep(SetupActions.DefineLiquid)
      .addStep(SetupActions.LiquidSaveWIP)
      .addStep(SetupActions.WellSelector, ['A1', 'A2'])
      .addStep(SetupActions.LiquidDropdown)
      .addStep(SetupVerifications.LiquidPage)
      .addStep(UniversalActions.Snapshot)
      .addStep(SetupActions.SelectLiquidWells)
      .addStep(SetupActions.SetVolumeAndSaveforWells)
      // Additional deck edits
      .addStep(SetupActions.ChoseDeckSlotC1)
      .addStep(SetupActions.EditHardwareLabwareOnDeck)
      .addStep(SetupActions.ClickLabwareHeader)
      .addStep(SetupActions.AddAdapters)
      .addStep(SetupActions.DeepWellTempModAdapter)
      .addStep(SetupActions.AddNest96DeepWellPlate)
      .addStep(SetupActions.SelectDone)
      .addStep(SetupActions.ProtocolStepsH)
      .addStep(SetupActions.AddStep)
      // Modules (temp deck) steps
      .addStep(ModActions.AddTemperatureStep)
      .addStep(ModVerifications.TempeDeckInitialForm)
      .addStep(UniversalActions.Snapshot)
      .addStep(ModActions.ActivateTempdeck)
      .addStep(ModActions.InputTempDeck4)
      .addStep(ModActions.SaveButtonTempdeck)
      .addStep(ModActions.PauseAfterSettingTempdeck)
      // Possibly verifying
      // .addStep(ModVerifications.Temp4CPauseTextVerification)
      .addStep(UniversalActions.Snapshot)
      // Another temperature step
      .addStep(SetupActions.AddStep)
      .addStep(ModActions.AddTemperatureStep)
      .addStep(ModActions.ActivateTempdeck)
      .addStep(ModActions.InputTempDeck95)
      .addStep(ModActions.SaveButtonTempdeck)
      .addStep(ModActions.PauseAfterSettingTempdeck)
      // Another temperature step
      .addStep(SetupActions.AddStep)
      .addStep(ModActions.AddTemperatureStep)
      .addStep(ModActions.ActivateTempdeck)
      .addStep(ModActions.InputTempDeck100)
      .build()

    runSteps(steps)
  })
})
