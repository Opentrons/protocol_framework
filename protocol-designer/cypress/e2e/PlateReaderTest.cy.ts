import { SetupActions, SetupVerifications } from '../support/SetupSteps'
import { UniversalActions } from '../support/universalActions'
import { ModActions, ModVerifications } from '../support/SupportModules'
import { runSteps } from '../support/StepExecution'
import type { StepsList } from '../support/StepExecution'

describe('The Redesigned Create Protocol Landing Page', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.verifyHomePage()
    cy.closeAnalyticsModal()
  })

  it('PlateReaderSteps', () => {
    cy.clickCreateNew()
    cy.verifyCreateNewHeader()
    const steps: StepsList = [
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
      SetupActions.NoGripper,
      SetupActions.Confirm,
      // Check that you can't add a plate reader without gripper
      SetupVerifications.AbsorbanceNotSelectable,
      SetupActions.GoBack,
      SetupActions.YesGripper,
      SetupActions.Confirm,
      // Add plate reader
      SetupActions.AddPlateReader,
      SetupActions.Confirm,
      SetupActions.Confirm,
      SetupActions.Confirm,
      SetupActions.EditProtocolA,
      SetupActions.ChoseDeckSlotC3,
      SetupActions.AddHardwareLabware,
      SetupActions.ClickLabwareHeader,
      SetupActions.ClickWellPlatesSection,
      SetupActions.SelectArmadillo96WellPlate,
      SetupActions.ChoseDeckSlotC3Labware,
      SetupActions.AddLiquid,
      SetupActions.ClickLiquidButton,
      SetupActions.DefineLiquid,
      SetupActions.LiquidSaveWIP,
      SetupActions.WellSelector,
      SetupActions.LiquidDropdown,
      SetupVerifications.LiquidPage,
      SetupActions.SelectLiquidWells,
      SetupActions.SetVolumeAndSaveforWells,
      UniversalActions.Snapshot,
      SetupActions.ProtocolStepsH,
      SetupActions.AddStep,
      SetupActions.AddMoveStep,
      SetupActions.UseGripperinMove,
      SetupActions.ChoseSourceMoveLabware,
      SetupActions.SelectArmadillo96WellPlateTransfer,
      SetupActions.ChoseDestinationMoveLabware,
      ModActions.MoveToPlateReader,
      SetupActions.Save,
      ModVerifications.NoMoveToPlateReaderWhenClosed,
      UniversalActions.Snapshot,
      SetupActions.DeleteSteps,
      SetupActions.AddStep,
      ModActions.StartPlateReaderStep,
      ModVerifications.PlateReaderPart1NoInitilization,
      SetupActions.Continue,
      ModVerifications.PlateReaderPart2NoInitilization,
      ModActions.DefineInitilizationSingle,
    ]
    runSteps(steps)
    cy.contains('Add reference wavelength?').click()
    cy.contains('Custom wavelength')
      .parent() // Move to the parent div
      .next() // Move to the next sibling div (which contains the input)
      .find('input')
      .type('350')
    /*
    case DefineInitilizationSingle
    cy.contains('Add reference wavelength').next('div').has('button') // get checkbox
    cy.contains('450n nm (blue)').click()
    cy.contains('562nm (green)').click()
    cy.contains('562nm (green)').click()
    cy.contains('600nm (orange)').click()
    cy.contains('600nm (orange)').click()
    cy.contains('650nm (red)').click()
    cy.contains('650nm (red)').click()
    cy.contains('Other').click()

    case ModVerifications.CheckPlateReaderBoundaries:

      cy.get('input[name="volume"]').type(`150`, { force: true }) // Set volume

    cy.contains({insert good select here within Custom wavelength}).type(700)
    click save





    */
  })
})
