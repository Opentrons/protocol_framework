import {
  SetupActions,
  setupFunctions,
  SetupVerifications,
} from '../support/SetupSteps'
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

  it('content and step 1 flow works', () => {
    cy.clickCreateNew()
    cy.verifyCreateNewHeader()
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
      { step: SetupActions.SingleChannelPipette50 },
      { step: SetupVerifications.StepTwo50uL },
      { step: UniversalActions.Snapshot },
      { step: SetupActions.Confirm },
      { step: SetupVerifications.StepTwoPart3 },
      { step: UniversalActions.Snapshot },
      { step: SetupActions.Confirm },
      { step: SetupVerifications.OnStep3 },
      { step: SetupActions.YesGripper },
      { step: SetupActions.Confirm },
      { step: SetupVerifications.Step4Verification },
      { step: SetupActions.AddThermocycler },
      { step: SetupVerifications.ThermocyclerImg },
      { step: SetupActions.AddHeaterShaker },
      { step: SetupVerifications.HeaterShakerImg },
      { step: SetupActions.AddMagBlock },
      { step: SetupVerifications.MagBlockImg },
      { step: SetupActions.AddTempdeck2 },
      { step: SetupVerifications.Tempdeck2Img },
      { step: SetupActions.Confirm },
      { step: SetupActions.Confirm },
      { step: SetupActions.Confirm },
      { step: SetupActions.EditProtocolA },
      { step: SetupActions.ChoseDeckSlotC2 },
      { step: SetupActions.AddHardwareLabware },
      { step: SetupActions.ClickLabwareHeader },
      { step: SetupActions.ClickWellPlatesSection },
      {
        step: setupFunctions.selectLabwareByDisplayName,
        params: 'Bio-Rad 96 Well Plate',
      },
      { step: SetupActions.ChoseDeckSlotC2Labware },
      { step: SetupActions.AddLiquid },
      { step: SetupActions.ClickLiquidButton },
      { step: SetupActions.DefineLiquid },
      { step: SetupActions.LiquidSaveWIP },
      { step: SetupActions.WellSelector },
      { step: SetupActions.LiquidDropdown },
      { step: SetupVerifications.LiquidPage },
      { step: UniversalActions.Snapshot },
      { step: SetupActions.SelectLiquidWells },
      { step: SetupActions.SetVolumeAndSaveforWells },
      { step: SetupActions.ChoseDeckSlotC1 },
      { step: SetupActions.EditHardwareLabwareOnDeck },
      { step: SetupActions.ClickLabwareHeader },
      { step: SetupActions.AddAdapters },
      { step: SetupActions.DeepWellTempModAdapter },
      { step: SetupActions.AddNest96DeepWellPlate },
      { step: SetupActions.Done },
      { step: SetupActions.ProtocolStepsH },
      { step: SetupActions.AddStep },
      { step: ModActions.AddTemperatureStep },
      { step: ModVerifications.TempeDeckInitialForm },
      { step: UniversalActions.Snapshot },
      { step: ModActions.ActivateTempdeck },
      { step: ModActions.InputTempDeck4 },
      { step: ModActions.SaveButtonTempdeck },
      { step: ModActions.PauseAfterSettingTempdeck },
      // ModVerifications.Temp4CPauseTextVerification}
      { step: UniversalActions.Snapshot },
      { step: SetupActions.AddStep },
      { step: ModActions.AddTemperatureStep },
      { step: ModActions.ActivateTempdeck },
      { step: ModActions.InputTempDeck95 },
      { step: ModActions.SaveButtonTempdeck },
      { step: ModActions.PauseAfterSettingTempdeck },
      { step: SetupActions.AddStep },
      { step: ModActions.AddTemperatureStep },
      { step: ModActions.ActivateTempdeck },
      { step: ModActions.InputTempDeck100 },
    ]
    runSteps(steps)
  })
})
