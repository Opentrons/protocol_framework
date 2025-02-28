import { UniversalSteps } from '../support/UniversalSteps'
import {
  SetupSteps,
  SetupVerifications,
  FlexSetup,
} from '../support/SetupSteps'
import { StepBuilder } from '../support/StepBuilder'

describe('The Redesigned Create Protocol Landing Page', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.closeAnalyticsModal()
  })

  it('content and step 1 flow works', () => {
    cy.clickCreateNew()
    cy.verifyCreateNewHeader()

    const steps = new StepBuilder()
    FlexSetup({
      thermocycler: true,
      heatershaker: true,
      magblock: true,
      tempdeck: true,
    })
    steps.add(SetupSteps.ChoseDeckSlotWithLabware('C2'))
    steps.add(SetupSteps.AddHardwareLabware())
    steps.add(SetupSteps.ClickLabwareHeader())
    steps.add(SetupSteps.ClickWellPlatesSection())
    steps.add(SetupSteps.SelectLabwareByDisplayName('Bio-Rad 96 Well Plate'))
    steps.add(SetupSteps.ChoseDeckSlotWithLabware('C2'))
    steps.add(SetupSteps.AddLiquid())
    steps.add(SetupSteps.ClickLiquidButton())
    steps.add(SetupSteps.DefineLiquid())
    steps.add(SetupSteps.LiquidSaveWIP())
    steps.add(SetupSteps.WellSelector(['A1', 'A2']))
    steps.add(SetupSteps.LiquidDropdown())
    steps.add(SetupVerifications.LiquidPage())
    steps.add(UniversalSteps.Snapshot())
    steps.add(SetupSteps.SelectLiquidWells())
    steps.add(SetupSteps.SetVolumeAndSaveForWells('150'))
    steps.add(SetupSteps.ChoseDeckSlotWithLabware('C3'))
    steps.add(SetupSteps.AddHardwareLabware())
    steps.add(SetupSteps.ClickLabwareHeader())
    steps.add(SetupSteps.ClickWellPlatesSection())
    steps.add(SetupSteps.SelectLabwareByDisplayName('Bio-Rad 96 Well Plate'))
    steps.execute()
  })
})
